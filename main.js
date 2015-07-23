'use strict';
let fs = require('fs');
let hbs = require('handlebars');
let express = require('express');
let session = require('express-session');
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
let signInTemplate = hbs.compile (
	fs.readFileSync (
		__dirname + '/sign-in-template.hbs', {
			encoding: 'utf8',
		}
	)
);
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: process.env.SESSION_SECRET || function() {
		throw new Error("Missing session secret (SESSION_SECRET).");
	}(),
}));
app.use(bodyParser);
app.get('/', function(req, res) {
	res.redirect(
		(req.session.userName && '/main') || '/sign-in'
	);
});
app.get('/sign-in', function(req, res) {
	if(req.session.userName) {
		res.redirect('/');
		return;
	}
	res.send(signInTemplate());
});
{
	function unauthorized(res, userName, more) {
		more = more || {};
		if(userName) {
			console.log("Authentication failure for user \"" + userName + "\".");
		}
		if(more.redirect) {
			res.redirect('/');
		}
		else {
			res.status(401);
			res.send(signInTemplate({
				badCredentials: true,
			}));
		}
	}
	app.post('/sign-in', function(req, res) {
		let userName = req.body.userName;
		let password = req.body.password;
		let hash = passwords[userName];
		if(!hash) {
			unauthorized(res, userName);
			return;
		}
		bcrypt.compare(password, hash, function(err, passwordCorrect) {
			if(err) {
				unauthorized(res, userName);
				console.error('bcrypt.compare error:', err);
				return;
			}
			if(!passwordCorrect) {
				unauthorized(res, userName);
				return;
			}
			req.session.userName = userName;
			res.redirect('/');
		});
	});
	app.use(function(req, res, next) {
		if(!req.session.userName) {
			unauthorized (
				res, null, {
					redirect: true,
				}
			);
			return;
		}
		next();
	});
}
app.get('/sign-out', function(req, res) {
	delete req.session.userName;
	res.redirect('/');
});
app.use('/:name', function(req, res, next) {
	req.clipboardFilePath = (
		__dirname + '/' + req.session.userName
		+ '-' + req.params.name +  '.clipboard'
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
