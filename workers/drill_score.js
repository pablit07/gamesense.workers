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

    if (!data.app) throw Error("Must include an app label")

    const c = this._collection;

    try {

      let result = {
      time_video_started: 0,
      time_answered: 0,
      question_id: null,
      team: '',
      app: ''
      };
/*
{
  "_id": "5c39636819e240fa06a28b04",
  "id_submission": "e494872f56b1ab9ceff6837eada9dd84",
  "activity_id": 19492,
  "activity_name": "Drill",
  "activity_value": "Michaela (LHP v RHB) - Basic",
  "app": "SB",
  "content_type_id": 19,
  "id": "cdc97a91bde69553327a640d2e7fdc51",
  "id_worker": "f0ccbe80-cf56-444e-81ba-2c80b2ad6e44",
  "object_id": 196,
  "processed_worker": "2019-01-12T04:37:33+00:00",
  "team": "",
  "team_id": "",
  "time_answered": 0,
  "time_answered_formatted": "January 11th 2019, 9:47:52 pm",
  "timestamp": "2019-01-12T03:49:00.000Z",
  "user_id": 1159,
  "Pitch Location Score": 80,
  "Pitch Type Score": 10,
  "Total Score": 95,
  "action_name": "Question Response",
  "time_video_started": 0,
  "timestamp_formatted": "January 11th 2019, 9:49:00 pm",
  "Question__pitcher_hand_value": "L",
  "Question__pitcher_name_value": "3014",
  "Question__hls_occluded_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c5/master.m3u8",
  "Question__full_video__pitch_type": 4,
  "Question__full_video__title": "3014-15c-full",
  "Question__full_video__pitcher_hand": "L",
  "Question__full_video__pitcher_name": "3014",
  "Question__full_video__labels__0": 1,
  "Question__full_video__labels__1": 3,
  "Question__full_video__labels__2": 4,
  "Question__full_video__labels__3": 24,
  "Question__full_video__labels__4": 29,
  "Question__full_video__labels__5": 109,
  "Question__full_video__id": 4467,
  "Question__full_video__pitch_count": "1-0",
  "Question__full_video__file": "https://gamesense-videos.s3.amazonaws.com/3014-15c-full.mp4",
  "Question__full_video__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c-full/master.m3u8",
  "Question__full_video__pitch_location": 2,
  "Question__full_video__batter_hand": "R",
  "Question__text": null,
  "Question__occluded_video__pitch_type": 4,
  "Question__occluded_video__title": "3014-15c",
  "Question__occluded_video__pitcher_hand": "L",
  "Question__occluded_video__pitcher_name": "3014",
  "Question__occluded_video__labels__0": 1,
  "Question__occluded_video__labels__1": 3,
  "Question__occluded_video__labels__2": 4,
  "Question__occluded_video__labels__3": 24,
  "Question__occluded_video__labels__4": 29,
  "Question__occluded_video__labels__5": 40,
  "Question__occluded_video__labels__6": 109,
  "Question__occluded_video__id": 4469,
  "Question__occluded_video__pitch_count": "1-0",
  "Question__occluded_video__file": "https://gamesense-videos.s3.amazonaws.com/3014-15c5.mp4",
  "Question__occluded_video__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c5/master.m3u8",
  "Question__occluded_video__pitch_location": 2,
  "Question__occluded_video__batter_hand": "R",
  "Question__pitch_type_value": null,
  "Question__field_name_id": null,
  "Question__response_uris__0": "/player/api-auth/baseball/pitchtypes/?video_id=4469&drill_id=196",
  "Question__response_uris__1": "/player/api-auth/baseball/pitchlocations/",
  "Question__pitch_count": "1-0",
  "Question__pitch_location_value": null,
  "Question__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c-full/master.m3u8",
  "Question__batter_hand_value": "R",
  "Question__occluded_video_file": "3014-15c5.mp4",
  "Question__field_name": null,
  "Question__id": 22975,
  "Question__full_video_file": "3014-15c-full.mp4",
  "Response__incorrect": true,
  "Response__correct": false,
  "Response__objName": "pitch_type",
  "Response__id": 1,
  "Response__name": "Fastball",
  "spent_time": 5.458
}
*/
      result.app = data.app = data.app.toUpperCase();

      result.id = data.id;
      result.id_submission = data.id_submission;


      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      // time

      if (data.timestamp) {
        result.time_answered_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.time_answered = new Date(moment(data.timestamp).format());
      }
      result.time_video_started = new Date(moment(data.timestamp).subtract(data.spent_time, 'seconds').format());
      result.time_video_started_formatted = moment(result.time_video_started).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
      result.time_spent = data.spent_time;
      result.device = data.user_device || "Web Browser";
      result.os = data.user_platform_os || "Unknown";


      // player
      result.user_id = data.user_id;
      let player = await db.collection('users').findOne({id:data.user_id,app:data.app});

      if (player) {
        result.player_first_name = player.first_name;
        result.player_last_name = player.last_name;
        result.player_id = `${data.user_id} ${player.first_name} ${player.last_name}`; 
        result.team = data.team;
        result.team_name = player.team;
        result.team_id = data.team_id;
      } else {
        console.log('******** Error player does not exist ' + data.user_id + data.app);
      }

      // read question

      result.question_id = data.Question__id;
      result.pitch = data.Question__occluded_video_file.replace('.mp4', '');
      result.occlusion = ('R' + result.pitch.substr(-1, 1)).replace(/R[abcdABCD]/, 'None');
      result.player_batting_hand = data.Question__batter_hand_value;
      result.pitcher_hand = data.Question__occluded_video__batter_hand;
      result.pitch_count = data.Question__occluded_video__pitch_count;
      result.pitcher_code = data.Question__occluded_video__pitcher_name;
      result.drill = data.activity_value;
      let titleParts = new RegExp("([A-Za-z\\s]+[A-Za-z]).*-\\s*([A-Za-z\\s]+)").exec(data.activity_value);
      if (titleParts) {
        result.pitcher_name = titleParts[1];
        result.difficulty = titleParts[2];
      }
      
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
      let query = {id_submission:result.id_submission,question_id:result.question_id};
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
      console.log("Error: " + (ex.stack ? ex : ""));
      console.error(ex.stack || ex);
    }
  }
}

module.exports = Task;
