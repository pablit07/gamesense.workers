const expandQuestionData = require("./util/expandQuestionData");
var crypto = require("crypto");
var moment = require("moment");
var schemas = require("../schemas");
var MongoRmqWorker = require("../lib/MongoRmqWorker");


const c = "drill_streak";


class Task extends MongoRmqWorker {

    getInputSchema() {
        return schemas.activity;
    }

    /*
      accepts a data object and expands and extracts the fields into a single row
      and inserts into the database
    */
    async myTask(data, msg, conn, ch, db) {
        try {

            if (!data.app) {
                ch.ack(msg);
                throw Error("Must include an app label");
            }


            let rawTimestamp = moment(data.timestamp).utcOffset(-6),
                timestamp = rawTimestamp.toDate(),
                lts = moment(data.timestamp).utcOffset(-6),
                lastDay = moment(lts.subtract(1, "days").utcOffset(-6).format('MMMM Do YYYY'), "MMMM Do YYYY").toDate(),
                startDate = lts.format('MMMM Do YYYY'),
                endDate = rawTimestamp.format('MMMM Do YYYY');
            let result = {timestamp, startDate, endDate, startDate_raw:lts.startOf('day').toDate(), endDate_raw:rawTimestamp.startOf('day').toDate()};

            result.processed_worker = moment().format();
            result.id_worker = this.consumer.uuidForCurrentExecution;
            result.id_submission = data.id_submission;
            result.user_id = data.user_id;
            result.app = data.app;
            result.team_id = data.team_id;

            // check if streak exists in db already for up to previous day
            let existingStreak = await db.collection(c).findOne({
                user_id: result.user_id,
                app: result.app,
                startDate: result.startDate,
                endDate: {$ne: result.endDate}
            });

            if (existingStreak) {
                // if it does, update the end date and add a day to counter
                existingStreak.days += 1;
                existingStreak.responses += 1;
                existingStreak.endDate = result.endDate;
                existingStreak.processed_worker = result.processed_worker;
                existingStreak.id_worker = result.id_worker;
                await db.collection(c).updateOne({
                    startDate: result.startDate,
                    user_id: result.user_id,
                    app: result.app
                }, {$set: existingStreak});
            } else {
                // also check if theres one for just yesterday
                existingStreak = await db.collection(c).findOne({
                    startDate: result.startDate,
                    endDate: result.endDate,
                    user_id: result.user_id,
                    app: result.app
                });
                if (existingStreak) {
                    existingStreak.responses += 1;
                    existingStreak.processed_worker = result.processed_worker;
                    existingStreak.id_worker = result.id_worker;
                    await db.collection(c).updateOne({
                        startDate: result.startDate,
                        user_id: result.user_id,
                        app: result.app
                    }, {$set: existingStreak});
                } else {
                    // Now, look at only today

                    result.startDate = result.endDate;
                    result.startDate_raw = result.endDate_raw;

                    let sameDayStreak = await db.collection(c).findOne({
                        startDate: result.startDate,
                        endDate: result.endDate,
                        user_id: result.user_id,
                        app: result.app
                    });
                    if (sameDayStreak) {
                        sameDayStreak.responses += 1;
                        await db.collection(c).updateOne({
                            startDate: result.startDate,
                            user_id: result.user_id,
                            app: result.app
                        }, {$set: sameDayStreak});
                    } else {
                        existingStreak = result;
                        existingStreak.days = 1;
                        existingStreak.responses = 1;
                        existingStreak.responses = 1;
                        await db.collection(c).findOneAndUpdate({
                            startDate: result.startDate,
                            endDate: result.endDate,
                            user_id: result.user_id,
                            app: result.app
                        }, {$set: existingStreak}, {upsert: true});
                    }

                }
            }

            console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + "." + c}`);

            ch.ack(msg);
        } catch (ex) {
            this.logError(data, msg, ex);
            ch.ack(msg);
            // client.close();
            // conn.close();
        }
    }
}

module.exports = Task;
