var validate = require('jsonschema').validate;
var Worker = require('../workers/test_usageSummary');



let rows = [{"_id":{"id_submission":"f16cf0d1-72f4-4b53-af6c-a7fe26b4ef13","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"650441 Leandro Santana"},"test_date":"2017-08-25T21:02:56.000Z","number_of_responses":72},{"_id":{"id_submission":"fef86479-910a-488a-9ef8-c1b1b3544916","source_etl":"GameSenseSportsminors22017-04-27-18-00","team":"Southern Illinois Miners","player_id":"9 Zaire Kutsulis"},"test_date":"2017-04-27T16:55:21.000Z","number_of_responses":72},{"_id":{"id_submission":"654cc06a-5cfb-47f5-bc94-7d5ad3cdfab4","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"642689 Francis Ancona"},"test_date":"2018-03-01T21:55:33.000Z","number_of_responses":72},{"_id":{"id_submission":"aa91c8eb-b01a-4705-afda-4dcdf776e5cf","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"dr18008 junior  tamares "},"test_date":"2018-07-06T22:10:31.000Z","number_of_responses":72},{"_id":{"id_submission":"1f567aeb-5989-450e-8fa2-b2587f1f89f1","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"DR18006 Wilmer Alcantara"},"test_date":"2018-07-06T21:51:47.000Z","number_of_responses":72},{"_id":{"id_submission":"2f578bc8-d2a2-43a6-bac1-dcc4bf592a9e","source_etl":"GameSenseSports REDS CL 2espanol2017-08-18-18-08","team":"Reds","player_id":"673656 Deybert Lozano"},"test_date":"2017-04-18T17:20:54.000Z","number_of_responses":72},{"_id":{"id_submission":"3cac867b-249b-4ef7-aa0c-056b610627eb","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"DR18003 Luis Cabrera"},"test_date":"2018-07-06T20:49:40.000Z","number_of_responses":72},{"_id":{"id_submission":"06783d7d-a18f-445d-a183-c0bc1cb68e9a","source_etl":"GameSenseSports2018-08-27-18-40","team":"Reds","player_id":"602115 Gabriel  Guerrero "},"test_date":"2018-08-21T19:56:57.000Z","number_of_responses":72},{"_id":{"id_submission":"562b7d82-ca1c-433d-8675-c760ea23c1a4","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"Do219 003 Cesar Julio Martinez"},"test_date":"2018-07-07T19:23:38.000Z","number_of_responses":72},{"_id":{"id_submission":"999cbfaf-9750-46b4-8695-1eebf337e5b3","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"678259 Emilio Garcia"},"test_date":"2018-04-11T16:56:39.000Z","number_of_responses":72},{"_id":{"id_submission":"50bb78dc-6723-49a1-9e93-c4899dd1d9f8","source_etl":"2018-02-20-16-08","player_id":"01 test peter"},"test_date":"2018-02-20T15:47:08.000Z","number_of_responses":72},{"_id":{"id_submission":"82ffc908-0f3a-4c49-a0bd-962ea802d3b3","source_etl":"GameSenseSports2018-07-06-22-32","team":"Reds","player_id":"660647 Mariel Bautista"},"test_date":"2018-03-03T18:23:27.000Z","number_of_responses":72},{"_id":{"id_submission":"222ada1d-ee3d-4410-9b49-22842c882947","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"Dr18004 Elly Antonio  De La Cruz Sanchez "},"test_date":"2018-07-06T21:25:51.000Z","number_of_responses":72},{"_id":{"id_submission":"15dafaa5-9357-40af-b3b8-39b81b9305e5","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"DRTamares junior tamares "},"test_date":"2018-04-12T16:46:20.000Z","number_of_responses":72},{"_id":{"id_submission":"174da437-e8be-448e-83a8-53ea36fc9826","source_etl":"GameSenseSports2018-07-07-20-41","team":"Reds","player_id":"642298 panel man Zander of"},"test_date":"2017-08-25T20:49:36.000Z","number_of_responses":72}];


let Consumer = {},
	Publisher = {},
	Amqp = {},
	config = {
		database: { name: '', connectionString: '' },
		messageBroker: { connectionString: '' },
		rollbar: {token: ''}
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
	var response = await worker.myTask(data, msg, conn, ch, db);

	console.log(validate(worker.getSchema(), response).errors === 0);
};

doIt();



/*
Expected:

[ { number_of_responses: 72,
       test_date: '2017-08-25T21:02:56.000Z',
       id_submission: 'f16cf0d1-72f4-4b53-af6c-a7fe26b4ef13',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: '650441 Leandro Santana' },
     { number_of_responses: 72,
       test_date: '2017-04-27T16:55:21.000Z',
       id_submission: 'fef86479-910a-488a-9ef8-c1b1b3544916',
       source_etl: 'GameSenseSportsminors22017-04-27-18-00',
       team: 'Southern Illinois Miners',
       player_id: '9 Zaire Kutsulis' },
     { number_of_responses: 72,
       test_date: '2018-03-01T21:55:33.000Z',
       id_submission: '654cc06a-5cfb-47f5-bc94-7d5ad3cdfab4',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: '642689 Francis Ancona' },
     { number_of_responses: 72,
       test_date: '2018-07-06T22:10:31.000Z',
       id_submission: 'aa91c8eb-b01a-4705-afda-4dcdf776e5cf',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: 'dr18008 junior  tamares ' },
     { number_of_responses: 72,
       test_date: '2018-07-06T21:51:47.000Z',
       id_submission: '1f567aeb-5989-450e-8fa2-b2587f1f89f1',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: 'DR18006 Wilmer Alcantara' },
     { number_of_responses: 72,
       test_date: '2017-04-18T17:20:54.000Z',
       id_submission: '2f578bc8-d2a2-43a6-bac1-dcc4bf592a9e',
       source_etl: 'GameSenseSports REDS CL 2espanol2017-08-18-18-08',
       team: 'Reds',
       player_id: '673656 Deybert Lozano' },
     { number_of_responses: 72,
       test_date: '2018-07-06T20:49:40.000Z',
       id_submission: '3cac867b-249b-4ef7-aa0c-056b610627eb',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: 'DR18003 Luis Cabrera' },
     { number_of_responses: 72,
       test_date: '2018-08-21T19:56:57.000Z',
       id_submission: '06783d7d-a18f-445d-a183-c0bc1cb68e9a',
       source_etl: 'GameSenseSports2018-08-27-18-40',
       team: 'Reds',
       player_id: '602115 Gabriel  Guerrero ' },
     { number_of_responses: 72,
       test_date: '2018-07-07T19:23:38.000Z',
       id_submission: '562b7d82-ca1c-433d-8675-c760ea23c1a4',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: 'Do219 003 Cesar Julio Martinez' },
     { number_of_responses: 72,
       test_date: '2018-04-11T16:56:39.000Z',
       id_submission: '999cbfaf-9750-46b4-8695-1eebf337e5b3',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: '678259 Emilio Garcia' },
     { number_of_responses: 72,
       test_date: '2018-02-20T15:47:08.000Z',
       id_submission: '50bb78dc-6723-49a1-9e93-c4899dd1d9f8',
       source_etl: '2018-02-20-16-08',
       player_id: '01 test peter' },
     { number_of_responses: 72,
       test_date: '2018-03-03T18:23:27.000Z',
       id_submission: '82ffc908-0f3a-4c49-a0bd-962ea802d3b3',
       source_etl: 'GameSenseSports2018-07-06-22-32',
       team: 'Reds',
       player_id: '660647 Mariel Bautista' },
     { number_of_responses: 72,
       test_date: '2018-07-06T21:25:51.000Z',
       id_submission: '222ada1d-ee3d-4410-9b49-22842c882947',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: 'Dr18004 Elly Antonio  De La Cruz Sanchez ' },
     { number_of_responses: 72,
       test_date: '2018-04-12T16:46:20.000Z',
       id_submission: '15dafaa5-9357-40af-b3b8-39b81b9305e5',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: 'DRTamares junior tamares ' },
     { number_of_responses: 72,
       test_date: '2017-08-25T20:49:36.000Z',
       id_submission: '174da437-e8be-448e-83a8-53ea36fc9826',
       source_etl: 'GameSenseSports2018-07-07-20-41',
       team: 'Reds',
       player_id: '642298 panel man Zander of' } ]

*/
