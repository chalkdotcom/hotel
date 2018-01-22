'use strict';

var os = require('os');
var unquote = require('unquote');

module.exports = function (cmd) {
  return os.platform() === 'win32' ? ['cmd', '/c'].concat(cmd.split(' ')) : ['sh', '-c'].concat(unquote(cmd));
};