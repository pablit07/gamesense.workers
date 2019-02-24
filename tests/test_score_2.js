
var Worker = require("../workers/test_score");


let Consumer = {},
	Publisher = {},
	Amqp = {},
	config = {
		database: { name: "", connectionString: "" },
		messageBroker: { connectionString: "" }
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
	{"_id":"5c62346c02307515d9864415","id_submission":"29ef73de1b393fb13a76749391bce567","activity_id":279839,"activity_name":"Test","activity_value":"Test - App (RHB)","app":"BB","content_type_id":14,"id":"9085bc94a063859b341850febc6dec04","id_worker":"c1a3c00f-6d24-4f46-80fb-5119f283b512","object_id":224,"processed_worker":"2019-02-12T03:09:48+00:00","team":"","team_id":"","time_answered":0,"time_answered_formatted":"February 11th 2019, 8:50:20 pm","timestamp":"2019-02-12T03:09:20.000Z","user_id":4,"time_video_started":0,"action_name":"Question Response","Question__pitcher_name_value":null,"Question__pitch_count":"","Question__full_video":null,"Question__pitcher_hand_value":null,"Question__hls_full_url":null,"Question__text":null,"Question__pitch_type_value":null,"Question__hls_occluded_url":"https://d2i05ub6a4m6ld.cloudfront.net/M40-test-2b2/master.m3u8","Question__response_uris__0":"/player/api-auth/baseball/pitchtypes/?video_id=4819&drill_id=224","Question__response_uris__1":"/player/api-auth/baseball/pitchlocations/","Question__batter_hand_value":"R","Question__pitch_location_value":null,"Question__occluded_video__pitch_type":3,"Question__occluded_video__title":"M40-test-2b+2","Question__occluded_video__pitcher_hand":"R","Question__occluded_video__pitch_location":2,"Question__occluded_video__pitcher_name":"M40-test","Question__occluded_video__id":4819,"Question__occluded_video__labels__0":25,"Question__occluded_video__labels__1":39,"Question__occluded_video__labels__2":1,"Question__occluded_video__labels__3":3,"Question__occluded_video__labels__4":5,"Question__occluded_video__labels__5":100,"Question__occluded_video__pitch_count":"","Question__occluded_video__file":"https://gamesense-videos.s3.amazonaws.com/M40-test-2b2.mp4","Question__occluded_video__hls_full_url":"https://d2i05ub6a4m6ld.cloudfront.net/M40-test-2b2/master.m3u8","Question__occluded_video__batter_hand":"R","Question__occluded_video_file":"M40-test-2b2.mp4","Question__field_name":null,"Question__id":61617,"Question__field_name_id":null,"Question__full_video_file":null,"Response__incorrect":false,"Response__correct":true,"Response__objName":"pitch_location","Response__id":2,"Response__name":"Strike","spent_time":291.625,"timestamp_formatted":"February 11th 2019, 9:09:20 pm"},
	msg = {},
	conn = {},
	ch = {
		ack: () => {},
		reject: () => {}
	};

let worker = new Worker(Consumer, Publisher, Amqp, config);
worker.myTask(data, msg, conn, ch, db);














