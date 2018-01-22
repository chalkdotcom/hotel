'use strict';

var express = require('express');
var conf = require('../../conf');
var log = require('../log');

// *.tld vhost
module.exports = function (group) {
  var app = express.Router();
  var hotelRegExp = new RegExp('hotel.' + conf.tld + '$');

  app.use(function (req, res, next) {
    var hostname = req.hostname;

    // Skip hotel.tld

    if (hotelRegExp.test(hostname)) {
      log('hotel.' + conf.tld);
      return next();
    }

    // If hostname is resolved proxy request
    group.exists(req, res, function () {
      group.start(req, res, function () {
        group.proxy(req, res);
      });
    });
  });

  return app;
};