var gulp = require('gulp');
var exec = require('child_process').exec;

gulp.task('start', function(cb) {
	exec('node app.js', function (err, stdout, stderr) {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  })
});

gulp.task('watch', function () {
    gulp.watch(['workers/*.js', 'config.js'], ['start']);
});


gulp.task('default', ['start', 'watch']);