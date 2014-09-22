var CORS = require('cors');
var Express = require('express');
var HTTP = require('http');
var MDNS = require('mdns');
var Path = require('path');
var Redis = require('redis');
var SocketIO = require('socket.io');
var Static = require('serve-static');

var db = Redis.createClient();

/**
 * Service Interface
 */
var app = Express();
var server = HTTP.createServer(app);
var io = SocketIO(server).of('/device');

app.use(CORS());

app.get('/device', function(req, res, next) {
  db.keys('DEVICE::*', function(err, keys) {
    if (err) return next(err);

    db.mget(keys, function(err, devices) {
      if (err) return next(err);
      res.json(devices.map(JSON.parse));
    });
  });
});

app.get('/device/:id', function(req, res, next) {
  db.get('DEVICE::' + req.params.id, function(err, device) {
    if (err) return next(err);
    if (!device) return res.status(404).end();
    res.type('application/json').send(device);
  });
});

/**
 * MDNS browser events
 */
var browser = MDNS.createBrowser(MDNS.tcp('raop'));
browser.on('serviceUp', function(device) {
  device = deviceMap(device);

  io.emit('up', device);
  db.set('DEVICE::' + device.id, JSON.stringify(device, null, 2));
  console.log('Adding device ' + device.id);
});

browser.on('serviceDown', function(device) {
  io.emit('down', device.name);
  db.del('DEVICE::' + device.name);
  console.log('Removing device ' + device.name);
});

var M_KEY = /^DEVICE::(.*)$/;
function keyMap(key) {
  var parts = key.match(M_KEY);

  if(!parts) return null;
  return parts[1];
}

function deviceMap(device) {
  return ({
    id: device.name,
    name: device.name.split('@')[1],
    host: device.host,
    port: device.port,
    model: device.txtRecord.am,
    fqdn: device.fullname,
    addresses: device.addresses
  });
}

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
