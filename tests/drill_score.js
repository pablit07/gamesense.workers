
var Worker = require('../workers/drill_score');


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
				findOne: () => {
					return {
						first_name: "dean",
						last_name: "eng",
						team: ""
					}
				},
				findOneAndUpdate: () => { return new Promise(() => {}); },
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
	data = 
	{
  "_id": "5c39636819e240fa06a28b04",
  "id_submission": "e494872f56b1ab9ceff6837eada9dd84",
  "activity_id": 19492,
  "activity_name": "Drill",
  "activity_value": "Michaela (LHP v RHB) - Basic",
  "app": "SB",
  "content_type_id": 19,
  "id": "cdc97a91bde69553327a640d2e7fdc51",
  "id_worker": "f0ccbe80-cf56-444e-81ba-2c80b2ad6e44",
  "object_id": 196,
  "processed_worker": "2019-01-12T04:37:33+00:00",
  "team": "",
  "team_id": "",
  "time_answered": 0,
  "time_answered_formatted": "January 11th 2019, 9:47:52 pm",
  "timestamp": "2019-01-12T03:49:00.000Z",
  "user_id": 1159,
  "Pitch Location Score": 80,
  "Pitch Type Score": 10,
  "Total Score": 95,
  "action_name": "Question Response",
  "time_video_started": 0,
  "timestamp_formatted": "January 11th 2019, 9:49:00 pm",
  "Question__pitcher_hand_value": "L",
  "Question__pitcher_name_value": "3014",
  "Question__hls_occluded_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c5/master.m3u8",
  "Question__full_video__pitch_type": 4,
  "Question__full_video__title": "3014-15c-full",
  "Question__full_video__pitcher_hand": "L",
  "Question__full_video__pitcher_name": "3014",
  "Question__full_video__labels__0": 1,
  "Question__full_video__labels__1": 3,
  "Question__full_video__labels__2": 4,
  "Question__full_video__labels__3": 24,
  "Question__full_video__labels__4": 29,
  "Question__full_video__labels__5": 109,
  "Question__full_video__id": 4467,
  "Question__full_video__pitch_count": "1-0",
  "Question__full_video__file": "https://gamesense-videos.s3.amazonaws.com/3014-15c-full.mp4",
  "Question__full_video__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c-full/master.m3u8",
  "Question__full_video__pitch_location": 2,
  "Question__full_video__batter_hand": "R",
  "Question__text": null,
  "Question__occluded_video__pitch_type": 4,
  "Question__occluded_video__title": "3014-15c",
  "Question__occluded_video__pitcher_hand": "L",
  "Question__occluded_video__pitcher_name": "3014",
  "Question__occluded_video__labels__0": 1,
  "Question__occluded_video__labels__1": 3,
  "Question__occluded_video__labels__2": 4,
  "Question__occluded_video__labels__3": 24,
  "Question__occluded_video__labels__4": 29,
  "Question__occluded_video__labels__5": 40,
  "Question__occluded_video__labels__6": 109,
  "Question__occluded_video__id": 4469,
  "Question__occluded_video__pitch_count": "1-0",
  "Question__occluded_video__file": "https://gamesense-videos.s3.amazonaws.com/3014-15c5.mp4",
  "Question__occluded_video__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c5/master.m3u8",
  "Question__occluded_video__pitch_location": 2,
  "Question__occluded_video__batter_hand": "R",
  "Question__pitch_type_value": null,
  "Question__field_name_id": null,
  "Question__response_uris__0": "/player/api-auth/baseball/pitchtypes/?video_id=4469&drill_id=196",
  "Question__response_uris__1": "/player/api-auth/baseball/pitchlocations/",
  "Question__pitch_count": "1-0",
  "Question__pitch_location_value": null,
  "Question__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/3014-15c-full/master.m3u8",
  "Question__batter_hand_value": "R",
  "Question__occluded_video_file": "3014-15c5.mp4",
  "Question__field_name": null,
  "Question__id": 22975,
  "Question__full_video_file": "3014-15c-full.mp4",
  "Response__incorrect": true,
  "Response__correct": false,
  "Response__objName": "pitch_type",
  "Response__id": 1,
  "Response__name": "Fastball",
  "spent_time": 5.458
},
	msg = {},
	conn = {},
	ch = {
		ack: () => {},
		reject: () => {}
	}

let worker = new Worker(Consumer, Publisher, Amqp, config)
worker.myTask(data, msg, conn, ch, db)














