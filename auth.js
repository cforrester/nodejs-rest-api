var auth = function () {
	/*
	* package imports
	* crypto: the native nodejs cryptography package, so we can store and use encrypted passwords - http://nodejs.org/api/crypto.html
	*/
	var crypto = require('crypto');

	// set cipher config
	var cipherOptions = {
		algorithm: 'aes-256-cbc',
		key: 'dfs9sdfsdfp9sdf9psdfp9dsfp9'
	};
	// generate an iv
	var m = crypto.createHash('md5');
	m.update(cipherOptions.key)
	cipherOptions.iv = m.digest('hex');
	/*
	* @function
	* @name hashPassword
	* @param username String
	* @param password String the password being hashed
	* @param callback function
	* @desc generates a salt and converts the password to its corresponding hash
	*/
	this.hashPassword = function(username, password, callback){
		// generate a salt based on the username
		var b = new Buffer(
			username + 'SO(GSDG{)dsgSU_D(gDG-0u)})'
			).toString('base64');
		var hash = {
			salt: b,
			iterations: 10000,
			keylen: 128
		};
		var hashedPassword;
		crypto.pbkdf2(password, hash.salt, hash.iterations, hash.keylen,
			function(err, key) {
				if (err)
					hashedPassword = null;
				else {
					hashedPassword = new Buffer( key, "binary" ).toString( "base64" );
				}
				callback(hashedPassword);
			});
	};

	/*
	* @function
	* @name generateClientAuthToken
	* @param clientId int the id of the client user
	* @param cipherOptions Object the cipher configuration used to encrypt the token
	* @return encryptedClientAuthToken String a base64-encoded client authorization token
	* @desc decodes and validates an encrypted client authorization token
	*/
	this.generateClientAuthToken = function(clientId){
		// set token expiration date (now + 7d)
		var d = new Date();
		d.setDate(d.getDate() + 7);
		var date = {
			y:d.getFullYear(),
			m:d.getMonth(),
			d:d.getDate(),
			h:d.getHours(),
			mn:d.getMinutes(),
			s:d.getSeconds()
		};
		// generate a cipher
		var cipher = crypto.createCipheriv(cipherOptions.algorithm
		, cipherOptions.key
		, cipherOptions.iv.slice(0,16));
		// generate client auth token
		var clientAuthToken = {
			tokenId: crypto.randomBytes(32), // a unique one-time id for this token
			clientId: clientId, // the client user id
			expDate: Date.UTC(date.y,date.m,date.d,date.h,date.mn,date.s)
		};
		// encrypt the client auth token using the cipher
		var encryptedClientAuthToken = cipher.update(JSON.stringify(clientAuthToken), 'utf8', 'base64') + cipher.final('base64');
		return encryptedClientAuthToken;
	};


	/*
	* @function
	* @name validateClientAuthToken
	* @param req Object the http request headers
	* @return Boolean the result of the validation
	* @desc decodes and validates an encrypted client authorization token
	*/
	this.validateClientAuthToken = function(req){
		var isAuthenticated = false;
		// check for and extract the encrypted clientAuthToken from the cookie
		var cookieObj = {};
		var cookie = req.headers.cookie;
		// make sure a cookie was included with this request
		if (typeof(cookie) != 'undefined'){
			// split the cookie into its separate values
			cookie && cookie.split(';').forEach(function( cookie ) {
				var c = cookie.split('=');
				cookieObj[c.shift().trim()] = unescape(c.join('='));
			});
			if (cookieObj.auth !== void 0){
				// found the clientAuthToken, attempt to decrypt it
				var clientAuthToken = decodeURIComponent(cookieObj.auth);
				// remove any url-friendly formatting from the token string
				clientAuthToken = clientAuthToken.replace(/\-/g, '+').replace(/_/g, '/');
				// create the decipher object
				var decipher = crypto.createDecipheriv(cipherOptions.algorithm
				, cipherOptions.key
				, cipherOptions.iv.slice(0,16));
				// wrapping this in a try/catch so that any attempt to pass a bad token can be captured and logged
				try{
					// run the decipher object on the encrypted token
					var decryptedClientAuthToken = decipher.update(clientAuthToken, 'base64', 'utf8') + decipher.final('utf8');
					// convert the decrypted token back into a JSON object
					var authObj = JSON.parse(decryptedClientAuthToken);
					// validate the token by checking that it has a valid expDate and that it is less than a week old
					var now = new Date().getTime();
					var valid = authObj.expDate - now > 0;
					return valid;
				} catch(ex){
					console.log(ex);
					return false;
				}
			}
		}
		return isAuthenticated;
	};
	/*
	* @function
	* @name failedResponse
	* @param res Object the http response
	* @desc generates a generic error response for when a client requests
	* an authentication-protected route without authentication
	*/
	this.failedResponse = function(res){
		console.log("Error: user is not authenticated.");
		res.writeHead(200, {
			'Content-Type': 'application/json'
		});
		var responseText = {
			error: 'authentication required'
		};
		res.write(JSON.stringify(responseText));
		res.end();
	};
};
exports.auth = auth;
