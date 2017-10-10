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
var path    = require('path');
var fs      = require('fs');

var seymour       = require('../src/seymour');
var cordova       = require('cordova-lib').cordova;
var ConfigParser  = require('cordova-common').ConfigParser;

process.env.PWD = __dirname;
process.chdir(__dirname);

test('version', function(t) {
    var version = require('../package.json').version;

    var stub = sinon.stub(console, 'log');

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

    stub.restore();
});


test('bad project', function(t) {
    var stub = sinon.stub(cordova, 'findProjectRoot').returns(null);

    t.throws(function() { seymour([], {}); }, 'throws a CordovaError');

    t.end();

    stub.restore();
});


var config_path = path.join(__dirname, 'config.xml');
var config = fs.readFileSync(path.join(__dirname, 'testconfig.xml'), 'utf8');

var prepareStub = sinon.stub(cordova.prepare, 'call').resolves(true);
var compileStub = sinon.stub(cordova.compile, 'call').resolves(true);

sinon.stub(cordova, 'findProjectRoot').returns(__dirname);
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
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

        t.end();
    });
});


test('failing build', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        browserify: true
    };

    t.test('prepare', function(t2) {
        prepareStub.restore();
        var stub = sinon.stub(cordova.prepare, 'call').rejects();

        return seymour([], {}).then(function() {
            t2.notOk(true, 'resolves');
        })
        .catch(function() {
            t2.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        })
        .then(function() {
            stub.restore();
            prepareStub = sinon.stub(cordova.prepare, 'call').resolves(true);

            t2.end();
        });
    });

    t.test('compile', function(t2) {
        compileStub.restore();
        var stub = sinon.stub(cordova.compile, 'call').rejects();

        return seymour([], {}).then(function() {
            t2.notOk(true, 'resolves');
        })
        .catch(function() {
            t2.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
            t2.ok(cordova.compile.call.called, 'calls compile');
        })
        .then(function() {
            stub.restore();
            compileStub = sinon.stub(cordova.compile, 'call').resolves(true);

            t2.end();
        });
    });

    t.end();
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
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

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
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

        t.end();
    });
});


test('SEY_BUILD_MODE', function(t) {
    var debug_opts = {
        platforms: [],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        browserify: true
    };

    var release_opts = {
        platforms: [],
        options: {device: true, release: true},
        verbose: false,
        silent: false,
        browserify: true
    };

    t.test('unspecified', function(t2) {
        seymour([], {}).then(function() {
            t2.ok(cordova.prepare.call.calledWith(null, debug_opts), 'calls prepare with debug=true');
            t2.ok(cordova.compile.call.called, 'calls compile');

            t2.end();
        });
    });


    t.test('= "debug"', function(t2) {
        seymour([], {SEY_BUILD_MODE: "debug"}).then(function() {
            t2.ok(cordova.prepare.call.calledWith(null, debug_opts), 'calls prepare with debug=true');
            t2.ok(cordova.compile.call.called, 'calls compile');

            t2.end();
        });
    });


    t.test('= "release"', function(t2) {
        seymour([], {SEY_BUILD_MODE: "release"}).then(function() {
            t2.ok(cordova.prepare.call.calledWith(null, release_opts), 'calls prepare with release=true');
            t2.ok(cordova.compile.call.called, 'calls compile');

            t2.end();
        });
    });

    t.end();
});


test('SEY_BUILD_CONFIG', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true, buildConfig: 'build.json'},
        verbose: false,
        silent: false,
        browserify: true
    };

    return seymour([], {SEY_BUILD_CONFIG: 'build.json'}).then(function(res) {
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

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
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

        t.end();
    });
});


test('SEY_APP_ID', function(t) {
    var setID = sinon.spy(ConfigParser.prototype, 'setPackageName');

    seymour([], {SEY_APP_ID: 'com.example.app.id'}).then(function() {
        t.ok(setID.calledWith('com.example.app.id'), 'sets the application id');
        t.end();
    });
});


test('SEY_APP_NAME', function(t) {
    var setName = sinon.spy(ConfigParser.prototype, 'setName');

    seymour([], {SEY_APP_NAME: 'MyApp'}).then(function() {
        t.ok(setName.calledWith('MyApp'), 'sets the application name');
        t.end();
    });
});


test('SEY_APP_SHORTNAME', function(t) {
    var setShortName = sinon.spy(ConfigParser.prototype, 'setShortName');

    seymour([], {SEY_APP_SHORTNAME: 'MyApp'}).then(function() {
        t.ok(setShortName.calledWith('MyApp'), 'sets the display name');
        t.end();
    });
});


test('SEY_APP_VERSION', function(t) {
    var setVer = sinon.spy(ConfigParser.prototype, 'setVersion');

    seymour([], {SEY_APP_VERSION: '1.2.3-qa'}).then(function() {
        t.ok(setVer.calledWith('1.2.3-qa'), 'sets the application version');
        t.end();
    });
});


test('Preferences', function(t) {
    var setGlobalPref = sinon.spy(ConfigParser.prototype, 'setGlobalPreference');

    seymour([], {SEY_PREFERENCE_backgroundColor: 'FF000000'}).then(function() {
        t.ok(setGlobalPref.calledWith('backgroundColor', 'FF000000'), 'sets the preferences');
        t.end();
    });
});
