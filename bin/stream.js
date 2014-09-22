/**
 * AirHorn
 * Stream Service
 *
 * Use libspotify to fetch audio streams, crossfade tracks,
 * and push the output stream to AirPlay devices
 */

// Stream Modules
var AirTunes = require('airtunes');
var Mixer = require('../lib/stream/mixer');
var Path = require('path');
var Spotify = require('libspotify');

// API Modules
var BodyParser = require('body-parser');
var CORS = require('cors');
var Express = require('express');
var HTTP = require('http');
var Path = require('path');
var SocketIO = require('socket.io');
var Static = require('serve-static');

// Config
var Config = require('../config.js');

// Open a Spotify session
var session = this._session = new Spotify.Session({
  applicationKey: Path.resolve(__dirname, '../spotify_appkey.key')
});

// Set up Crossfade Controller
var mixer = new Mixer(session, {
  delay: 128 // Default Crossfade overlap
});
mixer.pipe(AirTunes);

// Shutdown controller
function shutdown(sig) {
  console.log('Recieved ' + sig + '. Shutting down.');
  process.once(sig, process.exit());
  console.log('Send ' + sig + ' again to force terminate');

  if (mixer._player) mixer._player.stop();
  session.logout();
  session.close();
}
process.on('SIGINT', shutdown.bind(null, 'SIGINT'));
process.on('SIGTERM', shutdown.bind(null, 'SIGTERM'));

// Create Control API
var app = Express();
var server = HTTP.createServer(app);
var io = SocketIO(server);

// API Middleware
app.use(CORS());
app.use(BodyParser.json());

app.set('io', io);
app.set('mixer', mixer);
app.set('session', session);

require('../lib/stream/interface/player').attach(app);
require('../lib/stream/interface/devices').attach(app);

session.once('login', function(err) {
  if (err) throw err;
  server.listen(9081);
});

// Login to Spotify
session.login(Config.username, Config.password);
