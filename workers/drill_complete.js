const expandQuestionData = require("./util/expandQuestionData");
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

            data = await expandQuestionData(msgContent, data, db);

            let row = await db.collection("drill_usage").findOne({id_submission: msgContent.id_submission});
            if (!row) {
                // DONT publish error because we have parallel queues - TODO find a way to detect this condition?
                ch.ack(msg);
                return;
            }

            data.player_batting_hand = row.player_batting_hand;
            data.drill = row.drill;
            data.device = row.device;
            data.pitcher_name = row.pitcher_name;
            data.pitcher_hand = row.pitcher_hand;
            data.pitch_count = row.pitch_count;
            data.pitcher_code = row.pitcher_code;
            data.pitch_number = row.pitch_number;
            data.difficulty = row.difficulty;
            data.team = row.team;
            data.team_name = row.team;
            data.team_id = row.team_id;
            data.user_id = row.user_id;
            data.player_first_name = row.player_first_name;
            data.player_last_name = row.player_last_name;
            data.player_id = row.player_id;

            if (msgContent["Total Score"] !== undefined) {
                data.first_glance_location_score = msgContent["Pitch Location Score"];
                data.first_glance_type_score = msgContent["Pitch Type Score"];
                data.first_glance_total_score = msgContent["Total Score"];
            }

            if (msgContent.activity_name === 'Hit Station') {
                data.is_hitstation = true;
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
