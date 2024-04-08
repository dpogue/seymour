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
/* node:coverage disable */

import test from 'node:test';
import assert from 'node:assert';
import node_fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import url from 'node:url';
import cordovaLib from 'cordova-lib';
import cordovaCommon from 'cordova-common';
import seymour from 'seymour';
//import pkgJson from 'seymour/package.json' assert { type: 'json' };

let fs = node_fs;
try {
    fs = (await import('fs-extra')).default;
} catch (e) { }

const { cordova } = cordovaLib;
const { ConfigParser, CordovaLogger, CordovaError } = cordovaCommon;

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));
process.env.PWD = __dirname;
process.chdir(__dirname);


test('version', function(t) {
    t.mock.method(console, 'log', function() {});

    const require = createRequire(import.meta.url);
    const pkgJson = require('seymour/package.json');
    const version = pkgJson.version;

    return Promise.all([
        t.test('with --version', function() {
            seymour(['node', 'seymour', '--version'], {});
            assert.ok(console.log.mock.calls[0].arguments[0].match(version), 'prints version');
        }),

        t.test('with -v', function() {
            seymour(['node', 'seymour', '-v'], {});
            assert.ok(console.log.mock.calls[0].arguments[0].match(version), 'prints version');
        })
    ]);
});


test('bad project', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova, 'findProjectRoot', function() {
        return null;
    });

    return seymour([], {})
        .then(function(res) {
            assert.fail('expected to reject');
        })
        .catch(function(err) {
            assert.ok(err instanceof CordovaError, 'throws a CordovaError');
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

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });

    return seymour([], {})
        .then(function(res) {
            var prepareCalls = cordova.prepare.call.mock.calls;
            assert.strictEqual(prepareCalls.length, 1, 'calls prepare');
            assert.deepStrictEqual(prepareCalls[0].arguments[1], opts, 'calls prepare with opts');
            assert.strictEqual(cordova.compile.call.mock.calls.length, 1, 'calls compile');

            assert.strictEqual(logger.subscribe.mock.callCount(), 1, 'subscribes the logger');
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

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });


    return Promise.all([
        t.test('prepare', function(t2) {
            t2.mock.method(cordova.prepare, 'call', function() {
                return Promise.reject(new Error(""));
            });

            return seymour([], {})
                .then(function() {
                    assert.fail('resolves');
                })
                .catch(function() {
                    assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], opts, 'calls prepare');
                });
        }),

        t.test('compile', function(t2) {
            t2.mock.method(cordova.prepare, 'call', function() {
                return Promise.resolve(true);
            });
            t2.mock.method(cordova.compile, 'call', function() {
                return Promise.reject(new Error(""));
            });

            return seymour([], {})
                .then(function() {
                    assert.fail('resolves');
                })
                .catch(function() {
                    assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], opts, 'calls prepare');
                    assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
                });
        })
    ]);
});


test('SEY_VERBOSE', function(t) {
    var opts = {
        platforms: [],
        options: {debug: true, device: true, verbose: true},
        verbose: true,
        silent: false,
        fetch: true
    };

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });

    return seymour([], {SEY_VERBOSE: true})
        .then(function() {
            assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], opts, 'calls prepare');
            assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
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

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });

    return seymour([], {SEY_BUILD_PLATFORMS: "Windows,iOS"})
        .then(function() {
            assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], opts, 'calls prepare');
            assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
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

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    return Promise.all([
        t.test('unspecified', function(t2) {
            t2.mock.method(cordova.prepare, 'call', function() {
                return Promise.resolve(true);
            });
            t2.mock.method(cordova.compile, 'call', function() {
                return Promise.resolve(true);
            });

            return seymour([], {})
                .then(function() {
                    assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], debug_opts, 'calls prepare with debug=true');
                    assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
                });
        }),


        t.test('= "debug"', function(t2) {
            t2.mock.method(cordova.prepare, 'call', function() {
                return Promise.resolve(true);
            });
            t2.mock.method(cordova.compile, 'call', function() {
                return Promise.resolve(true);
            });

            return seymour([], {SEY_BUILD_MODE: "debug"})
                .then(function() {
                    assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], debug_opts, 'calls prepare with debug=true');
                    assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
                });
        }),


        t.test('= "release"', function(t2) {
            t2.mock.method(cordova.prepare, 'call', function() {
                return Promise.resolve(true);
            });
            t2.mock.method(cordova.compile, 'call', function() {
                return Promise.resolve(true);
            });

            return seymour([], {SEY_BUILD_MODE: "release"})
                .then(function() {
                    assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], release_opts, 'calls prepare with release=true');
                    assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
                });
        })
    ]);
});


