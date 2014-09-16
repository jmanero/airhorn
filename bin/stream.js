var AirTunes = require('airtunes');
var Interface = require('../lib/stream/interface');
var Mixer = require('../lib/stream/mixer');
var Path = require('path');
// var Speaker = require('speaker');
var Spotify = require('libspotify');

var username = '1216763447';
var password = '%APxc47v7+V8}h33W6m$CFVN(FXr.?Yc';

// Create an output device and mixer
// var speaker = new Speaker();

// 'spotify:track:2lfmRyTLtsTCkLwMQcFSQk',
// 'spotify:track:0s7PXyp4jKYGtMSiqTskiu',
// 'spotify:track:7hN5TKSdRb56uytwIpcUES',
// 'spotify:track:5U8hKxSaDXB8cVeLFQjvwx',
// 'spotify:track:4ImL3v98u2BLkwnyQDjfRm',
// 'spotify:track:0adTN3vBO3pimO3yfxm9vg',

// Create a Spotify session and instantiate its player
var session = this._session = new Spotify.Session({
  applicationKey: Path.resolve(__dirname, '../spotify_appkey.key')
});

// Track crossfade mixer
var mixer = new Mixer(session, {
  delay: 128 // Default Crossfade overlap
});
// mixer.pipe(speaker);
mixer.pipe(AirTunes);

// Shutdown controller
function shutdown(sig) {
  console.log('Recieved ' + sig + '. Shutting down.');
  process.once(sig, process.exit());
  console.log('Send ' + sig + ' again to force terminate');

  if (mixer._player) mixer._player.stop();
  session.logout();

  control.close();
  session.close();
}

process.on('SIGINT', shutdown.bind(null, 'SIGINT'));
process.on('SIGTERM', shutdown.bind(null, 'SIGTERM'));

// Create control interface
var interface = Interface.create(mixer);
session.once('login', function(err) {
  if (err) throw err;
  interface.listen(9081);
});

// Login to Spotify
session.login(username, password);
