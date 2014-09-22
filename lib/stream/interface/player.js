function toArray(param) {
  if (param instanceof Array) return param;
  if (param === undefined) return [];
  return [param];
}

exports.attach = function(app) {
  var mixer = app.get('mixer');
  var socket = app.get('io').of('/player');

  mixer.on('ready', function(track) {
    console.log('Ready');
    socket.emit('ready', track);
  });
  mixer.on('play', function(track) {
    console.log('Play');
    socket.emit('play', track);
  });
  mixer.on('pause', function() {
    console.log('Pause');
    socket.emit('pause');
  });
  mixer.on('crossfade', function() {
    console.log('Crossfade');
    socket.emit('crossfade');
  });
  mixer.on('crossfade-end', function() {
    socket.emit('crossfade-end');
  });
  mixer.on('tick', function(time) {
    socket.emit('tick', time);
  });

  /**
   * Get the current state of the mixer
   */
  app.get('/status', function(req, res, next) {
    res.json(mixer);
  });

  /**
   * Append tracks to the tail of the play queue
   */
  app.post('/queue', function(req, res, next) {
    var tracks = toArray(req.body);
    Array.prototype.push.apply(mixer.tracks, tracks);

    socket.emit('queue', mixer.tracks);
    res.json(mixer);
  });

  /**
   * Add a track to the middle of the queue
   */
  app.post('/queue/:position', function(req, res, next) {
    var tracks = toArray(req.body);
    tracks.unshift(req.params.position, 0);
    Array.prototype.splice.apply(mixer.tracks, tracks);

    socket.emit('queue', mixer.tracks);
    res.json(mixer);
  });

  /**
   * Remove a track from the queue
   */
  app.delete('/queue/:position', function(req, res, next) {
    mixer.tracks.splice(req.params.position, 1);

    socket.emit('queue', mixer.tracks);
    res.json(mixer);
  });

  /**
   * Resume playback
   */
  app.put('/play', function(req, res, next) {
    mixer.play(true);
    res.json(mixer);
  });

  /**
   * Move the libspotify stream to a new position and
   * dump the track's buffer to speed up the transition
   */
  app.put('/seek/:position', function(req, res, next) {
    if (isNaN(+(req.params.position)))
      return next(TypeError('Position must be a valid number'));

    mixer.seek(Math.floor(req.params.position) * 1000, function(err) {
      if (err) return next(err);
      res.json(mixer);
    });
  });

  /**
   * Halt playback
   */
  app.put('/pause', function(req, res, next) {
    mixer.play(false);
    res.json(mixer);
  });

  /**
   * Advance the player to the next queued track
   */
  app.post('/next', function(req, res, next) {
    mixer.track(function(err) {
      if (err) return next(err);
      res.json(mixer);
    });
  });

  /**
   * Set the crossfade delay
   */
  app.put('/delay/:value', function(req, res, next) {
    if (isNaN(+(req.params.delay)))
      return next(TypeError('Delay must be a valid number'));

    mixer.delay = Math.floor(req.params.delay);
    res.json(mixer);
  });
};
