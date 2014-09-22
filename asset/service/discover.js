
(function() {
  var app = angular.module('AirhornDiscovery', []);
  var servicePort = 9082;

  app.controller('DiscoveryController', ['$http', '$location',
  function($http, $location) {
    var controller = this;
    var socket = this.socket = io(serviceHost() + '/device');
    this.devices = {};

    socket.on('up', function(device) {
      console.log('DISCOVER Adding device ' + device.id);
      controller.devices[device.id] = device;
    });
    socket.on('down', function(device) {
      console.log('DISCOVER Removing device ' + device.id);
      delete controller.devices[device];
    });

    this.getDevices = function(callback) {
      $http.get(serviceHost() + '/device').success(function(devices) {
        console.log('DISCOVER Found ' + devices.length + ' devices');
        controller.devices = {};
        devices.forEach(function(device) {
          controller.devices[device.id] = device;
        });
      });
    };

    this.listDevices = function() {
      return Object.keys(this.devices).map(function(d) {
        return controller.devices[d];
      }).sort(function(a, b) {
        return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1;
      });
    };

    // Fetch device list on load
    this.getDevices();

    function serviceHost() {
      return $location.protocol() + '://' + $location.host() + ':' + servicePort;
    }
  }]);
})();
