


var config = require('../config')


var MongoClient = require('mongodb').MongoClient;

(async function() {
    let cs = config.database.connectionString + '/prod' + '?replicaSet=' + config.database.replicaSet;
    console.log(cs)
	let client = await MongoClient.connect(cs);
	let db = await client.db("prod");
	let scores = await db.collection('test_usage').find({id_submission:'0986ef71172126b7e28dfe8bc7cbe223'}).toArray();

        // console.info(scores);
    client.close();

	scores.forEach( async s => {
		try {
            client = await MongoClient.connect(cs);
            db = await client.db("prod");
            
            s.type_score = (s.response_id === s.correct_response_id) ? 1 : 0;
            s.location_score = (s.response_location === s.correct_response_location_id) ? 1 : 0;
            s.completely_correct_score = (s.type_score && s.location_score) ? 1 : 0;
            client = await MongoClient.connect(cs);
            db = await client.db("prod");
            await db.collection('test_usage').findOneAndUpdate({_id: s._id}, {$set:  s});            
            client.close();
        } catch (ex) {
			console.error(ex)
		}
    });

    client.close();
}());



