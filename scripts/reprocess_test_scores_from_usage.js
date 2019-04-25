


var config = require('../config');
var Publisher = require('../lib/publisher');
var Amqp = require('amqplib/callback_api');
var MongoClient = require('mongodb').MongoClient;

toReprocess = ['ada473c605c83f715e33841b90b105b4'];

toReprocess.forEach( async r => {
    let client = await MongoClient.connect(config.database.connectionString + '/prod?replicaSet=' + config.database.replicaSet, {keepAlive:true});
    let db = await client.db("prod");
    let scores = await db.collection('raw_usage').find({id_submission:r}).toArray();
    let combined = await db.collection('raw_usage_combined').findOne({id_submission:r});
    scores.forEach(s => {
        s.action_name = 'Test Response';
        let message = Object.assign({}, combined, s);
        message.id = s.id;
        Publisher.publish(message, 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.test.question_response', {})
    });
    client.close();
});




