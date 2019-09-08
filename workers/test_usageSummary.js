var MongoRmqApiWorker = require('../lib/MongoRmqApiWorker');
var moment = require('moment');
var schemas = require('../schemas');

const c = 'test_calc';

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.test_usageSummary;
	}

  	/*
 	calc summary per player per test taken
	*/
	async myTask(data, msg, conn, ch, db) {

		try {

			let query = {};

			data.filters = data.filters || {};

			if (data.filters.minDate) {
				query['$gte'] = new Date(data.filters.minDate);
			}

			if (data.filters.maxDate) {
				query['$lte'] = new Date(data.filters.maxDate);
			}

			let rows = await db.collection('test_usage').aggregate([{
				$group: {
					_id: {
						'id_submission': '$id_submission',
						'source_etl': '$source_etl',
						'team': '$team',
						'app': '$app',
						'player_id': '$player_id',
						'device': '$device',
					},
					test_date: {$first: '$time_video_started'},
					number_of_responses: {$sum: 1},
					type_scores: {$push: '$type_score'},
					location_scores: {$push: '$location_score'},
					completely_correct_scores: {$push: '$completely_correct_score'},
					total_completely_correct_scores: {$push: '$total_completely_correct_score'}
				},
			}, {$match: {'test_date': query}},
				{$sort: {"test_date": -1}}], { allowDiskUse: true }).toArray();

			console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + '.' + c}`);

			ch.ack(msg);

			return rows.map(x => Object.assign({
				device: (x.device || ""),
				id_submission: (x.id_submission || ""),
				team: (x.team || ""),
				player_id: (x.player_id || ""),
				source_etl: (x.source_etl || ""),
				app: (x.app || ""),
				number_of_responses: (x.number_of_responses || 0),
				type_scores: (x.type_scores || []).length,
				location_scores: (x.location_scores || []).length,
				completely_correct_scores: (x.completely_correct_scores || []).length,
				total_completely_correct_scores: (x.total_completely_correct_scores || []).length,
				test_date: (x.test_date ? moment(x.test_date).utcOffset(-6).format('MMMM Do YYYY') : null)
			}, x._id));
		} catch (ex) {
			this.logError(data, msg, ex);
		}
	}


}


module.exports = Task;