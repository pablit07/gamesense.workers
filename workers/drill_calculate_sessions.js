var moment = require("moment");
var schemas = require("../schemas");
var MongoRmqApiWorker = require("../lib/MongoRmqApiWorker");


const c = "drill_calc";
const SESSION_MINUTES = 30;

class Task extends MongoRmqApiWorker {


  getInputSchema() {
    return schemas.userIds;
  }

  getSchema() {
    return schemas.drill_sessions;
  }

  /*
    accepts a data object and expands and extracts the fields into a single row
    and inserts into the database
  */
  async myTask(data, msg, conn, ch, db) {


    if (!data.app) {
      ch.ack(msg);
      throw Error("Must include an app label");
    }

    if (this.isClientRequested(data)) {
      throw Error("Not authorized for client requests");
    }

    try {

      let result;
      // TODO support multiple
      let query = {user_id:data.user_id,app:data.app};
      let drills = await db.collection("raw_usage_combined").find(query, {time_answered:1,activity_value:1,"Total Score":1}).toArray();
      let sessions = [{drills:[]}];
      let i = 0;

      drills = drills.sort((a,b) => (a.time_answered > b.time_answered) ? 1 : ((b.time_answered > a.time_answered) ? -1 : 0));

      for (let d in drills) {

        let drill = drills[d];
        let diff, last, next;
        let recommendation = drill["Total Score"] >= 195 ? "New Drill" : "Repeat This Drill";
        let time_answered = drill.time_answered;

        if (!sessions[i].drills.length) {
          sessions[i].drills.push({name:drill.activity_value,score:drill["Total Score"] || 0,recommendation,time_answered,decisionQualityFromLast:"NEUTRAL"});
          continue;
        }

        last = moment(sessions[i].drills[sessions[i].drills.length - 1].time_answered);
        next = moment(drill.time_answered);
        diff = next.diff(last, "minutes");

        if (diff >= SESSION_MINUTES) {
          i++;
          sessions[i] = {drills:[{name:drill.activity_value,score:drill["Total Score"] || 0,recommendation,time_answered,decisionQualityFromLast:"NEUTRAL"}]};
        } else {
          sessions[i].drills.push({name:drill.activity_value,score:drill["Total Score"] || 0,recommendation,time_answered,decisionQualityFromLast:"NEUTRAL"});
        }
      }


      for(var s in sessions) {
        let prevDrill;
        let drills = sessions[s].drills;

        for (let d in drills) { 

          let drill = drills[d];

          if (!prevDrill) {
            prevDrill = drill;
            continue;
          }

          if ((prevDrill.recommendation == "Repeat This Drill" && drill.name != prevDrill.name) ||
              (prevDrill.recommendation == "New Drill" && drill.name == prevDrill.name)) {
            drill.decisionQualityFromLast = "BAD";
          } else {
            drill.decisionQualityFromLast = "GOOD";
          }

          prevDrill = drill;

        }
        prevDrill = null;
      }
      
      result = sessions;

      console.log(` [x] Wrote ${JSON.stringify(result)} to ${this.DbName + "." + c}`);

      ch.ack(msg);

      return result;

    } catch (ex) {
      this.logError(data, msg, ex);
      ch.ack(msg);
    }
  }
}

module.exports = Task;
