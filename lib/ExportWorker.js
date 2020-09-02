var Worker = require('./Worker');
var xlsx = require('xlsx');
const AWS = require('aws-sdk')
var fs = require('fs');


class ExportWorker extends Worker {
		
	constructor() {
		super(...arguments)
		this.xlsx = xlsx
		this.s3 = new AWS.S3()
		this.uploadStream = function(destinationDetails, sessionDetails) {
			this.s3Upload = this.s3Upload || require('s3-upload-stream')(this.s3);
			return this.s3Upload.upload(destinationDetails, sessionDetails);
		}
		this.downloadStream = function(params) {
			return require('s3-download-stream')({
				client: this.s3,
				params
			});
		}
		this.fs = fs
	}
}

module.exports = ExportWorker