


var config = require('../config');
var Publisher = require('../lib/publisher');
var Amqp = require('amqplib/callback_api');
var MongoClient = require('mongodb').MongoClient;
var Consumer = require("../lib/consumer");

// toReprocess = ['3a599bc923149f36a0a13474bd5e5557'];
//
// toReprocess.forEach( async r => {
//     let client = await MongoClient.connect(config.database.connectionString + '/prod?replicaSet=' + config.database.replicaSet, {keepAlive:true});
//     let db = await client.db("prod");
//     let scores = await db.collection('raw_usage').find({id_submission:r,action_name:'Test Response'}).toArray();
//     let combined = await db.collection('raw_usage_combined').findOne({id_submission:r});
//     scores.forEach(s => {
//         s.action_name = 'Test Response';
//         let message = Object.assign({}, combined, s);
//         message.id = s.id;
//         Publisher.publish(message, 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.test.question_response', {})
//     });
//     client.close();
// });




var ReprocessWorker = require('../lib/ReprocessWorker');

class ReprocessDrillScoresFromUsageForTeamAndDate extends ReprocessWorker {

    constructor(teamMembers, startDate) {
        super(Consumer, Publisher, Amqp, config);
        this.teamMembers = teamMembers;
        this.startDate = startDate;

        this.getCollectionFilter = this.getCollectionFilter.bind(this);
        this.reduceSet = this.reduceSet.bind(this);
        this.reprocessOne = this.reprocessOne.bind(this);
    }

    getExchange() {
        return "usage";
    }

    getRoutingKey() {
        return "usage.action.drill.final_score";
    }

    getAfterTaskResponseRmqQueueName() {
        return "reprocess_drill_scores_from_usage";
    }

    getCollectionName() {
        return "raw_usage";
    }

    getCollectionFilter() {
        return {user_id: {$in: this.teamMembers}, timestamp: {$gte: this.startDate}, action_name: 'Final Score'};
    }

    async reduceSet(currentSet, db) {
        let drillsBySubmission = (await currentSet.toArray()).map(item => item.id_submission);
        let combineds = await db.collection('raw_usage_combined').find({id_submission: {$in: drillsBySubmission}}).toArray();
        return combineds.reduce((result, item, index, array) => {
            result[item.id_submission] = item;
            return result;
        }, {});
    }

    async reprocessOne(d, i, reducedSet) {
        delete reducedSet[d.id_submission].id;
        Object.assign(d, reducedSet[d.id_submission]);

        return d;
    }

}

module.exports = ReprocessDrillScoresFromUsageForTeamAndDate;