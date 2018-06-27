class Task extends MongoRmqWorker {

  /* run a single unit of work
     in this case, just set a timeout for 3 seconds
  */
  async myTask(db, msgContent, msg, conn, ch) {

    let promise = new Promise(resolve => {

      console.info("zero seconds")
       
       setTimeout(function() {
        resolve();
        console.info("three seconds");

        ch.ack(msg);

       }, 3000)
    });

    
    

    await promise;

  }
}

module.exports = Task;
