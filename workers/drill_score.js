var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');


function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function(txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }


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
        result.team_name = player.team;
      } else {
        console.log('******** Error player does not exist ' + data.user_id + data.app);
      }
      result.team_id = data.team_id;      
      result.team = data.team;


      // read question

      result.id_question = crypto.createHash('md5').update(`${data.app}${result.question_id}`).digest("hex");
      result.pitch = data.Question__occluded_video_file.replace('.mp4', '');
      result.occlusion = ('R+' + result.pitch.substr(-1, 1)).replace(/R\+[abcdABCD]/, 'None').replace('+R', '');
      result.player_batting_hand = data.Question__batter_hand_value;
      result.pitcher_hand = data.Question__occluded_video__batter_hand;
      result.pitch_count = data.Question__occluded_video__pitch_count;
      result.pitcher_code = data.Question__occluded_video__pitcher_name;
      let pitchParts = new RegExp("^([0-9])+.*").exec(result.pitch.replace(result.pitcher_code + '-', ''));
      if (pitchParts) {
        result.pitch_number = pitchParts[1];
        result.pitcher_is_flipped = new RegExp("^[bd].*").test(result.pitch.replace(result.pitch_number).substr(0,1));
      }
      result.drill = data.activity_value;
      let titleParts = new RegExp("([-A-Za-z\\s/.]+[A-Za-z]).*-\\s*([Ww]icked|[Aa]dvanced|[Bb]asic|[Ff]ull [Pp]itch)").exec(data.activity_value);
      if (titleParts) {
        if (titleParts.length > 1) {
          result.pitcher_name = titleParts[1];
          result.pitcher_name = result.pitcher_name.replace(/([Ff]astball\w*|[Cc]urve\w*|[Cc]hange\w*|[Dd]rop\w*|[Ss]lide\w*|[Cc]ut\w*|[Rr]ise\w*|[Ss]crew\w*|[Kk]nuckle\w*|[Cc]ombo|[Ii]nside|[Oo]utside|[Pp]itch\w*|[Ss]wing|[Ll]ow|[Hh]igh|[Aa]way|[Dd]ecision|[Tt]ravel|[Yy]outh|HS|hs|[-()/&.])/g, "").trim();
        }
        if (titleParts.length > 2) {
          result.difficulty = titleParts[2];
          result.difficulty = toTitleCase(result.difficulty);
        }
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
      console.log("Error: " + (ex.stack ? ex : ""));
      console.error(ex.stack || ex);
    }
  }
}

module.exports = Task;
