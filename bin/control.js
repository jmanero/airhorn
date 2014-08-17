/**
 * Executable Root
 */
global.config = require("../config");
global.library = require("../lib");

var EJS = require("ejs");
var Express = require("express");
var HTTP = require("http");
var Mongoose = require("mongoose");
var Path = require("path");

// Middleware Modules
var BodyParser = require("body-parser");
// var Cache = library.mw("cache");
var Cookies = require("cookies");
var Favicon = require("serve-favicon");
var Morgan = require("morgan");
// var Session = library.mw("session");
var Static = require("serve-static");

// Database
// Mongoose.connect(config.server.database);
// Mongoose.connection.on("error", function(err) {
//   console.error("Database Error!");
//   console.error(err);
// });
// Mongoose.connection.on("open", function callback() {
//   console.log("Connected to " + config.server.database);
// });

// Web Server
var app = Express();
var server = HTTP.createServer(app);

// Expose helpers in templates
app.locals.Path = require("path");
app.locals.URL = require("url");

// Load Middleware
app.use(Morgan()); // Logging
app.use(Favicon(Path.resolve(__dirname, "../assets/favicon.ico")));
app.use("/assets", Static(Path.resolve(__dirname, "../assets")));
app.use(BodyParser.json());
app.use(Cookies.express());

// app.use(Session.manager());
// app.use(Session.enforcer());
// app.use(Cache.session({ debug : true }));
// app.use(Github.client());
// app.use(Github.user());

// Load Controllers

server.listen(config.server.port, function() {
  console.log("Listening on port " + config.server.port + " for HTTP requests");
});
