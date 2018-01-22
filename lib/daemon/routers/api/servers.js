'use strict';

var express = require('express');

module.exports = function (group) {
  var router = express.Router();

  router.get('/', function (req, res) {
    res.json(group.list());
  });

  router.post('/:id/start', group.exists.bind(group), group.start.bind(group), function (req, res) {
    return res.end();
  });

  router.post('/:id/stop', group.exists.bind(group), group.stop.bind(group), function (req, res) {
    return res.end();
  });

  return router;
};