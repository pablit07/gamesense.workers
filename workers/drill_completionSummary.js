const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const DataRepository = require("./data/drill_usageDetail");


const applyDataFormat = rows => {
	return rows.map(r => {
		Object.assign(r, r._id);
		r.date = new Date(r.year, r.month - 1)
		delete r._id;
		return r;
	});
}

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.drill_completionSummary;
	}

  	/*
 	calc summary per drill taken
	*/
	async myTask(data, msg, conn, ch, db) {

		try
		{
			if (!data.authToken || !data.authToken.id || !data.authToken.app) {
				throw Error("Must include authorization");
			}

			data.filters = data.filters || {};
			let user = await db.collection('users').findOne({id:data.authToken.id, app:data.authToken.app});
			if (!user) return [];

			data.filters = data.filters || {};

			data.filters['time_answered'] = {$ne:null};
			data.filters['drill_date_raw'] = {$ne:null};

			if (data.filters.minDate) {
				Object.assign(data.filters['time_answered'], {$gte:new Date(data.filters.minDate)});
				delete data.filters.minDate;
			}

			if (data.filters.maxDate) {
				Object.assign(data.filters['time_answered'], {$lte:new Date(data.filters.maxDate)});
				delete data.filters.maxDate;
			}

			data.groupings = {
				user_id: "$user_id",
				month: {$month: "$drill_date_raw"},
				year: {$year: "$drill_date_raw"},
			};

			let rows = await DataRepository.drill_usageDetail(data, db, null, applyDataFormat);

			ch.ack(msg);

			return rows;
		} catch (ex) {
			this.logError(data, msg, ex);
			ch.ack(msg);
		}
	}


}


module.exports = Task;