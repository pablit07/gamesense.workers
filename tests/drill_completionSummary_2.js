var validate = require('jsonschema').validate;
var Worker = require('../workers/drill_completionSummary');


let rows = [ { _id: { user_id: 150, month: 1, year: 2019 }, count: 24 },
	{ _id: { user_id: 150, month: 1, year: 2020 }, count: 13 },
	{ _id: { user_id: 150, month: 2, year: 2019 }, count: 4 },
	{ _id: { user_id: 150, month: 2, year: 2020 }, count: 15 },
	{ _id: { user_id: 150, month: 3, year: 2019 }, count: 42 },
	{ _id: { user_id: 150, month: 3, year: 2020 }, count: 4 },
	{ _id: { user_id: 150, month: 4, year: 2019 }, count: 43 },
	{ _id: { user_id: 150, month: 5, year: 2019 }, count: 159 },
	{ _id: { user_id: 150, month: 6, year: 2019 }, count: 42 },
	{ _id: { user_id: 150, month: 7, year: 2019 }, count: 1 },
	{ _id: { user_id: 150, month: 8, year: 2019 }, count: 1 },
	{ _id: { user_id: 150, month: 11, year: 2019 }, count: 5 },
	{ _id: { user_id: 150, month: 12, year: 2019 }, count: 1 } ]
let cachedRows = [ { _id: { user_id: 150, month: 1, year: 2019 }, count: 24 },
	{ _id: { user_id: 150, month: 1, year: 2020 }, count: 13 },
	{ _id: { user_id: 150, month: 2, year: 2019 }, count: 4 },
	{ _id: { user_id: 150, month: 2, year: 2020 }, count: 15 },
	{ _id: { user_id: 150, month: 3, year: 2019 }, count: 42 },
	{ _id: { user_id: 150, month: 3, year: 2020 }, count: 4 },
	{ _id: { user_id: 150, month: 4, year: 2019 }, count: 43 },
	{ _id: { user_id: 150, month: 5, year: 2019 }, count: 159 },
	{ _id: { user_id: 150, month: 6, year: 2019 }, count: 42 },
	{ _id: { user_id: 150, month: 7, year: 2019 }, count: 1 },
	{ _id: { user_id: 150, month: 8, year: 2019 }, count: 1 },
	{ _id: { user_id: 150, month: 11, year: 2019 }, count: 5 },
	{ _id: { user_id: 150, month: 12, year: 2019 }, count: 1 } ]

let Consumer = {},
	Publisher = {},
	Amqp = {},
	config = {
		database: { name: '', connectionString: '' },
		messageBroker: { connectionString: '' },
		rollbar: { token: '' }
	},
	db = {
		collection: () => {
			return {
				find: () => {
		          return {
		            project: () => {
		  					 return {
		  					   	toArray: () => {
		  						  	return rows;
		  						  }
		              }
		  					}
		          }
				},
				aggregate: () => {
					return {
							toArray: () => {
								return rows;
							}
						}
				},
				findOne: () => {
					//return null;
					return {minDate:new Date(),maxDate:new Date(),team_name:'Team',responses:cachedRows};
				},
				update: () => {},
				updateOne: () => {},
				updateMany: () => {},
				count: () => { return 1; },
				insertOne: () => {}
			}
		}
	},
	data = {
		filters: {},
		authToken: {id:1,app:'BB'},
		rollUpType: 'yearly'
	},
	msg = {},
	conn = {},
	ch = {
		ack: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config);

var doIt = async function() {
	var response = await worker.myTask(data, msg, conn, ch, db);
	console.log(response)
	// console.log(validate(worker.getSchema(), response).errors === 0);
};

doIt();


