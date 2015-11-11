var fs = require('fs');
var gulp = require('gulp');

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

	var jsContent = fs.readFileSync("src/dialog.js", "utf8");

	jsContent += "\n\n$.dialog.insertStyleHelper('" + cssContent + "');";

	if(!fs.existsSync('./build')) {
		fs.mkdirSync('./build');
	}

	fs.writeFileSync('./build/dialog-all.js', jsContent);

	var date = new Date();

	var timeStr = ['[', date.getHours(), ':', date.getMinutes(), ':', date.getSeconds(), ']'].join('');

	console.log(timeStr + ' dialog css and js combine success!');
}

gulp.task('default', function() {
  	gulp.watch(['src/dialog.css','src/dialog.js'], function() {
  		combineCSSAndJS();
	});
});