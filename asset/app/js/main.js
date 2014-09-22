(function() {
  var app = angular.module('airhornPlayer', ['AirhornStream', 'AirhornDiscovery']);

  app.filter('chop', function() {
    return function(input, length) {
      if(typeof input !== 'string' || input.length < length) return input;
      return input.slice(0, length) + ' ...';
    };
  });

  app.filter('duration', function() {
    return function(input) {
      if (isNaN(+input)) return input;

      var d = new Date(input);

      var seconds = d.getUTCSeconds();
      if (seconds < 10) seconds = '0' + seconds;
      var minutes = d.getUTCMinutes();

      var hours = d.getUTCHours();
      if (hours && minutes < 10) minutes = '0' + minutes;

      var output = minutes + ':' + seconds;
      if (hours) output = hours + ':' + output;

      return output;
    };
  });

  app.controller('SearchController', ['$http', '$location',
    function($http, $location) {
      var controller = this;

      this.query = '';
      this.tracks = [];

      // Dampen change events. Executes query after typing stops
      this._changeTimer = null;
      this.onChange = function() {
        clearTimeout(this._changeTimer);
        this._changeTimer = setTimeout(this.doSearch.bind(this), 500);
      };

      this.doSearch = function() {
        console.log('SEARCH Sending request for `' + this.query + '`');

        $http.get('/search?query=' + this.query).success(function(data) {
          console.log('SEARCH Received ' + data.length + ' results');
          controller.tracks = data;
        });
      };
    }
  ]);
})();
