var validate = require('jsonschema').validate;
var Worker = require('../workers/drill_completionSummary');


let rows = [ { _id: { user_id: 2, month: 4, year: 2020,  play_first_name: "First", player_last_name: "Last"}, count: 21 },
	{ _id: { user_id: 3, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 7 },
	{ _id: { user_id: 3, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 6 },
	{ _id: { user_id: 152, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 1 },
	{ _id: { user_id: 152, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 2 },
	{ _id: { user_id: 1088, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 3 },
	{ _id: { user_id: 12061, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 2 },
	{ _id: { user_id: 16040, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 2 },
	{ _id: { user_id: 23449, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last"}, count: 2 } ];
let cachedRows = [ { _id: { user_id: 2, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 21 },
	{ _id: { user_id: 3, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 7 },
	{ _id: { user_id: 3, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 6 },
	{ _id: { user_id: 152, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 1 },
	{ _id: { user_id: 152, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 2 },
	{ _id: { user_id: 1088, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 3 },
	{ _id: { user_id: 12061, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 2 },
	{ _id: { user_id: 16040, month: 4, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 2 },
	{ _id: { user_id: 23449, month: 5, year: 2020, player_first_name: "First", player_last_name: "Last" }, count: 2 } ];

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
		rollUpType: 'monthly'
	},
	msg = {},
	conn = {},
	ch = {
		ack: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config);

var doIt = async function() {
	var response = await worker.myTask(data, msg, conn, ch, db);
	// console.log(validate(worker.getSchema(), response).errors === 0);
};

doIt();
