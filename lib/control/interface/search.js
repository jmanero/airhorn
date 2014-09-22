var Spotify = require('spotify-web-api-node');
var connection = new Spotify();

exports.attach = function(app) {
  app.get('/search', function(req, res, next) {
    if(!req.query.query) return res.json({});

    connection.searchTracks(req.query.query).then(function(data) {
      res.json(data.tracks.items);
    }, function(err) {
      next(err);
    });
  });
};
