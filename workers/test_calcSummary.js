var MongoRmqApiWorker = require('../lib/MongoRmqApiWorker');
var moment = require('moment');
var schemas = require('../schemas');

const c = 'test_calc';

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.test_calcSummary;
	}

  	/*
 	calc summary per player per test taken
	*/
	async myTask(data, msg, conn, ch, db) {

		try {

			if (!data.authToken || !data.authToken.id || !data.authToken.app) {
				throw Error("Must include authorization");
			}

			data.filters = data.filters || {};

			let user = await db.collection('users').findOne({id:data.authToken.id, app:data.authToken.app});
			if (!user ||
				(data.filters.team_name && data.filters.team_name !== user.team)) {
				return [];
			}

			let query = this.prepareQuery(data);

			// check the filters we've added, only let admins request all data
			if (!query.id_submission && !query.team && !data.authToken.admin) {
				if (user.team) {
					query.team = user.team;
				} else {
					return [];
				}
			}

			let rows = await db.collection(c)
				.aggregate([
					{$match: query},
					{$sort: {first_glance_total_score: -1}},
					{$group: {
						"_id": {
							player_id: '$player_id',
							app: '$app',
						},
						player_first_name: {'$first': '$player_first_name'},
						player_last_name: {'$first': '$player_last_name'},
						id_submission: {'$first': '$id_submission'},
						first_glance_location_score: {'$first': '$first_glance_location_score'},
						first_glance_type_score: {'$first': '$first_glance_type_score'},
						first_glance_total_score:{'$first': '$first_glance_total_score'}
					}},
				]).toArray();

			let originalMap = {};
			await db.collection('raw_usage_combined').find({
				id_submission: {$in: rows.map(r => r.id_submission)}
			}).forEach(r => originalMap[r.id_submission] = r);

			rows.push({
				first_name: "Team",
				last_name: "Average",
				first_glance_type_score: 325,
				first_glance_location_score: 341.11,
				first_glance_total_score: 776.94,
				activity_id: null
			});

			console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + '.' + c}`);

			ch.ack(msg);

			return rows.map(x => Object.assign({}, {
				first_name: (x.last_name || x.player_last_name || ""),
				last_name: (x.first_name || x.player_first_name || ""),
				id_submission: (x.id_submission || ""),
				first_glance_location_score: x.first_glance_location_score,
				first_glance_type_score: x.first_glance_type_score,
				first_glance_total_score: x.first_glance_total_score,
				activity_id: originalMap[x.id_submission] ? originalMap[x.id_submission].activity_id : ""
			}));
		} catch (ex) {
			this.logError(data, msg, ex);
		}
	}


	prepareQuery(data) {
		let query = {};

		if (data.filters.minDate) {
			query.test_date_raw = {$gte: new Date(data.filters.minDate)};
		}

		if (data.filters.maxDate) {
			query.test_date_raw =
				Object.extend({$lte: new Date(data.filters.maxDate)}, query.test_date_raw || {});
		}

		if (data.filters.id_submission) {
			query.id_submission = data.filters.id_submission;
		}

		if (data.filters.team_name) {
			query.team = data.filters.team_name;
		}
		query.first_glance_total_score = {$ne: null};

		return query;
	}
}


module.exports = Task;