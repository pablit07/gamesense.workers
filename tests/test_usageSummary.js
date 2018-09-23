var validate = require('jsonschema').validate;
var Worker = require('../workers/test_usageSummary');



let rows = [
{ "_id" : { "id_submission" : "155d9e7c583c844dfc3292fd008e3ff4", "team" : "", "app" : "BB" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "4d1a70b94ecb5c3f9d6682f52ebe2b68", "team" : "Diamondbacks", "app" : "BB", "player_id" : "Alek Thomas" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "b9ac19bc0aabfb87fcc65727d7bcff6f", "team" : "Diamondbacks", "app" : "BB", "player_id" : "Blaze Alexander" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "a1ee701a344ebba1696346461591ded7", "team" : "Diamondbacks", "app" : "BB", "player_id" : "David Garza" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "035f46c40132a50de457aba5f02daf64", "team" : "Diamondbacks", "app" : "BB", "player_id" : "Alek Thomas" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "f8b138db6bd39777850f4f8bb6749436", "team" : "Diamondbacks", "app" : "BB", "player_id" : "Zack Shannon" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "40332d353fe153f756e676b40fa6b0c5", "team" : "Diamondbacks", "app" : "BB", "player_id" : "Daniel Wasinger" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "6643f95e374be2480a74b7ad495576a6", "team" : "Diamondbacks", "app" : "BB", "player_id" : "Joe Gillette" }, "number_of_responses" : 56 },
{ "_id" : { "id_submission" : "e2d487cf-3d47-4ef4-822c-5a18088a66ee", "source_etl" : "GameSenseSports dbacks esp72018-03-23-17-51", "team" : "Diamondbacks", "player_id" : "12 Brandon Peyton" }, "number_of_responses" : 1 },
{ "_id" : { "id_submission" : "f97076f5-0a3d-4177-8415-792449814160", "source_etl" : "GameSenseSports2018-03-24-15-45", "team" : "Diamondbacks", "player_id" : "16 Ryan Dobson" }, "number_of_responses" : 1 },
{ "_id" : { "id_submission" : "09679513-cc41-4c82-a9ef-6360b4e59798", "source_etl" : "GameSenseSports dbacks esp72018-03-25-19-27", "team" : "Diamondbacks", "player_id" : "12 Brandon Peyton" }, "number_of_responses" : 1 },
{ "_id" : { "id_submission" : "02c8033d-c58c-43df-a4df-4233ea7be345", "source_etl" : "GameSenseSportstest2017-03-19-16-50", "player_id" : "admin" }, "number_of_responses" : 2 },
{ "_id" : { "id_submission" : "3497046a-a684-49a6-96da-2c51f1bb9fa5", "source_etl" : "GameSenseSports2018-03-24-15-51", "team" : "Diamondbacks", "player_id" : "9 Jancarlos  Cintron" }, "number_of_responses" : 3 },
{ "_id" : { "id_submission" : "310cbb5d-266d-4498-8961-e3610e1872f6", "source_etl" : "GameSenseSportsbardo?2017-05-24-22-48", "team" : "Bardo", "player_id" : "trest rest test" }, "number_of_responses" : 9 },
{ "_id" : { "id_submission" : "37100333-faf8-402c-9663-c8a2b0f9ea3c", "source_etl" : "GameSenseSportsbardo42017-05-24-22-49", "team" : "Bardo", "player_id" : "rew wee we ewes" }, "number_of_responses" : 6 },
{ "_id" : { "id_submission" : "93bf8884-f158-4f7c-8f4f-7665c5e2cfbc", "source_etl" : "GameSenseSports2018-03-24-15-45", "team" : "Diamondbacks", "player_id" : "11 jack reinheimer" }, "number_of_responses" : 72 },
{ "_id" : { "id_submission" : "08807910-9d7d-4b28-a66d-880b15f6a9ac", "source_etl" : "GameSenseSportsminors62017-07-02-11-05", "team" : "Southern Illinois Miners", "player_id" : "28 cole Austin" }, "number_of_responses" : 72 },
{ "_id" : { "id_submission" : "4e59cb55-5934-4b7b-8f1c-78670b11eb18", "source_etl" : "GameSenseSportsminors62017-07-02-11-05", "team" : "Southern Illinois Miners", "player_id" : "23 Craig Massey" }, "number_of_responses" : 72 },
{ "_id" : { "id_submission" : "4107369c-f552-462d-879a-aa99bd29dd9b", "source_etl" : "GameSenseSportsminors62017-07-02-11-05", "team" : "Southern Illinois Miners", "player_id" : "yard dawgs Jackson Wilkerson " }, "number_of_responses" : 72 }
];


let Consumer = {},
	Publisher = {},
	Amqp = {},
	config = {
		database: { name: '', connectionString: '' },
		messageBroker: { connectionString: '' }
	},
	db = {
		collection: () => {
			return {
				aggregate: () => {
					return {
						toArray: () => {
							return rows;
						}
					}
				},
				update: () => {},
				updateMany: () => {},
				count: () => { return 1; }
			}
		}
	},
	data = {
		filter: {}
	},
	msg = {},
	conn = {},
	ch = {
		ack: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config);

var doIt = async function() {
	var response = await worker.myTask(db, data, msg, conn, ch);

	console.log(validate(worker.getSchema(), response));
};

doIt();
