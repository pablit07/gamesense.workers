var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');
var flatten = require('flat');
var braintree = require("braintree");


const c = 'financials_customerltv_calc';

class Task extends MongoRmqWorker {

  constructor() {
    super(...arguments);
  }

  /*
    accepts a data object and expands and extracts the fields into a single row
    and inserts into the database
  */
  async myTask(data, msg, conn, ch, db) {


    try {

      if (!data.app) {
        ch.ack(msg);
        throw Error("Must include an app label");
      }

      if (this.isClientRequested(data)) {
        throw Error("Not authorized for client requests");
      }

      let result = {
        ProfitMoleID: '',
        "Gross Profit": 0.0,
        CustomerID: '',
        OrderID: '',
        PaymentID: '',
        ActivityDate: '',
        Affiliate: '',
        CustomSegment1: '',
        CustomSegment2: '',
        CustomSegment3: '',
        CustomSegment4: '',
        CustomSegment5: '',
        Source: '',
        Campaign: ''
      };

      result.CustomSegment1 = data.app = data.app.toUpperCase();

      let keys = await db.collection('secrets').findOne({name:'braintree'});

      const gateway = braintree.connect({
        environment: braintree.Environment.Production,
        merchantId: keys.merchantId,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey
      });

      let subscription = await gateway.subscription.find(data.subscription_id);

      if (!subscription) {
        ch.ack(msg);
        throw Error("No subscription found for subscription_id " + data.subscription_id);
      }


      let charged_transaction = subscription.transactions.find(t => {
        return (t.status === braintree.Transaction.Status.Settled
            || t.status === braintree.Transaction.Status.SubmittedForSettlement
            || t.status === braintree.Transaction.Status.Settling)
      });

      if (!charged_transaction) {
        ch.ack(msg);
        throw Error("Subscription has no settlement transaction for subscription_id " + data.subscription_id);
      }

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      result.CustomerID = charged_transaction.customer.email;
      result.PaymentID = charged_transaction.id;
      result.OrderID = data.subscription_id;
      result.ActivityDate = moment(data.timestamp).toDate();
      result["Gross Profit"] = charged_transaction.amount;

      let query = {CustomerID: result.CustomerID, OrderID: result.OrderID, PaymentID: result.PaymentID};

      let doc = await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert: true, returnOriginal: false});
      doc = doc.value;

      if (doc) {
        await db.collection('raw_usage').findOneAndUpdate({id: data.id}, {$set: {financials_customerltv_calc_id: doc._id}});
      }
      
      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + '.' + c}`);

      // this.publish({id_submission:data.id_submission}, 'test.calculate_old');
      ch.ack(msg);
    } catch (ex) {
      this.logError(data, msg, ex);
      ch.ack(msg);
      // console.log("Error: " + (ex.stack ? ex : ""));
      // console.error(ex.stack || ex);
      // client.close();
      // conn.close();
    }
  }
}

module.exports = Task;
