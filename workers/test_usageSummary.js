var MongoRmqApiWorker = require('../lib/MongoRmqApiWorker');
var moment = require('moment');
var schemas = require('../schemas');

const c = 'test_calc';

class Task extends MongoRmqApiWorker {

	getSchema() {
		return schemas.test_usageSummary;
	}

  	/*
 	calc summary per player per test taken
	*/
	async myTask(data, msg, conn, ch, db) {

		var rows = await db.collection('test_usage').aggregate([{ 
			$group:{
				_id:{
					'id_submission':'$id_submission',
					'source_etl':'$source_etl',
					'team':'$team',
					'app':'$app',
					'player_id':'$player_id',
				},
				test_date:{$first:'$time_video_started'},
				number_of_responses:{$sum:1}
			},
		}, {$sort:{"test_date":-1} }]).toArray();

		console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + '.' + c}`);

		ch.ack(msg);

		return rows.map(x => Object.assign({id_submission: (x.id_submission || ""), team: (x.team || ""), player_id: (x.player_id || ""), source_etl: (x.source_etl || ""), app: (x.app || ""),number_of_responses: (x.number_of_responses || 0), test_date: (x.test_date ? moment(x.test_date).utcOffset(-6).format('MMMM Do YYYY') : null)}, x._id));
	}


}


module.exports = Task;