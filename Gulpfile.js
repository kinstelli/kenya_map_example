var gulp = require('gulp');
var nodemon = require('nodemon');
var projcleaner = require('./utils/projdata_cleaner');
var config = require('./config.json');

gulp.task('cleandata', function(){
	  var inputfile = config.datapath + config.uncleaned_geojson;
	  var outputfile = config.datapath + config.cleaned_geojson;
	  console.log(projcleaner(inputfile, outputfile));
});

gulp.task('run', function() {
    nodemon({
        script: 'server.js',
        watch: ["server.js", 'public/*', 'public/*/**'],
        ext: 'js'
    }).on('restart', () => {
    gulp.src('server.js')
      .pipe(notify('Running the server.'));
  });
});

gulp.task('default', ['cleandata', 'run']);
