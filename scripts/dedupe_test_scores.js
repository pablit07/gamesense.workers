


var config = require('../config')


var MongoClient = require('mongodb').MongoClient;

(async function() {
    let cs = config.database.connectionString + '/prod' + '?replicaSet=' + config.database.replicaSet;
    console.log(cs)
	let client = await MongoClient.connect(cs);
	let db = await client.db("prod");
	let scores = await db.collection('test_usage').aggregate([
        // {"$match": {"id_question": {$ne: null}}},
        {"$group" : {
            "_id": {
                "id_submission": "$id_submission",
                "time_answered": "$time_answered",
                "pitch": "$pitch"
            },
            "count": { "$sum": 1 }
        } },
        {"$match": {"count" : {"$gt": 1} } }]   ).toArray();

        // console.info(scores);
    client.close();

	scores.forEach( async s => {
		try {
            client = await MongoClient.connect(cs);
            db = await client.db("prod");
            console.log(s._id);
            let pair = await db.collection('test_usage').find(s._id).toArray()
            client.close();
            console.log(pair)
            let idToDelete = pair[0]._id;
            pair[0].id = pair[1].id;
            delete pair[0]._id;
            Object.assign(pair[1], pair[0]);
            pair[1].completely_correct_score = (pair[1].type_score && pair[1].location_score) ? 1 : 0;
            client = await MongoClient.connect(cs);
            db = await client.db("prod");
            await db.collection('test_usage').findOneAndUpdate({_id: pair[1]._id}, {$set:  pair[1]});
            console.info('updating ', pair[1]._id);
            console.info('will remove ', {_id: idToDelete});
            await db.collection('test_usage').deleteOne({_id: idToDelete});
            client.close();
        } catch (ex) {
			console.error(ex)
		}
    });

    client.close();
}());



