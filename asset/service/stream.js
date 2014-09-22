(function() {
  var app = angular.module('AirhornStream', []);
  var servicePort = 9081;

  app.controller('PlayerController', ['$http', '$location',
    function($http, $location) {
      var player = this;
      var socket = this.socket = io(serviceHost() + '/player');

      this.playing = false;
      this.current = null;
      this.queue = [];

      socket.on('tick', function() {

      });

      socket.on('play', function() {
        player.playing = true;
      });
      socket.on('pause', function() {
        player.playing = false;
      });

      this.play = function() {
        $http.put(serviceHost() + '/play');
      };

      this.pause = function() {
        $http.put(serviceHost() + '/pause');
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

      function serviceHost() {
        return $location.protocol() + '://' + $location.host() + ':' + servicePort;
      }
    }
  ]);

  app.controller('QueueController', ['$http', '$location',
    function($http, $location) {
      this.socket = io(serviceHost() + '/queue');

      function serviceHost() {
        return $location.protocol() + '://' + $location.host() + ':' + servicePort;
      }
    }
  ]);
})();
