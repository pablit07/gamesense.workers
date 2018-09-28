
var Worker = require('../workers/shared_parse_activity_combined');


let dataRow = {
		app: 'BB',
		id: 180951,
		activity_name:"Drill",
		activity_value:	"Adam (RHP v LHB) - Advanced",
		timestamp: "2018-07-17 07:06:08.997082-06",
		object_id:83,
		content_type_id:14,
		user_id:347
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














