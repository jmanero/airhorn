var Control = require("../lib/stream/control");
var Mixer = require("../lib/stream/mixer");
var Path = require("path");
var Speaker = require("speaker");
var Spotify = require("libspotify");

var username = "1216763447";
var password = "%APxc47v7+V8}h33W6m$CFVN(FXr.?Yc";

// Create an output device and mixer
var speaker = new Speaker();

// "spotify:track:2lfmRyTLtsTCkLwMQcFSQk",
// "spotify:track:0s7PXyp4jKYGtMSiqTskiu",
// "spotify:track:7hN5TKSdRb56uytwIpcUES",
// "spotify:track:5U8hKxSaDXB8cVeLFQjvwx",
// "spotify:track:4ImL3v98u2BLkwnyQDjfRm",
// "spotify:track:0adTN3vBO3pimO3yfxm9vg",

// Create a Spotify session and instantiate its player
var session = this._session = new Spotify.Session({
  applicationKey: Path.resolve(__dirname, "../spotify_appkey.key")
});

// Track crossfade mixer
var mixer = new Mixer(session, {
  delay: 128 // Default Crossfade overlap
});
mixer.pipe(speaker);

// Feedback data
mixer.on("ready", function(track) {
  console.log("Loading track " + track.title);
});
mixer.on("playing", function(track) {
  console.log("Starting track " + track.title + " (" + track.duration / 1000 + ")");
});
mixer.on("crossfade", function() {
  console.log("Crossfading tracks");
});
mixer.on("crossfade-end", function() {
  console.log("Finished Crossfade");
});
mixer.on("empty", function(name) {
  console.log("Track " + name + " empty");
});
mixer.on("idle", function(name) {
  console.log("Track " + name + " idle");
});
mixer.on("tick", function(time) {
  var d = new Date(time);
  console.log(d.getUTCMinutes() + ":" + d.getUTCSeconds());
});

// Shutdown controller
function shutdown(sig) {
  console.log("Recieved " + sig + ". Shutting down.");
  process.once(sig, process.exit());
  console.log("Send " + sig + " again to force terminate");

  if (mixer._player) mixer._player.stop();
  session.logout();

  control.close();
  session.close();
}

process.on("SIGINT", shutdown.bind(null, "SIGINT"));
process.on("SIGTERM", shutdown.bind(null, "SIGTERM"));

// Create control interface
var control = Control.create(mixer);
session.once("login", function(err) {
  if (err) throw err;
  control.listen(9081);
});

// Login to Spotify
session.login(username, password);
