var EventEmitter = require("events").EventEmitter;
var Net = require("net");
var QS = require("qs");
var Util = require("util");
var Writable = require("stream").Writable;

// CONSTANTS
var S_CRLF = "\r\n";
var CRLF = Buffer(S_CRLF, "ascii");
var EMPTY = Buffer(0);

var M_CRLF = /\r?\n/g;
var M_COLINSP = /^(.+): (.+)/;
var M_PROTOCOL = /^RTSP\/1\.0 (\d{3}) (\w+)/;

var R_PROTOCOL = Buffer(" RTSP/1.0", "ascii");
var R_METHODS = {
  OPTIONS: Buffer("OPTIONS ", "ascii"),
  DESCRIBE: Buffer("DESCRIBE ", "ascii"),
  ANNOUNCE: Buffer("ANNOUNCE ", "ascii"),
  SETUP: Buffer("SETUP ", "ascii"),
  PLAY: Buffer("PLAY ", "ascii"),
  PAUSE: Buffer("PAUSE ", "ascii"),
  TEARDOWN: Buffer("TEARDOWN ", "ascii"),
  GET_PARAMETER: Buffer("GET_PARAMETER ", "ascii"),
  SET_PARAMETER: Buffer("SET_PARAMETER ", "ascii"),
  REDIRECT: Buffer("REDIRECT ", "ascii"),
  RECORD: Buffer("RECORD ", "ascii"),
  GET: Buffer("GET ", "ascii"),
  POST: Buffer("POST ", "ascii")
};

/**
 * Construct the request packet, e.g.
 *   OPTIONS * RTSP/1.0\r\n
 *   content-length: 0\r\n
 *   ...
 *   \r\n
 *   <BODY>
 */
function BUILD_REQUEST(request) {
  var method = request.method;
  if (!R_METHODS[method] || !request._client.supported[method])
    throw TypeError("Method " + method + " is not supported");

  var headers = request.headers;
  var chunks = [
    R_METHODS[method],
    Buffer(request.path),
    R_PROTOCOL, CRLF
  ];

  Object.keys(headers).forEach(function(key) {
    var values = headers[key];
    if (!(values instanceof Array)) values = [values];

    values.forEach(function(value) {
      chunks.push(Buffer(key.toLowerCase() + ": " + value + S_CRLF));
    });
  });

  chunks.push(CRLF, request._body);
  return Buffer.concat(chunks);
}

/**
 * RTSP Client
 */
var Client = exports.Client = function(port, hostname) {
  EventEmitter.call(this);

  this.port = port;
  this.hostname = hostname;

  this.sequence = 0;
  this.session = null;
  this.connected = false;

  this.supported = {};

  this._requests = {};
  this._parser = new Parser(this);
};
Util.inherits(Client, EventEmitter);

/**
 * RTSP Request
 */
var Request = exports.Request = function(options, client) {
  options = options || {};
  EventEmitter.call(this);

  this._client = client;
  this.method = options.method || "OPTIONS";
  this.headers = {
    connection: "keep-laive"
  };
  this.path = "*";
};
Util.inherits(Request, EventEmitter);

/**
 * Form the request packet and send it
 */
Request.prototype.end = function() {
  var request = this;
  var client = this._client;
  var headers = this.headers;

  // Request body
  if (this.body instanceof Object) this._body = Buffer(QS.stringify(this.body));
  if (this.body instanceof String) this._body = Buffer(this.body);
  else if (this.body instanceof Buffer) this._body = this.body;
  else this._body = EMPTY;

  // Required headers
  client.sequence++;
  this.sequence = headers.cseq = client.sequence;
  headers.date = (new Date()).toUTCString();
  if (client.session) headers.session = client.session;

  if (this._body.length) {
    headers["content-length"] = this._body.length;
    if (!headers["content-type"]) headers["content-type"] = "application/sdp";
  }

  client.reconnect();

  var data = BUILD_REQUEST(this);
  client._socket.write(data, function() {
    client._requests[request.sequence] = request;
    request._timeout = setTimeout(function() {
      request.emit("timeout");
    }, 1000);
  });

  return this;
};

/**
 * RTSP Response
 */
var Response = exports.Response = function() {
  this.statusCode = 200;
  this.statusMessage = "OK";
  this.headers = {};
  this.length = 0;
  this.sequence = 0;
};

/**
 * RTSP Response Parser

RTSP/1.0 200 OK
Public: ANNOUNCE, SETUP, RECORD, PAUSE, FLUSH, TEARDOWN, OPTIONS, GET_PARAMETER, SET_PARAMETER, POST, GET
Server: AirTunes/200.54
CSeq: 0

 */
/* jshint -W086 */
var Parser = Client.Parser = function(client) {
  Writable.call(this);
  this.state = Parser.STATE.HEADERS;
};
Util.inherits(Parser, Writable);

Parser.STATE.HEADERS = "HEADERS";
Parser.STATE.BODY = "BODY";

Parser.prototype._write = function(chunk, encoding, callback) {
  switch (this.state) {
    case Parser.STATE.HEADERS:
      var schunk = chunk.toString("ascii");
      var response = new Response();

      // Read the Response line
      schunk.replace(M_PROTOCOL, function(_, code, message) {
        response.statusCode = code;
        response.statusMessage = message;
        return "";
      });
      var headers = res.headers;

      // Parse headers
      schunk.replace()
          if (headers[name] instanceof Array) headers[header_parts[1]].push(header_parts[2]);
          else if (headers[header_parts[1]]) headers[header_parts[1]] = [headers[header_parts[1]], header_parts[2]];
          else res.headers[header_parts[1]] = header_parts[2];
        }
      }

      if (!response.length) {
        this._return(response);
        return callback();
      }

      // Start reading the response body
      this.state = Parser.STATE.BODY;
    case Parser.STATE.BODY:
      // TODO better line reading instead of split
      response.body += "";
  }
};

Parser.prototype._return = function(response) {
  if (response.sequence && )
};

Client.prototype.reconnect = function() {
  if (this.connected) return;
  var client = this;
  var socket = this._socket = new Net.Socket();

  // Set up new socket
  socket.on("connect", function() {
    client.connected = true;
    client.emit("socket", this._socket);
  });
  socket.on("close", function() {
    client.connected = false;
    delete client._socket;
    client.emit("disconnect");
  });
  socket.pipe(this._parser);
  socket.connect(this.port, this.hostname);
};

Client.prototype.request = function(options, callback) {
  var request = new Request(options, this);
  if (callback) request.on("response", callback);

  return request;
};

Client.prototype.options = function(callback) {
  var client = this;
  var supported = {};

  return this.request({
    method: "OPTIONS"
  }, function(res) {
    if (res.headers.public) { // Parse the Public header into supported methods
      res.headers.public.split(/,\W?/g).forEach(function(method) {
        supported[method.toUpperCase()] = true;
      });
      client.supported = supported;
    }

    if (callback instanceof Function) callback(res);
  }).end();
};

Client.prototype.describe = function() {

};

Client.prototype.announce = function() {

};

Client.prototype.setup = function() {

};

Client.prototype.play = function() {

};

Client.prototype.pause = function() {

};

Client.prototype.teardown = function() {

};

Client.prototype.get = function() {

};

Client.prototype.set = function() {

};
