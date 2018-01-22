'use strict';

var express = require('express');
var conf = require('../../conf');
var log = require('../log');

module.exports = function (group) {
  var router = express.Router();

  function pac(req, res) {
    log('Serve proxy.pac');
    if (conf.proxy) {
      res.render('proxy-pac-with-proxy', { conf: conf });
    } else {
      res.render('proxy-pac', { conf: conf });
    }
  }

  router.get('/proxy.pac', pac).get('/:id', group.exists.bind(group), group.start.bind(group), group.redirect.bind(group));

  return router;
};