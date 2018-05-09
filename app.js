var config = require('./config')
var Process = require('./lib/Process')
var PM2 = require('pm2')


class App {

	constructor(config) {
		this.config = config;

		this.init()
	}

	init() {
		this.config.queues.forEach(q => {

			try {

				// start worker processes for each queue

				let proc = this.getProcess(q.name, q.instances || 1)
				if (!proc) {
					console.error("Process does not exist")
					throw new Exception()
				}

				proc.start()


			} catch (ex) {
				console.error('Unable to init process: ' + q.name)
			}
		})
	}

	getProcess(name, instances) {
		try {
			return new Process(name, instances, PM2)
		} catch (ex) {
			return null
		}
	}
}


var app = new App(config);

module.exports = app;