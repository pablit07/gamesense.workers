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
				ch.ack(msg);
				return [];
			}

			let query = this.prepareQuery(data);

			// check the filters we've added, only let admins request all data
			if (!query.id_submission && !query.team && !data.authToken.admin) {
				if (user.team) {
					let team = user.team;
					let teamMembers = await db.collection('users').find({team: team, app: data.authToken.app}).toArray();
					query.player_id = {$in: teamMembers.map(p => `${p.id} ${p.first_name} ${p.last_name}`)};
				} else {
					ch.ack(msg);
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
						first_glance_total_score:{'$first': '$first_glance_total_score'},
					}},
					{$sort: {player_last_name: -1}}
				]).toArray();

			let originalMap = {};
			await db.collection('raw_usage_combined').find({
				id_submission: {$in: rows.map(r => r.id_submission)}
			}).forEach(r => originalMap[r.id_submission] = r);

			rows.forEach((r, i) => {
				// display name
				let prev = rows[i - 1];
				let cur = rows[i];
				if (i > 0 && prev.player_last_name && cur.player_last_name && prev.player_last_name === cur.player_last_name) {
					prev.display_name = `${prev.player_first_name.substring(0, 1)} ${prev.player_last_name}`;
					cur.display_name = `${cur.player_first_name.substring(0, 1)} ${cur.player_last_name}`;
				}
			});

			let average = rows.reduce((prev, cur, i) => {
				// cumulative averages
				prev.first_glance_type_score =
					prev.first_glance_type_score+(cur.first_glance_type_score-prev.first_glance_type_score)/(i+1);
				prev.first_glance_location_score =
					prev.first_glance_location_score+(cur.first_glance_location_score-prev.first_glance_location_score)/(i+1);
				prev.first_glance_total_score =
					prev.first_glance_total_score+(cur.first_glance_total_score-prev.first_glance_total_score)/(i+1);
				return prev;
			}, {
				first_name: "Team",
				last_name: "Average",
				display_name: "Team Average",
				first_glance_type_score: 0,
				first_glance_location_score: 0,
				first_glance_total_score: 0,
				activity_id: null
			});
			average.first_glance_type_score = Math.round(average.first_glance_type_score);
			average.first_glance_location_score = Math.round(average.first_glance_location_score);
			average.first_glance_total_score = Math.round(average.first_glance_total_score);
			rows.push(average);

			console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + '.' + c}`);

			ch.ack(msg);

			return rows.map(x => Object.assign({}, {
				first_name: (x.first_name || x.player_first_name || ""),
				last_name: (x.last_name || x.player_last_name || ""),
				display_name: (x.display_name || x.player_last_name || ""),
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