var assert = require('assert');
var moment = require('moment');
var MongoRmqWorker = require('../lib/MongoRmqWorker');


const c = 'test_usage';

const locations = {1:'Ball',2:'Strike'};
const pitchtypes = {1:'Fastball',2:'Cutter',3:'Changeup',4:'Curveball',5:'Slider'};

class Task extends MongoRmqWorker {

  /*
    accepts a data object and expands and extracts the fields into a single row
    and inserts into the database
  */
  async myTask(client, data, msg, conn, ch) {

                try {

                  Object.assign({
                    time_video_started: 0,
                    time_answered: 0,
                    question_id: null,
                    team: null
                  }, data)


                    var db = client.db(this.DbName);


                    // ***** ETL Logic ******

                    data.processed_worker = moment().format();
                    data.id_worker = this.consumer.uuidForCurrentExecution;

                    // time

                    if (data.time_answered && data.time_video_started)
                      data.time_difference = (moment(data.time_answered) - moment(data.time_video_started));
                    if (data.time_video_started) {
                      data.time_video_started_formatted = moment(data.time_video_started).format('MMMM Do YYYY, h:mm:ss a');
                      data.time_video_started = new Date(moment(data.time_video_started).format());
                    }
                    if (data.time_answered) {
                      data.time_answered_formatted = moment(data.time_answered).format('MMMM Do YYYY, h:mm:ss a');
                      data.time_answered = new Date(moment(data.time_answered).format());
                    }

                    // player

                    if (data.player_id && /([^\s]+)\s+([^\s]+)\s+([^\s].*)/.test(data.player_id)) {
                      let nameParts = /([^\s]+)\s+([^\s]+)\s+([^\s].*)/.exec(data.player_id);
                      data.player_jersey_id = nameParts[1].trim();
                      data.player_first_name = nameParts[2].trim();
                      data.player_last_name = nameParts[3].trim();
                    }



                    // read question

                    let question = await db.collection('questions_and_answers').findOne({question_id:{$exists:true},id:data.question_id});
                    if (question){
                      delete question._id
                      question.correct_response_name = question.response_id;
                      question.correct_response_location_name = question.response_location;
                      question.correct_response_id = question.response_uris[0].find((x) => { return x.name == question.correct_response_name }).id
                      question.correct_response_location_id = question.response_uris[1].find((x) => { return x.name == question.correct_response_location_name }).id
                      data = Object.assign(question, data);

                      data.response_name = pitchtypes[data.response_id];
                      data.response_location_name = locations[data.response_location];
                      data.pitch = data.occluded_video_file.replace('.mp4', '');

                      // correct / incorrect

                      data.type_score = (question.correct_response_id === data.response_id) ? 1 : 0;
                      data.location_score = (question.correct_response_location_id === data.response_location) ? 1 : 0;
                      data.completely_correct_score = (data.type_score && data.location_score) ? 1 : 0;

                      data.player_batting_hand = data.batter_hand_value;
                    } else {
                      console.log('******** Error question does not exist for ' + data.question_id);
                    }

                    // read team

                    let team = await db.collection('test_team').findOne({filename:data.source_etl});
                    if (team) {
                      data.team = team.team;
                    } else {
                      console.log('******** Error team does not exist for ' + data.source_etl);
                    }

                      
            //       
                      console.log(` [x] Wrote ${JSON.stringify(data)} to ${this.DbName + '.' + c}`)
                      db.collection(c).insertOne(data)
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
