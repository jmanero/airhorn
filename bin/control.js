var EJS = require('ejs');
var Express = require('express');
var HTTP = require('http');
var Path = require('path');
var SocketIO = require('socket.io');

// Middleware Modules
var BodyParser = require('body-parser');
// var Cookies = require('cookies');
var Favicon = require('serve-favicon');
var Morgan = require('morgan');
var Static = require('serve-static');

// Web Server
var app = Express();
var server = HTTP.createServer(app);

// Expose helpers in templates
app.locals.Path = require('path');
app.locals.URL = require('url');

app.set('views', Path.resolve(__dirname, '../view'));

// Load Middleware
app.use(Morgan()); // Logging
app.use(Favicon(Path.resolve(__dirname, '../asset/favicon.png')));
app.use('/asset', Static(Path.resolve(__dirname, '../asset/control')));
app.use(BodyParser.json());
app.use(BodyParser.urlencoded());
// app.use(Cookies.express());

require('../lib/control/interface/ui').attach(app);
require('../lib/control/interface/search').attach(app);

server.listen(8080, function() {
  console.log('Listening on port ' + 8080 + ' for HTTP requests');
});
