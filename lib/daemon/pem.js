'use strict';

var fs = require('fs');
var path = require('path');
var tildify = require('tildify');
var selfsigned = require('selfsigned');
var log = require('./log');

var _require = require('../common'),
    hotelDir = _require.hotelDir;

var KEY_FILE = path.join(hotelDir, 'key.pem');
var CERT_FILE = path.join(hotelDir, 'cert.pem');

function generate() {
  if (fs.existsSync(KEY_FILE) && fs.existsSync(CERT_FILE)) {
    log('Reading self-signed certificate in ' + tildify(hotelDir));
    return {
      key: fs.readFileSync(KEY_FILE, 'utf-8'),
      cert: fs.readFileSync(CERT_FILE, 'utf-8')
    };
  } else {
    log('Generating self-signed certificate in ' + tildify(hotelDir));
    var pems = selfsigned.generate([{ name: 'commonName', value: 'hotel' }], {
      days: 365
    });
    fs.writeFileSync(KEY_FILE, pems.private, 'utf-8');
    fs.writeFileSync(CERT_FILE, pems.cert, 'utf-8');

    return { key: pems.private, cert: pems.cert };
  }
}

module.exports = {
  KEY_FILE: KEY_FILE,
  CERT_FILE: CERT_FILE,
  generate: generate
};