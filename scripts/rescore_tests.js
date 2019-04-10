


var config = require('../config')
var Publisher = require('../lib/publisher')
var Amqp = require('amqplib/callback_api');

var MongoClient = require('mongodb').MongoClient;

(async function() {

    let cs = config.database.connectionString + '/prod' + '?replicaSet=' + config.database.replicaSet;
    console.log(cs)
	let client = await MongoClient.connect(cs);
	let db = await client.db("prod");

	let toReprocess = await db.collection('test_calc').find({team:'Schoolcraft College'}, {id_submission:1}).toArray();

	toReprocess.forEach( r => Publisher.publish({id_submission:r}, 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.test.final_score', {}));

    client.close();
}());
