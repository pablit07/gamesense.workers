const MongoClient = require('mongodb').MongoClient
var validate = require('jsonschema').validate;
var Worker = require('../workers/drill_completionSummary');
var pry = require('pryjs')

const mongoUnit = require('mongo-unit')
const testData = require('./fixtures/drill_comp.json')

// const Fixtures = require('node-mongodb-fixtures');
// const fixtures = new Fixtures({
//   dir:'tests/fixtures/',
//   mute: false, // do not mute the log output
// });

// const testData = require('./fixtures/drill_comp.json')
 async function myFunction() {

	await mongoUnit.start()
	const connectionUrl = mongoUnit.getUrl()
  let client = await MongoClient.connect(connectionUrl);
  let db = await client.db('test')
  await mongoUnit.load(testData)
	// await fixtures.connect(connectionUrl)
	// await fixtures.unload()
  // await fixtures.load()
	// await fixtures.disconnect()


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

	let count = await db.collection('drill_comp').countDocuments({})
	let worker = await new Worker(Consumer, Publisher, Amqp, config);
	// var doIt = async function() {
  //
	// 	var response = await worker.myTask(data, msg, conn, ch, db);
	// 	console.log("helloo" response)
	// 	// console.log(validate(worker.getSchema(), response).errors === 0);
	// };
  //
	// doIt();

  let response = await worker.myTask(data, msg, conn, ch, db);

  // console.log("response data: " + response)
    // console.log(validate(worker.getSchema(), response).errors === 0);
  await mongoUnit.stop()
	return console.log("response: " + response)
}

myFunction();
