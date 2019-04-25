var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');


const c = 'raw_usage_combined';

class Task extends MongoRmqWorker {


  getInputSchema() {
    return schemas.activity;
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

      result.app = data.app = data.app.toUpperCase();

      result.id = crypto.createHash('md5').update(`${data.app}${data.id}`).digest("hex");
      result.id_submission = crypto.createHash('md5').update(`${data.app}${data.activity_id}`).digest("hex");

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      // time

      if (data.timestamp) {
        result.time_answered_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.time_answered = new Date(moment(data.timestamp).format());
      }
      
      let query = {id_submission:result.id_submission};

      if (result.activity_name == 'Drill') {
        const headers = {
          routing_key: 'usage.activity.drill'
        };
        this.publish(result, headers, ch);
      }

      await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true});
      delete result.id; delete result.timestamp; delete result.object_id; delete result.content_type_id;
      await db.collection('raw_usage').update(query, {$set: result}, {upsert:false});
      
      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + '.' + c}`);

      // this.publish({id_submission:data.id_submission}, 'test.calculate_old');
      ch.ack(msg);
    } catch (ex) {
      this.logError(data, msg, ex);
      // client.close();
      // conn.close();
    }
  }
}

module.exports = Task;
