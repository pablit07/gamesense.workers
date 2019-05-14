module.exports = {

	messageBroker: {
		name: 'rmq',
		connectionString: 'amqp://admin:admin@localhost'
	},

	database: {
		name: 'prod',
		connectionString: 'mongodb://ec2-18-233-188-98.compute-1.amazonaws.com'
	},
	rollbar: {
		token: '40c06617bf5d45bc98d9387e362bb54d'
	},
	exchanges: [],
	queues: [
		{name: 'test_score_old',instances:2},
		{name: 'test_calculate'}
	]
};
