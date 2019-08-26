


var config = require('../config')


var Consumer = require("../lib/consumer");
var Publisher = require('../lib/publisher');
var Amqp = require('amqplib/callback_api');
let updated = 0;
var Worker = require('../lib/MongoRmqWorker');

// (async function() {
// 	let cs = config.database.connectionString + '/prod?replicaSet=' + config.database.replicaSet;
// 	let client = await MongoClient.connect(cs, {keepAlive:true,  connectTimeoutMS: 30000, useNewUrlParser: true});
// 	let db = await client.db("prod");
// 	let drills = await db.collection('raw_usage').find({action_name: 'Hit Station Final Score'});
//
// 	await drills.forEach( async d => {
// 		try {
// 			Publisher.publish(Object.assign(d, {activity_name: 'Hit Station'}), 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.hitstation.final_score', {});
// 		} catch (ex) {
// 			console.error(ex)
// 		}
//     });
//
// }());

class Task extends Worker {

	constructor()
	{
		super(...arguments);
	}

	async myTask(msgContent, msg, conn, ch, db) {

		let drills = await db.collection('raw_usage').find({action_name: 'Final Score'}).skip(msgContent.skip||0).limit(msgContent.limit||1);
		let drillsBySubmission = (await drills.toArray()).map(item => item.id_submission);
		console.log(drillsBySubmission)
		let combineds = await db.collection('raw_usage_combined').find({id_submission:{$in:drillsBySubmission}}).toArray();
		let combinedBySubmission = combineds.reduce((result, item, index, array) => {
			result[item.id_submission] = item;
			return result;
		}, {});
		let i = 0;

		await drills.forEach(async d => {
			try {
				i++;

				if (i === 100) {
					Object.assign(d, {afterTask_responseMessage: {skip: msgContent.skip+100, limit: msgContent.limit}, afterTask_responseRmqQueueName: 'script_add_drill_completions'});
				}
				Publisher.publish(Object.assign({}, combinedBySubmission[d.id_submission], d), 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.drill.final_score', {});
			} catch (ex) {
				console.error(ex)
			}
		});

		ch.ack(msg);
	}

}


let task = new Task(Consumer, Publisher, Amqp, config);
task.q = 'script_add_drill_completions';
task.run();

// setTimeout(function() { Publisher.publishQ({skip: 0, limit: 100}, 'script_add_drill_completions', config.messageBroker.connectionString, Amqp); }, 3000)



