var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('./consumer');
var moment = require('moment');
var sleep = require('sleep');
const uuid = require('uuid/v4');

// calc single player scores

const q = 'test.calculate_old';
const c = 'test_calc';

const multiplier = 0.733;

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
                        id: uuid(),

                        occlusion_plus_5_type_score: 0,
                        occlusion_plus_2_type_score: 0,
                        occlusion_none_type_score: 0,

                        occlusion_plus_5_location_score: 0,
                        occlusion_plus_2_location_score: 0,
                        occlusion_none_location_score: 0,

                        occlusion_plus_5_completely_correct_score: 0,
                        occlusion_plus_2_completely_correct_score: 0,
                        occlusion_none_completely_correct_score: 0,

                        total_type_score: 0,
                        total_location_score: 0,
                        total_completely_correct_score: 0,

                        totalRowCount: 0,

                        prs: null

                      };

                      data.processed_worker = moment().format();
                      data.id_worker = consumer.uuidForCurrentExecution;
                      data.id_submission = msgContent.id_submission;
                      
                      

                      data.response_ids = msgContent.ids;

                      // sums then averages, x 100 then round to nearest non decimal
                      let AvgToPercent = (scores, propName) => {
                        let sum = 0.0;
                        scores.forEach((s) => {
                          sum += s[propName];
                        });
                        if (!sum) return 0;
                        return Math.round((parseFloat(sum) / scores.length) * 1000);
                      }

                      data.scoringAlgorithm = "AvgToPercent";

                      let rows, cursor, query;

                      let retries = 0;
                      while (data.totalRowCount === 0 && retries <= 10)  {
                        data.totalRowCount = await db.collection('test_usage').count({id:{$in:msgContent.ids}});

                        if (data.totalRowCount === 0) {
                          retries++;
                          if (retries > 10) {
                            console.log('Killing message ' + JSON.stringify(msgContent.id_submission));
                            
                          } else {
                            console.log('********* Warn: ids not available (yet?), sleeping for 1 and accepting');
                            sleep.sleep(1);
                          }
                        
                        }
                      }

                      
                      // occlusion scores
                      query = {id:{$in:msgContent.ids},occlusion:'R+2'};
                      data.rowCount_plus_2 = await db.collection('test_usage').count(query);
                      
                      cursor = db.collection('test_usage').find(query)
                      rows = await cursor.toArray();
                      data.occlusion_plus_2_location_score = (AvgToPercent(rows, 'location_score') );
                      data.occlusion_plus_2_type_score = (AvgToPercent(rows, 'type_score') );
                      data.occlusion_plus_2_completely_correct_score = (AvgToPercent(rows, 'completely_correct_score') );
                      db.collection('test_usage').updateMany(query, {$set: {occlusion_plus_2_both_score: data.occlusion_plus_2_location_score, occlusion_plus_2_type_score:data.occlusion_plus_2_type_score, occlusion_plus_2_both_score:data.occlusion_plus_2_both_score}});


                      query = {id:{$in:msgContent.ids},occlusion:'R+5'};
                      data.rowCount_plus_5 = await db.collection('test_usage').count(query);
                      cursor = db.collection('test_usage').find(query)
                      rows = await cursor.toArray();
                      data.occlusion_plus_5_location_score = (AvgToPercent(rows, 'location_score') );
                      data.occlusion_plus_5_type_score = (AvgToPercent(rows, 'type_score') );
                      data.occlusion_plus_5_completely_correct_score = (AvgToPercent(rows, 'completely_correct_score') );
                      db.collection('test_usage').updateMany(query, {$set: {occlusion_plus_5_location_score: data.occlusion_plus_5_location_score,occlusion_plus_5_type_score:data.occlusion_plus_5_type_score,occlusion_plus_5_completely_correct_score:data.occlusion_plus_5_completely_correct_score}});


                      query = {id:{$in:msgContent.ids},occlusion:'None'};
                      data.rowCount_none = await db.collection('test_usage').count(query);
                      cursor = db.collection('test_usage').find(query)
                      rows = await cursor.toArray();
                      data.occlusion_none_location_score = (AvgToPercent(rows, 'location_score') );
                      data.occlusion_none_type_score = (AvgToPercent(rows, 'type_score') );
                      data.occlusion_none_completely_correct_score = (AvgToPercent(rows, 'completely_correct_score') );
                      db.collection('test_usage').updateMany(query, {$set: {occlusion_none_location_score: data.occlusion_none_location_score,occlusion_none_type_score:data.occlusion_none_type_score,occlusion_none_completely_correct_score:data.occlusion_none_completely_correct_score}});

                      // total scores

                      query = {id:{$in:msgContent.ids}};
                      cursor = db.collection('test_usage').find(query)
                      rows = await cursor.toArray();
                      data.total_location_score = (AvgToPercent(rows, 'location_score') );
                      data.total_type_score = (AvgToPercent(rows, 'type_score') );
                      data.total_completely_correct_score = (AvgToPercent(rows, 'completely_correct_score') );
                      db.collection('test_usage').updateMany(query, {$set: {total_location_score: data.total_location_score,total_type_score:data.total_type_score,total_completely_correct_score:data.total_completely_correct_score}});


                      // PR score

                      if (data.total_completely_correct_score) {
                        data.pr = Math.round(multiplier * data.total_completely_correct_score);
                      }
                      
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
