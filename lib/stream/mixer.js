var Readable = require("stream").Readable;
var Spotify = require("libspotify");
var Track = require("./track-buffer");
var Util = require("util");

function noop() {}

var Mixer = module.exports = function(session, options) {
  var mixer = this;
  Readable.call(this, {
    highWaterMark: 0
  });

  this.tracks = [];
  this.session = session;

  // Track Buffers
  this.a = new Track("A", this, options);
  this.b = new Track("B", this, options);

  // Player state
  this.delay = options.delay || 0;

  // States
  this._writeto = false;
  this._readfrom = true;
  this.playing = false;

  // Setup the session's play stream once it's logged in
  session.once("login", function(err) {
    if (err) return;
    var player = mixer._player = session.getPlayer();

    // Start buffering the next track
    player.on("track-end", function() {
      mixer._next();
    });
  });
};
Util.inherits(Mixer, Readable);

Mixer.prototype._read = function() {
  while (this.push(this.pull())) {}
};

Object.defineProperties(Mixer.prototype, {
  dest: {
    get: function() {
      return this._writeto ? this.a : this.b;
    }
  },
  source: {
    get: function() {
      return this._readfrom ? this.a : this.b;
    }
  },
  next: {
    get: function() {
      return this._readfrom ? this.b : this.a;
    }
  }
});

/**
 * Start loading the next track in the queue
 */
Mixer.prototype._next = function(callback) {
  callback = (callback instanceof Function) ? callback : noop;

  var mixer = this;
  var player = this._player;

  // Ramp down current track
  player.stop();
  player.unpipe(this.dest);

  // End of play queue. Don't try to load another track
  if (!this.tracks.length) return;

  // Start loading the next track
  var uri = this.tracks.shift();
  var track = Spotify.Track.getFromUrl(uri);
  track.once("ready", function() {
    player.load(track);

    // Switch writer buffer
    mixer._writeto = !mixer._writeto;

    // Pipe player to new buffer
    track.uri = uri;
    mixer.dest.track = track;
    player.pipe(mixer.dest);

    // Start streaming track to buffer
    player.play();
    callback(null, track);
  });
};

/**
 * Fetch the next playback frame
 */
Mixer.prototype.pull = function() {
  if (!this.playing) return Track.EMPTY; // Paused

  // Source Idle
  if (this.source.isIdle()) return Track.EMPTY; // Dead Air

  // Source Ending -> Empty
  if (this._crossfading && this.source.isEmpty()) {
    this.emit("crossfade-end");
    delete this._crossfading;
    delete this._xf_start;

    // Source Empty -> Idle
    this.source.pull();

    // Switch source
    this._readfrom = !this._readfrom;
    this.source.volume = 1;
  }

  // Source Playing
  if (this.source.isPlaying()) return this.source.pull();

  // Source Playing -> Ending, Next Ready -> Playing (Start Crossfade)
  if (!this._crossfading) {
    if (this.source.isEnding(this.delay) && this.next.isReady()) {
      this.source.stop();
      this.next.play(); // Next Ready -> Playing

      // Setup crossfading states
      this.emit("crossfade");
      this._xf_start = this.source.length;
      this._crossfading = true;
    }

    // Source Playing -> Ending (Draining to buffer.length === delay)
    // Or Source Ending -> Empty -> Idle if next track isn't queued
    return this.source.pull();
  } else {

    // Set Buffer Volumes
    this.source.volume = this.source.length / this._xf_start;
    this.next.volume = 1 - this.source.volume;

    // Skip the addition if there's nothing to mix
    if (this.next.isEmpty()) return this.source.pull();

    /**
     * TrackBuffers return fixed-length frames defined by `Track.FRAME` to
     * ensure XF alignment
     */
    var frame = this.source.pull();
    var overlay = this.next.pull();
    for (var i = 0; i < Track.FRAME; i += 2)
      frame.writeInt16LE(frame.readInt16LE(i) + overlay.readInt16LE(i), i);

    return frame;
  }
};

Mixer.prototype.play = function(play) {
  play = !!play;
  if (this.playing === play) return;
  this.playing = play;


  // Kick the track timer
  if (play) return this.source.play();

  // Or emit pause
  this.emit("pause");
};

/**
 * Jump to the specified time offset, in seconds
 */
Mixer.prototype.seek = function(position, callback) {
  callback = (callback instanceof Function) ? callback : noop;

  if (this._crossfading)
    return callback(Error("Cannot seek while tracks are crossfading"));
  if (this.source.track.duration < position)
    return callback(RangeError("Cannot seek past the end of the track"));

  this._player.seek(position);
  this.source.seek(position); // Dump the tracks buffer to make the seek immediate
  callback();
};

/**
 * Advance the play queue. Crossfade between the current
 * track and the next
 */
Mixer.prototype.track = function(callback) {
  callback = (callback instanceof Function) ? callback : noop;
  if (!this._player) return callback(Error("Session is not ready"));
  if (!this.tracks.length) return callback(RangeError("No tracks queued"));

  this._next(callback);
};

Mixer.prototype.toJSON = function() {
  return ({
    playing: this.playing,
    queue: this.tracks,
    current: this.source
  });
};
