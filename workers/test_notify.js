var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var consumer = require('../consumer');
var publisher = require('../publisher');
var moment = require('moment');
var sleep = require('sleep');
const mongo_connectionString = require('../db').mongo_connectionString;
const rmq_connectionString = require('../env').rmq_connectionString;


const q = 'test.notify';

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

			if (data.filters && data.filters.report_viewer) {

				let cursor = db.collection('test_reports').find({});
				cursor.project({id_submission: 1});
				let id_submissions = await cursor.toArray();

				id_submissions = id_submissions.filter(s => s.id_submission != "");

				publisher.publishDurable({id_submissions:id_submissions.map((s) => s.id_submission), for:'report_viewer'}, 'test.notified', rmq_connectionString);
			}

			ch.ack(msg);

		}, q, rmq_connectionString);

  });