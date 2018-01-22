'use strict';

var express = require('express');

var ServerRouter = require('./servers');
var EventRouter = require('./events');

module.exports = function (group) {
  var router = express.Router();

  var servers = ServerRouter(group);
  var events = EventRouter(group);

  router.use('/servers', servers);
  router.use('/events', events);

  return router;
};