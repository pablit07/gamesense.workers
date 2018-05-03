var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('../consumer');
var publisher = require('../publisher');
var moment = require('moment');
var sleep = require('sleep');
var xlsx = require('xlsx');
const AWS = require('aws-sdk')
const s3 = new AWS.S3()
var s3Stream = require('s3-upload-stream')(s3);
var fs = require('fs');
const uuid = require('uuid/v4');
const mongo_connectionString = require('../db').mongo_connectionString;
const rmq_connectionString = require('../env').rmq_connectionString;

// write csvs and upload to s3

const c = 'test_usage';
const q = 'test.export_old';

// process.argv
if (!process.argv.length) sleep.sleep(30);

// try {

    // Database Name
  const dbName = 'prod';

  // Use connect method to connect to the server
  MongoClient.connect(mongo_connectionString + '/' + dbName, async function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to Mongo server: " + mongo_connectionString + '/' + dbName);

        var db = client.db(dbName);

        consumer.consume(async (data, msg, conn, ch) => {
            var wb = xlsx.utils.book_new();

            const id_submission = data.id_submission,
                  bucket = "gamesense-test-responses",
                  key = `${id_submission}.xlsx`;

            let report = {
                id: uuid(),
                id_submission: id_submission,
                s3_bucket: '',
                s3_key: '',
                s3_presigned1wk: '',
                data: {},

                received_worker: moment().format(),
                id_worker: consumer.uuidForCurrentExecution },

                existing,
                isExisting = await db.collection('test_reports').count({id_submission:id_submission});

            if (isExisting && !data.force) {
                existing = await db.collection('test_reports').findOne({id_submission:id_submission});
                report.received_original_worker = existing.received_worker;
                report.processed_worker = moment().format();
                report.data = existing.data;
                report.s3_bucket = existing.s3_bucket;
                report.s3_key = existing.s3_key;
            } else {

                const header = {
                    'time_video_started_formatted': 1,
                    'pitch': 1,
                    'response_location_name': 1,
                    'time_answered_formatted': 1,
                    'test_id': 1,
                    'response_name': 1,
                    'player_id': 1,
                    'occlusion': 1,
                    'type_score': 1,
                    'location_score': 1,
                    'completely_correct_score': 1
                };
                const header_plus_2 = {
                    'occlusion_plus_2_type_avg': 1,
                    'occlusion_plus_2_location_avg': 1,
                    'occlusion_plus_2_completely_correct_avg': 1
                };
                const header_plus_5 = {
                    'occlusion_plus_5_type_avg': 1,
                    'occlusion_plus_5_location_avg': 1,
                    'occlusion_plus_5_completely_correct_avg': 1
                };
                const header_none = {
                    'occlusion_none_type_avg': 1,
                    'occlusion_none_location_avg': 1,
                    'occlusion_none_completely_correct_avg': 1
                };
                const headerKeys = Object.keys(Object.assign({}, header, header_plus_2));

                var cursor = db.collection(c).find({"id_submission" : id_submission, "occlusion" : 'R+2'});
                cursor.project(Object.assign({}, header, header_plus_2));

                var responses = await cursor.toArray(),
                    occlusion_plus_2_type_avg = responses[0].occlusion_plus_2_type_avg,
                    occlusion_plus_2_location_avg = responses[0].occlusion_plus_2_location_avg,
                    occlusion_plus_2_completely_correct_avg = responses[0].occlusion_plus_2_completely_correct_avg
                // clear out columns for writing to sheet
                responses.forEach((r) => { 
                    delete r._id;
                    r.occlusion_plus_2_type_avg = null;
                    r.occlusion_plus_2_location_avg = null;
                    r.occlusion_plus_2_completely_correct_avg = null;
                });

                var ws = xlsx.utils.json_to_sheet(responses, {header: headerKeys});

                xlsx.utils.sheet_add_aoa(ws, [['','','','','','','','','','','',
                    occlusion_plus_2_type_avg,
                    occlusion_plus_2_location_avg,
                    occlusion_plus_2_completely_correct_avg,
                    Math.round(occlusion_plus_2_type_avg * 1000),
                    Math.round(occlusion_plus_2_location_avg * 1000),
                    Math.round(occlusion_plus_2_completely_correct_avg * 1000)
                ]], {origin:-1});

                cursor = db.collection(c).find({"id_submission" : id_submission, "occlusion" : 'R+5'});
                cursor.project(Object.assign({}, header, header_plus_5));

                responses = await cursor.toArray();
                let occlusion_plus_5_type_avg = responses[0].occlusion_plus_5_type_avg,
                    occlusion_plus_5_location_avg = responses[0].occlusion_plus_5_location_avg,
                    occlusion_plus_5_completely_correct_avg = responses[0].occlusion_plus_5_completely_correct_avg;
                // clear out columns for writing to sheet
                responses.forEach((r) => { 
                    delete r._id;
                    r.occlusion_plus_5_type_avg = null;
                    r.occlusion_plus_5_location_avg = null;
                    r.occlusion_plus_5_completely_correct_avg = null;
                });

                xlsx.utils.sheet_add_json(ws, responses, {header: headerKeys, skipHeader: true, origin: -1});

                xlsx.utils.sheet_add_aoa(ws, [['','','','','','','','','','','',
                    occlusion_plus_5_type_avg,
                    occlusion_plus_5_location_avg,
                    occlusion_plus_5_completely_correct_avg,
                    Math.round(occlusion_plus_5_type_avg * 1000),
                    Math.round(occlusion_plus_5_location_avg * 1000),
                    Math.round(occlusion_plus_5_completely_correct_avg * 1000)
                ]], {origin:-1});

                // average of +2 and +5
                xlsx.utils.sheet_add_aoa(ws, [['','','','','','','','','','','','','','',
                    Math.round(((occlusion_plus_2_type_avg + occlusion_plus_5_type_avg) / 2) * 1000),
                    Math.round(((occlusion_plus_2_location_avg + occlusion_plus_5_location_avg) / 2) * 1000),
                    Math.round(((occlusion_plus_2_completely_correct_avg + occlusion_plus_5_completely_correct_avg) / 2) * 1000)
                ]], {origin:-1});

                // "none" results
                // cursor = db.collection(c).find({"id_submission" : id_submission, "occlusion" : 'None'});
                // cursor.project(Object.keys(Object.assign({}, header, header_none)));

                // responses = await cursor.toArray();
                // let occlusion_none_type_avg = responses[0].occlusion_none_type_avg,
                //     occlusion_none_location_avg = responses[0].occlusion_none_location_avg,
                //     occlusion_none_completely_correct_avg = responses[0].occlusion_none_completely_correct_avg;
                // // clear out columns for writing to sheet
                // responses.forEach((r) => { 
                //     delete r._id;
                //     r.occlusion_none_type_avg = null;
                //     r.occlusion_none_location_avg = null;
                //     r.occlusion_none_completely_correct_avg = null;
                // });

                // xlsx.utils.sheet_add_json(ws, responses, {header: headerKeys, skipHeader: true, origin: -1});

                // xlsx.utils.sheet_add_aoa(ws, [['','','','','','','','','','','',
                //     occlusion_none_type_avg,
                //     occlusion_none_location_avg,
                //     occlusion_none_completely_correct_avg,
                //     Math.round(occlusion_none_type_avg * 1000),
                //     Math.round(occlusion_none_location_avg * 1000),
                //     Math.round(occlusion_none_completely_correct_avg * 1000)
                // ]], {origin:-1});

                xlsx.utils.book_append_sheet(wb, ws, 'Responses');

                xlsx.writeFile(wb, `/tmp/${id_submission}.xlsx`);

                var read = fs.createReadStream(`/tmp/${id_submission}.xlsx`);
                var upload = s3Stream.upload({
                  "Bucket": bucket,
                  "Key": key
                });

                upload.on('error', function (error) {
                  console.log(error);
                });
                 
                upload.on('part', function (details) {
                  console.log(details);
                });

                read.pipe(upload);

                let reportData = xlsx.utils.sheet_to_json(ws);

                report.processed_worker = moment().format();
                report.data = reportData;
                report.s3_bucket = bucket;
                report.s3_key = key;

                await db.collection('test_reports').insertOne(report);

            }

            const s3url = s3.getSignedUrl('getObject', {
                Bucket: bucket,
                Key: key,
                Expires: 604800
            })

            report.s3_presigned1wk = s3url;

            await db.collection('test_reports').updateOne({id_submission:id_submission}, {$set: {s3_presigned1wk:report.s3_presigned1wk}});

            publisher.publishDurable(report, 'test.exported_old', rmq_connectionString);

            ch.ack(msg);

            // client.close();
        }, q, rmq_connectionString);

    });

// } catch (ex) {
//   console.log("RMQ/Mongo Error: " + ex);
// }
