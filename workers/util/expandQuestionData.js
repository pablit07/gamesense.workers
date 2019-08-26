var crypto = require("crypto");
var moment = require("moment");

function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        function(txt) {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        }
    );
}




async function expandQuestionData(data, result, db) {
// time

    if (data.timestamp) {
        result.time_answered_formatted = moment(data.timestamp).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
        result.time_answered = new Date(moment(data.timestamp).format());
    }
    result.time_video_started = new Date(moment(data.timestamp).subtract(data.spent_time, 'seconds').format());
    result.time_video_started_formatted = moment(result.time_video_started).utcOffset(-6).format('MMMM Do YYYY, h:mm:ss a');
    result.time_spent = data.spent_time;
    result.drill_date = result.time_video_started_formatted.split(",")[0];
    result.drill_date_raw = moment(result.drill_date, "MMMM Do YYYY").toDate();

    result.device = data.user_device || "Web Browser";
    result.os = data.user_platform_os || "Unknown";


    // player
    result.user_id = data.user_id;
    let player = await db.collection('users').findOne({id: data.user_id, app: data.app});

    if (player) {
        result.player_first_name = player.first_name;
        result.player_last_name = player.last_name;
        result.player_id = `${data.user_id} ${player.first_name} ${player.last_name}`;
        result.team_name = player.team;
    } else {
        console.log('******** Error player does not exist ' + data.user_id + data.app);
    }
    result.team_id = data.team_id;
    result.team = data.team;


    // read question

    result.id_question = crypto.createHash("md5").update(`${data.app}${(data.question_id || data.Question__id)}`).digest("hex");
    let pitchParts;
    if (data.Question__occluded_video__file || data.Question__occluded_video_file) {
        result.pitch = (data.Question__occluded_video__file || data.Question__occluded_video_file).replace(".mp4", "").replace("https://gamesense-videos.s3.amazonaws.com/", "");
        result.occlusion = ('R+' + result.pitch.substr(-1, 1)).replace(/R\+[abcdABCDO]/, 'None').replace('+R', '');
        result.player_batting_hand = data.Question__batter_hand_value;
        result.pitcher_hand = data.Question__occluded_video__pitcher_hand;
        result.pitch_count = data.Question__occluded_video__pitch_count;
        result.pitcher_code = data.Question__occluded_video__pitcher_name;
        pitchParts = new RegExp("^([0-9])+.*").exec(result.pitch.replace(result.pitcher_code + '-', ''));
        if (pitchParts) {
            result.pitch_number = pitchParts[1];
            result.pitcher_is_flipped = new RegExp("^[bd].*").test(result.pitch.replace(result.pitch_number).substr(0, 1));
        }
    }

    let titleParts;
    if (data.activity_value) {
        result.drill = data.activity_value;
        titleParts = new RegExp("([-A-Za-z\\s/.]+[A-Za-z]).*-\\s*([Ww]icked|[Aa]dvanced|[Bb]asic|[Ff]ull [Pp]itch)").exec(data.activity_value);
    }
    if (titleParts) {
        if (titleParts.length > 1) {
            result.pitcher_name = titleParts[1];
            result.pitcher_name = result.pitcher_name.replace(/([Ff]astball\w*|[Cc]urve\w*|[Cc]hange\w*|[Dd]rop\w*|[Ss]lide\w*|[Cc]ut\w*|[Rr]ise\w*|[Ss]crew\w*|[Kk]nuckle\w*|[Cc]ombo|[Ii]nside|[Oo]utside|[Pp]itch\w*|[Ss]wing|[Ll]ow|[Hh]igh|[Aa]way|[Dd]ecision|[Tt]ravel|[Yy]outh|[Hh]\.?[Ss]\.?|[-()/&.])/g, "").trim();
        }
        if (titleParts.length > 2) {
            result.difficulty = titleParts[2];
            result.difficulty = toTitleCase(result.difficulty);
        }
    }

    return result;
}

module.exports = expandQuestionData;