const expandQuestionData = require("./util/expandQuestionData");
var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');



const locations = {1:'Ball',2:'Strike'};
const pitchtypes = {1:'Fastball',2:'Cutter',3:'Changeup',4:'Curveball',5:'Slider',106:'Knuckle',108:'Screw',109:'Drop',110:'Rise'};


class Task extends MongoRmqWorker {

  constructor() {
    super(...arguments)
    this._collection = 'drill_usage';
  }


  getInputSchema() {
    return schemas.action;
  }

  /*
    accepts a data object and expands and extracts the fields into a single row
    and inserts into the database
  */
  async myTask(data, msg, conn, ch, db) {

    if (!data.app) throw Error("Must include an app label");

    if (this.isClientRequested(data)) {
      throw Error("Not authorized for client requests");
    }

    const c = this._collection;

    try {

      let result = {
      time_video_started: 0,
      time_answered: 0,
      id_question: null,
      team: '',
      app: ''
      };

      result.app = data.app = data.app.toUpperCase();

      result.id = data.id;
      result.id_submission = data.id_submission;


      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      result = await expandQuestionData(data, result, db);

      if (data.Response__objName == 'pitch_location') {
        result.correct_response_location_name = locations[data.Question__occluded_video__pitch_location];
        result.response_location_name = data.Response__name;
        result.response_location = data.Response__id;
        result.correct_response_location_id = data.Question__occluded_video__pitch_location;
        result.location_score = (result.correct_response_location_id === result.response_location) ? 1 : 0;
      } else {
        result.response_name = data.Response__name;
        result.response_id = data.Response__id;
        result.correct_response_id = data.Question__occluded_video__pitch_type;
        result.correct_response_name = pitchtypes[data.Question__occluded_video__pitch_type];
        result.type_score = (result.correct_response_id === result.response_id) ? 1 : 0;
      }


      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + '.' + c}`);
      let query = {id_submission:result.id_submission,id_question:result.id_question};
      // handle if same question appeared multiple times
      if (data.Response__objName == 'pitch_location') {
        query.correct_response_location_id = null;
      } else {
        query.correct_response_id = null;
      }
      let doc = await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true, returnOriginal:false});
      doc = doc.value;
      if (doc.type_score !== undefined && doc.location_score !== undefined) {
        let completely_correct_score = (doc.type_score && doc.location_score) ? 1 : 0;
        db.collection(c).update({id:result.id}, {$set: {completely_correct_score: completely_correct_score}});
      }

      ch.ack(msg);
    } catch (ex) {
      ch.reject(msg);
      this.logError(data, msg, ex);
    }
  }
}

module.exports = Task;
