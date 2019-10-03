const uuid = require('uuid/v4');
var fs = require('fs');
var util = require('util');
var sleep = require('sleep');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var error_file = fs.createWriteStream(__dirname + '/error.log', {flags : 'w'});
var log_stdout = process.stdout;



const uuidForCurrentExecution = uuid();


// func gets called inside amqp connection, 
// should accept an object to call publish on, 
// @param publisher
// object with two methods
//		@method publish
//		@method close
function MakeConsumer(func, q, connectionString, amqp, {maxThreads, autoDelete}, afterFunc) {

	// enable debug logging
	console.log = function(d) { //
	  log_file.write(util.format(d) + '\n');
	  log_stdout.write(util.format(d) + '\n');
	};

	// enable error logging
	console.error = function(d) { //
	  error_file.write(util.format(d) + '\n');
	  log_stdout.write(util.format(d) + '\n');
	};

  	return function() {
  		let threads = 0;
		let args = Array.prototype.slice.call(arguments);

		let connectPromise = new Promise((resolve, reject) => {
		amqp.connect(connectionString, function(err, conn) {
			if (err) {
			      console.error(err);
			      reject();
			      return;
			}

		     conn.createChannel(function(err, ch) {

		     	ch.assertQueue(q, {durable: false, autoDelete});
		     	if (maxThreads) ch.prefetch(maxThreads);

		     	console.log("RMQ: [*] Waiting for messages in %s. To exit press CTRL+C", q);

		     	let _func = async function(msg) {
		     		if (!msg) return;
		     		threads++;

		     		if (msg.properties.headers && msg.properties.headers.routing_key) {
						msg.properties.headers.routing_key = msg.properties.headers.routing_key.replace('diagnostics.delay.', '');
					}
		     		let content = JSON.parse(msg.content);
		     		if (content.payload) {
		     			content = content.payload;
		     		}
		     		console.log(` [x] Received Message: ${q}: ${JSON.stringify(content)}`);
		     		let innerArgs = [content, msg, conn, ch].concat(args);
		     		let retVal = await func(...innerArgs);
		     		if (afterFunc) {
		     			innerArgs.unshift(retVal);
		     			afterFunc(...innerArgs);
		     		}

		     		threads == 0 || threads--;

		     		console.log('RMQ: [*] Finished executing');
		     		return retVal;
		     	}

		     	ch.consume(q, _func, {noAck: false});

		     }) 

     


	      
	      });
		});
	}
}

function consume(receive, q, connectionString, amqp, {maxThreads, autoDelete}) {
	(MakeConsumer(receive, q, connectionString, amqp, {maxThreads, autoDelete}))();
}

module.exports.MakeConsumer = MakeConsumer;
module.exports.consume = consume;
module.exports.uuidForCurrentExecution = uuidForCurrentExecution;
	     
