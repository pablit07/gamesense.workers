


var config = require('../config')


var Consumer = require("./consumer");
var Publisher = require('./publisher');
var Amqp = require('amqplib/callback_api');
let updated = 0;
var Worker = require('./MongoRmqWorker');
const sleep = require("sleep");

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

		this.q = this.getAfterTaskResponseRmqQueueName();
		this.autoDelete = true;
	}

	// executes a query and fires the results back out with some routing key, after possibly doing some pre-processing steps
	async myTask(msgContent, msg, conn, ch, db) {

		let currentSet = await db.collection(this.getCollectionName()).find(this.getCollectionFilter()).skip(msgContent.skip||0).limit(msgContent.limit||1);
		let reducedSet = await this.reduceSet(currentSet, db);
		let i = 0;
		await currentSet.forEach(async r => {
			try {
				r = await this.reprocessOne(r, i, reducedSet);
				i++;
				if (i === this.getBatchSize()) {
					Object.assign(r, {
						afterTask_responseMessage: {skip: msgContent.skip + this.getBatchSize(), limit: msgContent.limit},
						afterTask_responseRmqQueueName: this.getAfterTaskResponseRmqQueueName(),
						afterTask_complete: msgContent.afterTask_complete
					});
				}
				delete r._id;

				this.publish(r, {routing_key: this.getRoutingKey()}, ch, this.getExchange());

			} catch (ex) {
				console.error(ex)
			}
		});

		ch.ack(msg);

		if (i < this.getBatchSize() && msgContent.afterTask_complete) {
			setTimeout(async () => {
				console.log(" [x] Closing channel and deleting queue");
				await ch.cancel(Object.keys(ch.consumers)[0]);
			}, 3000);
			// await ch.deleteQueue(this.getAfterTaskResponseRmqQueueName());
		}
	}

	// give the exchange where the target worker(s) are running
	getExchange() {
		return 'usage';
	}

	// give the routing key that the target worker(s) are consuming
	getRoutingKey() {
		return 'usage.action.drill.final_score';
	}

	// give this script a unique name
	// this allows the script to create a queue if the reprocess messages are more than 100, to break up execution
	getAfterTaskResponseRmqQueueName() {
		return 'script_add_drill_completions';
	}

	// give the collection that we will reprocess
	getCollectionName() {
		return 'raw_usage';
	}

	// filter any rows that we will reprocess
	getCollectionFilter() {
		return {action_name: 'Final Score'};
	}

	// define an operation for the whole set during the first step of reprocessing
	async reduceSet(currentSet, db) {
		let drillsBySubmission = (await currentSet.toArray()).map(item => item.id_submission);
		let combineds = await db.collection('raw_usage_combined').find({id_submission: {$in: drillsBySubmission}}).toArray();
		let combinedBySubmission = combineds.reduce((result, item, index, array) => {
			result[item.id_submission] = item;
			return result;
		}, {});
		return combinedBySubmission;
	}

	// define an operation for each row during the final step of reprocessing
	async reprocessOne(d, i, reducedSet) {

		Object.assign(d, reducedSet[d.id_submission]);

		return d;
	}

	// calling this self-opens the queue, and kills the queue as soon as it detects the last batch finishing
	async runOnce() {
		setTimeout(() => {
			Publisher.publishQ({skip: 0, limit: this.getBatchSize(), afterTask_complete: true}, this.getAfterTaskResponseRmqQueueName(), config.messageBroker.connectionString, Amqp, {autoDelete:this.autoDelete});
		}, 3000)
		await this.run();
	}

	getBatchSize() {
		return 200;
	}
}

module.exports = Task;

// let task = new Task(Consumer, Publisher, Amqp, config);
// task.run();

// setTimeout(function() { Publisher.publishQ({skip: 0, limit: 100}, 'script_add_drill_completions', config.messageBroker.connectionString, Amqp); }, 3000)



