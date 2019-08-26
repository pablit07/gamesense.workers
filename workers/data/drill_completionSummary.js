const moment = require('moment');


const c = "drill_comp";
const header = {id_submission:1,team:1,player_first_name:1,player_last_name:1,drill:1,app:1,first_glance_total_score:1,time_answered_formatted:1,device:1};
const headerKeys = Object.keys(header);


function applyDataFormat(rows) {
	return rows.map(r => {
		    let shortDate = moment(r.time_answered_formatted, 'MMMM Do YYYY, hh:mm:ss a').format('YYYY-MM-DD HH:mm:ss');
		    r.team_name = r.team || '';
		    r.completion_timestamp_formatted = r.time_answered_formatted;
		    delete r._id;
		    delete r.team;
		    delete r.time_answered_formatted;
		    return Object.assign({
		    first_glance_total_score: r.first_glance_total_score || 'HS',
			player_first_name: r.player_first_name || '',
			player_last_name: r.player_last_name || '',
		    completion_timestamp_formatted_short: shortDate
		}, r);});
}


async function drill_usageSummary(data, db, modifyHeader) {

	let query = {}, responses;

	data.filters = data.filters || {};
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
		cache = await db.collection("drill_reports").findOne(cacheQuery, {sort:[['maxDate','desc']]});
	}
	if (cache) {
		delete query['drill_date_raw']['$gte'];
		query.time_answered = {$gte:cache.maxDate ? cache.maxDate : new Date(moment().format('YYYY-MM-DD HH:mm'))};

		let updatedResponses = await db.collection(c).find(query, {sort:{"time_answered":-1} }).project(modifyHeader(header)).toArray();

		updatedResponses = applyDataFormat(updatedResponses);

		responses = updatedResponses.concat(cache.responses);

		db.collection('drill_reports').updateOne({_id: cache._id}, {$set: {minDate:new Date(data.filters.minDate), maxDate: data.filters.maxDate ? new Date(data.filters.maxDate) : new Date(moment().format('YYYY-MM-DD HH:mm')), responses: responses}});

		if (data.paginate) {
			responses = responses.slice(0,100);
		}

	} else {
		let cursor = db.collection(c).find(query, {sort:{"time_answered":-1} }).project(modifyHeader(header));

		if (data.paginate) {
			cursor.limit(100);
		}

		responses = await cursor.toArray();

		responses = applyDataFormat(responses);

		if (!data.paginate) {
			await db.collection("drill_reports").insertOne({minDate:new Date(data.filters.minDate), maxDate:data.filters.maxDate ? new Date(data.filters.maxDate) : new Date(moment().format('YYYY-MM-DD HH:mm')), team_name: data.filters.team_name, report:'drill_usageSummary',responses:responses});
		}
	}

	return responses;
}


module.exports.drill_usageSummary = drill_usageSummary;
module.exports.headerKeys = headerKeys;