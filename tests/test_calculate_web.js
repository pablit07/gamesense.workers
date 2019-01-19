
var Worker = require("../workers/test_calculate");


let dataRow = {
				"_id" : "5af8474fa4078c98b670aa6c",
				"pitcher_name_value" : null,
				"full_video" : null,
				"pitcher_hand_value" : null,
				"pitch_type_value" : null,
				"response_uris" : [
					[
						{
							"id" : 1,
							"name" : "Fastball"
						},
						{
							"id" : 3,
							"name" : "Changeup"
						},
						{
							"id" : 5,
							"name" : "Slider"
						}
					],
					[
						{
							"id" : 1,
							"name" : "Ball"
						},
						{
							"id" : 2,
							"name" : "Strike"
						}
					]
				],
				"batter_hand_value" : "R",
				"pitch_location_value" : null,
				"occluded_video" : "/player/api-auth/baseball/videos/4807/",
				"field_name" : null,
				"occluded_video_file" : "M40-test-4a2.mp4",
				"text" : null,
				"id" : "ad2eb296-d3c3-415b-91a0-176ea76d7ee5",
				"full_video_file" : null,
				"question_id" : 29501,
				"response_id" : 1,
				"response_location" : 2,
				"occlusion" : "R+2",
				"correct_response_name" : "Fastball",
				"correct_response_location_name" : "Strike",
				"correct_response_id" : 1,
				"correct_response_location_id" : 2,
				"time_video_started" : Date("2017-08-27T21:12:14Z"),
				"player_id" : "4 dean eng",
				"test_id" : 224,
				"time_answered" : Date("2017-08-27T21:12:15Z"),
				"id_etl" : "1a56f5e3-a88a-4603-a992-9c3f90b7c975",
				"processed_etl" : "2018-05-13T14:10:23+00:00",
				"source_etl" : "GameSenseSport2017-08-28-22-22",
				"id_submission" : "15b8e708-0e6a-4a67-b56c-1779b4e1c8a2",
				"processed_worker" : "2018-05-13T14:10:41+00:00",
				"id_worker" : "bdd6a31e-e120-4470-a7af-504e0cdb0421",
				"time_difference" : 1075,
				"time_video_started_formatted" : "August 27th 2017, 3:12:14 pm",
				"time_answered_formatted" : "August 27th 2017, 3:12:15 pm",
				"player_jersey_id" : "4",
				"player_first_name" : "dean",
				"player_last_name" : "eng",
				"response_name" : "Fastball",
				"response_location_name" : "Strike",
				"pitch" : "M40-test-4a2",
				"type_score" : 1,
				"location_score" : 1,
				"completely_correct_score" : 1,
				"player_batting_hand" : "R",
				"occlusion_none_completely_correct_avg" : 0.2916666666666667,
				"occlusion_none_completely_correct_score" : 292,
				"occlusion_none_location_avg" : 0.625,
				"occlusion_none_location_score" : 625,
				"occlusion_none_type_avg" : 0.5416666666666666,
				"occlusion_none_type_score" : 542,
				"occlusion_plus_2_completely_correct_avg" : 0.2916666666666667,
				"occlusion_plus_2_completely_correct_score" : 292,
				"occlusion_plus_2_location_avg" : 0.625,
				"occlusion_plus_2_location_score" : 625,
				"occlusion_plus_2_type_avg" : 0.5416666666666666,
				"occlusion_plus_2_type_score" : 542,
				"occlusion_plus_5_completely_correct_avg" : 0.2916666666666667,
				"occlusion_plus_5_completely_correct_score" : 292,
				"occlusion_plus_5_location_avg" : 0.625,
				"occlusion_plus_5_location_score" : 625,
				"occlusion_plus_5_type_avg" : 0.5416666666666666,
				"occlusion_plus_5_type_score" : 542,
				"prs" : 192,
				"total_completely_correct_score" : 292,
				"total_location_score" : 625,
				"total_type_score" : 542
			};


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
				find: () => {
					return {
						project: () => {
							return {
								toArray: () => {
									return [
										dataRow
									];
								}
							}
						},
						toArray: () => {
							return [
								dataRow
							];
						},
						limit: () => {
							return {
								toArray: () => {
									return [
										dataRow
									];
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
	};

let worker = new Worker(Consumer, Publisher, Amqp, config);
worker.myTask(data, msg, conn, ch, db);














