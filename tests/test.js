var consumer = require('../consumer');
var Publisher = require('../publisher').Publisher;

function test1(p, a) {
	console.info(a);
}

// test1 = consumer.MakeConsumer(test1, 'test.score_old', 'amqp://admin:admin@ec2-18-208-1-21.compute-1.amazonaws.com');

// test1();


consumer.consume((msg,conn) => {
	console.log(msg, conn);
}, 'test.score_old', 'amqp://admin:admin@ec2-18-208-1-21.compute-1.amazonaws.com');

// async function test() {
// 	var result = await test1('test');
// 	console.log(result);
// }

// test();

// (Publisher('test_score_old', (publisher) => {

// 	console.info(publisher);
// }))();

// p.publish({});

// var handler = require('./index').parseS3json;
// handler()
