var moment = require("moment");
const uuid = require("uuid/v4");
const Worker = require("../lib/Worker");
const spawnSync = require('child_process').spawnSync;
const downloadStream = require('s3-download-stream');
const fs = require('fs');

// write csvs and upload to s3

class Task extends Worker {

  /*
     run a command to compress video file
  */
    async myTask(data, msg, conn, ch, db) {

        try {

            const workingFile = `${this.consumer.uuidForCurrentExecution}.${key}`;
            const workingPath = `/tmp/${workingFile}`;

            var write = fs.createWriteStream(workingPath);

            let download = downloadStream.download({
                "Bucket": data.bucket,
                "Key": data.key
            });

            write.pipe(download);

            let outputPath = `/tmp/compressed.${workingFile}`;

            const result = spawnSync('ffmpeg', [`-i ${data.key}`, '-vcodec h264', outputPath]);

            fs.unlinkSync(workingPath);

            // var read = fs.createReadStream(`/tmp/${key}`);
            // var upload = s3Stream.upload({
            //   "Bucket": bucket,
            //   "Key": key
            // });
            //
            // upload.on("error", function (error) {
            //   console.log(error);
            // });
            //
            // upload.on("part", function (details) {
            //   console.log(details);
            // });
            //
            // read.pipe(upload);

            ch.ack(msg);

        } catch (ex) {
            this.logError(data, msg, ex);
            ch.ack(msg);
        }
    }
}

module.exports = Task