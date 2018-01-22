'use strict';

var path = require('path');
var homedir = require('os').homedir();

var hotelDir = path.join(homedir, '.hotel');

module.exports = {
  hotelDir: hotelDir,
  confFile: path.join(hotelDir, 'conf.json'),
  serversDir: path.join(hotelDir, 'servers'),
  pidFile: path.join(hotelDir, 'daemon.pid'),
  logFile: path.join(hotelDir, 'daemon.log'),
  startupFile: path.join(hotelDir, 'startup')
};