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

try {
    fs = require('fs-extra');
} catch (e) { }

var seymour       = require('../src/seymour');
var cordova       = require('cordova-lib').cordova;
var ConfigParser  = require('cordova-common').ConfigParser;
var CordovaLogger = require('cordova-common').CordovaLogger;
var CordovaError  = require('cordova-common').CordovaError;

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


var config_path = path.join(__dirname, 'config.xml');
var config = fs.readFileSync(path.join(__dirname, 'testconfig.xml'), 'utf8');

var prepareStub = sinon.stub(cordova.prepare, 'call').resolves(true);
var compileStub = sinon.stub(cordova.compile, 'call').resolves(true);

var findRootStub = sinon.stub(cordova, 'findProjectRoot');
var readFileStub = sinon.stub(fs, 'readFileSync');

findRootStub.returns(__dirname);
readFileStub.withArgs(config_path).returns(config);

var logger = CordovaLogger.get();
var subscribeStub = sinon.stub(logger, 'subscribe');


test('bad project', function(t) {
    findRootStub.returns(null);

    return seymour([], {}).then(function(res) {
        t.fail('expected to reject');
    })
    .catch(function(err) {
        t.ok(err instanceof CordovaError, 'throws a CordovaError');

        findRootStub.returns(__dirname);
        t.end();
    });


});


test('no parameters', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        fetch: true
    };

    return seymour([], {}).then(function(res) {
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

        t.ok(subscribeStub.called, 'subscribes the logger');

        t.end();
    });
});


test('failing build', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true},
        verbose: false,
        silent: false,
        fetch: true
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
        fetch: true
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
        fetch: true
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
        fetch: true
    };

    var release_opts = {
        platforms: [],
        options: {device: true, release: true},
        verbose: false,
        silent: false,
        fetch: true
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
        fetch: true
    };

    return seymour([], {SEY_BUILD_CONFIG: 'build.json'}).then(function(res) {
        t.ok(cordova.prepare.call.calledWith(null, opts), 'calls prepare');
        t.ok(cordova.compile.call.called, 'calls compile');

        t.end();
    });
});


test('SEY_APP_ID', function(t) {
    var setID = sinon.spy(ConfigParser.prototype, 'setPackageName');

    seymour([], {SEY_APP_ID: 'com.example.app.id'}).then(function() {
        t.ok(setID.calledWith('com.example.app.id'), 'sets the application id');

        setID.restore();
        t.end();
    });
});


test('SEY_APP_NAME', function(t) {
    var setName = sinon.spy(ConfigParser.prototype, 'setName');

    seymour([], {SEY_APP_NAME: 'MyApp'}).then(function() {
        t.ok(setName.calledWith('MyApp'), 'sets the application name');

        setName.restore();
        t.end();
    });
});


test('SEY_APP_SHORTNAME', function(t) {
    var setShortName = sinon.spy(ConfigParser.prototype, 'setShortName');

    seymour([], {SEY_APP_SHORTNAME: 'MyApp'}).then(function() {
        t.ok(setShortName.calledWith('MyApp'), 'sets the display name');

        setShortName.restore();
        t.end();
    });
});


test('SEY_APP_VERSION', function(t) {
    var setVer = sinon.spy(ConfigParser.prototype, 'setVersion');

    seymour([], {SEY_APP_VERSION: '1.2.3-qa'}).then(function() {
        t.ok(setVer.calledWith('1.2.3-qa'), 'sets the application version');

        setVer.restore();
        t.end();
    });
});


test('Preferences', function(t) {
    var setGlobalPref = sinon.spy(ConfigParser.prototype, 'setGlobalPreference');

    seymour([], {SEY_PREFERENCE_backgroundColor: 'FF000000'}).then(function() {
        t.ok(setGlobalPref.calledWith('backgroundColor', 'FF000000'), 'sets the preferences');

        setGlobalPref.restore();
        t.end();
    });
});

test('Creating IOS Plaform Preferences', function(t) {
    readFileStub.restore();

    seymour([], {SEY_IOS_PREFERENCE_sas_api_key: '123456789'}).then(function() {
        var config = new ConfigParser(config_path);

        t.ok(config.getPlatformPreference('sas_api_key', 'ios')  === '123456789');
        t.end();
    });
    readFileStub.withArgs(config_path).returns(config);
});

test('Editing IOS Platform Preferences', function(t) {
    readFileStub.restore();

    seymour([], {SEY_IOS_PREFERENCE_sas_api_key: '987654321'}).then(function() {

        var config = new ConfigParser(config_path);

        t.ok(config.getPlatformPreference('sas_api_key', 'ios')  === '987654321');
        t.end();
    });
    readFileStub.withArgs(config_path).returns(config);
});

test('Creating Android Plaform Preferences', function(t) {
    readFileStub.restore();

    seymour([], {SEY_ANDROID_PREFERENCE_sas_api_key: '123456789'}).then(function() {
        var config = new ConfigParser(config_path);

        t.ok(config.getPlatformPreference('sas_api_key', 'android')  === '123456789');
        t.end();
    });
    readFileStub.withArgs(config_path).returns(config);
});

test('Editing Android Platform Preferences', function(t) {
    readFileStub.restore();

    seymour([], {SEY_ANDROID_PREFERENCE_sas_api_key: '987654321'}).then(function() {

        var config = new ConfigParser(config_path);

        t.ok(config.getPlatformPreference('sas_api_key', 'android')  === '987654321');
        t.end();
    });
    readFileStub.withArgs(config_path).returns(config);
});


test('config-only mode', function(t) {
    prepareStub.reset();
    compileStub.reset();

    var setID = sinon.spy(ConfigParser.prototype, 'setPackageName');

    seymour(['node', 'seymour', '--config-only'], {SEY_APP_ID: 'com.example.app.id'}).then(function() {
        t.ok(setID.calledWith('com.example.app.id'), 'sets the application id');

        t.notOk(cordova.prepare.call.called, 'calls prepare');
        t.notOk(cordova.compile.call.called, 'calls compile');

        setID.restore();

        t.end();
    });
});
