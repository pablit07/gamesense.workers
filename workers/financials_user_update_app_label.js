const moment = require('moment');
const MongoRmqWorker = require('../lib/MongoRmqWorker');
const braintree = require("braintree");
const https = require('https');


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

      await gateway.customer.update(data.braintree_customer_id, {customFields:{app:data.app}});

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
