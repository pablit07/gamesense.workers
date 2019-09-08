

// func gets called inside amqp connection, 
// should accept an object to call publish on, 
// @param publisher
// object with two methods
//		@method publish
//		@method close
function MakePublisher(func, q, connectionString, {isDurable, autoDelete}, amqp) {

	var isDurable = isDurable || false;

  	return function() {

  		let args = Array.prototype.slice.call(arguments);
  		let _close = false;
  		let _closePromises = []
  		let retVal;
	  
		let connectPromise = new Promise((resolve, reject) => {
		amqp.connect(connectionString, function(err, conn) {
			if (err) {
			      console.error(err);
			      reject();
			      return;
			}
		    conn.createConfirmChannel(function(err, ch) {

	    	args.unshift({
    			publishQ: (message) => {

    				if (!message || message !== Object(message)) {
    					console.error('publisher: Error: message is not an object')
    					return
    				}

				    ch.assertQueue(q, {durable: isDurable, autoDelete});
				    let _closePromise = new Promise((resolve, reject) => {
				    	ch.sendToQueue(q, new Buffer(JSON.stringify(message)), {}, (err, _) => { resolve() });
				    });				    
				    _closePromises.push(_closePromise);
				    console.log(`Sent message: ${JSON.stringify(message)}`);
				},

				publish: (message, routingKey, headers) => {

    				if (!message || message !== Object(message)) {
    					console.error('publisher: Error: message is not an object')
    					return
    				}

				    ch.assertExchange(q);
				    let _closePromise = new Promise((resolve, reject) => {
				    	ch.publish(q, routingKey, new Buffer(JSON.stringify(message)), {headers}, (err, _) => { resolve() });
				    });
				    _closePromises.push(_closePromise);
				    console.log(`Sent message: ${JSON.stringify(message)}`);
				},

				close: () => {
					resolve();
					Promise.all(_closePromises).then(() => conn.close());
				}
			});

			retVal = func(...args);

		  });
		});
		})

		return connectPromise.then(() => { return retVal });
	}
}

function publish(value, q, connectionString, amqp, routingKey, headers) {
	(MakePublisher((publisher) => {
          publisher.publish(value, routingKey, headers);
          publisher.close();
        }, q, connectionString, false, amqp))();
}

function publishQ(value, q, connectionString, amqp, {autoDelete}) {
	(MakePublisher((publisher) => {
          publisher.publishQ(value);
          publisher.close();
        }, q, connectionString, {isDurable:false,autoDelete}, amqp))();
}

function publishDurable(value, q, connectionString, amqp) {
	(MakePublisher((publisher) => {
          publisher.publish(value);
          publisher.close();
        }, q, connectionString,{isDurable:true}, amqp))();
}

function publishQDurable(value, q, connectionString, amqp) {
	(MakePublisher((publisher) => {
          publisher.publishQ(value);
          publisher.close();
        }, q, connectionString, {isDurable:true}, amqp))();
}

module.exports.MakePublisher = MakePublisher;
module.exports.publish = publish;
module.exports.publishQ = publishQ;
module.exports.publishDurable = publishDurable;
module.exports.publishQDurable = publishQDurable;