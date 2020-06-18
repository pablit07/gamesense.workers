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
	      	let connectionString = this.mongo_connectionString + '/' + this.DbName;
	      	if (this.config.database.replicaSet) {
	      		connectionString += "?replicaSet=" + this.config.database.replicaSet;

	      		if (this.config.database.readPreference) {
	      			connectionString += "&readPreference=" + this.config.database.readPreference;
	      		}
	      	}
			let client = await this.MongoClient.connect(connectionString, {useNewUrlParser: true});
	        // assert.equal(null, err);
	        console.log("Connected successfully to Mongo server")


	        let startConsumer = this.consumer.MakeConsumer(
	        	this.myTask.bind(this),
	        	this.q,
	        	this.rmq_connectionString,
	        	this.amqp,
				{maxThreads:this.maxThreads,autoDelete:this.autoDelete},
	        	this.afterTask.bind(this)
	        );

        	await startConsumer(client.db(this.DbName));

	    } catch (ex) {
	      console.log("RMQ/Mongo Error: " + ex)
	    }
	}

	// callback for when myTask completes
	afterTask(result, data, msg, conn, ch, db) { }

	isClientRequested(data) {

		return data && !!data.authToken;
	}
}

module.exports = MongoRmqWorker
