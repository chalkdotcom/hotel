'use strict';

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

const cp = require('child_process');
const getPort = require('get-port');
const servers = require('./servers');
const getCmd = require('../get-cmd');

const signals = ['SIGINT', 'SIGTERM', 'SIGHUP'];

module.exports = {
  // For testing purpose, allows stubbing cp.spawnSync
  _spawnSync(...args) {
    cp.spawnSync(...args);
  },

  // For testing purpose, allows stubbing process.exit
  _exit(...args) {
    process.exit(...args);
  },

  spawn(cmd, opts = {}) {
    const cleanAndExit = (code = 0) => {
      servers.rm(opts);
      this._exit(code);
    };

    const startServer = port => {
      const serverAddress = `http://localhost:${port}`;

      process.env.PORT = port;
      servers.add(serverAddress, opts);

      signals.forEach(signal => process.on(signal, cleanAndExit));

      var _getCmd = getCmd(cmd),
          _getCmd2 = _toArray(_getCmd);

      const command = _getCmd2[0],
            args = _getCmd2.slice(1);

      var _spawnSync = this._spawnSync(command, args, {
        stdio: 'inherit',
        cwd: process.cwd()
      });

      const status = _spawnSync.status,
            error = _spawnSync.error;


      if (error) throw error;
      cleanAndExit(status);
    };

    if (opts.port) {
      startServer(opts.port);
    } else {
      getPort().then(startServer).catch(err => {
        throw err;
      });
    }
  }
};