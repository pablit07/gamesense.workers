var Rollbar = require("rollbar");
var fs = require('fs');

class Worker {

	constructor(consumer, publisher, Amqp, config) {
		if (! (consumer || publisher || Amqp || config) ) throw Error('must init all deps');
		this.config = config;
		this.consumer = consumer;
		this.publisher = publisher;
		this.rmq_connectionString = config.messageBroker.connectionString;
		this.amqp = Amqp;
		this.rollbar = new Rollbar({
			accessToken: config.rollbar.token,
			captureUncaught: false,
			captureUnhandledRejections: false,
			environment: "production",
			logLevel: 'error'
		});
	}

	run() {
		let startConsumer = this.consumer.MakeConsumer(this.myTask.bind(this), this.q, this.rmq_connectionString, this.amqp, {maxThreads:this.maxThreads,autoDelete:this.autoDelete});
		startConsumer();
	}

	myTask(msgContent, msg, conn, ch) {
		throw Error('Not Implemented: worker must override myTask')
	}

	publish(rawData, headers, ch, exchange = null) {
		let content = this.createContentFromRaw(rawData);
		exchange = (exchange || this.responseRmqExchangeName);
		console.info(" [x] Sent Message: ", this.q, {headers, exchange, rawData})
		ch.publish(exchange, headers.routing_key, content, {headers});
	}

	publishError(msg, ch, errorRoute) {
		let headers = msg.properties.headers;
		let routingKey = headers.routing_key || msg.fields.routingKey;
		console.info(` [x] Message Error: ${this.q}: `, errorRoute);
		console.log(`error.${routingKey}.${errorRoute}`);
		ch.publish("error", `error.${routingKey}.${errorRoute}`, msg.content, {headers});
	}

	createContentFromRaw(content) {
		return new Buffer(JSON.stringify(content));
	}

	// these publish direct to the queue and are deprecated

	publishQ(data, q_pub, isDurable, ch) {
		if (isDurable)
			this.publisher.publishQDurable(data, q_pub, this.rmq_connectionString, this.amqp);
		else
			ch.sendToQueue(q_pub, this.createContentFromRaw(data));
	}

	publishDurable(data, q_pub) {
		return this.publish(data, q_pub, true)
	}

	logError(data, msg, ex) {
		if ('PM2_HOME' in process.env) {
			this.rollbar.configure({payload: {person: data.authToken, context: this.q}});
			this.rollbar.error(ex, {data, message: JSON.stringify(msg)});
		} else {
			console.error(ex);
		}
	}

	publishDelayed(msg, ch, headers, msgContent, exchange) {
		let delayQ = 'diagnostics.delay.' + msg.fields.routingKey;
		ch.assertQueue(delayQ, {
			arguments:
				{
					// set the dead-letter exchange to the default queue
					'x-dead-letter-exchange': exchange,
					// when the message expires, set change the routing key into the destination queue name
					'x-dead-letter-routing-key': msg.fields.routingKey,
					// the time in milliseconds to keep the message in the queue
					'x-message-ttl': 10000
				}
		}, () => {
			ch.bindQueue(delayQ, 'delay', delayQ, {}, () => {
				headers.routing_key = delayQ;
				this.publish(msgContent, headers, ch, 'delay');
				ch.ack(msg);
			});
		});
	}
}

Worker.get = function(name) {
	let path = './workers/' + name + '.js';

	if (!fs.existsSync(path)) throw Error("Can't find worker: " + name);

	let worker = require('../workers/' + name);
	return worker
};


module.exports = Worker;
