'use strict';

var fs = require('fs');

var _require = require('../common'),
    startupFile = _require.startupFile,
    pidFile = _require.pidFile;

function killProcess() {
  if (!fs.existsSync(pidFile)) return;

  var pid = fs.readFileSync(pidFile, 'utf-8');
  try {
    process.kill(pid);
  } catch (err) {}

  fs.unlinkSync(pidFile);
}

function removeStartup() {
  if (!fs.existsSync(startupFile)) return;
  var startupFilePath = fs.readFileSync(startupFile, 'utf-8');
  fs.unlinkSync(startupFile);

  if (!fs.existsSync(startupFilePath)) return;
  fs.unlinkSync(startupFilePath);
}

module.exports = function () {
  killProcess();
  removeStartup();
};