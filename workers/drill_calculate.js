const uuid = require("uuid/v4");
var moment = require("moment");
var schemas = require("../schemas");
var sleep = require("sleep");
var MongoRmqWorker = require("../lib/MongoRmqWorker");

// calc single player scores

const c = "drill_calc";


class Task extends MongoRmqWorker {


  getInputSchema() {
    return schemas.final_score_action;
  }

  /*
     calc single player scores
  */
  async myTask(msgContent, msg, conn, ch, db) {
                  try {

                      if (this.isClientRequested(msgContent)) {
                          throw Error("Not authorized for client requests");
                      }

                      // ***** ETL Logic ******
                      
                      let data = {
                        id: uuid(),
                        app: msgContent.app,

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

                        occlusion_plus_2_plus_5_type_avg: 0,
                        occlusion_plus_2_plus_5_location_avg: 0,
                        occlusion_plus_2_plus_5_completely_correct_avg: 0,

                        total_type_score: 0,
                        total_location_score: 0,
                        total_completely_correct_score: 0,

                        totalRowCount: 0,

                        prs: null

                      };

                      data.processed_worker = moment().format();
                      data.id_worker = this.consumer.uuidForCurrentExecution;
                      data.id_submission = msgContent.id_submission;                      

                      // sums then averages, x 100 then round to nearest non decimal
                      let AvgToPercent = (scores, propName) => {
                        let sum = 0.0;
                        scores.forEach((s) => {
                          sum += s[propName];
                        });
                        if (!sum) return [0,0];
                        return [Math.round((parseFloat(sum) / scores.length) * 1000), (parseFloat(sum) / scores.length)];
                      }

                      data.scoringAlgorithm = "AvgToPercent";

                      let rows, cursor, query;

                      let retries = 0;
                      while (data.totalRowCount === 0 && retries <= 10)  {
                        // let one = await db.collection("drill_usage").findOne({});

                        // console.log("Found:" + one.id);

                        data.totalRowCount = await db.collection("drill_usage").count({id_submission:msgContent.id_submission});

                        if (data.totalRowCount === 0) {
                          retries++;
                          if (retries > 10) {
                            console.log("Killing message " + JSON.stringify(msgContent.id_submission));
                            
                          } else {
                            console.log("********* Warn: ids not available (yet?), sleeping for 1 and retrying");
                            sleep.sleep(1);
                          }
                        
                        }
                      }
                      if (data.totalRowCount === 0) { ch.ack(msg); }
                      else {

                        let rows_plus_2, rows_plus_5, rows_none, rows;

                        let query_plus_2 = {id_submission:msgContent.id_submission,occlusion:"R+2"},
                            query_plus_5 = {id_submission:msgContent.id_submission,occlusion:"R+5"},
                            query_none = {id_submission:msgContent.id_submission,occlusion:"None"},
                            query = {id_submission:msgContent.id_submission};

                        let cursor_plus_2 = db.collection("drill_usage").find(query_plus_2),
                            cursor_plus_5 = db.collection("drill_usage").find(query_plus_5),
                            cursor_none = db.collection("drill_usage").find(query_none),
                            cursor = db.collection("drill_usage").find(query).limit(1);

                        [data.rowCount_plus_2,
                         rows_plus_2,
                         data.rowCount_plus_5,
                         rows_plus_5,
                         data.rowCount_none,
                         rows_none,
                         rows] = await Promise.all([db.collection("drill_usage").count(query_plus_2),
                                                    cursor_plus_2.toArray(),
                                                    db.collection("drill_usage").count(query_plus_5),
                                                    cursor_plus_5.toArray(),
                                                    db.collection("drill_usage").count(query_none),
                                                    cursor_none.toArray(),
                                                    cursor.toArray()]);
                      
                        // occlusion scores

                        [data.occlusion_plus_2_location_score, data.occlusion_plus_2_location_avg] = (AvgToPercent(rows_plus_2, "location_score") );
                        [data.occlusion_plus_2_type_score, data.occlusion_plus_2_type_avg] = (AvgToPercent(rows_plus_2, "type_score") );
                        [data.occlusion_plus_2_completely_correct_score, data.occlusion_plus_2_completely_correct_avg] = (AvgToPercent(rows_plus_2, "completely_correct_score") );
                        

                        [data.occlusion_plus_5_location_score, data.occlusion_plus_5_location_avg] = (AvgToPercent(rows_plus_5, "location_score") );
                        [data.occlusion_plus_5_type_score, data.occlusion_plus_5_type_avg] = (AvgToPercent(rows_plus_5, "type_score") );
                        [data.occlusion_plus_5_completely_correct_score, data.occlusion_plus_5_completely_correct_avg] = (AvgToPercent(rows_plus_5, "completely_correct_score") );


                        [data.occlusion_none_location_score, data.occlusion_none_location_avg] = (AvgToPercent(rows_none, "location_score") );
                        [data.occlusion_none_type_score, data.occlusion_none_type_avg] = (AvgToPercent(rows_none, "type_score") );
                        [data.occlusion_none_completely_correct_score, data.occlusion_none_completely_correct_avg] = (AvgToPercent(rows_none, "completely_correct_score") );
                        

                        data.occlusion_plus_2_plus_5_type_avg = (data.occlusion_plus_2_type_avg + data.occlusion_plus_5_type_avg) / 2;
                        data.occlusion_plus_2_plus_5_location_avg = (data.occlusion_plus_2_location_avg + data.occlusion_plus_5_location_avg) / 2;
                        data.occlusion_plus_2_plus_5_completely_correct_avg = (data.occlusion_plus_2_completely_correct_avg + data.occlusion_plus_5_completely_correct_avg) / 2;

                        // total scores

                        data.total_location_score = Math.round((data.occlusion_plus_5_location_score + data.occlusion_plus_2_location_score) / 2.0);
                        data.total_type_score = Math.round((data.occlusion_plus_5_type_score + data.occlusion_plus_2_type_score) / 2.0);
                        data.total_completely_correct_score = Math.round((data.occlusion_plus_5_completely_correct_score + data.occlusion_plus_2_completely_correct_score) / 2.0);
                        
                        data.team = rows[0].team;
                        data.team_name = rows[0].team;
                        data.team_id = rows[0].team_id;
                        data.user_id = rows[0].user_id;
                        data.player_first_name = rows[0].player_first_name;
                        data.player_last_name = rows[0].player_last_name;
                        data.player_id = rows[0].player_id;
                        data.drill_date = rows[0].time_video_started_formatted.split(",")[0];
                        data.drill_date_raw = moment(data.drill_date, "MMMM Do YYYY").toDate();
                        data.player_batting_hand = rows[0].player_batting_hand;
                        data.drill = rows[0].drill;
                        data.device = rows[0].device;
                        data.pitcher_name = rows[0].pitcher_name;
                        data.difficulty = rows[0].difficulty;

                        // PR score

                        if (data.total_completely_correct_score) {
                          data.prs = Math.round(data.total_completely_correct_score) - 100;
                          if (!data.prs || data.prs < 0) {
                            data.prs = 0;
                          }
                        }

                        data.first_glance_location_score = msgContent["Pitch Location Score"];
                        data.first_glance_type_score = msgContent["Pitch Type Score"];
                        data.first_glance_total_score = msgContent["Total Score"];

                        if (msgContent["timestamp"] !== undefined) {
                          data.completion_timestamp = msgContent.timestamp;
                          data.completion_timestamp_raw = new Date(msgContent.timestamp);
                          data.completion_timestamp_formatted = moment(data.completion_timestamp).utcOffset(-6).format("MMMM Do YYYY, h:mm:ss a");
                        }

                        // update rows

                        db.collection("drill_usage").updateMany(query, {$set: data});
                      
                        console.log(` [x] Wrote ${JSON.stringify(data)} to ${this.DbName + "." + c}`);
                        db.collection(c).update({id_submission:msgContent.id_submission,scoringAlgorithm:data.scoringAlgorithm}, data, {upsert:true});
                        ch.ack(msg);

                        // this.publish({}, q_pub);
                      }


                } catch (ex) {
                      this.logError(msgContent, msg, ex);
                      ch.ack(msg);
                  // client.close();
                  // conn.close();
                }
  }
}

module.exports = Task;
