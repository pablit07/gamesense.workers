var crypto = require("crypto");
var moment = require("moment");
var schemas = require("../schemas");
var MongoRmqWorker = require("../lib/MongoRmqWorker");



const locations = {1:"Ball",2:"Strike"};
const pitchtypes = {1:"Fastball",2:"Cutter",3:"Changeup",4:"Curveball",5:"Slider",106:"Knuckle",108:"Screw",109:"Drop",110:"Rise"};

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
    
    if (data.action_name != "Test Response") ch.ack(msg);

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

      // time

      if (data.timestamp) {
        result.time_answered_formatted = moment(data.timestamp).utcOffset(-6).format("MMMM Do YYYY, h:mm:ss a");
        result.time_answered = new Date(moment(data.timestamp).format());
      }
      result.time_video_started = new Date(moment(data.timestamp).subtract(data.spent_time, "seconds").format());
      result.time_video_started_formatted = moment(result.time_video_started).utcOffset(-6).format("MMMM Do YYYY, h:mm:ss a");


      // player
      result.user_id = data.user_id;
      let player = await db.collection("users").findOne({id:data.user_id,app:data.app});

      if (player) {
        result.player_first_name = player.first_name;
        result.player_last_name = player.last_name;
        result.player_id = `${data.user_id} ${player.first_name} ${player.last_name}`; 
        result.team = player.team;
      } else {
        console.log("******** Warning player does not exist " + data.user_id + data.app);
      }
      result.team_id = data.team_id;      
      result.team = data.team;


      // read question

      result.id_question = crypto.createHash("md5").update(`${data.app}${(data.question_id || data.Question__id)}`).digest("hex");
      result.pitch = (data.Question__occluded_video__file || data.Question__occluded_video_file).replace(".mp4", "").replace("https://gamesense-videos.s3.amazonaws.com/", "");
      result.occlusion = ("R+" + result.pitch.substr(-1, 1)).replace(/R\+[abcdABCDO]/, "None").replace("+R", "");
      result.player_batting_hand = data.Question__batter_hand_value;
      result.pitcher_hand = data.Question__occluded_video__pitcher_hand;
      result.pitch_count = data.Question__occluded_video__pitch_count;
      result.pitcher_code = data.Question__occluded_video__pitcher_name;
      result.device = data.user_device;
      
      let pitchParts = new RegExp("^([0-9])+.*").exec(result.pitch.replace(result.pitcher_code + "-", ""));
      if (pitchParts) {
        result.pitch_number = pitchParts[1];
        result.pitcher_is_flipped = new RegExp("^[bd].*").test(result.pitch.replace(result.pitch_number).substr(0,1));
      }
        
        // result = Object.assign({}, question, result);

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
      let doc = await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true, returnOriginal:false});
      doc = doc.value;
      if (doc.type_score !== undefined && doc.location_score !== undefined) {
        let completely_correct_score = (doc.type_score && doc.location_score) ? 1 : 0;
        db.collection(c).update({id:result.id}, {$set: {completely_correct_score: completely_correct_score}});
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
