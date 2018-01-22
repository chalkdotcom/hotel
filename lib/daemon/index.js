'use strict';

var exitHook = require('exit-hook');
var httpProxy = require('http-proxy');
var conf = require('../conf');
var pidFile = require('../pid-file');
var pem = require('./pem');
var log = require('./log');
var Group = require('./group');
var Loader = require('./loader');
var App = require('./app');

var group = Group();
var app = App(group);

// Load and watch files
Loader(group);

// Create pid file
pidFile.create();

// Clean exit
exitHook(function () {
  console.log('Exiting');
  console.log('Stop daemon');
  proxy.close();
  app.close();
  group.stopAll();

  console.log('Remove pid file');
  pidFile.remove();
});

// HTTPS proxy
var proxy = httpProxy.createServer({
  target: {
    host: '127.0.0.1',
    port: conf.port
  },
  ssl: pem.generate(),
  ws: true,
  xfwd: true
});

// Start HTTPS proxy and HTTP server
proxy.listen(conf.port + 1);

app.listen(conf.port, conf.host, function () {
  log('Server listening on port ' + conf.host + ':' + conf.port);
});