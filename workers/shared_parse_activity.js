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


    try {

      if (!data.app) {
        ch.ack(msg);
        throw Error("Must include an app label");
      }

      if (this.isClientRequested(data)) {
        throw Error("Not authorized for client requests");
      }

      let result = {
      app: ''
      };

      result.app = data.app = data.app.toUpperCase();

      result.id = crypto.createHash('md5').update(`${data.app}${data.id}`).digest("hex");
      result.id_submission = crypto.createHash('md5').update(`${data.app}${data.activity_id}`).digest("hex");
      result.action_name = data.action_name;
      result.user_id = data.user_id;

      let actionValue;
      try {
        actionValue = typeof(data.action_value) == 'string' ? JSON.parse(data.action_value) : data.action_value;
      } catch (ex) {
        this.logError(data, msg, ex);
        console.error("Invalid JSON");
        ch.ack(msg);
        return;
      }

      result.player = actionValue.player;

      Object.assign(result, flatten(actionValue, {delimiter: '__'}));

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      // time
      if (actionValue.timestamp) {
        result.timestamp_formatted = moment(actionValue.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.timestamp = new Date(moment(actionValue.timestamp).format());
      }
      else if (data.timestamp) {
        result.timestamp_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.timestamp = new Date(moment(data.timestamp).format());
      }
      
      let query = {id_submission:result.id_submission};

      query.id = result.id
      await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true});
      
      let combined = await db.collection('raw_usage_combined').findOne({id_submission:result.id_submission});
      if (combined && combined.activity_name == 'Hit Station') {
        let headers, message;
        switch (result.action_name) {
          case 'Hit Station Final Score':
            headers = {
              routing_key: 'usage.action.hitstation.final_score'
            };
            message = Object.assign({}, combined, result);
            message.id = result.id;
            this.publish(message, headers, ch);
            break;
        }
      }
      else if (combined && combined.activity_name == 'Drill') {
        let headers, message;
        switch (result.action_name)
        {
          case 'Question Response':
            headers = {
              routing_key: 'usage.action.drill.question_response'
            };
            message = Object.assign({}, combined, result);
            message.id = result.id;
            this.publish(message, headers, ch);
            break;

          case 'Final Score':
            headers = {
              routing_key: 'usage.action.drill.final_score'
            };
            message = Object.assign({}, combined, result);
            message.id = result.id;
            this.publish(message, headers, ch);
            break;
        }
      } else if (combined && combined.activity_name == 'Test') {

        let headers, message;
        switch (result.action_name)
        {
          case 'Test Response':
          case 'Question Response':
            headers = {
              routing_key: 'usage.action.test.question_response'
            };
            result.action_name = 'Test Response'
            message = Object.assign({}, combined, result);
            message.id = result.id;
            this.publish(message, headers, ch);

            // recalculate in case scores come in wrong order
            let earlyFinalScore = await db.collection(c).findOne({id_submission:result.id_submission,action_name:'Test'});
            if (earlyFinalScore) {
                headers = {
                  routing_key: 'usage.action.test.final_score'
                };
                this.publish({app:earlyFinalScore.app,id_submission:earlyFinalScore.id_submission,timestamp:earlyFinalScore.timestamp,player:earlyFinalScore.player,"Pitch Location Score":earlyFinalScore["Pitch Location Score"],"Pitch Type Score":earlyFinalScore["Pitch Type Score"],"Total Score":earlyFinalScore["Total Score"]}, headers, ch);
            }
            break;

          case 'Final Score':
          case 'Test':
            headers = {
              routing_key: 'usage.action.test.final_score'
            };
            this.publish({app:result.app,id_submission:result.id_submission,timestamp:result.timestamp,player:result.player,"Pitch Location Score":result["Pitch Location Score"],"Pitch Type Score":result["Pitch Type Score"],"Total Score":result["Total Score"]}, headers, ch);
            break;

        }
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
