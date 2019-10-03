const expandQuestionData = require("./util/expandQuestionData");
var crypto = require("crypto");
var moment = require("moment");
var schemas = require("../schemas");
var MongoRmqWorker = require("../lib/MongoRmqWorker");



const locations = {1:"Ball",2:"Strike"};
const pitchtypes = {1:"Fastball",2:"Cutter",3:"Changeup",4:"Curveball",5:"Slider",106:"Rise",108:"Drop",109:"Screw",110:"Knuckle"};

class Task extends MongoRmqWorker {

  constructor() {
    super(...arguments);
    this._collection = "test_usage";
  }


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
    
    const c = this._collection;

    try {

      let result = {
      time_video_started: 0,
      time_answered: 0,
      question_id: null,
      team: "",
      app: ""
      };

      result.app = data.app = data.app.toUpperCase();
      result.id = data.id;
      result.id_submission = crypto.createHash("md5").update(`${data.app}${data.activity_id}`).digest("hex");


      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      result = await expandQuestionData(data, result, db);
        
      if (data.Response__objName == "pitch_location") {
        result.correct_response_location_name = locations[data.Question__occluded_video__pitch_location];
        result.response_location_name = locations[data.Response__id];
        result.response_location = data.Response__id;
        result.correct_response_location_id = data.Question__occluded_video__pitch_location;
        result.location_score = (result.correct_response_location_id === result.response_location) ? 1 : 0;
      } else {
        result.response_name = pitchtypes[data.Response__id];
        result.response_id = data.Response__id;
        result.correct_response_id = data.Question__occluded_video__pitch_type;
        result.correct_response_name = pitchtypes[data.Question__occluded_video__pitch_type];
        result.type_score = (result.correct_response_id === result.response_id) ? 1 : 0;
      }

            //       
      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + "." + c}`);
      let query = {id_submission:result.id_submission,id_question:result.id_question};
      let {player_id, player_first_name, player_last_name } = result;
      delete result['player_id']; delete result['player_first_name']; delete result['player_last_name'];
      let doc = await db.collection(c).findOneAndUpdate(query, {$set: result, $setOnInsert: {player_id, player_first_name, player_last_name}}, {upsert:true, returnOriginal:false});
      doc = doc.value;
      if (doc.type_score !== undefined && doc.location_score !== undefined) {
        let completely_correct_score = (doc.type_score && doc.location_score) ? 1 : 0;
        db.collection(c).updateMany({id:result.id}, {$set:{completely_correct_score: completely_correct_score}});
      }

      // this.publish({id_submission:data.id_submission}, "test.calculate_old");
      ch.ack(msg);
    } catch (ex) {
      this.logError(data, msg, ex);
      ch.ack(msg);
      // client.close();
      // conn.close();
    }
  }
}

module.exports = Task;
