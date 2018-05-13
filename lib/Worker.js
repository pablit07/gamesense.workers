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
		this.consumer.consume(async (data, msg, conn, ch) => {
			this.myTask(data, msg, conn, ch)
		}, this.q, this.rmq_connectionString, this.amq, this.maxThreads)
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