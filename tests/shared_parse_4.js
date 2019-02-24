
var Worker = require('../workers/shared_parse_activity');


let dataRow = {
		app: 'BB',
		action_id:2358188,
		action_name:'Test Response',
		action_value:`{
		  "Question": {
		    "id": 61629,
		    "full_video": "/player/api-auth/baseball/videos/4712/",
		    "pitch_count": "",
		    "occluded_video": {
		      "id": 4712,
		      "file": "https://gamesense-videos.s3.amazonaws.com/F44-test-2a5.mp4",
		      "title": "F44-test-2a+5",
		      "labels": [
		        40,
		        1,
		        4,
		        5,
		        100,
		        19
		      ],
		      "pitch_type": 1,
		      "batter_hand": "R",
		      "pitch_count": "",
		      "hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/F44-test-2a5/master.m3u8",
		      "pitcher_hand": "L",
		      "pitcher_name": "F44-test",
		      "pitch_location": 1
		    },
		    "hls_occluded_url": "https://d2i05ub6a4m6ld.cloudfront.net/F44-test-2a5/master.m3u8",
		    "batter_hand_value": "R",
		    "occluded_video_file": "F44-test-2a5.mp4"
		  },
		  "Response": {
		    "id": 1,
		    "name": "Fastball",
		    "correct": true,
		    "objName": "pitch_type",
		    "incorrect": false
		  },
		  "spent_time": 5.328526973724365
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














