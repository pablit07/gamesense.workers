
var Worker = require('../workers/drill_calculate');


let dataRow = {"time_video_started":"2019-01-12T03:48:54.000Z","time_answered":"2019-01-12T03:49:00.000Z","id_question":"9c1f92f558a269a384d26384d232b222","team":"","app":"SB","id":"cdc97a91bde69553327a640d2e7fdc51","id_submission":"e494872f56b1ab9ceff6837eada9dd84","processed_worker":"2019-01-14T12:11:58-07:00","time_answered_formatted":"January 11th 2019, 9:49:00 pm","time_video_started_formatted":"January 11th 2019, 9:48:54 pm","time_spent":5.458,"device":"Web Browser","os":"Unknown","user_id":1159,"player_first_name":"dean","player_last_name":"eng","player_id":"1159 dean eng","team_name":"","team_id":"","pitch":"3014-15c5","occlusion":"R+5","player_batting_hand":"R","pitcher_hand":"R","pitch_count":"1-0","pitcher_code":"3014","drill":"Michaela (LHP v RHB) - Basic","pitcher_name":"Michaela","difficulty":"Basic","response_name":"Fastball","response_id":1,"correct_response_id":4,"correct_response_name":"Curveball","type_score":0};


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
	data = {
		filter: {}
	},
	msg = {},
	conn = {},
	ch = {
		ack: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config)
worker.myTask(data, msg, conn, ch, db)














