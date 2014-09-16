var Util = require("util");
var Writable = require("stream").Writable;

// Add toJSON to SPTrack
require("libspotify").Track.prototype.toJSON = function() {
  return ({
    duration: this.duration,
    name: this.name,
    artists: this.artists,
    album: this.album,
    availability: this.availability,
    popularity: this.popularity,
    uri: this.uri
  });
};


var Track = module.exports = function(name, mixer, options) {
  options = options || {};
  Writable.call(this, {
    highWaterMark: 0
  });

  this.name = name;
  this.mixer = mixer;
  this.track = null;

  this.buffer = Buffer(0);
  this.time = 0;

  this.window = FRAME * (options.window || 256);
  this.volume = 1;

  // Track State
  this._loading = false;
  this._playing = false;

  // Drive loading state with pipe events
  this.on("pipe", function() {
    this._loading = true; // Idle -> Ready

    this.buffer = Buffer(0);
    this.time = 0;
    this.mixer.emit("ready", this.track);
  });
  this.on("unpipe", function() {
    this._loading = false; // Playing -> (Ending)
  });
};
Util.inherits(Track, Writable);

Object.defineProperties(Track.prototype, {
  length: {
    get: function() {
      return this.buffer.length / FRAME;
    }
  },
  position: {
    get: function() {
      return this.track.duration - this.time;
    }
  }
});

/**
 * Track States
 */
Track.prototype.isIdle = function() {
  return !this._loading && !this._playing;
};

Track.prototype.isReady = function() {
  return this._loading && !this._playing;
};

Track.prototype.isPlaying = function() {
  return this._loading && this._playing;
};

Track.prototype.isEnding = function(delay) {
  if (!delay) return false;
  return !this._loading && this._playing && this.length < delay;
};

Track.prototype.isEmpty = function() {
  return !this._loading && this._playing && this.buffer.length === 0;
};

/**
 * Start the track timer, set Playing state
 */
Track.prototype.play = function() {
  if (this.track) this.mixer.emit("play", this.track);

  if (this._playing) return;
  this._playing = true; // Ready -> Playing

  var track = this;
  this._timer = setInterval(function() {
    if (!track.mixer.playing) return; // Don't count while paused
    if (this.position < 0) return;

    track.time += 1000;
    track.mixer.emit("tick", track.position);
  }, 1000);
};

/**
 * Stop the track timer
 */
Track.prototype.stop = function() {
  clearInterval(this._timer);
  delete this._timer;
};

/**
 * Dump the buffer and set the timer position
 */
Track.prototype.seek = function(time) {
  this.buffer = Buffer(0);
  this.time = time;
};

// Zero-padding frames
function zeros(length) {
  var z = Buffer(length);
  z.fill(0);

  return z;
}
var FRAME = Track.FRAME = 8192;
var EMPTY = Track.EMPTY = zeros(FRAME);

Track.prototype._write = function(chunk, encoding, callback) {
  this.buffer = Buffer.concat([this.buffer, chunk]);
  // console.log("WRITE " + this.length());
  if (this.buffer.length < this.window) return callback();

  // Resume Hook for `pull`
  this._resume = function() {
    callback();
  };
};

Track.prototype.pull = function() {
  if (this.isEmpty()) { // Empty -> Idle
    this._playing = false;
    this.mixer.emit("idle", this.name);
  }
  if (this.buffer.length === 0) return EMPTY;

  // Chop a frame off of the buffer
  var frame = this.buffer.slice(0, FRAME);
  this.buffer = this.buffer.slice(FRAME);

  // Ending -> Empty
  if (this.isEnding(1)) {
    this.stop(); // Clear TICK timer
    this.mixer.emit("empty", this.name);
  }

  // LH Zero pad undersized frames
  if (frame.length < FRAME)
    frame = Buffer.concat([frame, zeros(FRAME - frame.length)]);

  // Apply volume scaling
  if (this.volume !== 1) {
    for (var i = 0; i < FRAME; i += 2)
      frame.writeInt16LE(Math.floor(frame.readInt16LE(i) * this.volume), i);
  }

  // Resume reading if paused
  if (this._resume instanceof Function && this.buffer.length < (this.window / 2)) {
    this._resume();
    delete this._resume;
  }

  return frame;
};

Track.prototype.toJSON = function() {

};
