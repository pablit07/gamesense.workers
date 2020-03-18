


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
        let filter = {timestamp: {$gte: this.startDate}, action_name: 'Final Score'};
        if (this.teamMembers && this.teamMembers.length) {
            Object.assign(filter, {user_id: {$in: this.teamMembers}});
        }
        return filter;
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

(async function() {

    let worker = new ReprocessDrillScoresFromUsageForTeamAndDate(([17116, 6068, 17666, 17136, 18009, 16802, 17071, 16801, 56, 17742, 17747, 13281, 17094, 17740, 17745, 16808, 16050, 16581, 17072, 11568, 9277, 3844, 16804, 16527, 17784, 412, 16547, 17970, 17739, 17124, 17092, 17662, 17964, 17085, 11595, 17154, 16795, 17118, 1206, 17678, 5110, 17743, 16522, 10500, 3463, 17223, 5113, 1175, 10902, 16818, 17089, 12011, 17240, 17129, 17130, 16809, 16698, 17125, 17879, 11086, 16439, 16193, 17971, 10331, 3465, 10270, 16468, 8812, 17735, 16699, 17074, 17117, 11528, 10587, 10739, 17069, 17831, 1166, 5103, 3, 17427, 150, 17876, 2642, 16525, 3835, 16048, 17687, 17686, 16760, 17665, 17864, 17780, 16694, 16058, 17121, 17734, 11511, 17663, 4025, 17869, 16343, 10271, 17132, 11516, 17736, 16063, 17732, 17688, 16693, 16344, 10104, 3861, 17083, 17614, 17866, 16840, 17699, 17671, 16064, 17938, 16714, 12020, 9080, 16810, 16582, 17081, 17746, 17589, 16580, 16336, 16337, 13862, 16523, 17870, 16583, 16346, 17878, 17099, 16341, 16047, 17131, 3842, 17115, 16794, 17880, 17235, 7114, 5132, 17755, 17673, 17749, 16339, 3468, 17693, 11518, 5108, 11525, 16788, 17664, 16708, 2, 9837, 17677, 12875, 17234, 17825, 16889, 16060, 16758, 16793, 9087, 17750, 11522, 16812, 16051, 5099, 14224, 16566, 16573, 16791, 13507, 16539, 17692, 3839, 5121, 17078, 17768, 15462, 13341, 16578, 13497, 16567, 3469, 17123, 11642, 16800, 17659, 16789, 17875, 9085, 10000, 17822, 16569, 9081, 17091, 8954, 17097, 17674, 17090, 17414, 16579, 17119, 3841, 16805, 389, 16574, 11515, 17987, 16572, 17680, 16338, 8927, 11237, 17238, 17669, 17873, 16046, 16437, 16340, 16790, 17882, 17111, 8925, 16585, 16052, 17696, 1167, 17183, 1174, 9424, 16575, 17559, 12657, 10150, 17239, 9089, 16055, 10788, 16577, 3466, 17127, 4, 16531, 9084, 17695, 17702, 8908, 10916, 16571, 17088, 17991, 17120, 16049, 8918, 5415, 16797, 3840, 1022, 17752, 17698, 17128, 17733, 3464, 8926, 17112, 17751, 16056, 17660, 1088, 17871, 17965, 16530, 17744, 10481, 11519, 10476, 17685, 8968, 16576, 16584, 17730, 16345, 16348, 17731, 9083, 17113, 17658, 17738, 14030, 11517, 16792, 17684, 151, 17874, 17741, 17690, 17820, 16653, 17672, 17080, 16757, 16803, 17134, 16528, 16796, 9079, 16806, 16759, 5321, 11719, 8513, 17697, 16570, 17737, 13999, 16568, 8919, 17675, 17472, 17122, 17748, 16057, 17670, 16054, 13589, 16159, 3831], new Date(2020, 0, 12)));
    await worker.runOnce();

})();