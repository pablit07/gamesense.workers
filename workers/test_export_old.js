var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('../consumer');
var publisher = require('../publisher');
var moment = require('moment');
var sleep = require('sleep');
var xlsx = require('xlsx');
const uuid = require('uuid/v4');
const mongo_connectionString = require('../db').mongo_connectionString;
const rmq_connectionString = require('../env').rmq_connectionString;

// write csvs and upload to s3

const c = 'test_usage';

// process.argv
if (!process.argv.length) sleep.sleep(30);

// try {

    // Database Name
  const dbName = 'test';

  // Use connect method to connect to the server
  MongoClient.connect(mongo_connectionString + '/' + dbName, async function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to Mongo server: " + mongo_connectionString + '/' + dbName);

        var db = client.db(dbName);
        const id_submission = "089b4290-e24d-4d77-9633-6b0c744a81ab";

        let cursor = db.collection(c).find({"id_submission" : id_submission});
        var responses = await cursor.toArray();

        var wb = xlsx.utils.book_new();

        var ws = xlsx.utils.json_to_sheet(responses);

        // xlsx.utils.sheet_add_aoa(ws, [['','','','','','','','','','','',responses[0].occlusion_none_type_avg,responses[0].occlusion_none_location_avg,responses[0].occlusion_none_completely_correct_avg]], {});

        xlsx.utils.book_append_sheet(wb, ws, 'Responses');

        xlsx.writeFile(wb, `/tmp/${id_submission}.xlsx`);

        client.close();

    });

// } catch (ex) {
//   console.log("RMQ/Mongo Error: " + ex);
// }
