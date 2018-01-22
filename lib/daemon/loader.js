'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var chokidar = require('chokidar');
var log = require('./log');
var common = require('../common');

function getId(file) {
  return path.basename(file, '.json');
}

function handleAdd(group, file) {
  log(file + ' added');
  var id = getId(file);

  try {
    var conf = JSON.parse(fs.readFileSync(file, 'utf8'));
    group.add(id, conf);
  } catch (err) {
    log('Error: Failed to parse ' + file, err);
  }
}

function handleUnlink(group, file, cb) {
  log(file + ' unlinked');
  var id = getId(file);
  group.remove(id, cb);
}

function handleChange(group, file) {
  log(file + ' changed');
  handleUnlink(group, file, function () {
    handleAdd(group, file);
  });
}

module.exports = function (group) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : { watch: true };

  var dir = common.serversDir;

  // Ensure directory exists
  mkdirp.sync(dir);

  // Watch ~/.hotel/servers
  if (opts.watch) {
    log('Watching ' + dir);
    chokidar.watch(dir).on('add', function (file) {
      return handleAdd(group, file);
    }).on('change', function (file) {
      return handleChange(group, file);
    }).on('unlink', function (file) {
      return handleUnlink(group, file);
    });
  }

  // Bootstrap
  fs.readdirSync(dir).forEach(function (file) {
    handleAdd(group, path.resolve(dir, file));
  });
};