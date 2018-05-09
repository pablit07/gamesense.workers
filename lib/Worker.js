var fs = require('fs')

class Worker {

	constructor(consumer, publisher, MongoClient, Amqp, config) {
		if (! (consumer || publisher || MongoClient || Amqp || config) ) throw Error('must init all deps')
		this.MongoClient = MongoClient
		this.consumer = consumer
		this.publisher = publisher
		this.DbName = config.database.name
		this.mongo_connectionString = config.database.connectionString
		this.amqp = Amqp
	}

	run() {
		this.myTask()
	}

	myTask() {
		throw Error('Not Implemented: worker must override myTask')
	}
}

Worker.get = function(name) {
	let path = './workers/' + name + '.js'

	if (!fs.existsSync(path)) throw Error("Can't find worker: " + name)

	let worker = require('../workers/' + name)
	return worker
}


module.exports = Worker