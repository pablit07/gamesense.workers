const MongoClient = require('mongodb').MongoClient
const EJSON = require('ejson')
const mongoUnit = require('mongo-unit')
let validate = require('jsonschema').validate
let Worker = require('../workers/drill_completionSummary')
let assert = require('assert')

async function testWorkerResponse() {

  // create test database
  await mongoUnit.start()
	const connectionUrl = mongoUnit.getUrl()
  let client = await MongoClient.connect(connectionUrl);
  let db = await client.db('test')

  // load test data
  const testData = require('./fixtures/drill_comp.json')
  await mongoUnit.load(EJSON.fromJSONValue(testData))

	let Consumer = {}
	let Publisher = {}
	let Amqp = {}
	let config = {
			database: { name: '', connectionString: '' },
			messageBroker: { connectionString: '' },
			rollbar: { token: '' }
		}

  // setup data filters
	let data = {
			filters: {},
			authToken: {id:150, app:'BB'},
			rollUpType: 'monthly'
		}
	let msg = {}
	let conn = {}
	let ch = {
			ack: () => {}
		}

	let worker = await new Worker(Consumer, Publisher, Amqp, config);
  let response = await worker.myTask(data, msg, conn, ch, db);

  console.log("response data: " + JSON.stringify(response))

  // basic assert statements for testing
  // throws errror if statement false
  await assert(response[0].count === 2);
  await assert(response[0].user_id === 150);
  await assert(response[0].month === 5);
  await assert(response[0].year === 2019);
  await assert(response[0].player_first_name === 'Coach');
  await assert(response[0].player_last_name === 'Kohlhoff');
  await assert(response[0].date.toISOString() === "2019-04-30T06:00:00.000Z");
  await assert(response[0].date_format === "5-2019");

  await mongoUnit.stop()
  return response
}

testWorkerResponse();
