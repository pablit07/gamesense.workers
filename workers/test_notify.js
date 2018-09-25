var assert = require('assert');
var moment = require('moment');
var sleep = require('sleep');
var MongoRmqWorker = require('../lib/MongoRmqWorker');


class Task extends MongoRmqWorker {

	async myTask(data, msg, conn, ch, db) {

			if (data.filters && data.filters.report_viewer) {

				let cursor = db.collection('test_reports').find({});
				cursor.project({id_submission: 1});
				let id_submissions = await cursor.toArray();

				id_submissions = id_submissions.filter(s => s.id_submission != "");

				this.publishDurable({id_submissions:id_submissions.map((s) => s.id_submission), for:'report_viewer'}, 'test.notified');
			}

			ch.ack(msg);

	}

 }

 module.exports = Task;