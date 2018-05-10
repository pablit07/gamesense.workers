var Worker = require('./Worker');


class MongoRmqWorker extends Worker {
		
	async run() {
	
		try {

	      // Use connect method to connect to the server
	        let client = await this.MongoClient.connect(this.mongo_connectionString + '/' + this.DbName)
	        // assert.equal(null, err);
	        console.log("Connected successfully to Mongo server")


	        this.consumer.consume(async (data, msg, conn, ch) => {
				this.myTask(client, data, msg, conn, ch)
			}, this.q, this.rmq_connectionString, this.amqp)
        

	    } catch (ex) {
	      console.log("RMQ/Mongo Error: " + ex)
	    }
	}

	publish(data, q_pub, isDurable) {
		if (isDurable)
			this.publisher.publishDurable(data, q_pub, this.rmq_connectionString, this.amqp)
		else
			this.publisher.publish(data, q_pub, this.rmq_connectionString, this.amqp)
	}
}

module.exports = MongoRmqWorker