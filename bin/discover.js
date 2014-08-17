var HTTP = require("http");
var MDNS = require("mdns");
var Redis = require("redis");
var SocketIO = require("socket.io");

var db = Redis.createClient();
var browser = MDNS.createBrowser(MDNS.tcp('raop'));
var server = HTTP.createServer();
var io = SocketIO(server).of("device");

browser.on('serviceUp', function(service) {
  console.log("DEVICE " + service.name + " UP");
  io.emit("up", service);
  db.set("DEVICE-" + service.name, JSON.stringify(service));
});

browser.on('serviceDown', function(service) {
  console.log("DEVICE " + service.name + " DOWN");
  io.emit("down", service);
  db.del("DEVICE-" + service.name);
});

db.on("ready", function() {
  browser.start();
  server.listen(9082);
});
