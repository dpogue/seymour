/**
 * Copyright 2015 Darryl Pogue
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var test    = require('tap').test;
var sinon   = require('sinon');
var Q       = require('q');
var path    = require('path');
var fs      = require('fs');

var seymour       = require('../src/seymour');
var cordova       = require('cordova-lib').cordova;
var ConfigParser  = require('cordova-common').ConfigParser;

process.env.PWD = __dirname;
process.chdir(__dirname);

sinon.stub(console, 'log');

test('version', function(t) {
    var version = require('../package.json').version;

    t.test('with --version', function(tt) {
        seymour(['node', 'seymour', '--version'], {});
        tt.ok(console.log.firstCall.args[0].match(version), 'prints version');
        tt.end();
    });

    t.test('with -v', function(tt) {
        seymour(['node', 'seymour', '-v'], {});
        tt.ok(console.log.firstCall.args[0].match(version), 'prints version');
        tt.end();
    });

    t.end();
});


var config_path = path.join(__dirname, 'config.xml');
var config = fs.readFileSync(path.join(__dirname, 'testconfig.xml'), 'utf8');

sinon.stub(cordova, 'findProjectRoot').returns(__dirname);
sinon.stub(cordova.raw.prepare, 'call').returns(Q(true));
sinon.stub(cordova.raw.compile, 'call').returns(Q(true));
sinon.stub(fs, 'readFileSync').withArgs(config_path).returns(config);

test('no parameters', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        browserify: true
    };

    return seymour([], {}).then(function(res) {
        t.ok(cordova.raw.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.raw.compile.call.called, 'calls compile');

        t.end();
    });
});


test('SEY_VERBOSE', function(t) {
    var opts = {
        platforms: [],
        options: {debug: true, device: true, verbose: true},
        verbose: true,
        silent: false,
        browserify: true
    };

    seymour([], {SEY_VERBOSE: true}).then(function() {
        t.ok(cordova.raw.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.raw.compile.call.called, 'calls compile');

        t.end();
    });
});


test('SEY_BUILD_PLATFORMS', function(t) {
    var opts = {
        platforms: ['windows', 'ios'],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        browserify: true
    };

    seymour([], {SEY_BUILD_PLATFORMS: "Windows,iOS"}).then(function() {
        t.ok(cordova.raw.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.raw.compile.call.called, 'calls compile');

        t.end();
    });
});

test('SEY_NOBROWSERIFY', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        browserify: false
    };

    return seymour([], {SEY_NOBROWSERIFY: true}).then(function(res) {
        t.ok(cordova.raw.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.raw.compile.call.called, 'calls compile');

        t.end();
    });
});


test('Preferences', function(t) {
    var setGlobalPref = sinon.spy(ConfigParser.prototype, 'setGlobalPreference');

    var opts = {
        platforms: [],
        options: {debug: true, device: true},
        verbose: false,
        silent: false,
        browserify: true
    };

    seymour([], {SEY_PREFERENCE_backgroundColor: 'FF000000'}).then(function() {
        t.ok(setGlobalPref.calledWith('backgroundColor', 'FF000000'), 'sets the preferences');

        t.ok(cordova.raw.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.raw.compile.call.called, 'calls compile');

        t.end();
    });
});
