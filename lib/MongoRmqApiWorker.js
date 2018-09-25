var MongoRmqWorker = require('./MongoRmqWorker');
var validate = require('jsonschema').validate;


class MongoRmqApiWorker extends MongoRmqWorker {

		
	constructor() {
		super(...arguments);
		this.responseRmqExchangeName = 'api_server';
	}

	getSchema() {
		/** important - must implement getSchema in derivative classes **/
		throw new Error("Not Implemented: Must implement method 'getSchema'");
	}

	decorate(func) {

		var self = this;

		return async function(msg) {
			let response = await func(msg);
			let schema = self.getSchema();
			if (!schema || validate(response, schema).errors.length != 0) throw new Error(`Response ${JSON.stringify(response)} does not match defined schema: ${JSON.stringify(schema)}`);
			self.publishDurable(response, self.responseRmqExchangeName);
		};
	}
}

module.exports = MongoRmqApiWorker