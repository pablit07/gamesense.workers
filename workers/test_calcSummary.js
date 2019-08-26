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

			let query = {};

			data.filters = data.filters || {};

			// if (data.filters.minDate) {
			// 	query['$gte'] = new Date(data.filters.minDate);
			// }
			//
			// if (data.filters.maxDate) {
			// 	query['$lte'] = new Date(data.filters.maxDate);
			// }

			var rows = await db.collection(c).find({
				'id_submission': data.filters.id_submission
			}).toArray();

			console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + '.' + c}`);

			ch.ack(msg);

			return rows.map(x => Object.assign({}, {
				id_submission: (x.id_submission || ""),
				first_glance_location_score: (x.first_glance_location_score || ""),
				first_glance_type_score: (x.first_glance_type_score || ""),
				first_glance_total_score: (x.first_glance_total_score || "")
			}));
		} catch (ex) {
			this.logError(data, msg, ex);
		}
	}


}


module.exports = Task;