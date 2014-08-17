var BodyParser = require("body-parser");
var Express = require("express");
var HTTP = require("http");
var SocketIO = require("socket.io");

exports.create = function(mixer) {
  var app = Express();
  var server = HTTP.createServer(app);
  var io = SocketIO(server);

  app.use(BodyParser.json());

  app.get("/queue", function(req, res, next) {
    res.json({
      length: mixer.tracks.length,
      playing: mixer.playing,
      paused: mixer.paused,
      tracks: mixer.tracks
    });
  });

  app.post("/queue", function(req, res, next) {
    mixer.queue(req.body, function(err) {
      if (err) return next(err);
      res.json({
        length: mixer.tracks.length,
        playing: mixer.playing
      });
    });
  });

  app.put("/play", function(req, res, next) {
    mixer.play(true);
    res.json({
      playing: mixer.playing
    });
  });

  app.put("/seek/:position", function(req, res, next) {
    mixer.seek(req.params.position * 1000, function(err) {
      if (err) return next(err);
      res.json({

      });
    });
  });

  app.put("/pause", function(req, res, next) {
    mixer.play(false);
    res.json({
      playing: mixer.playing
    });
  });

  app.post("/next", function(req, res, next) {
    mixer.track(function(err) {
      if (err) return next(err);
      res.json({
        queue: mixer.tracks.length,
        playing: mixer.playing
      });
    });
  });

  app.put("/delay", function(req, res, next) {
    res.json({
      delay: mixer.delay
    });
  });

  app.put("/delay/:value", function(req, res, next) {
    mixer.delay = req.params.delay;
    res.json({
      delay: mixer.delay
    });
  });

  return server;
};
