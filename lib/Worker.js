var fs = require('fs')

class Worker {

	constructor(consumer, publisher, Amqp, config) {
		if (! (consumer || publisher || Amqp || config) ) throw Error('must init all deps')
		this.config = config
		this.consumer = consumer
		this.publisher = publisher
		this.rmq_connectionString = config.messageBroker.connectionString
		this.amqp = Amqp
	}

	run() {
		let startConsumer = this.consumer.MakeConsumer(this.myTask.bind(this), this.q, this.rmq_connectionString, this.amq, this.maxThreads);
		startConsumer();
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
