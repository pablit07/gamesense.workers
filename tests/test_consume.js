
require('../lib/MongoRmqWorker')


let worker = new MongoRmqWorker(Consumer, Publisher, Amqp, config)
worker.q = 'test_1'

worker.run()