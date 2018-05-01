var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('../consumer');
var publisher = require('../publisher');
var moment = require('moment');
var sleep = require('sleep');
var xlsx = require('xlsx');
var AWS = require('aws-sdk');
var s3Stream = require('s3-upload-stream')(new AWS.S3());
var fs = require('fs');
const uuid = require('uuid/v4');
const mongo_connectionString = require('../db').mongo_connectionString;
const rmq_connectionString = require('../env').rmq_connectionString;

// write csvs and upload to s3

const c = 'test_usage';

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
        var wb = xlsx.utils.book_new();
        const id_submission = "a37649b4-5a54-4874-928f-01210fd8008b";
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
            Math.round((occlusion_plus_2_type_avg + occlusion_plus_5_type_avg) / 2),
            Math.round((occlusion_plus_2_location_avg + occlusion_plus_5_location_avg) / 2),
            Math.round((occlusion_plus_2_completely_correct_avg + occlusion_plus_5_completely_correct_avg) / 2)
        ]], {origin:-1});

        // "none" results
        cursor = db.collection(c).find({"id_submission" : id_submission, "occlusion" : 'None'});
        cursor.project(header);

        responses = await cursor.toArray();
        // let occlusion_plus_5_type_avg = responses[0].occlusion_plus_5_type_avg,
        //     occlusion_plus_5_location_avg = responses[0].occlusion_plus_5_location_avg,
        //     occlusion_plus_5_completely_correct_avg = responses[0].occlusion_plus_5_completely_correct_avg;
        // clear out columns for writing to sheet
        responses.forEach((r) => { 
            delete r._id;
        });

        xlsx.utils.sheet_add_json(ws, responses, {header: headerKeys, skipHeader: true, origin: -1});

        xlsx.utils.book_append_sheet(wb, ws, 'Responses');

        xlsx.writeFile(wb, `/tmp/${id_submission}.xlsx`);

        var read = fs.createReadStream(`/tmp/${id_submission}.xlsx`);
        var upload = s3Stream.upload({
          "Bucket": "gamesense-test-responses",
          "Key": `${id_submission}.xlsx`
        });

        upload.on('error', function (error) {
          console.log(error);
        });
         
        upload.on('part', function (details) {
          console.log(details);
        });

        read.pipe(upload);

        client.close();

    });

// } catch (ex) {
//   console.log("RMQ/Mongo Error: " + ex);
// }
