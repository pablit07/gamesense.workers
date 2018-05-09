const amqp = require('amqplib/callback_api');


// func gets called inside amqp connection, 
// should accept an object to call publish on, 
// @param publisher
// object with two methods
//		@method publish
//		@method close
function MakePublisher(func, q, connectionString, isDurable) {

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
    			publish: (message) => {

    				if (!message || message !== Object(message)) {
    					console.error('publisher: Error: message is not an object')
    					return
    				}

				    ch.assertQueue(q, {durable: isDurable});
				    let _closePromise = new Promise((resolve, reject) => {
				    	ch.sendToQueue(q, new Buffer(JSON.stringify(message)), {}, (err, ok) => { resolve() });
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

function publish(value, q, connectionString) {
	(MakePublisher((publisher) => {
          publisher.publish(value);
          publisher.close();
        }, q, connectionString))();
}

function publishDurable(value, q, connectionString) {
	(MakePublisher((publisher) => {
          publisher.publish(value);
          publisher.close();
        }, q, connectionString, true))();
}

module.exports.MakePublisher = MakePublisher;
module.exports.publish = publish;
module.exports.publishDurable = publishDurable;