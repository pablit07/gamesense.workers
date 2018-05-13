var assert = require('assert');
var moment = require('moment');
const uuid = require('uuid/v4');
var sleep = require('sleep');
var MongoRmqWorker = require('../lib/MongoRmqWorker');

// calc single player scores

const q_pub = 'test.notify';
const c = 'test_calc';


class Task extends MongoRmqWorker {

  /*
     calc single player scores
  */
  async myTask(db, msgContent, msg, conn, ch) {

    let promise = new Promise(resolve => {

      console.info("zero seconds")
       
       setTimeout(function() {
        resolve();
        console.info("three seconds");

        ch.ack(msg);

       }, 3000)
    });

    
    

    await promise;

  }
}

module.exports = Task;