test('SEY_BUILD_CONFIG', function(t) {
    var opts = {
        platforms: [],
        options: {device: true, debug: true, buildConfig: 'build.json'},
        verbose: false,
        silent: false,
        fetch: true
    };

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });

    return seymour([], {SEY_BUILD_CONFIG: 'build.json'})
        .then(function(res) {
            assert.deepStrictEqual(cordova.prepare.call.mock.calls[0].arguments[1], opts, 'calls prepare');
            assert.strictEqual(cordova.compile.call.mock.callCount(), 1, 'calls compile');
        });
});


test('SEY_BUILD_NUMBER', function(t) {
    var config_path = path.join(__dirname, 'config.xml');

    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });

    return seymour([], {SEY_BUILD_NUMBER: 234})
        .then(function() {
            fs.readFileSync.mock.restore();
            var config = new ConfigParser(config_path);

            assert.strictEqual(config.android_versionCode(), '234', 'sets the android version code');
            assert.strictEqual(config.ios_CFBundleVersion(), '234', 'sets the iOS bundle version');
        });
});


test('SEY_APP_ID', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setPackageName');

    return seymour([], {SEY_APP_ID: 'com.example.app.id'})
        .then(function() {
            var call = ConfigParser.prototype.setPackageName.mock.calls[0];
            assert.strictEqual(call.arguments[0], 'com.example.app.id', 'sets the application id');
        });
});


test('SEY_APP_NAME', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setName');

    return seymour([], {SEY_APP_NAME: 'MyApp'})
        .then(function() {
            var call = ConfigParser.prototype.setName.mock.calls[0];
            assert.strictEqual(call.arguments[0], 'MyApp', 'sets the application name');
        });
});


test('SEY_APP_SHORTNAME', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setShortName');

    return seymour([], {SEY_APP_SHORTNAME: 'MyApp'})
        .then(function() {
            var call = ConfigParser.prototype.setShortName.mock.calls[0];
            assert.strictEqual(call.arguments[0], 'MyApp', 'sets the display name');
        });
});


test('SEY_APP_VERSION', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setVersion');

    return seymour([], {SEY_APP_VERSION: '1.2.3-qa'})
        .then(function() {
            var call = ConfigParser.prototype.setVersion.mock.calls[0];
            assert.strictEqual(call.arguments[0], '1.2.3-qa', 'sets the application version');
        });
});


test('Preferences', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setGlobalPreference');

    return seymour([], { SEY_PREFERENCE_backgroundColor: 'FF000000' })
        .then(function() {
            var call = ConfigParser.prototype.setGlobalPreference.mock.calls[0];
            assert.deepStrictEqual(call.arguments, ['backgroundColor', 'FF000000'], 'sets the preference');
        });
});

test('Platform Preferences', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setPlatformPreference');

    return seymour([], { SEY_IOS_PREFERENCE_sas_api_key: '123456789' })
        .then(function() {
            var call = ConfigParser.prototype.setPlatformPreference.mock.calls[0];
            assert.deepStrictEqual(call.arguments, ['sas_api_key', 'ios', '123456789'], 'sets the preference');
        });
});


test('config-only mode', function(t) {
    t.mock.method(console, 'log', function() {});

    var logger = CordovaLogger.get();
    t.mock.method(logger, 'subscribe', function() {});

    var es = fs.existsSync;
    t.mock.method(fs, 'existsSync', function(f) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return true;
        }

        return es.call(this, f);
    });

    var rfs = fs.readFileSync;
    t.mock.method(fs, 'readFileSync', function(f, ...args) {
        if (f === path.join(process.cwd(), 'config.xml')) {
            return rfs.call(this, path.join(process.cwd(), 'testconfig.xml'), ...args);
        }

        return rfs.call(this, f, ...args);
    });

    t.mock.method(cordova.prepare, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(cordova.compile, 'call', function() {
        return Promise.resolve(true);
    });
    t.mock.method(ConfigParser.prototype, 'setPackageName');

    return seymour(['node', 'seymour', '--config-only'], {SEY_APP_ID: 'com.example.app.id'}).then(function() {
        var call = ConfigParser.prototype.setPackageName.mock.calls[0];
        assert.strictEqual(call.arguments[0], 'com.example.app.id', 'sets the application id');

        assert.strictEqual(cordova.prepare.call.mock.calls.length, 0, 'calls prepare');
        assert.strictEqual(cordova.compile.call.mock.calls.length, 0, 'calls compile');
    });
});
