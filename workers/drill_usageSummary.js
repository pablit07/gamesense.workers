var MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
var schemas = require("../schemas");

const c = "drill_calc";

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.drill_usageSummary;
	}

  	/*
 	calc summary per player per test taken
	*/
	async myTask(data, msg, conn, ch, db) {

		var rows = await db.collection(c).find({}, {$sort:{"completion_timestamp":-1} }).project({id_submission:1,team_name:1,player_first_name:1,player_last_name:1,drill:1,app:1,first_glance_total_score:1,completion_timestamp_formatted:1}).toArray();

		rows = rows.map(r => {delete r._id; return Object.assign({
			app: r.app || "",
			first_glance_total_score: r.first_glance_total_score || 0
		}, r);});
		console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + "." + c}`);

		ch.ack(msg);

		return rows;
	}


}


module.exports = Task;