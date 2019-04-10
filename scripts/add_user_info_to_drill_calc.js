


var config = require('../config')


var MongoClient = require('mongodb').MongoClient;

(async function() {
	let client = await MongoClient.connect(config.database.connectionString + '/prod?replicaSet=' + config.database.replicaSet, {keepAlive:true});
	let db = await client.db("prod");
	let users = await db.collection('users').find({team:'Reddick Baseball 2018 Offer'});

	await users.forEach( async u => {
		try {
            let result = await db.collection('drill_calc').updateOne({user_id:u.id}, {$set: {
            	player_first_name: u.first_name,
            	player_last_name: u.last_name,
            	team_name: u.team
            }});
        } catch (ex) {
			console.error(u + ": " + ex)
		}
    });

    client.close();
}());



