(function() {
  var app = angular.module('airhornPlayer', []);

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

  app.controller('PlayerController', ['$http',
    function($http) {
      var player = this;

      this.playing = false;
      this.current = null;
      this.queue = [];

      this.play = function() {
        this.playing = true;
      };

      this.pause = function() {
        this.playing = false;
      };

      this.play_now = function(track) {
        console.log('Play ' + track.name + '(' + track.uri + ') Now');

        this.current = track;
        this.play();
      };

      this.play_next = function(track) {
        console.log('Play ' + track.name + '(' + track.uri + ') Next');
        this.queue.unshift(track);
      };

      this.enqueue = function(track) {
        console.log('Enqueue ' + track.name + '(' + track.uri + ')');
        this.queue.push(track);
      };

      this.remove = function(n) {
        this.queue.splice(n, 1);
      };
    }
  ]);

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
        console.log(this.query);
        // $location.hash('/' + this.query);

        $http.get('/search?query=' + this.query).success(function(data) {
          console.log(data);
          controller.tracks = data;
        });
      };
    }
  ]);
})();
