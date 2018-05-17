var assert = require('assert');
var moment = require('moment');
const uuid = require('uuid/v4');
var sleep = require('sleep');
var jStat = require('jStat').jStat;
var MongoRmqWorker = require('../lib/MongoRmqWorker');


// calc single team / date range quartiles

const c = 'test_calc';
const quartileNames = ['100%', '75%', '50%', '25%'];


class Task extends MongoRmqWorker {

  /*
     calc single team / date range quartiles
  */
  async myTask(db, data, msg, conn, ch) {


    let result = {
      occlusion_plus_5_completely_correct_score_q1: 0,
      occlusion_plus_5_completely_correct_score_median: 0,
      occlusion_plus_5_completely_correct_score_q3: 0,

      occlusion_plus_2_completely_correct_score_q1: 0,
      occlusion_plus_2_completely_correct_score_median: 0,
      occlusion_plus_2_completely_correct_score_q3: 0,

      occlusion_none_completely_correct_score_q1: 0,
      occlusion_none_completely_correct_score_median: 0,
      occlusion_none_completely_correct_score_q3: 0,

      prs_q1: 0,
      prs_median: 0,
      prs_q3: 0,
    };


    let query = {
      time: {$gte: data.filter.dateStart},
      time: {$lte: data.filter.dateEnd},
      team: data.filter.team,
    },
    projection = {
      occlusion_plus_5_completely_correct_score: 1,
      occlusion_plus_2_completely_correct_score: 1,
      occlusion_none_completely_correct_score: 1,
      prs: 1
    };

    let rows = await db.collection(c).find(query).project(projection).toArray();

    let maps = {
      plus_5: rows.map(x=>x.occlusion_plus_5_completely_correct_score),
      plus_2: rows.map(x=>x.occlusion_plus_2_completely_correct_score),
      none: rows.map(x=>x.occlusion_none_completely_correct_score),
      prs: rows.map(x=>x.prs)
    };

    for (let scoreType in ['plus_5', 'plus_2', 'none', 'prs']) {
      let quarts = jStat.quartiles(maps[scoreType]);
      results['occlusion_plus_5_completely_correct_score_q1'] = quarts[0];
      results['occlusion_plus_5_completely_correct_score_q1'] = quarts[1];
      results['occlusion_plus_5_completely_correct_score_q1'] = quarts[2];
    }

    console.info(result);

  }
}

module.exports = Task;
