


var config = require('../config')


var MongoClient = require('mongodb').MongoClient;
var Publisher = require('../lib/publisher');
var Amqp = require('amqplib/callback_api');
let updated = 0;


(async function() {
	let cs = config.database.connectionString + '/prod?replicaSet=' + config.database.replicaSet;
	let client = await MongoClient.connect(cs, {keepAlive:true,  connectTimeoutMS: 30000, useNewUrlParser: true});
	let db = await client.db("prod");
	let drills = await db.collection('raw_usage').find({action_name: 'Question Response'});

	await drills.forEach( async d => {
		try {
			Publisher.publish(d, 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.drill.question_response', {});
		} catch (ex) {
			console.error(ex)
		}
    });

}());







