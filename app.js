var config = require("./config");
var Process = require("./lib/Process");
var PM2 = require("pm2");


class App {

	constructor(config) {
		this.config = config;

		this.init();
	}

	async init() {
		for (let q of this.config.queues) {

			try {
				// start worker processes for each queue
				if (q.start === false) continue;

				let proc = this.getProcess(q.name, q.instances || 1);
				if (!proc) {
					console.error("Process does not exist");
					throw new Error();
				}
				await proc.start();

			} catch (ex) {
				console.error("Unable to init process: " + q.name);
				console.error(ex);
			}
		}
	}

	getProcess(name, instances) {
		try {
			return new Process(name, instances, PM2);
		} catch (ex) {
			return null;
		}
	}
}


var app = new App(config);

module.exports = app;