import expandQuestionData from "./util/expandQuestionData";

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
