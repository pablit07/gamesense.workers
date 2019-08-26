const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const moment = require('moment');


const c = "drill_streak";

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.drill_streakSummary;
	}

  	/*
 	calc summary per day streaks
	*/
	async myTask(data, msg, conn, ch, db) {

		try
		{
			if (!data.authToken || !data.authToken.id || !data.authToken.app) {
				throw Error("Must include authorization");
			}

			data.filters = data.filters || {};
			data.groupings = {"days":"$days"};


			let rows = await db.collection(c).aggregate([
				{"$match": data.filters },
				{"$group" : {
						"_id": {
							...data.groupings
						},
						"count": { "$sum": 1 }
					} },
				{"$sort": {_id: 1}}
			], { allowDiskUse: true }).toArray();

			rows = rows.map(r => {let _id = r._id; delete r._id; return Object.assign(r, _id)});

			console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + "." + c}`);

			ch.ack(msg);

			return rows;
		} catch (ex) {
			this.logError(data, msg, ex);
			ch.ack(msg);
		}
	}
}


module.exports = Task;