var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');


const c = 'users';

class Task extends MongoRmqWorker {


  getInputSchema() {
    return schemas.user;
  }

  /*
    accepts a data object and expands and extracts the fields into a single row
    and inserts into the database
  */
  async myTask(data, msg, conn, ch, db) {


    if (!data.app) {
      ch.ack(msg);
      throw Error("Must include an app label");
    }

    if (this.isClientRequested(data)) {
      throw Error("Not authorized for client requests");
    }

    try {

      let result = {
        app: ''
      };

      Object.assign(result, data);
      result.app = result.app.toUpperCase();

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      let query = {id:result.id,app:result.app};
      await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true});
      
      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + '.' + c}`);

      ch.ack(msg);
    } catch (ex) {
      this.logError(data, msg, ex);
      // client.close();
      // conn.close();
    }
  }
}

module.exports = Task;
