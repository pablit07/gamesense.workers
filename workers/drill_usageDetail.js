const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const DataRepository = require("./data/drill_usageDetail");


// {"paginate":true,"groupings":{"pitcher_name":"$pitcher_name","user_id":"$user_id"},"filters":{"user_id":10475}}

function snakeToCamel(s){
	return s.replace(/(_\w)/g, function(m){return m[1].toUpperCase();});
}

const keyPrefix = 'pitchType_';
const groupDataByName = (data, keys, rollupField = false) => data.reduce((previousValue, currentValue, index) => {
	let returnValue = previousValue;

	if (currentValue.pitcher_name && currentValue.correct_response_name) {
		let existingRow = returnValue.find(x => x.name === currentValue.pitcher_name && (!rollupField || x[rollupField] === currentValue[snakeToCamel(rollupField)]));
		if (existingRow) {
			existingRow[keyPrefix + currentValue.correct_response_name] = Math.round(currentValue.type_score_percent);
		} else {
			let nameRow = {
				name: currentValue.pitcher_name,
				userId: currentValue.user_id,
				playerFirstName: currentValue.player_first_name,
				playerLastName: currentValue.player_last_name,
				// yes these are redundant
				team: currentValue.team,
				playerTeam: currentValue.team
			};
			// add a default value
			keys.forEach(pt => nameRow[keyPrefix + pt] = '-');
			nameRow[keyPrefix + currentValue.correct_response_name] = Math.round(currentValue.type_score_percent);
			returnValue.push(nameRow);
		}
	}

	return previousValue;
}, []);

const groupDataByKeys = data => Object.keys(data.reduce((previousValue, currentValue, index) => {
	let returnValue = previousValue;

	if (currentValue.pitcher_name && currentValue.correct_response_name) {
		returnValue[currentValue.correct_response_name] = 1;
	}

	return returnValue;

}, {}));


const applyDataFormat = rows => {
	return rows.map(r => {
		Object.assign(r, r._id);
		r.type_score_percent = (r.type_score / r.count) * 100;
		r.location_score_percent = (r.location_score / r.count) * 100;
		r.completely_correct_score_percent = (r.completely_correct_score / r.count) * 100;
		delete r._id;
		return r;
	});
}


const groupings = {
	"singleUserPitcherResponseType": {
		key: "user_id",
		value: {
			pitcher_name: "$pitcher_name",
			user_id: "$user_id",
			correct_response_name: "$correct_response_name",
			player_first_name: "$player_first_name",
			player_last_name: "$player_last_name",
			team: "$team"
		}
	},
	"singleUserPitcherResponseLocation": {
		key: "user_id",
		value: {
			pitcher_name: "$pitcher_name",
			user_id: "$user_id",
			correct_response_name: "$correct_response_location_name",
			player_first_name: "$player_first_name",
			player_last_name: "$player_last_name",
			team: "$team"
		}
	},
	"teamPitcherResponseType": {
		key: "team",
		value: {
			pitcher_name: "$pitcher_name",
			team: "$team",
			correct_response_name: "$correct_response_name"
		}
	},
	"teamPitcherResponseLocation": {
		key: "team",
		value: {
			pitcher_name: "$pitcher_name",
			team: "$team",
			correct_response_name: "$correct_response_location_name"
		}
	},
	"globalPitcherResponseType": {
		key: false,
		value: {
			pitcher_name: "$pitcher_name",
			correct_response_name: "$correct_response_name"
		}
	},
	"globalPitcherResponseLocation": {
		key: false,
		value: {
			pitcher_name: "$pitcher_name",
			correct_response_name: "$correct_response_location_name"
		}
	}
};


class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.drill_usageDetail;
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
			data.rollUpType = data.rollUpType || "singleUserPitcherResponseType";
			data.filters = data.filters || {};
			let user = await db.collection('users').findOne({id:data.authToken.id, app:data.authToken.app});
			if (!user) return [];

			data.filters = data.filters || {};

			if (!data.authToken.admin) {
				data.filters.app = data.authToken.app;
				if (!data.rollUpType.startsWith('global')) {
					if (user.team) {
						// team user allowed to see team
						data.filters.team = user.team;
					} else {
						// indiv user only allowed to see self
						data.filters.user_id = user.id;
					}
				}
			} else { // admin allowed to see all users
					data.filters.app = data.authToken.app;
			}

			data.filters['time_answered'] = {$ne:null};

			if (data.filters.minDate) {
				Object.assign(data.filters['time_answered'], {$gte:new Date(data.filters.minDate)});
				delete data.filters.minDate;
			}

			if (data.filters.maxDate) {
				Object.assign(data.filters['time_answered'], {$lte:new Date(data.filters.maxDate)});
				delete data.filters.maxDate;
			}

			data.groupings = groupings[data.rollUpType].value;
			data.projection = {
				"type_score": {"$sum": "$type_score"},
				"location_score": {"$sum": "$location_score"},
				"completely_correct_score": {"$sum": "$completely_correct_score"}
			};

			let rows = await DataRepository.drill_usageDetail(data, db, null, applyDataFormat);

			ch.ack(msg);

			let keys = groupDataByKeys(rows);
			return {rows: groupDataByName(rows, keys, groupings[data.rollUpType].key), keys: keys};
		} catch (ex) {
			this.logError(data, msg, ex);
			ch.ack(msg);
		}
	}


}


module.exports = Task;