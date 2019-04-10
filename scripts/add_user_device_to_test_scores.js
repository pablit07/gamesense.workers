


var config = require('../config')


var MongoClient = require('mongodb').MongoClient;
let updated = 0;


(async function() {
	let cs = config.database.connectionString + '/prod?replicaSet=' + config.database.replicaSet;
	let client = await MongoClient.connect(cs, {keepAlive:true,  connectTimeoutMS: 30000, useNewUrlParser: true});
	let db = await client.db("prod");
	let tests = await db.collection('raw_usage_combined').find({activity_name:'Test'}).sort({time_answered: -1}).skip(600).limit(100).toArray();

	client.close();

	await tests.forEach( async t => {
		try {
			client = await MongoClient.connect(cs, {keepAlive:true,  connectTimeoutMS: 30000, useNewUrlParser: true});
			db = await client.db("prod");
            let score = await db.collection('raw_usage').findOne({id_submission:t.id_submission, user_device:{$ne:null}});
			client.close();
			if (!score) { console.log('Not Found: ' + t.id_submission); }
			else {
				client = await MongoClient.connect(cs, {keepAlive:true,  connectTimeoutMS: 30000, useNewUrlParser: true});
				db = await client.db("prod");
				await db.collection('test_usage').updateMany({id_submission: t.id_submission}, {
					$set: {
						device: score.user_device
					}
				});
				updated++;
				console.log("updated: " + updated);
				client.close();
			}

		} catch (ex) {
			console.error(t + ": " + ex)
		}
    });

    client.close();
}());







