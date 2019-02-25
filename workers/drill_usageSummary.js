const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const moment = require('moment');

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

			let query = {};

			data.filters = data.filters || {};
			query['drill_date_raw'] = {$ne:null};

			if (data.filters.minDate) {
				Object.assign(query['drill_date_raw'], {$gt:new Date(data.filters.minDate)});
			}

			if (data.filters.maxDate) {
				Object.assign(query['drill_date_raw'], {$lt:new Date(data.filters.maxDate)});
			}

			var rows = await db.collection(c).find(query, {sort:{"completion_timestamp":-1} }).project({id_submission:1,team_name:1,player_first_name:1,player_last_name:1,drill:1,app:1,first_glance_total_score:1,completion_timestamp_formatted:1,device:1}).toArray();

			rows = rows.map(r => {
				let shortDate = moment(r.completion_timestamp_formatted, 'MMMM Do YYYY, hh:mm:ss a').format('YYYY-MM-DD HH:mm:ss');
				delete r._id;
				return Object.assign({
				first_glance_total_score: r.first_glance_total_score || 0,
				completion_timestamp_formatted_short: shortDate
			}, r);});
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