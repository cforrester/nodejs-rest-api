var fs = require('fs');
var http = require("http");

var testController = {};
testController.testPage = function(res,req){
	fs.readFile('./tests/test.html', function (err, data) {
	  if (err) throw err;
		res.writeHead(200, {
			'Content-Type': 'text/html',
			'Set-Cookie': 'auth=null; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
		});		
		res.write(data);
		res.end();
	});
};

exports.testController = testController;