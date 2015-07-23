'use strict';
let fs = require('fs');
let hbs = require('handlebars');
let express = require('express');
let basicAuth = require('basic-auth');
let bodyParser = (
	require('body-parser').urlencoded ({
		extended: true
	})
);
let bcrypt = require('bcrypt-nodejs');
let app = express();
let passwords = JSON.parse (
	fs.readFileSync (
		__dirname + '/passwords.json', {
			encoding: 'utf8',
		}
	)
);
hbs.registerPartial (
	'head', fs.readFileSync (
		__dirname + '/head.partial.hbs', {
			encoding: 'utf8',
		}
	)
);
let pageTemplate = hbs.compile (
	fs.readFileSync (
		__dirname + '/page-template.hbs', {
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
	let hash = passwords[user.name];
	if(!hash) {
		unauthorized();
		return;
	}
	bcrypt.compare(user.pass, hash, function(err, passwordCorrect) {
		if(err) {
			unauthorized();
			console.error(err);
			return;
		}
		if(!passwordCorrect) {
			unauthorized();
			return;
		}
		req.userName = user.name;
		next();
	});
});
app.use(bodyParser);
app.get('/', function(req, res) {
	res.redirect('/main');
});
app.use('/:name', function(req, res, next) {
	req.clipboardFilePath = (
		__dirname + '/' + req.userName + '-' + req.params.name +  '.clipboard'
	);
	next();
});
app.get('/:name', function(req, res) {
	res.send (
		pageTemplate ({
			clipboardData: fs.readFileSync (
				req.clipboardFilePath, {
					encoding: 'utf8',
				}
			)
		})
	);
});
app.post('/:name', function(req, res) {
	fs.writeFileSync(req.clipboardFilePath, req.body.clipboardData);
	res.redirect('/' + req.params.name);
});
{
	let port = process.env.PORT || 3000;
	app.listen(port);
	console.log('Listening on http://localhost:' + port + '.');
}
