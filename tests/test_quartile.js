
var Worker = require('../workers/test_calculate_quartile');


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
				find: () => {
					return {
						project: () => {
							return {
								toArray: () => {
									return [
										{
											occlusion_plus_5_completely_correct_score:400,
											occlusion_plus_2_completely_correct_score: 375,
											occlusion_none_completely_correct_score: 700,
											occlusion_plus_5_type_score:400,
											occlusion_plus_2_type_score: 375,
											occlusion_none_type_score: 700,
											occlusion_plus_5_location_score:400,
											occlusion_plus_2_location_score: 375,
											occlusion_none_location_score: 700,
											prs: 300
										},
										{
											occlusion_plus_5_completely_correct_score:420,
											occlusion_plus_2_completely_correct_score: 395,
											occlusion_none_completely_correct_score: 720,
											occlusion_plus_5_location_score:420,
											occlusion_plus_2_location_score: 395,
											occlusion_none_location_score: 720,
											occlusion_plus_5_type_score:420,
											occlusion_plus_2_type_score: 395,
											occlusion_none_type_score: 720,
											prs: 320
										},
										{
											occlusion_plus_5_completely_correct_score:440,
											occlusion_plus_2_completely_correct_score: 415,
											occlusion_none_completely_correct_score: 740,
											occlusion_plus_5_type_score:440,
											occlusion_plus_2_type_score: 415,
											occlusion_none_type_score: 740,
											occlusion_plus_5_location_score:440,
											occlusion_plus_2_location_score: 415,
											occlusion_none_location_score: 740,
											prs: 340
										},
										{
											occlusion_plus_5_completely_correct_score:460,
											occlusion_plus_2_completely_correct_score: 435,
											occlusion_none_completely_correct_score: 760,
											occlusion_plus_5_location_score:460,
											occlusion_plus_2_location_score: 435,
											occlusion_none_location_score: 760,
											occlusion_plus_5_type_score:460,
											occlusion_plus_2_type_score: 435,
											occlusion_none_type_score: 760,
											prs: 360
										},
										{
											occlusion_plus_5_completely_correct_score:480,
											occlusion_plus_2_completely_correct_score: 455,
											occlusion_none_completely_correct_score: 780,
											occlusion_plus_5_type_score:480,
											occlusion_plus_2_type_score: 455,
											occlusion_none_type_score: 780,
											occlusion_plus_5_location_score:480,
											occlusion_plus_2_location_score: 455,
											occlusion_none_location_score: 780,
											prs: 380
										}
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
worker.myTask(db, data, msg, conn, ch)














