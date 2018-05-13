var config = require('./config')
var Worker = require('./lib/Worker')
var Consumer = require('./lib/consumer')
var Publisher = require('./lib/publisher')
var Amqp = require('amqplib/callback_api');

if (process.argv.length != 3) {
	throw Error('Invalid Arguments: pass one argument for relative worker path')
}

class App {

	constructor(name, config) {
		this.config = config
		this.name = name

		this.init()
	}

	init() {
		let proc, queue;

		try {

			this.config.queues.forEach(q => {

				if (q.name == this.name) {
					queue = q
				}
			})


			if (!queue) {
				console.error('Unable to find config for worker: ' + this.name)
				throw new Error()
			}

			// start worker processes for each queue
				
			proc = this.getWorker(this.name, queue.maxThreads || 0)
			if (!proc) {
				console.error("Worker does not exist")
				throw new Error()
			}

			proc.run()


		} catch (ex) {
			console.error('Unable to init worker: ' + this.name)
		}
	}

	getWorker(name, maxThreads) {
		try {
			let WorkerClass = Worker.get(name)
			let worker = new WorkerClass(Consumer, Publisher, Amqp, this.config)
			worker.q = name.replace('_', '.')
			worker.maxThreads = maxThreads
			return worker
		} catch (ex) {
			console.error(ex)
			return null
		}
	}
}


var app = new App(process.argv[2], config);

module.exports = app;