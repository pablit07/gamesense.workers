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
                result = existingStreak;
                result.days += 1;
                result.responses += 1;
                delete result._id;
                await db.collection(c).updateOne({
                    startDate: result.startDate,
                    user_id: result.user_id,
                    app: result.app
                }, {$set: result});
            } else {
                // also check if theres one for just yesterday
                existingStreak = await db.collection(c).findOne({
                    startDate: result.startDate,
                    endDate: result.endDate,
                    user_id: result.user_id,
                    app: result.app
                });
                if (existingStreak) {
                    result = existingStreak;
                    result.responses += 1;
                    result.days += 1;
                    delete result._id;
                    await db.collection(c).updateOne({
                        startDate: result.startDate,
                        user_id: result.user_id,
                        app: result.app
                    }, {$set: result});
                } else {
                    // Now, look at only today

                    let sameDayStreak = await db.collection(c).findOne({
                        startDate: result.endDate,
                        endDate: result.endDate,
                        user_id: result.user_id,
                        app: result.app
                    });
                    if (sameDayStreak) {
                        result = sameDayStreak;
                        result.responses += 1;
                        delete result._id;
                        await db.collection(c).updateOne({
                            startDate: result.startDate,
                            user_id: result.user_id,
                            app: result.app
                        }, {$set: result});
                    } else {
                        result.days = 1;
                        result.responses = 1;
                        await db.collection(c).findOneAndUpdate({
                            startDate: result.startDate,
                            endDate: result.endDate,
                            user_id: result.user_id,
                            app: result.app
                        }, {$set: result}, {upsert: true});
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
