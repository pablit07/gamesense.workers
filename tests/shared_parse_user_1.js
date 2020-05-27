
var Worker = require('../workers/shared_parse_user');


let dataRow = [{"id":24237,
							"first_name":"Paul",
							"last_name":"Kohlhoff",
							"team":"",
							"email":"paul.kohlhoff+test71367@gmail.com",
							"username":"paul.kohlhoff+test71367@gmail.com",
							"organization": "test organization",
							"app":"BB"}

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






 // input {"id":24237,"first_name":"Paul","last_name":"Kohlhoff","team":"","email":"paul.kohlhoff+test71367@gmail.com","username":"paul.kohlhoff+test71367@gmail.com","app":"BB"}
 // expected: {"app":"BB","id":24237,"first_name":"Paul","last_name":"Kohlhoff","team":"","email":"paul.kohlhoff+test71367@gmail.com","username":"paul.kohlhoff+test71367@gmail.com","processed_worker":"2020-05-27T11:46:45+00:00","id_worker":"8bb51dbf-40fa-4770-a3f9-c21ef05b3558"} to prod.users
