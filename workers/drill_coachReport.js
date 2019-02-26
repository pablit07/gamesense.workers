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
			if (!data.user_id) {
		      throw Error("Must include user_id");
		    }

			data.filters = data.filters || {};
			data.filters.team_name = (await db.collection('users').findOne({id:data.user_id})).team;
			
			if (!data.filters.team_name) return [];

			var rows = await DataRepository.drill_usageSummary(data, db, header => { delete header.team_name; return header });

			console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + "." + c}`);

			ch.ack(msg);

			return rows;
		} catch (ex) {
			console.error(ex);
			ch.ack(msg);
		}
	}


}


module.exports = Task;