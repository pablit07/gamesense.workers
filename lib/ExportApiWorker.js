var MongoRmqApiWorker = require('./MongoRmqApiWorker');
var xlsx = require('xlsx');
const AWS = require('aws-sdk')
var fs = require('fs');


class ExportApiWorker extends MongoRmqApiWorker {
		
	constructor() {
		super(...arguments)
		this.xlsx = xlsx
		this.s3 = new AWS.S3()
		this.s3Stream = require('s3-upload-stream')(this.s3);
		this.fs = fs
	}
}

module.exports = ExportApiWorker