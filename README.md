# gamesense.workers

OOP framework for building RabbitMQ-based Node apps.

## Sample Config

    module.exports = {

        messageBroker: {
            name: 'rmq',
            connectionString: 'amqp://user:pass@localhost'
        },

        database: {
            name: 'prod',
            connectionString: 'mongodb://localhost'
        },

        exchanges: [],
        queues: [
            {name: 'test_score_old',instances:2},
            {name: 'test_calculate_old'}
        ]
    };

## Installing
    sudo npm install

## Start app
    nohup gulp &

## Defining workers

Define worker classes by extending Worker and overriding myTask()

    var Worker = require('../lib/Worker');


    class Task extends Worker {

      async myTask(data, msg, conn, ch) {

          console.info("zero seconds")
          setTimeout(function() {
            console.info("three seconds");

            ch.ack(msg);

           }, 3000)
         });

      }
    }

    module.exports = Task;
