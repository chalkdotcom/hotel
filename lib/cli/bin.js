#!/usr/bin/env node
'use strict';

var pkg = require('../../package.json');
require('please-upgrade-node')(pkg);

var updateNotifier = require('update-notifier');
var sudoBlock = require('sudo-block');

sudoBlock('\nShould not be run as root, please retry without sudo.\n');
updateNotifier({ pkg: pkg }).notify();
require('./')(process.argv);