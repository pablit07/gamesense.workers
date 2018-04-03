var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('./consumer');
var moment = require('moment');



const q = 'test.score_old';
const c = 'test_usage';

// process.argv
if (!process.argv.length) sleep.sleep(30);

try {

    // Connection URL
  const url = 'mongodb://ec2-18-233-188-98.compute-1.amazonaws.com';
    // Database Name
  const dbName = 'prod';

  // Use connect method to connect to the server
  MongoClient.connect(url + '/' + dbName, function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to Mongo server");


          consumer.consume(async function(data, msg, conn, ch) {
             
                  try {

                      var db = client.db(dbName);


                      // ***** ETL Logic ******

                      data.processed_worker = moment().format();
                      data.id_worker = consumer.uuidForCurrentExecution;

                      // time

                      if (data.time_answered) data.time_answered = moment(data.time_answered).format();
                      if (data.time_video_started) {
                        data.time_video_started = moment(data.time_video_started).format();
                        data.time_video_started_formatted = moment(data.time_video_started).format('MMMM Do YYYY, h:mm:ss a');
                      }
                      if (data.time_answered && data.time_video_started)
                        data.time_difference = (moment(data.time_answered) - moment(data.time_video_started));

                      // player

                      if (data.player_id && /(\d+)\s+(\w+)\s+(\w+)/.test(data.player_id)) {
                        let nameParts = /(\d+) (\w+) (\w+)/.exec(data.player_id);
                        data.player_jersey_id = nameParts[1];
                        data.player_first_name = nameParts[2];
                        data.player_last_name = nameParts[3];
                      }

                      // read question

                      let question = await db.collection('questions_and_answers').findOne({question_id:{$exists:true},id:data.question_id});
                      if (question){
                        delete question._id
                        question.correct_response_name = question.response_id;
                        question.correct_response_location_name = question.response_location;
                        question.correct_response_id = question.response_uris[0].find((x) => { return x.name = question.correct_response_name }).id
                        question.correct_response_location_id = question.response_uris[1].find((x) => { return x.name = question.correct_response_location_name }).id
                        data = Object.assign(question, data);

                        // correct / incorrect

                        data.type_score = (question.correct_response_id === data.response_id) ? 1 : 0;
                        data.location_score = (question.correct_response_location_id === data.response_location) ? 1 : 0;
                        data.completely_correct_score = (data.type_score && data.location_score) ? 1 : 0;

                        data.player_batting_hand = data.batter_hand_value
                      } else {
                        console.log('******** Error question does not exist for ' + data.question_id);
                      }
                      // db.collection.find({question_id:{$exists:true},time_answered:{$exists:false}}) 
                      // db.collection.find({id:{$exists:true},question_id:{$exists:false},time_answered:{$exists:false}})

                        
              //       
                        console.log(` [x] Wrote ${JSON.stringify(data)} to ${dbName + '' + c}`)
                        db.collection(c).insertOne(data)
                        ch.ack(msg);
                } catch (ex) {
                  console.log("Error: " + ex);
                  // client.close();
                  // conn.close();
                }

          }, q, 'amqp://admin:admin@localhost');
    });

} catch (ex) {
  console.log("RMQ/Mongo Error: " + ex);
}
