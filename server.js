'use strict';

var app = require('./index');
var http = require('http');

var server;
var serverPort = process.env.OPENSHIFT_NODEJS_PORT || 8000;
var serverIP = process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';

/*
 * Create and start HTTP server.
 */

server = http.createServer(app);
server.listen(serverPort, serverIP);
server.on('listening', function() {
  console.log('Server listening on http://localhost:%d', this.address().port);
});
