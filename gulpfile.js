var fs = require('fs');
var gulp = require('gulp');

var buildPath = './build';

var combineCSSAndJS = function() {
	// css min
	var cssContent = fs.readFileSync('src/dialog.css', 'utf8')
		.replace(/\/\*.*\*\//g, '')
		.replace(/[\r\n\t]/g, '')
		.replace(/\s*\{\s*/g, '{')
		.replace(/\s*\}\s*/g, '}')
		.replace(/;\s*/g, ';')
		.replace(/:\s*/g, ':')
		.replace(/,\s*/g, ',');

	var jsContent = fs.readFileSync('src/dialog.js', 'utf8');

	jsContent += "\n\n$.dialog.insertStyleHelper('" + cssContent + "');";

	if(!fs.existsSync(buildPath)) {
		fs.mkdirSync(buildPath);
	}

	fs.writeFileSync(buildPath + '/dialog-all.js', jsContent);

	var date = new Date();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	hours = hours > 9 ? hours : '0' + hours;
	minutes = minutes > 9 ? minutes : '0' + minutes;
	seconds = seconds > 9 ? seconds : '0' + seconds;

	var timeStr = '[' + [hours, ':', minutes, ':', seconds].join('') + ']';

	console.log(timeStr + ' dialog css and js combine success!');
};

gulp.task('default', function() {
  gulp.watch(['src/dialog.css','src/dialog.js'], combineCSSAndJS);
});
