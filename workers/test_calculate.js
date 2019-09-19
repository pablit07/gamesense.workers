var moment = require("moment");
const uuid = require("uuid/v4");
var MongoRmqWorker = require("../lib/MongoRmqWorker");

// calc single player scores

const c = "test_calc";


class Task extends MongoRmqWorker {

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

                      const player_jersey_id = msgContent.player_jersey_id,
                            player_id = msgContent.player_id;


                      if (player_id || player_jersey_id) {
                        let query = {};
                        if (player_id) {
                            Object.assign(query, {player_id});
                        }
                        if (player_jersey_id) {
                            Object.assign(query, {player_jersey_id});
                        }
                        var byPlayerId = await db.collection("test_usage").distinct("id_submission", query);
                        if (byPlayerId.length) {
                            byPlayerId.forEach(r => {
                                this.publishQ({id_submission:r}, "test.calculate", false, ch);
                                
                            });
                        }
                        ch.ack(msg);
                        return;
                      }
                      

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

                      data.totalRowCount = await db.collection("test_usage").count({id_submission:msgContent.id_submission});

                      if (data.totalRowCount === 0) {
                          this.publishError(msg, ch, "no_rows");
                          ch.ack(msg);
                          return;
                      }

                      let rows_plus_2, rows_plus_5, rows_none, rows;
                      let query_plus_2 = {id_submission: msgContent.id_submission, occlusion: "R+2"},
                          query_plus_5 = {id_submission: msgContent.id_submission, occlusion: "R+5"},
                          query_none = {id_submission: msgContent.id_submission, occlusion: "None"},
                          query = {id_submission: msgContent.id_submission};
                      let cursor_plus_2 = db.collection("test_usage").find(query_plus_2),
                          cursor_plus_5 = db.collection("test_usage").find(query_plus_5),
                          cursor_none = db.collection("test_usage").find(query_none),
                          cursor = db.collection("test_usage").find(query).limit(1);
                      [data.rowCount_plus_2,
                          rows_plus_2,
                          data.rowCount_plus_5,
                          rows_plus_5,
                          data.rowCount_none,
                          rows_none,
                          rows] = await Promise.all([db.collection("test_usage").count(query_plus_2),
                          cursor_plus_2.toArray(),
                          db.collection("test_usage").count(query_plus_5),
                          cursor_plus_5.toArray(),
                          db.collection("test_usage").count(query_none),
                          cursor_none.toArray(),
                          cursor.toArray()]);
                      if (rows_plus_2.some(r => r.type_score == null || r.location_score == null || r.completely_correct_score == null) ||
                          rows_plus_5.some(r => r.type_score == null || r.location_score == null || r.completely_correct_score == null) ||
                          rows_none.some(r => r.type_score == null || r.location_score == null || r.completely_correct_score == null)) {

                          this.publishError(msg, ch, "null_scores");
                          ch.ack(msg);
                          return;
                      }
                      [data.occlusion_plus_2_location_score, data.occlusion_plus_2_location_avg] = (AvgToPercent(rows_plus_2, "location_score"));
                      [data.occlusion_plus_2_type_score, data.occlusion_plus_2_type_avg] = (AvgToPercent(rows_plus_2, "type_score"));
                      [data.occlusion_plus_2_completely_correct_score, data.occlusion_plus_2_completely_correct_avg] = (AvgToPercent(rows_plus_2, "completely_correct_score"));
                      [data.occlusion_plus_5_location_score, data.occlusion_plus_5_location_avg] = (AvgToPercent(rows_plus_5, "location_score"));
                      [data.occlusion_plus_5_type_score, data.occlusion_plus_5_type_avg] = (AvgToPercent(rows_plus_5, "type_score"));
                      [data.occlusion_plus_5_completely_correct_score, data.occlusion_plus_5_completely_correct_avg] = (AvgToPercent(rows_plus_5, "completely_correct_score"));
                      [data.occlusion_none_location_score, data.occlusion_none_location_avg] = (AvgToPercent(rows_none, "location_score"));
                      [data.occlusion_none_type_score, data.occlusion_none_type_avg] = (AvgToPercent(rows_none, "type_score"));
                      [data.occlusion_none_completely_correct_score, data.occlusion_none_completely_correct_avg] = (AvgToPercent(rows_none, "completely_correct_score"));
                      data.occlusion_plus_2_plus_5_type_avg = (data.occlusion_plus_2_type_avg + data.occlusion_plus_5_type_avg) / 2;
                      data.occlusion_plus_2_plus_5_location_avg = (data.occlusion_plus_2_location_avg + data.occlusion_plus_5_location_avg) / 2;
                      data.occlusion_plus_2_plus_5_completely_correct_avg = (data.occlusion_plus_2_completely_correct_avg + data.occlusion_plus_5_completely_correct_avg) / 2;
                      data.total_location_score = Math.round((data.occlusion_plus_5_location_score + data.occlusion_plus_2_location_score) / 2.0);
                      data.total_type_score = Math.round((data.occlusion_plus_5_type_score + data.occlusion_plus_2_type_score) / 2.0);
                      data.total_completely_correct_score = Math.round((data.occlusion_plus_5_completely_correct_score + data.occlusion_plus_2_completely_correct_score) / 2.0);
                      if (msgContent["timestamp"] != null) {
                          data.completion_timestamp = msgContent.timestamp;
                          data.completion_timestamp_formatted = moment(data.completion_timestamp).utcOffset(-6).format("MMMM Do YYYY, h:mm:ss a");
                      }
                      let player = {};
                      if (msgContent["player"] != null) {
                          player = msgContent.player;
                          player.player_id = data.player_id = `${player.jersey_number} ${player.first_name} ${player.last_name}`;
                          data.player_first_name = player.first_name;
                          data.player_last_name = player.last_name;
                      } else if (rows[0].first_name && rows[0].last_name && rows[0].jersey_number) {
                          // this is for the manual entry textbox in the app
                          player.player_id = `${rows[0].jersey_number} ${rows[0].first_name} ${rows[0].last_name}`;
                          data.player_first_name = rows[0].first_name;
                          data.player_last_name = rows[0].last_name;
                      } else {
                          player.player_id = data.player_id = rows[0].player_id;
                          data.player_first_name = rows[0].player_first_name;
                          data.player_last_name = rows[0].player_last_name;
                      }
                      console.log('  [x]  Using player_id ' + player.player_id);
                      data.team = rows[0].team;
                      data.test_date = rows[0].time_video_started_formatted.split(",")[0];
                      data.test_date_raw = new Date(data.test_date.replace(/(\d+)st|nd|rd|th/, "$1").replace(/^(\w{3})\w*\s/, "$1 "));

