var moment = require("moment");
const uuid = require("uuid/v4");
const ExportApiWorker = require("../lib/ExportApiWorker")
const schemas = require("../schemas");
const DataRepository = require("./data/drill_usageSummary");
// write csvs and upload to s3

const c = "test_calc";

class Task extends ExportApiWorker {


    getSchema() {
        return schemas.test_export;
    }

  /*
     drop an xlsx of single player scores in
     s3 and generate a copy in the database
     creates a presigned link to the report
     with a week expiry
  */
    async myTask(data, msg, conn, ch, db) {

        try {

            if (!data.authToken || !data.authToken.id || !data.authToken.app) {
                throw Error("Must include authorization");
            }

            if (!data.authToken.admin) {
                data.filters.app = data.authToken.app;
                data.filters.user_id = data.authToken.id;
            }

            const xlsx = this.xlsx,
                  s3 = this.s3,
                  s3Stream = this.s3Stream,
                  fs = this.fs

            var wb = xlsx.utils.book_new();

            const bucket = "gamesense-test-responses";


            let key = `GameSenseSports_PrScores_${moment()}.xlsx`;

            let report = {
                id: uuid(),
                s3_bucket: "",
                s3_key: "",
                s3_presigned1wk: "",
                player_id: "",
                data: {},

                received_worker: moment().format(),
                id_worker: this.consumer.uuidForCurrentExecution },

                existing,
                // isExisting = await db.collection("test_reports").count({id_submission:id_submission});
                isExisting = false;

            if (isExisting && !data.force) {
                existing = await db.collection("test_reports").findOne({id_submission:id_submission});
                report.received_original_worker = existing.received_worker;
                report.processed_worker = moment().format();
                report.data = existing.data;
                report.s3_bucket = existing.s3_bucket;
                report.s3_key = existing.s3_key;
                report.player_id = existing.player_id;
                key = existing.s3_key;
            } else {

                var rows = await db.collection(c).aggregate([
                    {$match: {'id_submission': {$in: data.filters.id_submissions}}},
                    {$addFields: {"__order": {$indexOfArray: [data.filters.id_submissions, "$id_submission" ]}}},
                    {$sort: {"__order": 1}}
                ]).toArray();

                let responses = rows.map(x => Object.assign({}, {
                    "First Name": (x.player_first_name || ""),
                    "Last Name": (x.player_last_name || ""),
                    "Pitch Type": x.first_glance_type_score,
                    "Ball/Strike": x.first_glance_location_score,
                    "PR Score": x.first_glance_total_score,
                }));

                console.log(responses);

                var ws = xlsx.utils.json_to_sheet(responses, {header: ["First Name", "Last Name", "Pitch Type", "Ball/Strike", "PR Score"]});
                xlsx.utils.book_append_sheet(wb, ws, "Responses");

                xlsx.writeFile(wb, `/tmp/${key}`);

                var read = fs.createReadStream(`/tmp/${key}`);
                var upload = s3Stream.upload({
                  "Bucket": bucket,
                  "Key": key
                });

                upload.on("error", function (error) {
                  console.log(error);
                });
                 
                upload.on("part", function (details) {
                  console.log(details);
                });

                read.pipe(upload);

                let reportData = xlsx.utils.sheet_to_json(ws);

                report.processed_worker = moment().format();
                report.data = reportData;
                report.s3_bucket = bucket;
                report.s3_key = key;

                // await db.collection("drill_reports").insertOne(report);

            }

            const s3url = s3.getSignedUrl("getObject", {
                Bucket: bucket,
                Key: key,
                Expires: 604800
            })

            report.s3_presigned1wk = s3url;

            // await db.collection("drill_reports").updateOne({s3_key:report.s3_key}, {$set: {s3_presigned1wk:report.s3_presigned1wk}});

            // this.publishQ(report, "test.exported_old", true);
            ch.ack(msg);

            return report;
        } catch (ex) {
            this.logError(data, msg, ex);
            ch.ack(msg);
        }
    }
}

module.exports = Task