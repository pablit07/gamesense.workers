const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const moment = require('moment');
const DataRepository = require("./data/drill_usageSummary");


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

			let rows = await DataRepository.drill_usageSummary(data, db);

			//console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + "." + c}`);

			ch.ack(msg);

			return rows;
		} catch (ex) {
			console.error(ex);
			ch.ack(msg);
		}
	}


}


module.exports = Task;