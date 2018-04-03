var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('./consumer');
var moment = require('moment');

// calc single player scores

const q = 'test.calculate_old';
const c = 'test_calc';

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

          // msg should contain ids of test records to run calcs on
          consumer.consume(async function(msgContent, msg, conn, ch) {
             
                  try {

                      var db = client.db(dbName);


                      // ***** ETL Logic ******
                      
                      let data = {

                        occlusion_plus_5_type_score: null,
                        occlusion_plus_2_type_score: null,
                        occlusion_none_type_score: null,

                        occlusion_plus_5_location_score: null,
                        occlusion_plus_2_location_score: null,
                        occlusion_none_location_score: null,

                        occlusion_plus_5_both_score: null,
                        occlusion_plus_2_both_score: null,
                        occlusion_none_both_score: null,

                        total_type_score: null,
                        total_location_score: null,
                        total_both_score: null,

                        prs: null 

                      };

                      data.processed_worker = moment().format();
                      data.id_worker = consumer.uuidForCurrentExecution;

                      var responses = await db.collection('test_usage').find({id:{$in:msgContent.ids}});
                      console.log(responses[0])

                      data.response_ids = msgContent.ids;


                      let AvgToPercent = (scores, propName) => {
                        let sum = 0;
                        scores.forEach((s) => {
                          sum += s[propName]
                        })
                        return sum / 2;
                      }

                      data.scoreingAlgorithm = "AvgToPercent";

                      // occlusion scores

                      // total scores

                      // PR score
                      
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
