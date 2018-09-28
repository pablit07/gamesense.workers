var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');
var flatten = require('flat');


const c = 'raw_usage';

const locations = {1:'Ball',2:'Strike'};
const pitchtypes = {1:'Fastball',2:'Cutter',3:'Changeup',4:'Curveball',5:'Slider'};

class Task extends MongoRmqWorker {


  getInputSchema() {
    return schemas.activity;
  }

  /*
    accepts a data object and expands and extracts the fields into a single row
    and inserts into the database
  */
  async myTask(data, msg, conn, ch, db) {


    if (!data.app) throw Error("Must include an app label")

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

      let actionValue = JSON.parse(data.action_value);

      Object.assign(result, flatten(actionValue));

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      // time

      if (data.timestamp) {
        result.time_answered_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.time_answered = new Date(moment(data.timestamp).format());
      }
      // if (actionValue.time_answered) {
      result.time_video_started = new Date(moment(data.timestamp).subtract(result.time_difference, 'seconds').format());
      result.time_video_started_formatted = moment(result.time_answered).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');

      
      let query = {id_submission:result.id_submission};
      if (result.action_name != 'Final Score)') {
        query.id = result.id
        await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true});
      } else {

        await db.collection('raw_usage_combined').findOneAndUpdate(query, {$set: result}, {upsert:true});
        delete result.id; delete result.timestamp;
        await db.collection(c).update(query, {$set: result}, {upsert:true});
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
