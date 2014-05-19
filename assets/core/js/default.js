/**
 * Library "Modules"
 */

/* jshint -W057 */
/* jshint -W058 */

window.UI = (function() {
  // this.paginater = function(total, current, range) {
  //   current = current || 0;
  //   range = range || 10;
  //
  //   var html = "<ul class="pagination">";
  //   html += "<li><a href="#">&laquo;</a></li>"
  //
  //   html += "</ul>";
  //   return $(html);
  // };
})();

window.Request = new(function Request() {
  this.partial = function(path, target, callback) {
    if (target.attr("data-fetched") === "yes") return;

    request({
      method: "GET",
      url: "/partial/" + path
    }, function(err, res, body) {
      if (err) return callback(err);

      target.attr("data-fetched", "yes");
      callback(null, target.html(body));
    });
  };
});
