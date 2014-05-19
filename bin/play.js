var Lame = require("lame");
var Speaker = require("speaker");
var Spotify = require("spotify-web");
var Util = require("util");

// Spotify credentials...
var uri = process.argv[2] || "spotify:track:36mCPzCbnDVSfvh5KHGutc";
var username = process.env.USERNAME;
var password = process.env.PASSWORD;

Spotify.login(username, password, function (err, spotify) {
  if (err) throw err;

  // first get a "Track" instance from the track URI
  spotify.get(uri, function (err, track) {
    if (err) throw err;
    console.log("Playing: %s - %s", track.artist[0].name, track.name);
    console.log(Util.inspect(track));

    // play() returns a readable stream of MP3 audio data
    track.play()
      .pipe(new Lame.Decoder())
      .pipe(new Speaker())
      .on("finish", function () {
        spotify.disconnect();
      });

  });
});
