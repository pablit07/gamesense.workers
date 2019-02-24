var moment = require("moment");
const uuid = require("uuid/v4");
const ExportApiWorker = require("../lib/ExportApiWorker")
const schemas = require("../schemas");
// write csvs and upload to s3

const c = "drill_calc";

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
            const xlsx = this.xlsx,
                  s3 = this.s3,
                  s3Stream = this.s3Stream,
                  fs = this.fs

            var wb = xlsx.utils.book_new();

            const bucket = "gamesense-drill-responses";


            let key = `GameSenseSports_DrillUsage_${moment()}.xlsx`;

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

                const header = {id_submission:1,team_name:1,player_first_name:1,player_last_name:1,drill:1,app:1,first_glance_total_score:1,completion_timestamp_formatted:1,device:1};
                
                const headerKeys = Object.keys(header);





                let query = {};

                data.filters = data.filters || {};
                query['drill_date_raw'] = {$ne:null};

                if (data.filters.minDate) {
                    Object.assign(query['drill_date_raw'], {$gt:new Date(data.filters.minDate)});
                }

                if (data.filters.maxDate) {
                    Object.assign(query['drill_date_raw'], {$lt:new Date(data.filters.maxDate)});
                }

                var cursor = db.collection(c).find(query, {sort:{"drill_date_raw":-1} });
                cursor.project(header);

                var responses = await cursor.toArray();

                responses = responses.map(r => {
                    let shortDate = moment(r.completion_timestamp_formatted, 'MMMM Do YYYY, hh:mm:ss a').format('YYYY-MM-DD HH:mm:ss');
                    delete r._id;
                    return Object.assign({
                    first_glance_total_score: r.first_glance_total_score || 0,
                    completion_timestamp_formatted_short: shortDate
                }, r);});


                var ws = xlsx.utils.json_to_sheet(responses, {header: headerKeys});
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

                await db.collection("drill_reports").insertOne(report);

            }

            const s3url = s3.getSignedUrl("getObject", {
                Bucket: bucket,
                Key: key,
                Expires: 604800
            })

            report.s3_presigned1wk = s3url;

            await db.collection("drill_reports").updateOne({s3_key:report.s3_key}, {$set: {s3_presigned1wk:report.s3_presigned1wk}});

            // this.publishQ(report, "test.exported_old", true);
            ch.ack(msg);

            return report;
        } catch (ex) {
            console.error(ex);
            ch.ack(msg);
        }
    }
}

module.exports = Task