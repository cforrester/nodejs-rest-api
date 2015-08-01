function route(apiRequest, pathname, res, req) {
  if (typeof apiRequest[pathname] === 'function'){
	try{
		apiRequest[pathname](res, req);
	} catch (ex) {
		console.log(ex);
	}
  } else {
	console.log("No request handler found for " + pathname);
    var responseText = {
		msg: '404 Not Found'
	};
	res.writeHead(404, {"Content-Type": "application/json"});
	res.write(JSON.stringify(responseText));
    res.end();
  }
}

exports.route = route;