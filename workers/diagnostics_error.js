const Worker = require('../lib/Worker');
const moment = require("moment");
const sleep = require("sleep");


class Task extends Worker {

    constructor() {
        super(...arguments);

        this.usage_action_test_final_score_no_rows = this.action_test_final_score_no_rows;
        this.usage_action_test_final_score_null_scores = this.action_test_final_score_null_scores;

        this.usage_action_drill_final_score_no_rows = this.action_test_final_score_no_rows;
        this.usage_action_drill_final_score_null_scores = this.action_test_final_score_null_scores;

    }

    myTask(msgContent, msg, conn, ch) {

        let errorHandler = msg.fields.routingKey.split('.').splice(1).join('.').replace(/\./g, '_');

        if (this[errorHandler]) {

            this[errorHandler](msgContent, msg, ch);

        } else {
            ch.ack(msg);
            throw Error("Undefined error handler! " + errorHandler);
        }
    }

    action_test_final_score_no_rows(msgContent, msg, ch) {
        let headers = msg.properties.headers;
        if (headers.retries > 10) {
            console.log("Killing message " + JSON.stringify(msgContent.id_submission));
            this.publish(msgContent, headers, ch, 'dead_letter');
            ch.ack(msg);

        } else {
            console.log(`********* Warn: ids not available (yet?) for ${msgContent.id_submission}, sleeping for 1 and retrying`);
            sleep.msleep(1);
            let headers = msg.properties.headers;
            headers.retries = headers.retries || 0;
            headers.retries++;
            this.publish(msgContent, headers, ch, 'usage');
            ch.ack(msg);
        }
    }

    action_test_final_score_null_scores(msgContent, msg, ch) {
        let headers = msg.properties.headers;
        if (headers.retries > 10) {
            console.log("Killing message " + JSON.stringify(msgContent.id_submission));
            this.publish(msgContent, headers, ch, 'dead_letter');
            ch.ack(msg);

        } else if (headers.retries === 5) {
            let responses = db.collection('raw_usage').find({action_name: 'Question Response', id_submission: msgContent.id_submission});

            responses.forEach( async response => {
                try {
                    // TODO add msgContent
                    Publisher.publish(response, 'usage', config.messageBroker.connectionString, Amqp, 'usage.action.drill.question_response', {});
                } catch (ex) {
                    console.error(ex)
                }
            });
            headers.retries++;
            this.publish(msgContent, headers, ch, 'usage');
            ch.ack(msg);
            sleep.msleep(1);
        } else {
            console.log(`********* Warn: some null scores exist for ${msgContent.id_submission}, rejecting`);
            headers.retries = headers.retries || 0;
            headers.retries++;
            this.publish(msgContent, headers, ch, 'usage');
            ch.ack(msg);
            sleep.msleep(1);
        }
    }
}


module.exports = Task;