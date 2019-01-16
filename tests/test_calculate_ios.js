
var Worker = require('../workers/test_calculate');


let dataRow = {"time_video_started":"2019-01-16T15:37:48.000Z","time_answered":"2019-01-16T15:37:52.000Z","question_id":null,"app":"BB","id":"fcd0afc9878071467727a1fd302a67f6","id_submission":"e4f2a4a65423470141374e3e1ef4919f","processed_worker":"2019-01-16T11:51:24-06:00","time_answered_formatted":"January 16th 2019, 9:37:52 am","time_video_started_formatted":"January 16th 2019, 9:37:48 am","user_id":44,"id_question":"8a25651a6e80eb4b0aa9411f5a247758","pitch":"https://gamesense-videos.s3.amazonaws.com/M40-test-4c5","occlusion":"R+5","player_batting_hand":"L","pitcher_hand":"L","pitch_count":"","pitcher_code":"M40-test","response_name":"Cutter","response_id":2,"correct_response_id":1,"correct_response_name":"Fastball","type_score":0};


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
		  "_id": "5c3f4fbc5d76d53947fcac77",
		  "id": "dc3ac8db9dbfc75dde3155873579a8b5",
		  "id_submission": "0ed638f5ed5bcc288763cfdd780b17db",
		  "Pitch Location Score": 360,
		  "Pitch Type Score": 300,
		  "Total Score": 745,
		  "action_name": "Test",
		  "app": "BB",
		  "id_worker": "fa3f6471-ac77-4f45-b082-85c97df8e1e7",
		  "player__age": -1,
		  "player__first_name": "Pedro",
		  "player__id": -1,
		  "player__jersey_number": "56",
		  "player__last_name": "Jaeminez",
		  "player__level": -1,
		  "player__userprofile__batting_hand": 2,
		  "player__userprofile__is_coach": false,
		  "player":{
		  	"age": -1,
		  	"first_name": "Pedro",
		  	"id": -1,
		  	"jersey_number": "56",
		  	"last_name": "Jaeminez",
		  	"level": -1,
		  	"userprofile__batting_hand": 2,
		  	"userprofile__is_coach": false
		  },
		  "processed_worker": "2019-01-16T15:37:32+00:00",
		  "time_answered": 0,
		  "time_video_started": 0,
		  "timestamp": "2019-01-16 09:37:32.000",
		  "timestamp_formatted": "January 16th 2019, 9:37:32 am",
		  "user_id": 44
	},
	msg = {},
	conn = {},
	ch = {
		ack: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config)
worker.myTask(data, msg, conn, ch, db)














