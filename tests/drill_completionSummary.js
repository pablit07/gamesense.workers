var validate = require('jsonschema').validate;
var Worker = require('../workers/drill_completionSummary');


let rows = [ {"first_glance_total_score":185,"completion_timestamp_formatted_short":"2019-02-25 17:04:06","app":"BB","id_submission":"ded876efa3aa5e3d03830fcf2f1d6710","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Adam (LHP-F v RHB) - Advanced","device":"Web Browser","completion_timestamp_formatted":"February 25th 2019, 5:04:06 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:03:30","app":"BB","id_submission":"95efdaa025a446efb346e20405b0a856","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:03:30 pm"},{"first_glance_total_score":210,"completion_timestamp_formatted_short":"2019-02-25 17:02:56","app":"BB","id_submission":"bef63d71a32093a70ffadb53b7fd327d","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v RHB) - Advanced","device":"Web Browser","completion_timestamp_formatted":"February 25th 2019, 5:02:56 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:02:55","app":"BB","id_submission":"6760ac145b43d617e8e3ce6a7d976f4c","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:02:55 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:02:22","app":"BB","id_submission":"245489f2af53dfd7aedc2a4e1c4a5944","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:02:22 pm"},{"first_glance_total_score":145,"completion_timestamp_formatted_short":"2019-02-25 17:01:51","app":"BB","id_submission":"d440b61bd08e91395b1e4b8830905f6b","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (LHP-F v RHB) - Basic","device":"Web Browser","completion_timestamp_formatted":"February 25th 2019, 5:01:51 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:01:50","app":"BB","id_submission":"f43863264a6ec6e66353dab748b91cf2","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:01:50 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:01:15","app":"BB","id_submission":"31756c20f76e0e0756db0e46e5d13a2e","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:01:15 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:00:42","app":"BB","id_submission":"4c81e93b84f210aa97a9db39c1548f26","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:00:42 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:00:07","app":"BB","id_submission":"951ddcd46bb0213f26943cb4f5633fc9","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:00:07 pm"},{"first_glance_total_score":195,"completion_timestamp_formatted_short":"2019-02-25 16:59:25","app":"BB","id_submission":"cb04db470e20aa9910c5e90bc2d8f7eb","team_name":"","player_first_name":"a","player_last_name":"b","drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 4:59:25 pm"}];
let cachedRows = [{"first_glance_total_score":185,"completion_timestamp_formatted_short":"2019-01-25 17:04:06","app":"BB","id_submission":"ded876efa3aa5e3d03830fcf2f1d6710","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Adam (LHP-F v RHB) - Advanced","device":"Web Browser","completion_timestamp_formatted":"January 25th 2019, 5:04:06 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-01-25 17:03:30","app":"BB","id_submission":"95efdaa025a446efb346e20405b0a856","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:03:30 pm"},{"first_glance_total_score":210,"completion_timestamp_formatted_short":"2019-02-25 17:02:56","app":"BB","id_submission":"bef63d71a32093a70ffadb53b7fd327d","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v RHB) - Advanced","device":"Web Browser","completion_timestamp_formatted":"February 25th 2019, 5:02:56 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:02:55","app":"BB","id_submission":"6760ac145b43d617e8e3ce6a7d976f4c","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:02:55 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:02:22","app":"BB","id_submission":"245489f2af53dfd7aedc2a4e1c4a5944","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:02:22 pm"},{"first_glance_total_score":145,"completion_timestamp_formatted_short":"2019-02-25 17:01:51","app":"BB","id_submission":"d440b61bd08e91395b1e4b8830905f6b","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (LHP-F v RHB) - Basic","device":"Web Browser","completion_timestamp_formatted":"February 25th 2019, 5:01:51 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:01:50","app":"BB","id_submission":"f43863264a6ec6e66353dab748b91cf2","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:01:50 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:01:15","app":"BB","id_submission":"31756c20f76e0e0756db0e46e5d13a2e","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:01:15 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:00:42","app":"BB","id_submission":"4c81e93b84f210aa97a9db39c1548f26","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:00:42 pm"},{"first_glance_total_score":250,"completion_timestamp_formatted_short":"2019-02-25 17:00:07","app":"BB","id_submission":"951ddcd46bb0213f26943cb4f5633fc9","team_name":"","player_first_name":null,"player_last_name":null,"drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"February 25th 2019, 5:00:07 pm"},{"first_glance_total_score":195,"completion_timestamp_formatted_short":"2019-02-25 16:59:25","app":"BB","id_submission":"cb04db470e20aa9910c5e90bc2d8f7eb","team_name":"","player_first_name":"a","player_last_name":"b","drill":"Abbot (RHP v LHB) - Full Pitch","device":"Unrecognized device","completion_timestamp_formatted":"January 25th 2019, 4:59:25 pm"}]

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
		rollUpType: 'weekly'
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


