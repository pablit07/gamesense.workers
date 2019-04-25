const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const moment = require('moment');
const DataRepository = require("./data/drill_usageSummary");


const c = "drill_calc";

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.drill_coachReport;
	}

  	/*
 	calc summary per drill taken
	*/
	async myTask(data, msg, conn, ch, db) {

		try
		{
			if (!data.authToken || !data.authToken.id) {
		      throw Error("Must include authorization");
		    }

			data.filters = data.filters || {};
			let user = await db.collection('users').findOne({id:data.authToken.id});
			if (!user || !user.team) return [];

			data.filters.team_name = user.team;

			var rows = await DataRepository.drill_usageSummary(data, db, header => { delete header.team_name; return header });

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