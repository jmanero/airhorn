var Express = require('express');
var HTTP = require('http');
var MDNS = require('mdns');
var Path = require('path');
var Redis = require('redis');
var SocketIO = require('socket.io');
var Static = require('serve-static');

var app = Express();
var browser = MDNS.createBrowser(MDNS.tcp('raop'));
var db = Redis.createClient();
var server = HTTP.createServer(app);
var io = SocketIO(server).of('device');

var M_KEY = /^DEVICE::(.*)$/;
function keyMap(key) {
  var parts = key.match(M_KEY);

  if(!parts) return null;
  return parts[1];
}

function deviceMap(device) {
  return ({
    name: device.name,
    host: device.host,
    port: device.port,
    model: device.txtRecord.am,
    fqdn: device.fullname,
    addresses: device.addresses
  });
}

app.get('/device', function(req, res, next) {
  db.keys('DEVICE::*', function(err, keys) {
    if (err) return next(err);
    res.json(keys.map(keyMap));
  });
});

app.get('/device/:id', function(req, res, next) {
  db.get('DEVICE::' + req.params.id, function(err, device) {
    if (err) return next(err);
    if (!device) return res.status(404).end();
    res.type('application/json').send(device);
  });
});

// MDNS browser events
browser.on('serviceUp', function(device) {
  io.emit('up', device);
  db.set('DEVICE::' + device.name, JSON.stringify(deviceMap(device), null, 2));
});

browser.on('serviceDown', function(device) {
  io.emit('down', device);
  db.del('DEVICE::' + device.name);
});

// Startup
db.on('ready', function() {
  // Dump old records before starting the browser
  db.keys('DEVICE::*', function(err, keys) {
    if (err) throw err;

    if (!keys || !keys.length) return browser.start();
    db.del(keys, function(err) {
      if (err) throw err;
      browser.start();
    });

  });

  server.listen(9082);
});
