var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('../consumer');
var publisher = require('../publisher');
var moment = require('moment');
var sleep = require('sleep');
const uuid = require('uuid/v4');
const mongo_connectionString = require('../db').mongo_connectionString;
const rmq_connectionString = require('../env').rmq_connectionString;

// calc single player scores

const q_sub = 'test.calculate_old';
const q_pub = 'test.notify';
const c = 'test_calc';

// process.argv
if (!process.argv.length) sleep.sleep(30);

try {

    // Connection URL
  const url = mongo_connectionString;
    // Database Name
  const dbName = 'prod';

  if (process.argv.length > 1 && process.argv[1] == 'test') {
    dbName = 'test';
  }

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
                        occlusion_plus_5_type_avg: 0,
                        occlusion_plus_2_type_score: 0,
                        occlusion_plus_2_type_avg: 0,
                        occlusion_none_type_score: 0,
                        occlusion_none_type_avg: 0,

                        occlusion_plus_5_location_score: 0,
                        occlusion_plus_5_location_avg: 0,
                        occlusion_plus_2_location_score: 0,
                        occlusion_plus_2_location_avg: 0,
                        occlusion_none_location_score: 0,
                        occlusion_none_location_avg: 0,

                        occlusion_plus_5_completely_correct_score: 0,
                        occlusion_plus_5_completely_correct_avg: 0,
                        occlusion_plus_2_completely_correct_score: 0,
                        occlusion_plus_2_completely_correct_avg: 0,
                        occlusion_none_completely_correct_score: 0,
                        occlusion_none_completely_correct_avg: 0,

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
                        return [Math.round((parseFloat(sum) / scores.length) * 1000), (parseFloat(sum) / scores.length)];
                      }

                      data.scoringAlgorithm = "AvgToPercent";

                      let rows, cursor, query;

                      let retries = 0;
                      while (data.totalRowCount !== msgContent.ids.length && retries <= 10)  {
                        data.totalRowCount = await db.collection('test_usage').count({id:{$in:msgContent.ids}});

                        if (data.totalRowCount === 0) {
                          retries++;
                          if (retries > 10) {
                            console.log('Killing message ' + JSON.stringify(msgContent.id_submission));
                            
                          } else {
                            console.log('********* Warn: ids not available (yet?), sleeping for 1 and retrying');
                            sleep.sleep(1);
                          }
                        
                        }
                      }
                      if (data.totalRowCount === 0) { ch.ack(msg); }
                      else {
                      
                        // occlusion scores
                        query = {id:{$in:msgContent.ids},occlusion:'R+2'};
                        data.rowCount_plus_2 = await db.collection('test_usage').count(query);
                        
                        cursor = db.collection('test_usage').find(query)
                        rows = await cursor.toArray();
                        [data.occlusion_plus_2_location_score, data.occlusion_plus_2_location_avg] = (AvgToPercent(rows, 'location_score') );
                        [data.occlusion_plus_2_type_score, data.occlusion_plus_2_type_avg] = (AvgToPercent(rows, 'type_score') );
                        [data.occlusion_plus_2_completely_correct_score, data.occlusion_plus_2_completely_correct_avg] = (AvgToPercent(rows, 'completely_correct_score') );
                        db.collection('test_usage').updateMany(query, {$set: {
                          occlusion_plus_2_location_score: data.occlusion_plus_2_location_score,
                          occlusion_plus_2_location_avg: data.occlusion_plus_2_location_avg,
                          occlusion_plus_2_type_score:data.occlusion_plus_2_type_score,
                          occlusion_plus_2_type_avg:data.occlusion_plus_2_type_avg,
                          occlusion_plus_2_completely_correct_score:data.occlusion_plus_2_completely_correct_score,
                          occlusion_plus_2_completely_correct_avg:data.occlusion_plus_2_completely_correct_avg
                        }});


                        query = {id:{$in:msgContent.ids},occlusion:'R+5'};
                        data.rowCount_plus_5 = await db.collection('test_usage').count(query);
                        cursor = db.collection('test_usage').find(query)
                        rows = await cursor.toArray();
                        [data.occlusion_plus_5_location_score, occlusion_plus_5_location_avg] = (AvgToPercent(rows, 'location_score') );
                        [data.occlusion_plus_5_type_score, data.occlusion_plus_5_type_avg] = (AvgToPercent(rows, 'type_score') );
                        [data.occlusion_plus_5_completely_correct_score, data.occlusion_plus_5_completely_correct_avg] = (AvgToPercent(rows, 'completely_correct_score') );
                        db.collection('test_usage').updateMany(query, {$set: {
                          occlusion_plus_5_location_score: data.occlusion_plus_5_location_score,
                          occlusion_plus_5_location_avg: data.occlusion_plus_5_location_avg,
                          occlusion_plus_5_type_score:data.occlusion_plus_5_type_score,
                          occlusion_plus_5_type_avg:data.occlusion_plus_5_type_avg,
                          occlusion_plus_5_completely_correct_score:data.occlusion_plus_5_completely_correct_score,
                          occlusion_plus_5_completely_correct_avg:data.occlusion_plus_5_completely_correct_avg
                        }});


                        query = {id:{$in:msgContent.ids},occlusion:'None'};
                        data.rowCount_none = await db.collection('test_usage').count(query);
                        cursor = db.collection('test_usage').find(query)
                        rows = await cursor.toArray();
                        [data.occlusion_none_location_score, data.occlusion_none_location_avg] = (AvgToPercent(rows, 'location_score') );
                        [data.occlusion_none_type_score, data.occlusion_none_type_avg] = (AvgToPercent(rows, 'type_score') );
                        [data.occlusion_none_completely_correct_score, data.occlusion_none_completely_correct_avg] = (AvgToPercent(rows, 'completely_correct_score') );
                        db.collection('test_usage').updateMany(query, {$set: {
                          occlusion_none_location_score: data.occlusion_none_location_score,
                          occlusion_none_location_avg: data.occlusion_none_location_avg,
                          occlusion_none_type_score:data.occlusion_none_type_score,
                          occlusion_none_type_avg:data.occlusion_none_type_avg,
                          occlusion_none_completely_correct_score:data.occlusion_none_completely_correct_score,
                          occlusion_none_completely_correct_avg:data.occlusion_none_completely_correct_avg
                        }});

                        // total scores

                        query = {id:{$in:msgContent.ids}};
                        cursor = db.collection('test_usage').find(query).limit(1)
                        rows = await cursor.toArray();
                        data.total_location_score = Math.round((data.occlusion_plus_5_location_score + data.occlusion_plus_2_location_score) / 2.0);
                        data.total_type_score = Math.round((data.occlusion_plus_5_type_score + data.occlusion_plus_2_type_score) / 2.0);
                        data.total_completely_correct_score = Math.round((data.occlusion_plus_5_completely_correct_score + data.occlusion_plus_2_completely_correct_score) / 2.0);
                        db.collection('test_usage').updateMany(query, {$set: {total_location_score: data.total_location_score,total_type_score:data.total_type_score,total_completely_correct_score:data.total_completely_correct_score}});
                        data.player_id = rows[0].player_id


                        // PR score

                        if (data.total_completely_correct_score) {
                          data.prs = Math.round(data.total_completely_correct_score) - 100;
                        }
                      
                        console.log(` [x] Wrote ${JSON.stringify(data)} to ${dbName + '.' + c}`)
                        db.collection(c).insertOne(data)
                        ch.ack(msg);

                        publisher.publish({}, q_pub, rmq_connectionString);
                      }


                } catch (ex) {
                  console.log("Error: " + (ex.stack ? ex : ""));
                  console.error(ex.stack || ex);
                  // client.close();
                  // conn.close();
                }

          }, q_sub, rmq_connectionString);
    });

} catch (ex) {
  console.log("RMQ/Mongo Error: " + ex);
}
