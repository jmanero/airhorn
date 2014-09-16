
exports.attach = function(app) {
  app.get('/', function(req, res, next) {
    res.render('index.ejs');
  });
};
