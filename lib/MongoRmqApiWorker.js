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

	afterTask(response, data, msg, conn, ch, _) {
 		const properties = msg.properties;
		const headers = {
			socket_id: properties.headers.socket_id,
			routing_key: properties.headers.routing_key,
			unique_id: properties.headers.unique_id,
			service: properties.headers.service
		};
		let schema = this.getSchema();
		let schemaValidateResult;
		if (!schema || (schemaValidateResult = validate(response, schema)).errors.length !== 0) {
			console.error(schemaValidateResult);
			throw new Error(`Response ${JSON.stringify(response)} does not match defined schema: ${JSON.stringify(schema)} `);
		}
		this.publish(response, headers, ch);
	}
}

module.exports = MongoRmqApiWorker