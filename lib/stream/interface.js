var BodyParser = require("body-parser");
var Express = require("express");
var HTTP = require("http");
var SocketIO = require("socket.io");

function toArray(param) {
  if (param instanceof Array) return param;
  if (param === undefined) return [];
  return [param];
}

exports.create = function(mixer) {
  var app = Express();
  var server = HTTP.createServer(app);
  var io = SocketIO(server);

  // Event streams
  var player = io.of("/player");
  var queue = io.of("/queue");

  mixer.on("ready", function(track) {
    console.log("Ready");
    player.emit("ready", track);
  });
  mixer.on("play", function(track) {
    console.log("Play");
    player.emit("play", track);
  });
  mixer.on("pause", function() {
    console.log("Pause");
    player.emit("pause");
  });
  mixer.on("crossfade", function() {
    console.log("Crossfade");
    player.emit("crossfade");
  });
  mixer.on("crossfade-end", function() {
    player.emit("crossfade-end");
  });
  mixer.on("tick", function(time) {
    player.emit("tick", time);
  });

  // API Middleware
  app.use(BodyParser.json());

  /**
   * Get the current state of the mixer
   */
  app.get("/status", function(req, res, next) {
    res.json(mixer);
  });

  /**
   * Append tracks to the tail of the play queue
   */
  app.post("/queue/push", function(req, res, next) {
    var tracks = toArray(req.body);
    Array.prototype.push.apply(mixer.tracks, tracks);

    queue.emit("push", tracks);
    res.json(mixer);
  });


  /**
   * Resume playback
   */
  app.put("/play", function(req, res, next) {
    mixer.play(true);
    res.json(mixer);
  });

  /**
   * Move the libspotify stream to a new position and
   * dump the track's buffer to speed up the transition
   */
  app.put("/seek/:position", function(req, res, next) {
    if (isNaN(+(req.params.position)))
      return next(TypeError("Position must be a valid number"));

    mixer.seek(Math.floor(req.params.position) * 1000, function(err) {
      if (err) return next(err);
      res.json(mixer);
    });
  });

  /**
   * Halt playback
   */
  app.put("/pause", function(req, res, next) {
    mixer.play(false);
    res.json(mixer);
  });

  /**
   * Advance the player to the next queued track
   */
  app.post("/next", function(req, res, next) {
    mixer.track(function(err) {
      if (err) return next(err);
      res.json(mixer);
    });
  });

  /**
   * Set the crossfade delay
   */
  app.put("/delay/:value", function(req, res, next) {
    if (isNaN(+(req.params.delay)))
      return next(TypeError("Delay must be a valid number"));

    mixer.delay = Math.floor(req.params.delay);
    res.json(mixer);
  });

  return server;
};
