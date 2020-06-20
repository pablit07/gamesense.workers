const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const DataRepository = require("./data/drill_completions");
const moment = require('moment');


const applyDataFormat = rows => {
	return rows.map(r => {
		Object.assign(r, r._id);
		if (r.week) {
			r.date = new Date(moment(`${r.year}W${("00"+(r.week+1)).slice(-2)}`));
		} else {
			r.date = new Date(r.year, (r.month || 1) - 1, r.day || 0);
		}
		delete r._id;
		return r;
	});
}

const groupings = {
	"yearly": {
		user_id: "$user_id",
		year: {$year: "$drill_date_raw"},
		player_last_name: "$player_last_name",
		player_first_name: "$player_first_name",
	},
	"monthly": {
		user_id: "$user_id",
		month: {$month: "$drill_date_raw"},
		year: {$year: "$drill_date_raw"},
		player_last_name: "$player_last_name",
		player_first_name: "$player_first_name"
	},
	"weekly": {
		user_id: "$user_id",
		week: {$week: "$drill_date_raw"},
		year: {$year: "$drill_date_raw"},
		player_last_name: "$player_last_name",
		player_first_name: "$player_first_name"
	},
	"daily": {
		user_id: "$user_id",
		day: {$day: "$drill_date_raw"},
		month: {$month: "$drill_date_raw"},
		year: {$year: "$drill_date_raw"},
		player_last_name: "$player_last_name",
		player_first_name: "$player_first_name"
	}
};

const formats = {
	"yearly": o => `${o.year}`,
	"monthly": o => `${o.month}-${o.year}`,
	"weekly": o => `${o.week}w ${o.year}`,
	"daily": o => `${o.month}-${o.day}-${o.year}`
};

function getApplyDataFormat(rollUpType) {
	return rows => applyDataFormat(rows).map(r => {
		r.date_format = formats[rollUpType](r);
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
			if (!user) {
				ch.ack(msg);
				return [];
			}

			data.filters = data.filters || {};

			data.filters['time_answered'] = {$ne:null};
			data.filters['drill_date_raw'] = {$ne:null};
			if (!data.authToken.admin) {
				if (!data.filters.user_id && user.team) {
					// team user allowed to see team
					let users = await db.collection('users').distinct('id', {team: user.team});
					data.filters.user_id = {$in: users};
				} else {
					data.filters.user_id = data.filters.user_id || data.authToken.id;
				}
				data.filters.app = data.filters.app || data.authToken.app;
			}

			if (data.filters.minDate) {
				Object.assign(data.filters['time_answered'], {$gte:new Date(data.filters.minDate)});
				delete data.filters.minDate;
			}

			if (data.filters.maxDate) {
				Object.assign(data.filters['time_answered'], {$lte:new Date(data.filters.maxDate)});
				delete data.filters.maxDate;
			}

			let rows = {};
			if (Array.isArray(data.rollUpType)) {
				await data.rollUpType.forEach(async rut => {
					data.groupings = groupings[rut];
					rows[rut] = await DataRepository.drill_completionDetail(data, db, null, getApplyDataFormat(rut));
				});
			} else {
				let rut = data.rollUpType || "monthly";
				data.groupings = groupings[rut];
				if (data.authToken.admin) delete data.groupings['user_id'];
				rows = await DataRepository.drill_completionDetail(data, db, null, getApplyDataFormat(rut));

			}


			ch.ack(msg);

			return rows;
		} catch (ex) {
			this.logError(data, msg, ex);
			ch.ack(msg);
		}
	}


}


module.exports = Task;
