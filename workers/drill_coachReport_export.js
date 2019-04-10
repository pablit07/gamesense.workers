var moment = require("moment");
const uuid = require("uuid/v4");
const ExportApiWorker = require("../lib/ExportApiWorker")
const schemas = require("../schemas");
const DataRepository = require("./data/drill_usageSummary");
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


            let key = `CoachReport_${moment().utcOffset(420)}.xlsx`;

            let report = {
                id: uuid(),
                s3_bucket: "",
                s3_key: "",
                s3_presigned1wk: "",
                player_id: "",
                data: {},

                received_worker: moment().format(),
                id_worker: this.consumer.uuidForCurrentExecution };

            if (!data.authToken || !data.authToken.id || !data.authToken.app) {
              throw Error("Must include authorization");
            }

            data.filters = data.filters || {};
            let user = await db.collection('users').findOne({id:data.authToken.id, app:data.authToken.app});
            if (!user || !user.team) return [];

            data.filters.team_name = user.team;


            let responses = await DataRepository.drill_usageSummary(data, db, header => { ['id_submission', 'team_name', 'app'].forEach(k => delete header[k]); return header; });

            var ws = xlsx.utils.aoa_to_sheet([['First Name',
                'Last Name',
                'Drill',
                'Score',
                'Formatted Timestamp',
                'Device',
                'Timestamp']]);

            responses = responses.sort((a,b) => {
                if ((a.player_last_name || "").toLowerCase() === (b.player_last_name || "").toLowerCase()) {
                    if ((a.player_first_name || "").toLowerCase() === (b.player_first_name || "").toLowerCase()) {
                        return a.completion_timestamp_formatted_short > b.completion_timestamp_formatted_short ? 1 : -1;
                    }
                    return (a.player_first_name || "").toLowerCase() > (b.player_first_name || "").toLowerCase() ? 1 : -1;
                }
                return (a.player_last_name || "").toLowerCase() > (b.player_last_name || "").toLowerCase() ? 1 : -1;
            });

            xlsx.utils.sheet_add_json(ws, responses, {header:['player_first_name','player_last_name','drill','first_glance_total_score','completion_timestamp_formatted','device','completion_timestamp_formatted_short'], skipHeader:true, origin:1})

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

            const s3url = s3.getSignedUrl("getObject", {
                Bucket: bucket,
                Key: key,
                Expires: 604800,
                ResponseContentDisposition: `attachment; filename="${key}"`
            });

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