
var Worker = require('../workers/shared_parse_activity');


let dataRow = {
		app: 'BB',
		id: 2358189,
		action_name:'Final Score',
		action_value: `{"Total Score": 170, "Pitch Type Score": 60, "Pitch Location Score": 80}`,
		timestamp:"2018-07-17 07:06:41.391771-06",
		object_id:112798,
		activity_id:180951,
		content_type_id:25,
		user_id:347

		// TODO test activity
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
		ack: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config)
worker.myTask(data, msg, conn, ch, db)














