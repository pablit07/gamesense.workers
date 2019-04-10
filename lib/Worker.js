var fs = require('fs');

class Worker {

	constructor(consumer, publisher, Amqp, config) {
		if (! (consumer || publisher || Amqp || config) ) throw Error('must init all deps');
		this.config = config;
		this.consumer = consumer;
		this.publisher = publisher;
		this.rmq_connectionString = config.messageBroker.connectionString;
		this.amqp = Amqp
	}

	run() {
		let startConsumer = this.consumer.MakeConsumer(this.myTask.bind(this), this.q, this.rmq_connectionString, this.amqp, this.maxThreads);
		startConsumer();
	}

	myTask(msgContent, msg, conn, ch) {
		throw Error('Not Implemented: worker must override myTask')
	}

	publish(rawData, headers, ch, exchange = null) {
		let content = this.createContentFromRaw(rawData);
		console.info(" [x] Sent Message: ", this.q, {headers, exchange, rawData})
		ch.publish(exchange || this.responseRmqExchangeName, headers.routing_key, content, {headers});
	}

	publishError(msg, ch, errorRoute) {
		let headers = msg.properties.headers;
		console.info(` [x] Message Error: ${this.q}: `, errorRoute);
		console.log(`error.${headers.routing_key}.${errorRoute}`);
		ch.publish("error", `error.${headers.routing_key}.${errorRoute}`, msg.content, {headers});
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

Worker.get = function(name) {
	let path = './workers/' + name + '.js';

	if (!fs.existsSync(path)) throw Error("Can't find worker: " + name);

	let worker = require('../workers/' + name);
	return worker
};


module.exports = Worker;
