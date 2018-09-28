var crypto = require('crypto');
var moment = require('moment');
var schemas = require('../schemas');
var MongoRmqWorker = require('../lib/MongoRmqWorker');



const locations = {1:'Ball',2:'Strike'};
const pitchtypes = {1:'Fastball',2:'Cutter',3:'Changeup',4:'Curveball',5:'Slider'};

class Task extends MongoRmqWorker {

  constructor() {
    super(...arguments)
    this._collection = 'drill_usage';
  }


  getInputSchema() {
    return schemas.activity;
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

      result.app = data.app = data.app.toUpperCase();

      result.id = crypto.createHash('md5').update(`${data.app}${data.id}`).digest("hex");
      result.id_submission = crypto.createHash('md5').update(`${data.app}${data.activity_id}`).digest("hex");

      let actionValue = JSON.parse(data.action_value);

      // ***** ETL Logic ******

      result.processed_worker = moment().format();
      result.id_worker = this.consumer.uuidForCurrentExecution;

      // time

      // TODO need to add duration to source data
      // if (data.time_answered && data.time_video_started)
        // data.time_difference = (moment(data.time_answered) - moment(data.time_video_started));
      result.time_difference = 0;
      if (data.timestamp) {
        result.time_answered_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.time_answered = new Date(moment(data.timestamp).format());
      }
      // if (actionValue.time_answered) {
      result.time_video_started = new Date(moment(data.timestamp).subtract(result.time_difference, 'seconds').format());
      result.time_video_started_formatted = moment(result.time_answered).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');


      // player
      let player = await db.collection('users').findOne({id:data.user_id,app:data.app});

      if (player) {
        result.player_first_name = player.first_name;
        result.player_last_name = player.last_name;
        result.player_id = `${player.first_name} ${player.last_name}`; 
        result.team = player.team;
      } else {
        console.log('******** Error player does not exist ' + data.user_id + data.app);
      }



      // read question

      let question = actionValue.Question;
      if (question) {
        result.question_id = question.id;
        result.pitch = question.occluded_video_file.replace('.mp4', '');
        result.occlusion = ('R' + question.occluded_video.title.substr(-2, 2)).replace('RNO', 'None');
        result.player_batting_hand = question.batter_hand_value;
        
        // result = Object.assign({}, question, result);

        if (actionValue.Response.objName == 'pitch_location') {
          result.correct_response_location_name = locations[question.occluded_video.pitch_location];
          result.response_location_name = locations[actionValue.Response.id];
          result.response_location = actionValue.Response.id;
          result.correct_response_location_id = question.occluded_video.pitch_location;
          result.location_score = (result.correct_response_location_id === result.response_location) ? 1 : 0;
        } else {
          result.response_name = pitchtypes[actionValue.Response.id];
          result.response_id = actionValue.Response.id;
          result.correct_response_id = question.occluded_video.pitch_type;
          result.correct_response_name = pitchtypes[question.occluded_video.pitch_type];
          result.type_score = (result.correct_response_id === result.response_id) ? 1 : 0;
        }
       
        
        // actionValue.completely_correct_score = (actionValue.type_score && actionValue.location_score) ? 1 : 0;

      } else {
        console.log('******** Error question does not exist ');
      }

            //       
      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + '.' + c}`);
      let query = {id_submission:result.id_submission,question_id:result.question_id};
      let doc = await db.collection(c).findOneAndUpdate(query, {$set: result}, {upsert:true, returnOriginal:false});
      doc = doc.value;
      if (doc.type_score !== undefined && doc.location_score !== undefined) {
        let completely_correct_score = (doc.type_score && doc.location_score) ? 1 : 0;
        db.collection(c).update({id:result.id}, {$set: {completely_correct_score: completely_correct_score}});
      }

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
