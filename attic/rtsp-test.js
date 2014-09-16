var RTSP = require("./rtsp");

var client = new RTSP.Client(5000, "Living-Room-Apple-TV.local.");
client.on("socket", function() {
  console.log("Connected to " + this.hostname);
});
client.on("disconnected", function() {
  console.log("Disconnected");
});

client.options(function(res) {

});
