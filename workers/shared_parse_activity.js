var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');
var flatten = require('flat');


const c = 'raw_usage';

class Task extends MongoRmqWorker {

  constructor() {
    super(...arguments);
    this.responseRmqExchangeName = 'usage';
  }


  getInputSchema() {
    return schemas.action;
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

    try {

      let result = {
      time_video_started: 0,
      time_answered: 0,
      app: ''
      };

      result.app = data.app = data.app.toUpperCase();

      result.id = crypto.createHash('md5').update(`${data.app}${data.id}`).digest("hex");
      result.id_submission = crypto.createHash('md5').update(`${data.app}${data.activity_id}`).digest("hex");
      result.action_name = data.action_name;
      result.user_id = data.user_id;

      let actionValue = typeof(data.action_value) == 'string' ? JSON.parse(data.action_value) : data.action_value;

      Object.assign(result, flatten(actionValue, {delimiter: '__'}));

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      // time

      if (data.timestamp) {
        result.timestamp_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.timestamp = new Date(moment(data.timestamp).format());
      }
      
      let query = {id_submission:result.id_submission};

      query.id = result.id
      await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true});
      
      let combined = await db.collection('raw_usage_combined').findOne({id_submission:result.id_submission});
      if (combined && combined.activity_name == 'Drill') {
        let headers, message;
        switch (result.action_name)
        {
          case 'Question Response':
            headers = {
              routing_key: 'usage.action.drill.question_response'
            };
            message = Object.assign({}, combined, result);
            this.publish(message, headers, ch);
            break;

          case 'Final Score':
            headers = {
              routing_key: 'usage.action.drill.final_score'
            };
            this.publish({id_submission:result.id_submission}, headers, ch); 
            break;
        }
      }
      
      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + '.' + c}`);

      // this.publish({id_submission:data.id_submission}, 'test.calculate_old');
      ch.ack(msg);
    } catch (ex) {
      console.log("Error: " + (ex.stack ? ex : ""));
      console.error(ex.stack || ex);
      // client.close();
      // conn.close();
    }
  }
}

module.exports = Task;
