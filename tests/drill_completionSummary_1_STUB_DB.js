const MongoClient = require('mongodb').MongoClient
var validate = require('jsonschema').validate;
var Worker = require('../workers/drill_completionSummary');
var pry = require('pryjs')

const mongoUnit = require('mongo-unit')

const Fixtures = require('node-mongodb-fixtures');
const fixtures = new Fixtures({
  dir:'tests/fixtures/',
  mute: false, // do not mute the log output
});

// const testData = require('./fixtures/drill_comp.json')
( async function() {

	await mongoUnit.start()
	const connectionUrl = mongoUnit.getUrl()


	await fixtures.connect(connectionUrl)
	await fixtures.unload()
  await fixtures.load()
	await fixtures.disconnect()
	let client = await MongoClient.connect(connectionUrl);

	let Consumer = {},
		Publisher = {},
		Amqp = {},
		config = {
			database: { name: '', connectionString: '' },
			messageBroker: { connectionString: '' },
			rollbar: { token: '' }
		},
		data = {
			filters: {},
			authToken: {id:1,app:'BB'},
			rollUpType: 'monthly'
		},
		msg = {},
		conn = {},
		ch = {
			ack: () => {}
		}
		let db = await client.db('prod')
	  let count = await db.collection('drilllll_comp').count({})
	eval(pry.it)
	let worker = new Worker(Consumer, Publisher, Amqp, config);
	var doIt = async function() {
		var response = await worker.myTask(data, msg, conn, ch, db);
		console.log(response)
		// console.log(validate(worker.getSchema(), response).errors === 0);
	};

	doIt();

	// return await mongoUnit.stop()
})()
