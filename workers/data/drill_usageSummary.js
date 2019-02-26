const moment = require('moment');


const c = "drill_calc";
const header = {id_submission:1,team_name:1,player_first_name:1,player_last_name:1,drill:1,app:1,first_glance_total_score:1,completion_timestamp_formatted:1,device:1};
const headerKeys = Object.keys(header);

async function drill_usageSummary(data, db, modifyHeader) {

	let query = {};
	let _header = header;

	data.filters = data.filters || {};
	query['drill_date_raw'] = {$ne:null};

	if (data.filters.team_name) {
		query.team_name = data.filters.team_name;
	}

	if (data.filters.minDate) {
	    Object.assign(query['drill_date_raw'], {$gt:new Date(data.filters.minDate)});
	}

	if (data.filters.maxDate) {
	    Object.assign(query['drill_date_raw'], {$lt:new Date(data.filters.maxDate)});
	}

	if (!modifyHeader) {
		modifyHeader = function() { return header };
	}

	var responses = await db.collection(c).find(query, {sort:{"drill_date_raw":-1} }).project(modifyHeader(header)).toArray();

	responses = responses.map(r => {
	    let shortDate = moment(r.completion_timestamp_formatted, 'MMMM Do YYYY, hh:mm:ss a').format('YYYY-MM-DD HH:mm:ss');
	    delete r._id;
	    return Object.assign({
	    first_glance_total_score: r.first_glance_total_score || 0,
	    completion_timestamp_formatted_short: shortDate
	}, r);});

	return responses;
}


module.exports.drill_usageSummary = drill_usageSummary;
module.exports.headerKeys = headerKeys;