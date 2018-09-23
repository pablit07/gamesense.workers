var MongoRmqWorker = require('./MongoRmqWorker');
var validate = require('jsonschema').validate;


class MongoRmqApiWorker extends MongoRmqWorker {

		
	constructor() {
		super(...arguments);
		this.responseRmqExchangeName = 'api_server';
		/** important - must implement getSchema in derivative classes **/
		if (typeof(this.getSchema) !== 'function') throw new Error("Must implement method named 'getSchema'");
	}

	async innerConsume(client, data, msg, conn, ch) {
		let response = await this.myTask(client.db(this.DbName), data, msg, conn, ch)
		let schema = this.getSchema();
		if (!schema || validate(response, schema).errors.length != 0) throw new Error(`Response ${JSON.stringify(response)} does not match defined schema: ${JSON.stringify(schema)}`);
		this.publish(response, this.responseRmqExchangeName);
	}
}

module.exports = MongoRmqApiWorker