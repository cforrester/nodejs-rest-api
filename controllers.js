// import url package
var url = require("url");

// load JSON data
var data = require("./data").data;

// load user input sanitization library
var inputSanitizer = require("./inputSanitizer").inputSanitizer;

// load authentication handlers
var Auth = require("./auth").auth;
auth = new Auth();

Array.prototype.find = function(obj) {
    return this.filter(function(item) {
        for (var prop in obj)
            if (!(prop in item) || obj[prop] !== item[prop])
                 return false;
        return obj;
    });
};

/*
* @function
* @name apiResponse
* @param res Object a data structure representing the server's response
* @param responseText Object information to be included in the response
* @desc returns the response from a route
*/
function apiResponse(res, responseText){
	res.writeHead(200, {
		'Content-Type': 'application/json'
	});
	res.write(JSON.stringify(responseText));
	res.end();
}

// the userController will be our container for user-related API routes
var userController = {};
/*
* @function
* @name login
* @param req Object a data structure representing the client's http request
* @param res Object a data structure representing the server's response
* @desc attempts to log the user in with the provided credentials, sets an encrypted clientAuthToken upon success
*/
userController.login = function(res, req){
	var reqObj = JSON.parse(req.body);
	var responseText = {};

	// hash password and do lookup
	auth.hashPassword(reqObj.username, reqObj.password,
		function(hashedPassword) {
				var user = {
					username: reqObj.username,
					password: hashedPassword
				};

				var result = data.users.find(user);
				if (result.length > 0){
					// user auth success, generate an encrypted client auth token
					var clientAuthToken = auth.generateClientAuthToken(result.id);
					// pass token back to client
					responseText.msg = "login successful";
					res.writeHead(200, {
						'Content-Type': 'application/json',
						'Set-Cookie': 'auth='+encodeURIComponent(clientAuthToken)+'; secure'
					});
				} else {
					// user auth failure
					responseText.msg = "login failed";
					res.writeHead(200, {
						'Content-Type': 'application/json',
						'Set-Cookie': 'auth=null; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure'
					});
				}
				res.write(JSON.stringify(responseText));
				res.end();

		});
};
/* 
* @name logout
* @param res Object a data structure representing the server's response
* @desc logs the user out, clearing their local ClientAuthToken
*/
userController.logout = function(res){
	var responseText = {};
	responseText.msg = "logout successful";
	res.writeHead(200, {
		'Content-Type': 'application/json',
		'Set-Cookie': 'auth=null; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure'
	});
	res.write(JSON.stringify(responseText));
    res.end();
};
var dataController = {};
/*
* @name items
* @param req Object a data structure representing the request
* @param res Object a data structure representing the server's response
* @desc lists the existing configuration items, sorted by field specified (if any)
*/
dataController.items = function(res,req){
	if (!auth.validateClientAuthToken(req)){
		auth.failedResponse(res);
	} else {
		var configurations = (typeof (data.configurations) == 'undefined') ? [] : data.configurations;
		// get the sort parameter from the querystring if one was included
		if (configurations.length > 0){
			var queryObj = url.parse(req.url, true).query;
			if (queryObj.sort !== void 0){
			var sort = queryObj.sort;
				if (typeof(configurations[0][sort]) == "string")
					configurations.sort(function(a,b) {return (a[sort] > b[sort]) ? 1 : ((b[sort] > a[sort]) ? -1 : 0);} );
				 else if (typeof(configurations[0][sort]) == "number")
					configurations.sort(function(a,b) {return a[sort] - b[sort];} );
			}
			// get any pagination parameters included
			if (queryObj.offset !== void 0 || queryObj.numItems !== void 0){
				var offset = parseInt(queryObj.offset) || 0;
				var numItems = parseInt(queryObj.numItems) || configurations.length;
				configurations = configurations.slice(offset,offset+numItems);
			}
		}
		var responseText = {
			configurations: configurations
		};
		apiResponse(res, responseText);
	}
};
/*
* @function
* @name addItem
* @param res Object a data structure representing the server's response
* @param req Object a data structure representing the client's http request
* @desc adds a configuration item
*/
dataController.addItem = function(res,req){
	if (!auth.validateClientAuthToken(req)){
		auth.failedResponse(res);
	} else {
		// sanitize the user input
		var reqObj = JSON.parse(inputSanitizer.clean(req.body));
		data.configurations.push(reqObj);
		var responseText = {
			msg: 'Configuration successfully added.',
			configurations: data.configurations
		};
		apiResponse(res, responseText);
	}
};
/*
* @function
* @name deleteItem
* @param res Object a data structure representing the server's response
* @param req Object a data structure representing the client's http request
* @desc deletes a configuration item
*/
dataController.deleteItem = function(res,req){
	if (!auth.validateClientAuthToken(req)){
		auth.failedResponse(res);
	} else {
		var deleteResultMsg;
		// parse the query string to find what we're deleting
		var queryObj = url.parse(req.url, true).query;
		// build an array based on the deleteBy parameter so we can get the index of the item selected for deletion
		var arrayMap = data.configurations.map(function(e) { return e[queryObj.deleteBy]; });
		// return an error if deleteBy is invalid
		if (arrayMap.length === 0){
			deleteResultMsg = 'Delete failed: '+queryObj.deleteBy+' is not a valid configuration field';

		} else {
			// return an error if no match was found in the selected field
			var pos = arrayMap.indexOf(queryObj.q);
			if (pos === -1){
				deleteResultMsg = 'Delete failed: no configuration with the '+queryObj.deleteBy+ +' '+queryObj.q+' was found';
			} else {
				data.configurations.splice(pos,1);
				deleteResultMsg = 'Configuration successfully deleted.';
			}
		}
		var responseText = {
			msg: deleteResultMsg,
			configurations: data.configurations
		};
		apiResponse(res, responseText);
	}
};

exports.dataController = dataController;
exports.userController = userController;