                      let updateSet = {
                          ...player,
                          team: data.team,
                          test_date: data.test_date,
                          test_date_raw: data.test_date_raw,
                          completion_timestamp: data.completion_timestamp,
                          total_location_score: data.total_location_score,
                          total_type_score: data.total_type_score,
                          total_completely_correct_score: data.total_completely_correct_score,
                          occlusion_plus_2_location_score: data.occlusion_plus_2_location_score,
                          occlusion_plus_2_location_avg: data.occlusion_plus_2_location_avg,
                          occlusion_plus_2_type_score: data.occlusion_plus_2_type_score,
                          occlusion_plus_2_type_avg: data.occlusion_plus_2_type_avg,
                          occlusion_plus_2_completely_correct_score: data.occlusion_plus_2_completely_correct_score,
                          occlusion_plus_2_completely_correct_avg: data.occlusion_plus_2_completely_correct_avg,
                          occlusion_none_location_score: data.occlusion_none_location_score,
                          occlusion_none_location_avg: data.occlusion_none_location_avg,
                          occlusion_none_type_score: data.occlusion_none_type_score,
                          occlusion_none_type_avg: data.occlusion_none_type_avg,
                          occlusion_none_completely_correct_score: data.occlusion_none_completely_correct_score,
                          occlusion_none_completely_correct_avg: data.occlusion_none_completely_correct_avg,
                          occlusion_plus_5_location_score: data.occlusion_plus_5_location_score,
                          occlusion_plus_5_location_avg: data.occlusion_plus_5_location_avg,
                          occlusion_plus_5_type_score: data.occlusion_plus_5_type_score,
                          occlusion_plus_5_type_avg: data.occlusion_plus_5_type_avg,
                          occlusion_plus_5_completely_correct_score: data.occlusion_plus_5_completely_correct_score,
                          occlusion_plus_5_completely_correct_avg: data.occlusion_plus_5_completely_correct_avg,
                          occlusion_plus_2_plus_5_type_avg: data.occlusion_plus_2_plus_5_type_avg,
                          occlusion_plus_2_plus_5_location_avg: data.occlusion_plus_2_plus_5_location_avg,
                          occlusion_plus_2_plus_5_completely_correct_avg: data.occlusion_plus_2_plus_5_completely_correct_avg
                      };

                      if (data.total_completely_correct_score) {
                          updateSet.prs = data.prs = Math.round(data.total_completely_correct_score) - 100;
                      }
                      if (msgContent["Total Score"] !== undefined) {
                          updateSet.first_glance_location_score = data.first_glance_location_score = msgContent["Pitch Location Score"];
                          updateSet.first_glance_type_score = data.first_glance_type_score = msgContent["Pitch Type Score"];
                          updateSet.first_glance_total_score = data.first_glance_total_score = msgContent["Total Score"];
                      }
                      db.collection("test_usage").updateMany(query, {
                          $set: updateSet
                      });
                      console.log(` [x] Wrote ${JSON.stringify(data)} to ${this.DbName + "." + c}`);

                      db.collection(c).updateOne({
                          id_submission: msgContent.id_submission,
                          scoringAlgorithm: data.scoringAlgorithm
                      }, {$set:data}, {upsert: true});
                      ch.ack(msg);


                } catch (ex) {
                      this.logError(msgContent, msg, ex);
                  // client.close();
                  // conn.close();
                }
  }
}

module.exports = Task;
