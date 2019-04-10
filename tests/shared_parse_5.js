
var Worker = require('../workers/shared_parse_activity');


let dataRow = {
		app: 'BB',
		action_id:2358188,
		action_name:'Test',
		action_value:`{
		    "player": {
		      "test": "yes"
		    },
		    "Pitch Location Score": 80,
		    "Pitch Type Score": 60,
		    "Total Score": 170
		}`,
		timestamp:'2018-07-17 07:06:39.582026-06',
		object_id:37171,
		activity_id:180951,
		content_type_id:15,
		user_id:347
	};

let singleDateRow = {
	activity_name: 'Test'
};


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
				update: () => {},
				updateMany: () => {},
				count: () => { return 1; },
				findOneAndUpdate: () => {}, 
				findOne: () => {
					return singleDateRow;
				},
				find: () => {
					return {
						project: () => {
							return {
								toArray: () => {
									return [
										dataRow
									]
								}
							}
						},
						toArray: () => {
							return [
								dataRow
							]
						},
						limit: () => {
							return {
								toArray: () => {
									return [
										dataRow
									]
								}
							}
						}
					}
				}
			}
		}
	},
	data = dataRow,
	msg = {},
	conn = {},
	ch = {
		ack: () => {},
		publish: () => { console.log(arguments) }
	}

let worker = new Worker(Consumer, Publisher, Amqp, config)
worker.myTask(data, msg, conn, ch, db)














