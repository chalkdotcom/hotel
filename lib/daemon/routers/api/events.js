'use strict';

var express = require('express');
var connectSSE = require('connect-sse');
var sse = connectSSE();

function listen(res, group, groupEvent, handler) {
  function removeListener() {
    // Remove group handler
    group.removeListener(groupEvent, handler);

    // Remove self
    res.removeListener('close', removeListener);
    res.removeListener('finish', removeListener);
  }

  group.on(groupEvent, handler);

  res.on('close', removeListener);
  res.on('finish', removeListener);
}

module.exports = function (group) {
  var router = express.Router();

  router.get('/', sse, function (req, res) {
    // Handler
    function sendState() {
      res.json(group.list());
    }

    // Bootstrap
    sendState();

    // Listen
    listen(res, group, 'change', sendState);
  });

  router.get('/output', sse, function (req, res) {
    function sendOutput(id, data) {
      res.json({
        id: id,
        output: data.toString()
      });
    }

    // Bootstrap
    var list = group.list();
    Object.keys(list).forEach(function (id) {
      var mon = list[id];
      if (mon && mon.tail) {
        sendOutput(id, mon.tail);
      }
    });

    // Listen
    listen(res, group, 'output', sendOutput);
  });

  return router;
};