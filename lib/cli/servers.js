'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var tildify = require('tildify');
var mkdirp = require('mkdirp');
var common = require('../common');

var serversDir = common.serversDir;

module.exports = {
  add: add,
  rm: rm,
  ls: ls
};

function isUrl(str) {
  return (/^(http|https):/.test(str)
  );
}

// Converts '_-Some Project_Name--' to 'some-project-name'
function domainify(str) {
  return str.toLowerCase()
  // Replace all _ and spaces with -
  .replace(/(_| )/g, '-')
  // Trim - characters
  .replace(/(^-*|-*$)/g, '');
}

function getId(cwd) {
  return domainify(path.basename(cwd));
}

function getServerFile(id) {
  return serversDir + '/' + id + '.json';
}

function add(param) {
  var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  mkdirp.sync(serversDir);

  var cwd = opts.dir || process.cwd();
  var id = opts.name ? domainify(opts.name) : getId(cwd);

  var file = getServerFile(id);

  var conf = {};

  if (opts.xfwd) {
    conf.xfwd = opts.xfwd;
  }

  if (opts.changeOrigin) {
    conf.changeOrigin = opts.changeOrigin;
  }

  if (opts.httpProxyEnv) {
    conf.httpProxyEnv = opts.httpProxyEnv;
  }

  if (isUrl(param)) {
    conf = _extends({
      target: param
    }, conf);
  } else {
    conf = _extends({
      cwd: cwd,
      cmd: param
    }, conf);

    if (opts.o) conf.out = opts.o;

    conf.env = {};

    // By default, save PATH env for version managers users
    conf.env.PATH = process.env.PATH;

    // Copy other env option
    if (opts.env) {
      opts.env.forEach(function (key) {
        var value = process.env[key];
        if (value) {
          conf.env[key] = value;
        }
      });
    }

    // Copy port option
    if (opts.port) {
      conf.env.PORT = opts.port;
    }
  }

  var data = JSON.stringify(conf, null, 2);

  console.log('Create ' + tildify(file));
  fs.writeFileSync(file, data);

  // if we're mapping a domain to a URL there's no additional info to output
  if (conf.target) return;

  // if we're mapping a domain to a local server add some info
  if (conf.out) {
    var logFile = tildify(path.resolve(conf.out));
    console.log('Output ' + logFile);
  } else {
    console.log("Output No log file specified (use '-o app.log')");
  }

  if (!opts.p) {
    console.log("Port Random port (use '-p 1337' to set a fixed port)");
  }
}

function rm() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var cwd = process.cwd();
  var id = opts.n || getId(cwd);
  var file = getServerFile(id);

  console.log('Remove  ' + tildify(file));
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log('Removed');
  } else {
    console.log('No such file');
  }
}

function ls() {
  mkdirp.sync(serversDir);

  var list = fs.readdirSync(serversDir).map(function (file) {
    var id = path.basename(file, '.json');
    var serverFile = getServerFile(id);
    var server = void 0;

    try {
      server = JSON.parse(fs.readFileSync(serverFile));
    } catch (error) {
      // Ignore mis-named or malformed files
      return;
    }

    if (server.cmd) {
      return id + '\n' + chalk.gray(tildify(server.cwd)) + '\n' + chalk.gray(server.cmd);
    } else {
      return id + '\n' + chalk.gray(server.target);
    }
  }).filter(function (item) {
    return item;
  }).join('\n\n');

  console.log(list);
}