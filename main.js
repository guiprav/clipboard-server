'use strict';
let express = require('express');
let app = express();
{
	let port = process.env.PORT || 3000;
	app.listen(port);
	console.log('Listening on http://localhost:' + port + '.');
}
