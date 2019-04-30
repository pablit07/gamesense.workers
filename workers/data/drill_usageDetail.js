const moment = require('moment');


const c = "drill_usage";
const header = {id_submission:1,team_name:1,player_first_name:1,player_last_name:1,drill:1,app:1,first_glance_total_score:1,completion_timestamp_formatted:1,device:1};
const headerKeys = Object.keys(header);


async function drill_usageDetail(data, db, modifyHeader, applyDataFormat=x=>x) {

	let query = {}, responses;

	data.filters = data.filters || {};
	data.groupings = data.groupings || {"id_submission": "$id_submission", "time_answered": "$time_answered", "pitch": "$pitch"};
	query['drill_date_raw'] = {$ne:null};

	if (data.filters.team_name) {
		query.team_name = data.filters.team_name;
	}

	if (data.filters.minDate) {
	    Object.assign(query['drill_date_raw'], {$gte:new Date(data.filters.minDate)});
	}

	if (data.filters.maxDate) {
	    Object.assign(query['drill_date_raw'], {$lte:new Date(data.filters.maxDate)});
	}

	if (!modifyHeader) {
		modifyHeader = function() { return header };
	}

	// do we have a report that partially fills this data?
	let cache;
	if (data.filters.minDate && !data.paginate) {
		let cacheQuery = {report: 'drill_usageSummary', minDate: new Date(data.filters.minDate), team_name: data.filters.team_name};
		cache = false;//await db.collection("drill_reports").findOne(cacheQuery, {sort:[['maxDate','desc']]});
	}
	if (cache) {
		// delete query['drill_date_raw']['$gte'];
		// query.completion_timestamp_raw = {$gte:cache.maxDate ? cache.maxDate : new Date(moment().format('YYYY-MM-DD HH:mm'))};
		//
		// let updatedResponses = await db.collection(c).find(query, {sort:{"completion_timestamp":-1} }).project(modifyHeader(header)).toArray();
		//
		// updatedResponses = applyDataFormat(updatedResponses);
		//
		// responses = updatedResponses.concat(cache.responses);
		//
		// db.collection('drill_reports').updateOne({_id: cache._id}, {$set: {minDate:new Date(data.filters.minDate), maxDate: data.filters.maxDate ? new Date(data.filters.maxDate) : new Date(moment().format('YYYY-MM-DD HH:mm')), responses: responses}});
		//
		// if (data.paginate) {
		// 	responses = responses.slice(0,100);
		// }

	} else {
		let cursor = db.collection(c).aggregate([
			{"$match": data.filters },
			{"$group" : {
					"_id": {
						...data.groupings
					},
					...data.projection,
					"count": { "$sum": 1 }
				} },
			], { allowDiskUse: true });

		if (data.paginate) {
			cursor.limit(100);
		}

		responses = await cursor.toArray();

		responses = applyDataFormat(responses);

		if (!data.paginate) {
			// await db.collection("drill_reports").insertOne({minDate:new Date(data.filters.minDate), maxDate:data.filters.maxDate ? new Date(data.filters.maxDate) : new Date(moment().format('YYYY-MM-DD HH:mm')), team_name: data.filters.team_name, report:'drill_usageSummary',responses:responses});
		}
	}

	return responses;
}


module.exports.drill_usageDetail = drill_usageDetail;
module.exports.headerKeys = headerKeys;