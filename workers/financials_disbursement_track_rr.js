const moment = require('moment');
const MongoRmqWorker = require('../lib/MongoRmqWorker');
const braintree = require("braintree");
const request = require('request');


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

      let keys = await db.collection('secrets').findOne({name:'braintree'});

      const gateway = braintree.connect({
        environment: braintree.Environment.Production,
        merchantId: keys.merchantId,
        publicKey: keys.publicKey,
        privateKey: keys.privateKey
      });

      const projectId = 'P53wSFUi';

      const track = postData => {
        let dataString = JSON.stringify(postData);
        let options = {
          url: 'https://track.attributionapp.com/track',
          method: 'POST',
          body: dataString,
          auth: {
            'user': projectId,
            'pass': ''
          }
        };

        function callback(error, response, body) {
            console.log(body);
        }

        request(options, callback);
      };

      if (data.transaction_ids) {
        await data.transaction_ids.forEach(async transactionId => {
          let transaction = await gateway.transaction.find(transactionId);
          if (transaction) {
            let subscription = await gateway.subscription.find(transaction.subscriptionId);
            let customer = await gateway.customer.find(transaction.customer.id);
            if (subscription && customer && subscription.currentBillingCycle > 1) {
              // do the request
              let user = await db.collection('users').findOne({email: customer.email, app: customer.customFields.app});
              let postData = {
                user_id: `${user.app}${user.id}`,
                event: 'Credit Card Charged',
                properties: {revenue: transaction.amount}
              };
              track(postData);
            }
          }
        });
      }

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
