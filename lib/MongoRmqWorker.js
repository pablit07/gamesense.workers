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


	        let startConsumer = this.consumer.MakeConsumer(this.myTask, this.q, this.rmq_connectionString, this.amqp, this.maxThreads, this.decorate);
        	await startConsumer(client.db(this.DbName));

	    } catch (ex) {
	      console.log("RMQ/Mongo Error: " + ex)
	    }
	}

	decorate(func) {
		return func;
	}

	publish(data, q_pub, isDurable) {
		if (isDurable)
			this.publisher.publishDurable(data, q_pub, this.rmq_connectionString, this.amqp)
		else
			this.publisher.publish(data, q_pub, this.rmq_connectionString, this.amqp)
	}

	publishDurable(data, q_pub) {
		return this.publish(data, q_pub, true)
	}
}

module.exports = MongoRmqWorker