
var Worker = require('../workers/shared_parse_activity');


let dataRow = {
		app: 'BB',
		action_id:2358188,
		action_name:'Question Response',
		action_value:`{
		  "Question": {
		    "id": 37171,
		    "text": null,
		    "field_name": null,
		    "full_video": {
		      "id": 1324,
		      "file": "https://gamesense-videos.s3.amazonaws.com/M10-4a-full.mp4",
		      "title": "M10-4a+2-full",
		      "labels": [
		        20,
		        32,
		        1,
		        4,
		        5
		      ],
		      "pitch_type": 1,
		      "batter_hand": "L",
		      "pitch_count": "2-0",
		      "hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/M10-4a-full/master.m3u8",
		      "pitcher_hand": "R",
		      "pitcher_name": "M10",
		      "pitch_location": 2
		    },
		    "pitch_count": "2-0",
		    "hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/M10-4a-full/master.m3u8",
		    "response_uris": [
		      "/player/api-auth/baseball/pitchtypes/?video_id=1321&drill_id=83",
		      "/player/api-auth/baseball/pitchlocations/"
		    ],
		    "occluded_video": {
		      "id": 1321,
		      "file": "https://gamesense-videos.s3.amazonaws.com/M10-4a2.mp4",
		      "title": "M10-4a+2",
		      "labels": [
		        20,
		        32,
		        1,
		        4,
		        5
		      ],
		      "pitch_type": 1,
		      "batter_hand": "L",
		      "pitch_count": "2-0",
		      "hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/M10-4a2/master.m3u8",
		      "pitcher_hand": "R",
		      "pitcher_name": "M10+2",
		      "pitch_location": 2
		    },
		    "full_video_file": "M10-4a-full.mp4",
		    "hls_occluded_url": "https://d2i05ub6a4m6ld.cloudfront.net/M10-4a2/master.m3u8",
		    "pitch_type_value": null,
		    "batter_hand_value": "L",
		    "pitcher_hand_value": "R",
		    "pitcher_name_value": "M10+2",
		    "occluded_video_file": "M10-4a2.mp4",
		    "pitch_location_value": null
		  },
		  "Response": {
		    "id": 2,
		    "name": "Strike",
		    "correct": true,
		    "objName": "pitch_location",
		    "incorrect": false
		  },
		  "spent_time": 0.835
		}`,
		timestamp:'2018-07-17 07:06:39.582026-06',
		object_id:37171,
		activity_id:180951,
		content_type_id:15,
		user_id:347,

		// TODO test activity
	};




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














