'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var fs = require('fs');
var path = require('path');
var EventEmitter = require('events');
var url = require('url');
var once = require('once');
var getPort = require('get-port');
var matcher = require('matcher');
var respawn = require('respawn');
var afterAll = require('after-all');
var httpProxy = require('http-proxy');
var serverReady = require('server-ready');
var log = require('./log');
var tcpProxy = require('./tcp-proxy');
var daemonConf = require('../conf');
var getCmd = require('../get-cmd');

module.exports = function () {
  return new Group();
};

var Group = function (_EventEmitter) {
  _inherits(Group, _EventEmitter);

  function Group() {
    _classCallCheck(this, Group);

    var _this = _possibleConstructorReturn(this, (Group.__proto__ || Object.getPrototypeOf(Group)).call(this));

    _this._list = {};
    _this._proxy = httpProxy.createProxyServer({
      xfwd: true
    });
    _this._proxy.on('error', _this.handleProxyError);
    return _this;
  }

  _createClass(Group, [{
    key: '_output',
    value: function _output(id, data) {
      this.emit('output', id, data);
    }
  }, {
    key: '_log',
    value: function _log(mon, logFile, data) {
      mon.tail = mon.tail.concat(data).split('\n').slice(-100).join('\n');

      if (logFile) {
        fs.appendFile(logFile, data, function (err) {
          if (err) log(err.message);
        });
      }
    }
  }, {
    key: '_change',
    value: function _change() {
      this.emit('change', this._list);
    }

    //
    // Conf
    //

  }, {
    key: 'list',
    value: function list() {
      return this._list;
    }
  }, {
    key: 'find',
    value: function find(id) {
      return this._list[id];
    }
  }, {
    key: 'add',
    value: function add(id, conf) {
      var _this2 = this;

      if (conf.target) {
        log('Add target ' + id);
        this._list[id] = conf;
        this._change();
        return;
      }

      log('Add server ' + id);

      var HTTP_PROXY = 'http://127.0.0.1:' + daemonConf.port + '/proxy.pac';

      conf.env = _extends({}, process.env, conf.env);

      if (conf.httpProxyEnv) {
        conf.env = _extends({
          HTTP_PROXY: HTTP_PROXY,
          HTTPS_PROXY: HTTP_PROXY,
          http_proxy: HTTP_PROXY,
          https_proxy: HTTP_PROXY
        }, conf.env);
      }

      var logFile = void 0;
      if (conf.out) {
        logFile = path.resolve(conf.cwd, conf.out);
      }

      var command = getCmd(conf.cmd);

      var mon = respawn(command, _extends({}, conf, {
        maxRestarts: 0
      }));

      this._list[id] = mon;

      // Add proxy config
      mon.xfwd = conf.xfwd || false;
      mon.changeOrigin = conf.changeOrigin || false;

      // Emit output
      mon.on('stdout', function (data) {
        return _this2._output(id, data);
      });
      mon.on('stderr', function (data) {
        return _this2._output(id, data);
      });
      mon.on('warn', function (data) {
        return _this2._output(id, data);
      });

      // Emit change
      mon.on('start', function () {
        return _this2._change();
      });
      mon.on('stop', function () {
        return _this2._change();
      });
      mon.on('crash', function () {
        return _this2._change();
      });
      mon.on('sleep', function () {
        return _this2._change();
      });
      mon.on('exit', function () {
        return _this2._change();
      });

      // Log status
      mon.on('start', function () {
        return log(id, 'has started');
      });
      mon.on('stop', function () {
        return log(id, 'has stopped');
      });
      mon.on('crash', function () {
        return log(id, 'has crashed');
      });
      mon.on('sleep', function () {
        return log(id, 'is sleeping');
      });
      mon.on('exit', function () {
        return log(id, 'child process has exited');
      });

      // Handle logs
      mon.tail = '';

      mon.on('stdout', function (data) {
        return _this2._log(mon, logFile, data);
      });
      mon.on('stderr', function (data) {
        return _this2._log(mon, logFile, data);
      });
      mon.on('warn', function (data) {
        return _this2._log(mon, logFile, data);
      });

      mon.on('start', function () {
        mon.tail = '';

        if (logFile) {
          fs.unlink(logFile, function (err) {
            if (err) log(err.message);
          });
        }
      });

      this._change();
    }
  }, {
    key: 'remove',
    value: function remove(id, cb) {
      var item = this.find(id);
      if (item) {
        delete this._list[id];
        this._change();

        if (item.stop) {
          item.stop(cb);
          item.removeAllListeners();
          return;
        }
      }

      cb && cb();
    }
  }, {
    key: 'stopAll',
    value: function stopAll(cb) {
      var _this3 = this;

      var next = afterAll(cb);

      Object.keys(this._list).forEach(function (key) {
        if (_this3._list[key].stop) {
          _this3._list[key].stop(next());
        }
      });
    }
  }, {
    key: 'update',
    value: function update(id, conf) {
      var _this4 = this;

      this.remove(id, function () {
        return _this4.add(id, conf);
      });
    }

    //
    // Hostname resolver
    //

  }, {
    key: 'resolve',
    value: function resolve(str) {
      log('Resolve ' + str);
      var arr = Object.keys(this._list).sort().reverse().map(function (h) {
        return {
          host: h,
          isStrictMatch: matcher.isMatch(str, h),
          isWildcardMatch: matcher.isMatch(str, '*.' + h)
        };
      });

      var strictMatch = arr.find(function (h) {
        return h.isStrictMatch;
      });
      var wildcardMatch = arr.find(function (h) {
        return h.isWildcardMatch;
      });

      if (strictMatch) return strictMatch.host;
      if (wildcardMatch) return wildcardMatch.host;
    }

    //
    // Middlewares
    //

  }, {
    key: 'exists',
    value: function exists(req, res, next) {
      // Resolve using either hostname `app.tld`
      // or id param `http://localhost:2000/app`
      var tld = new RegExp('.' + daemonConf.tld + '$');
      var id = req.params.id ? this.resolve(req.params.id) : this.resolve(req.hostname.replace(tld, ''));

      // Find item
      var item = this.find(id);

      // Not found
      if (!id || !item) {
        var msg = 'Can\'t find server id: ' + id;
        log(msg);
        return res.status(404).send(msg);
      }

      req.hotel = {
        id: id,
        item: item
      };

      next();
    }
  }, {
    key: 'start',
    value: function start(req, res, next) {
      var item = req.hotel.item;


      if (item.start) {
        if (item.env.PORT) {
          item.start();
          next();
        } else {
          getPort().then(function (port) {
            item.env.PORT = port;
            item.start();
            next();
          }).catch(function (error) {
            next(error);
          });
        }
      } else {
        next();
      }
    }
  }, {
    key: 'stop',
    value: function stop(req, res, next) {
      var item = req.hotel.item;


      if (item.stop) {
        item.stop();
      }

      next();
    }
  }, {
    key: 'proxyWeb',
    value: function proxyWeb(req, res, target) {
      var _req$hotel$item = req.hotel.item,
          xfwd = _req$hotel$item.xfwd,
          changeOrigin = _req$hotel$item.changeOrigin;


      this._proxy.web(req, res, {
        target: target,
        xfwd: xfwd,
        changeOrigin: changeOrigin
      }, function (err) {
        log('Proxy - Error', err.message);
        var server = req.hotel.item;
        var view = server.start ? 'server-error' : 'target-error';
        res.status(502).render(view, {
          err: err,
          serverReady: serverReady,
          server: server
        });
      });
    }
  }, {
    key: 'proxy',
    value: function proxy(req, res) {
      var _this5 = this;

      var _ref = req.headers.host && req.headers.host.split(':'),
          _ref2 = _slicedToArray(_ref, 2),
          hostname = _ref2[0],
          port = _ref2[1];

      var item = req.hotel.item;

      // Handle case where port is set
      // http://app.localhost:5000 should proxy to http://localhost:5000

      if (port) {
        var target = 'http://127.0.0.1:' + port;

        log('Proxy - http://' + req.headers.host + ' \u2192 ' + target);
        return this.proxyWeb(req, res, target);
      }

      // Make sure to send only one response
      var send = once(function () {
        var target = item.target;


        log('Proxy - http://' + hostname + ' \u2192 ' + target);
        _this5.proxyWeb(req, res, target);
      });

      if (item.start) {
        // Set target
        item.target = 'http://localhost:' + item.env.PORT;

        // If server stops, no need to wait for timeout
        item.once('stop', send);

        // When PORT is open, proxy
        serverReady(item.env.PORT, send);
      } else {
        // Send immediatly if item is not a server started by a command
        send();
      }
    }
  }, {
    key: 'redirect',
    value: function redirect(req, res) {
      var id = req.params.id;
      var item = req.hotel.item;

      // Make sure to send only one response

      var send = once(function () {
        log('Redirect - ' + id + ' \u2192 ' + item.target);
        res.redirect(item.target);
      });

      if (item.start) {
        // Set target
        item.target = 'http://' + req.hostname + ':' + item.env.PORT;

        // If server stops, no need to wait for timeout
        item.once('stop', send);

        // When PORT is open, redirect
        serverReady(item.env.PORT, send);
      } else {
        // Send immediatly if item is not a server started by a command
        send();
      }
    }
  }, {
    key: 'parseHost',
    value: function parseHost(host) {
      var _host$split = host.split(':'),
          _host$split2 = _slicedToArray(_host$split, 2),
          hostname = _host$split2[0],
          port = _host$split2[1];

      var tld = new RegExp('.' + daemonConf.tld + '$');
      var id = this.resolve(hostname.replace(tld, ''));
      return { id: id, hostname: hostname, port: port };
    }

    // Needed to proxy WebSocket from CONNECT

  }, {
    key: 'handleUpgrade',
    value: function handleUpgrade(req, socket, head) {
      if (req.headers.host) {
        var host = req.headers.host;

        var _parseHost = this.parseHost(host),
            id = _parseHost.id,
            port = _parseHost.port;

        var item = this.find(id);

        if (item) {
          var target = void 0;
          if (port && port !== '80') {
            target = 'ws://127.0.0.1:' + port;
          } else if (item.start) {
            target = 'ws://127.0.0.1:' + item.env.PORT;
          } else {
            var _url$parse = url.parse(item.target),
                hostname = _url$parse.hostname,
                _port = _url$parse.port;

            var targetPort = _port || 80;
            target = 'ws://' + hostname + ':' + targetPort;
          }
          log('WebSocket - ' + host + ' \u2192 ' + target);
          this._proxy.ws(req, socket, head, { target: target }, function (err) {
            log('WebSocket - Error', err.message);
          });
        } else {
          log('WebSocket - No server matching ' + id);
        }
      } else {
        log('WebSocket - No host header found');
      }
    }

    // Handle CONNECT, used by WebSockets and https when accessing .localhost domains

  }, {
    key: 'handleConnect',
    value: function handleConnect(req, socket, head) {
      if (req.headers.host) {
        var host = req.headers.host;

        var _parseHost2 = this.parseHost(host),
            id = _parseHost2.id,
            hostname = _parseHost2.hostname,
            port = _parseHost2.port;

        // If https make socket go through https proxy on 2001
        // TODO find a way to detect https and wss without relying on port number


        if (port === '443') {
          return tcpProxy.proxy(socket, daemonConf.port + 1, hostname);
        }

        var item = this.find(id);

        if (item) {
          if (port && port !== '80') {
            log('Connect - ' + host + ' \u2192 ' + port);
            tcpProxy.proxy(socket, port);
          } else if (item.start) {
            var PORT = item.env.PORT;

            log('Connect - ' + host + ' \u2192 ' + PORT);
            tcpProxy.proxy(socket, PORT);
          } else {
            var _url$parse2 = url.parse(item.target),
                _hostname = _url$parse2.hostname,
                _port2 = _url$parse2.port;

            var targetPort = _port2 || 80;
            log('Connect - ' + host + ' \u2192 ' + _hostname + ':' + _port2);
            tcpProxy.proxy(socket, targetPort, _hostname);
          }
        } else {
          log('Connect - Can\'t find server for ' + id);
          socket.end();
        }
      } else {
        log('Connect - No host header found');
      }
    }
  }]);

  return Group;
}(EventEmitter);