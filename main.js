'use strict';
let fs = require('fs');
let express = require('express');
let basicAuth = require('basic-auth');
let app = express();
let passwords = JSON.parse (
	fs.readFileSync (
		__dirname + '/passwords.json', {
			encoding: 'utf8',
		}
	)
);
app.use(function(req, res, next) {
	let user = basicAuth(req);
	function unauthorized() {
		if(user) {
			console.log("Authentication failure for user \"" + user.name + "\".");
		}
		res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
		res.sendStatus(401);
	}
	if(!user) {
		unauthorized();
		return;
	}
	let password = passwords[user.name];
	if(!password || user.pass !== password) {
		unauthorized();
		return;
	}
	req.userName = user.name;
	next();
});
{
	let port = process.env.PORT || 3000;
	app.listen(port);
	console.log('Listening on http://localhost:' + port + '.');
}
