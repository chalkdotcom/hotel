'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var startup = require('user-startup');
var common = require('../common');
var conf = require('../conf');
var uninstall = require('../scripts/uninstall');

module.exports = {
  start: start,
  stop: stop

  // Start daemon in background
};function start() {
  var node = process.execPath;
  var daemonFile = path.join(__dirname, '../daemon');
  var startupFile = startup.getFile('hotel');

  startup.create('hotel', node, [daemonFile], common.logFile);

  // Save startup file path in ~/.hotel
  // Will be used later by uninstall script
  mkdirp.sync(common.hotelDir);
  fs.writeFileSync(common.startupFile, startupFile);

  console.log('Started http://localhost:' + conf.port);
}

// Stop daemon
function stop() {
  startup.remove('hotel');
  // kills process and clean stuff in ~/.hotel
  uninstall();
  console.log('Stopped');
}