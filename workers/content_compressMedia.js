const ExportWorker = require("../lib/ExportWorker");
const exec = require('child_process').exec;


class Task extends ExportWorker {

  /*
     run a command to download then compress video file
  */
    async myTask(data, msg, conn, ch) {

        try {

            const workingFile = `${this.consumer.uuidForCurrentExecution}.${data.key}`;
            const workingPath = `/tmp/${workingFile}`;

            let write = this.fs.createWriteStream(workingPath);

            let download = this.downloadStream({
                "Bucket": data.bucket,
                "Key": data.key
            });

            download.pipe(write);

            write.on("finish", () => {

                let outputPath = `/tmp/compressed.${workingFile}`;

                exec(`ffmpeg -i ${workingPath} -vcodec h264 ${outputPath}`, () => {

                    this.fs.unlinkSync(workingPath);

                    var read = fs.createReadStream(outputPath);

                    var upload = this.uploadStream({
                        "Bucket": data.bucket,
                        "Key": data.key
                    });

                    read.pipe(upload);

                    ch.ack(msg);
                });
            });

            // var read = fs.createReadStream(`/tmp/${key}`);
            // var upload = this.uploadStream({
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


        } catch (ex) {
            this.logError(data, msg, ex);
            ch.ack(msg);
        }
    }
}

module.exports = Task