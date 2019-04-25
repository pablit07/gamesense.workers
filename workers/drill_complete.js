const uuid = require("uuid/v4");
var moment = require("moment");
var schemas = require("../schemas");
var MongoRmqWorker = require("../lib/MongoRmqWorker");

// calc single player scores

const c = "drill_comp";


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

                total_type_score: 0,
                total_location_score: 0,
                total_completely_correct_score: 0
            };

            data.processed_worker = moment().format();
            data.id_worker = this.consumer.uuidForCurrentExecution;
            data.id_submission = msgContent.id_submission;

            data.team = msgContent.team;
            data.team_name = msgContent.team;
            data.team_id = msgContent.team_id;
            data.user_id = msgContent.user_id;
            data.player_first_name = msgContent.player_first_name;
            data.player_last_name = msgContent.player_last_name;
            data.player_id = msgContent.player_id;
            data.drill_date = msgContent.time_video_started_formatted.split(",")[0];
            data.drill_date_raw = moment(data.drill_date, "MMMM Do YYYY").toDate();
            data.player_batting_hand = msgContent.player_batting_hand;
            data.drill = msgContent.drill;
            data.device = msgContent.device;
            data.pitcher_name = msgContent.pitcher_name;
            data.difficulty = msgContent.difficulty;

            if (msgContent["Total Score"] !== undefined) {
                data.first_glance_location_score = msgContent["Pitch Location Score"];
                data.first_glance_type_score = msgContent["Pitch Type Score"];
                data.first_glance_total_score = msgContent["Total Score"];
            }

            if (msgContent.activity_name === 'Hit Station') {
                data.is_hitstation = true;
            }

            if (msgContent["timestamp"] !== undefined) {
                data.completion_timestamp = msgContent.timestamp;
                data.completion_timestamp_raw = new Date(msgContent.timestamp);
                data.completion_timestamp_formatted = moment(data.completion_timestamp).utcOffset(-6).format("MMMM Do YYYY, h:mm:ss a");
            }

            console.log(` [x] Wrote ${JSON.stringify(data)} to ${this.DbName + "." + c}`);
            db.collection(c).update({id_submission: msgContent.id_submission}, data, {upsert: true});
            ch.ack(msg);

        } catch (ex) {
            this.logError(msgContent, msg, ex);
            ch.ack(msg);
            // client.close();
            // conn.close();
        }
    }
}

module.exports = Task;
