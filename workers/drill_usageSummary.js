const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const moment = require('moment');
const DataRepository = require("./data/drill_completions");


const c = "drill_calc";

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.drill_usageSummary;
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

			if (!data.authToken.admin) {
				data.filters.app = data.authToken.app;
				data.filters.user_id = data.authToken.id;
			}

			let rows = await DataRepository.drill_completionSummary(data, db);

			//console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + "." + c}`);

			ch.ack(msg);

			return rows;
		} catch (ex) {
			this.logError(data, msg, ex);
			ch.ack(msg);
		}
	}
}


module.exports = Task;