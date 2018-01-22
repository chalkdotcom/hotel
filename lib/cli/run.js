'use strict';

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var cp = require('child_process');
var getPort = require('get-port');
var servers = require('./servers');
var getCmd = require('../get-cmd');

var signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

module.exports = {
  // For testing purpose, allows stubbing cp.spawnSync
  _spawnSync: function _spawnSync() {
    cp.spawnSync.apply(cp, arguments);
  },


  // For testing purpose, allows stubbing process.exit
  _exit: function _exit() {
    var _process;

    (_process = process).exit.apply(_process, arguments);
  },
  spawn: function spawn(cmd) {
    var _this = this;

    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var cleanAndExit = function cleanAndExit() {
      var code = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

      servers.rm(opts);
      _this._exit(code);
    };

    var startServer = function startServer(port) {
      var serverAddress = 'http://localhost:' + port;

      process.env.PORT = port;
      servers.add(serverAddress, opts);

      signals.forEach(function (signal) {
        return process.on(signal, cleanAndExit);
      });

      var _getCmd = getCmd(cmd),
          _getCmd2 = _toArray(_getCmd),
          command = _getCmd2[0],
          args = _getCmd2.slice(1);

      var _spawnSync2 = _this._spawnSync(command, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      }),
          status = _spawnSync2.status,
          error = _spawnSync2.error;

      if (error) throw error;
      cleanAndExit(status);
    };

    if (opts.port) {
      startServer(opts.port);
    } else {
      getPort().then(startServer).catch(function (err) {
        throw err;
      });
    }
  }
};