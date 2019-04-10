const MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");
const schemas = require("../schemas");
const DataRepository = require("./data/drill_usageDetail");


// {"paginate":true,"groupings":{"pitcher_name":"$pitcher_name","user_id":"$user_id"},"filters":{"user_id":10475}}

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
				throw Error("Must include authorization" + data.authToken.app);
			}
			data.filters = data.filters || {};
			let user = await db.collection('users').findOne({id:data.authToken.id, app:data.authToken.app});
			if (!user) return [];

			data.filters = data.filters || {};
			data.filters.app = data.authToken.app;
			if (user.team) {
				data.filters.team = user.team;
			}
			data.filters.team = '';
			data.groupings = {
				pitcher_name: "$pitcher_name",
				user_id: "$user_id",
				correct_response_name: "$correct_response_name"
			};

			let rows = await DataRepository.drill_usageDetail(data, db);

			ch.ack(msg);

			return rows;
		} catch (ex) {
			console.error(ex);
			ch.ack(msg);
		}
	}


}


module.exports = Task;