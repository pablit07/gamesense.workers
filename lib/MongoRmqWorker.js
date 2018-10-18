var Worker = require('./Worker');
var MongoClient = require('mongodb').MongoClient


class MongoRmqWorker extends Worker {

	constructor() {
		super(...arguments)
		this.MongoClient = MongoClient
		this.DbName = this.config.database.name
		this.mongo_connectionString = this.config.database.connectionString
	}
		
	async run() {
	
		try {

	      // Use connect method to connect to the server
	        let client = await this.MongoClient.connect(this.mongo_connectionString + '/' + this.DbName)
	        // assert.equal(null, err);
	        console.log("Connected successfully to Mongo server")


	        let startConsumer = this.consumer.MakeConsumer(
	        	this.myTask.bind(this),
	        	this.q,
	        	this.rmq_connectionString,
	        	this.amqp,
	        	this.maxThreads,
	        	this.afterTask.bind(this)
	        );

        	await startConsumer(client.db(this.DbName));

	    } catch (ex) {
	      console.log("RMQ/Mongo Error: " + ex)
	    }
	}

	// callback for when myTask completes
	afterTask(result, data, msg, conn, ch, db) { }

	publish(rawData, headers, ch) {
		let content = this.createContentFromRaw(rawData);
		ch.publish(this.responseRmqExchangeName, headers.routing_key, content, {headers});
	}

	createContentFromRaw(content) {
		return new Buffer(JSON.stringify(content));
	}

	// these publish direct to the queue and are deprecated

	publishQ(data, q_pub, isDurable, ch) {
		if (isDurable)
			this.publisher.publishQDurable(data, q_pub, this.rmq_connectionString, this.amqp)
		else
			ch.sendToQueue(q_pub, this.createContentFromRaw(data), this.rmq_connectionString, this.amqp)
	}

	publishDurable(data, q_pub) {
		return this.publish(data, q_pub, true)
	}
}

module.exports = MongoRmqWorker