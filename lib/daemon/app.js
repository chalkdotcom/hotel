'use strict';

var path = require('path');
var http = require('http');
var express = require('express');
var vhost = require('vhost');
var serverReady = require('server-ready');
var conf = require('../conf');

// Require routes
var IndexRouter = require('./routers');
var APIRouter = require('./routers/api');
var TLDHost = require('./vhosts/tld');

module.exports = function (group) {
  var app = express();
  var server = http.createServer(app);

  // Initialize routes
  var indexRouter = IndexRouter(group);
  var api = APIRouter(group);
  var tldHost = TLDHost(group);

  // requests timeout
  serverReady.timeout = conf.timeout;

  // Templates
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');
  app.locals.pretty = true;

  // API
  app.use('/_', api);

  // .tld host
  app.use(vhost(new RegExp('.*.' + conf.tld), tldHost));

  // app.get('/', (req, res) => res.render('index'))

  // Static files
  // vendors, etc...
  app.use(express.static(path.join(__dirname, 'public')));
  // front files
  app.use(express.static(path.join(__dirname, '../../dist')));

  // localhost router
  app.use(indexRouter);

  // Handle CONNECT, used by WebSockets and https when accessing .localhost domains
  server.on('connect', function (req, socket, head) {
    group.handleConnect(req, socket, head);
  });

  server.on('upgrade', function (req, socket, head) {
    group.handleUpgrade(req, socket, head);
  });

  return server;
};