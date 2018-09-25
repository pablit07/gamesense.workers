var MongoRmqApiWorker = require('../lib/MongoRmqApiWorker');
var schemas = require('../schemas');


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
					'player_id':'$player_id'
				},
				number_of_responses:{$sum:1}
			} 
		}]).toArray();

		console.log(` [x] Wrote ${JSON.stringify(rows)} to ${this.DbName + '.' + c}`);

		return rows.map(x => Object.assign({number_of_responses: x.number_of_responses}, x._id));
	}


}


module.exports = Task;