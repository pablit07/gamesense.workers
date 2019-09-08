var MongoRmqWorker = require('./MongoRmqWorker');


class MongoRmqRepublishWorker extends MongoRmqWorker {

		
	constructor() {
		super(...arguments);
	}

	afterTask(_1, data, msg, conn, ch, _2) {
		if (!data || !data.afterTask_responseMessage || !data.afterTask_responseRmqQueueName) return;

		this.publisher.publishQ(data.afterTask_responseMessage, data.afterTask_responseRmqQueueName, this.config.messageBroker.connectionString, this.amqp, {autoDelete:this.autoDelete})
	}

	publishError(msg, ch, errorRoute) {
		let msgToSend = Object.assign({}, msg);
		delete msgToSend['afterTask_responseMessage'];
		delete msgToSend['afterTask_responseRmqQueueName'];
		super.publishError(msg, ch, errorRoute);
	}
}

module.exports = MongoRmqRepublishWorker