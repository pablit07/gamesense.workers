
var Worker = require("../workers/test_score");


let Consumer = {},
	Publisher = {},
	Amqp = {},
	config = {
		database: { name: "", connectionString: "" },
		messageBroker: { connectionString: "" },
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
									];
								}
							}
						},
						toArray: () => {
							return [
							];
						},
						limit: () => {
							return {
								toArray: () => {
									return [
									];
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
		"_id": "5c3f4fd05d76d53947fcb723",
		"id": "71f6b1e9baade5633d6a8bf9000a6640",
		"id_submission": "0ed638f5ed5bcc288763cfdd780b17db",
		"Question__batter_hand_value": "L",
		"Question__full_video": "/player/api-auth/baseball/videos/4790/",
		"Question__hls_occluded_url": "https://d2i05ub6a4m6ld.cloudfront.net/M40-test-4c5/master.m3u8",
		"Question__id": 61609,
		"Question__occluded_video_file": "M40-test-4c5.mp4",
		"Question__pitch_count": "",
		"Response__correct": true,
		"Response__id": 2,
		"Response__incorrect": false,
		"Response__objName": "pitch_type",
		"action_name": "Test Response",
		"app": "BB",
		"id_worker": "fa3f6471-ac77-4f45-b082-85c97df8e1e7",
		"processed_worker": "2019-01-16T15:37:52+00:00",
		"spent_time": 3.505970001220703,
		"time_answered": 0,
		"time_video_started": 0,
		"timestamp": "2019-01-16 09:37:52.000",
		"timestamp_formatted": "January 16th 2019, 9:37:52 am",
		"user_device": "iPad 4th Gen",
		"user_id": 44,
		"user_platform_os": "iOS 10.3.3",
		"Question__occluded_video__batter_hand": "L",
		"Question__occluded_video__file": "https://gamesense-videos.s3.amazonaws.com/M40-test-4c5.mp4",
		"Question__occluded_video__hls_full_url": "https://d2i05ub6a4m6ld.cloudfront.net/M40-test-4c5/master.m3u8",
		"Question__occluded_video__id": 4790,
		"Question__occluded_video__labels__0": 25,
		"Question__occluded_video__labels__1": 40,
		"Question__occluded_video__labels__2": 1,
		"Question__occluded_video__labels__3": 3,
		"Question__occluded_video__labels__4": 5,
		"Question__occluded_video__labels__5": 100,
		"Question__occluded_video__pitch_count": "",
		"Question__occluded_video__pitch_location": 2,
		"Question__occluded_video__pitch_type": 1,
		"Question__occluded_video__pitcher_hand": "R",
		"Question__occluded_video__pitcher_name": "M40-test",
		"Question__occluded_video__title": "M40-test-4c+5"
	},
	msg = {},
	conn = {},
	ch = {
		ack: () => {},
		reject: () => {}
	};

let worker = new Worker(Consumer, Publisher, Amqp, config);
worker.myTask(data, msg, conn, ch, db);














