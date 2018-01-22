'use strict';

var net = require('net');
var log = require('./log');

module.exports = {
  proxy: proxy
};

function proxy(source, targetPort, targetHost) {
  var target = net.connect(targetPort);
  source.pipe(target).pipe(source);

  var handleError = function handleError(err) {
    log('TCP Proxy - Error', err);
    source.destroy();
    target.destroy();
  };

  source.on('error', handleError);
  target.on('error', handleError);

  source.write('HTTP/1.1 200 Connection Established\r\n' + 'Proxy-agent: Hotel\r\n' + '\r\n');

  return target;
}