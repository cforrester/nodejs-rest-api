/* 
* import the native nodejs modules used by the server
* https: used to create a secure http server - http://nodejs.org/api/https.html
* fs: basic filesystem wrapper - http://nodejs.org/api/fs.html
* url: URL resolution and parsing for routes - http://nodejs.org/api/url.html
* path: utilities for transforming file paths - http://nodejs.org/api/path.html
*/
var https = require("https");
var fs = require('fs');
var url = require("url");
var path = require('path');
 
var mimeTypes = {
'.js': 'text/javascript',
'.html': 'text/html'
};
// read in the cert and private key files so we can use SSL
var options = {
  key: fs.readFileSync('fixtures/keys/privateKey.pem'),
  cert: fs.readFileSync('fixtures/keys/certificate.pem')
};

// set the external port
var listenPort = 1771;
/* 
* @function
* @name start
* @param route String the route speicified by the current http request
* @param apiRequest Object the collection of request handlers that make up the API
* @desc starts the nodejs server and opens a port to listen for http requests
*/
function start(route, apiRequest) {
/* 
* @function
* @name onApiRequest
* @param req Object a data structure representing the client's http request
* @param res Object a data structure representing the server's response
* @desc event handler for incoming http requests
*/
  function onApiRequest(req, res) {

		var reqBody = "";
		// parse the pathname from the request url
		var pathname = url.parse(req.url).pathname;
		console.log(req.method + " " + pathname + " HTTP/" + req.httpVersion);
		// if a static file is requested, serve it; don't send the request to the API
		var f = __dirname + '/static/' + pathname;
		fs.exists(f, function (exists) {
		// only allow the file types specified in the mimeTypes object to be served directly
		if (exists && mimeTypes[path.extname(pathname)]) {
			fs.readFile(f, function (err, data) {
				if (err) {
					res.writeHead(500);
					res.end('An internal server error occurred while trying to process this request.'); 
					return;
				}
				var headers = {
					'Content-type': mimeTypes[path.extname(pathname)]
				};
				res.writeHead(200, headers);
				res.end(data);
			});
		}
		else {		
			// if this is a POST request we need to extract the data from the request body
			req.setEncoding("utf8");
			req.addListener("data", function(data) {
				req.body = data;
			});	
			// route the request, along with any data that was included
			req.addListener("end", function() {
				route(apiRequest, pathname, res, req);
			});		
		}
	  });
  }
  // begin running the server and listening for requests
  https.createServer(options, onApiRequest).listen(listenPort);
  console.log("secure API listening on port "+listenPort+".");
}
// store the server's start() method so index.js can include it
exports.start = start;