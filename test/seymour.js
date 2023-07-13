/**
 * Copyright 2015 Darryl Pogue
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import cordovaCommon from "cordova-common";
import cordovaLib from "cordova-lib";
import fs from "fs";
import { createRequire } from "module";
import path from "path";
import sinon from "sinon";
import { test } from "tap";
import url from "url";
import seymour from "../src/seymour.js";

const { ConfigParser, CordovaLogger, CordovaError } = cordovaCommon;
const { cordova } = cordovaLib;

try {
    fs = await import("fs-extra");
} catch (e) {}

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

process.env.PWD = __dirname;
process.chdir(__dirname);

test("version", function (t) {
    const require = createRequire(import.meta.url);
    const { version } = require("../package.json");

    const stub = sinon.stub(console, "log");

    t.test("with --version", function (tt) {
        seymour(["node", "seymour", "--version"], {});
        tt.ok(console.log.firstCall.args[0].match(version), "prints version");
        tt.end();
    });

    t.test("with -v", function (tt) {
        seymour(["node", "seymour", "-v"], {});
        tt.ok(console.log.firstCall.args[0].match(version), "prints version");
        tt.end();
    });

    t.end();

    stub.restore();
});

const config_path = path.join(__dirname, "config.xml");
const config = fs.readFileSync(path.join(__dirname, "testconfig.xml"), "utf8");

let prepareStub = sinon.stub(cordova.prepare, "call").resolves(true);
let compileStub = sinon.stub(cordova.compile, "call").resolves(true);

const findRootStub = sinon.stub(cordova, "findProjectRoot");
const readFileStub = sinon.stub(fs, "readFileSync");

findRootStub.returns(__dirname);
readFileStub.withArgs(config_path).returns(config);

const logger = CordovaLogger.get();
const subscribeStub = sinon.stub(logger, "subscribe");

test("bad project", function (t) {
    findRootStub.returns(null);

    return seymour([], {})
        .then(function (res) {
            t.fail("expected to reject");
        })
        .catch(function (err) {
            t.ok(err instanceof CordovaError, "throws a CordovaError");

            findRootStub.returns(__dirname);
            t.end();
        });
});

test("no parameters", function (t) {
    const opts = {
        platforms: [],
        options: { device: true, debug: true },
        verbose: false,
        silent: false,
        fetch: true,
    };

    return seymour([], {}).then(function (res) {
        t.ok(cordova.prepare.call.calledWith(null, opts), "calls prepare");
        t.ok(cordova.compile.call.called, "calls compile");

        t.ok(subscribeStub.called, "subscribes the logger");

        t.end();
    });
});

test("failing build", function (t) {
    const opts = {
        platforms: [],
        options: { device: true, debug: true },
        verbose: false,
        silent: false,
        fetch: true,
    };

    t.test("prepare", function (t2) {
        prepareStub.restore();
        const stub = sinon.stub(cordova.prepare, "call").rejects();

        return seymour([], {})
            .then(function () {
                t2.notOk(true, "resolves");
            })
            .catch(function () {
                t2.ok(
                    cordova.prepare.call.calledWith(null, opts),
                    "calls prepare"
                );
            })
            .then(function () {
                stub.restore();
                prepareStub = sinon
                    .stub(cordova.prepare, "call")
                    .resolves(true);

                t2.end();
            });
    });

    t.test("compile", function (t2) {
        compileStub.restore();
        const stub = sinon.stub(cordova.compile, "call").rejects();

        return seymour([], {})
            .then(function () {
                t2.notOk(true, "resolves");
            })
            .catch(function () {
                t2.ok(
                    cordova.prepare.call.calledWith(null, opts),
                    "calls prepare"
                );
                t2.ok(cordova.compile.call.called, "calls compile");
            })
            .then(function () {
                stub.restore();
                compileStub = sinon
                    .stub(cordova.compile, "call")
                    .resolves(true);

                t2.end();
            });
    });

    t.end();
});

test("SEY_VERBOSE", function (t) {
    const opts = {
        platforms: [],
        options: { debug: true, device: true, verbose: true },
        verbose: true,
        silent: false,
        fetch: true,
    };

    seymour([], { SEY_VERBOSE: true }).then(function () {
        t.ok(cordova.prepare.call.calledWith(null, opts), "calls prepare");
        t.ok(cordova.compile.call.called, "calls compile");

        t.end();
    });
});

test("SEY_BUILD_PLATFORMS", function (t) {
    const opts = {
        platforms: ["windows", "ios"],
        options: { device: true, debug: true },
        verbose: false,
        silent: false,
        fetch: true,
    };

    seymour([], { SEY_BUILD_PLATFORMS: "Windows,iOS" }).then(function () {
        t.ok(cordova.prepare.call.calledWith(null, opts), "calls prepare");
        t.ok(cordova.compile.call.called, "calls compile");

        t.end();
    });
});

test("SEY_BUILD_MODE", function (t) {
    const debug_opts = {
        platforms: [],
        options: { device: true, debug: true },
        verbose: false,
        silent: false,
        fetch: true,
    };

    const release_opts = {
        platforms: [],
        options: { device: true, release: true },
        verbose: false,
        silent: false,
        fetch: true,
    };

    t.test("unspecified", function (t2) {
        seymour([], {}).then(function () {
            t2.ok(
                cordova.prepare.call.calledWith(null, debug_opts),
                "calls prepare with debug=true"
            );
            t2.ok(cordova.compile.call.called, "calls compile");

            t2.end();
        });
    });

    t.test(`= 'debug'`, function (t2) {
        seymour([], { SEY_BUILD_MODE: "debug" }).then(function () {
            t2.ok(
                cordova.prepare.call.calledWith(null, debug_opts),
                "calls prepare with debug=true"
            );
            t2.ok(cordova.compile.call.called, "calls compile");

            t2.end();
        });
    });

    t.test(`= 'release'`, function (t2) {
        seymour([], { SEY_BUILD_MODE: "release" }).then(function () {
            t2.ok(
                cordova.prepare.call.calledWith(null, release_opts),
                "calls prepare with release=true"
            );
            t2.ok(cordova.compile.call.called, "calls compile");

            t2.end();
        });
    });

    t.end();
});

test("SEY_BUILD_CONFIG", function (t) {
    const opts = {
        platforms: [],
        options: { device: true, debug: true, buildConfig: "build.json" },
        verbose: false,
        silent: false,
        fetch: true,
    };

    return seymour([], { SEY_BUILD_CONFIG: "build.json" }).then(function (res) {
        t.ok(cordova.prepare.call.calledWith(null, opts), "calls prepare");
        t.ok(cordova.compile.call.called, "calls compile");

        t.end();
    });
});

test("SEY_BUILD_NUMBER", function (t) {
    readFileStub.restore();

    seymour([], { SEY_BUILD_NUMBER: 234 }).then(function () {
        const config = new ConfigParser(config_path);

        t.ok(
            config.android_versionCode() === "234",
            "sets the android version code"
        );
        t.ok(
            config.ios_CFBundleVersion() === "234",
            "sets the iOS bundle version"
        );
        t.end();
    });
    readFileStub.withArgs(config_path).returns(config);
});

test("SEY_APP_ID", function (t) {
    const setID = sinon.spy(ConfigParser.prototype, "setPackageName");

    seymour([], { SEY_APP_ID: "com.example.app.id" }).then(function () {
        t.ok(setID.calledWith("com.example.app.id"), "sets the application id");

        setID.restore();
        t.end();
    });
});

test("SEY_APP_NAME", function (t) {
    const setName = sinon.spy(ConfigParser.prototype, "setName");

    seymour([], { SEY_APP_NAME: "MyApp" }).then(function () {
        t.ok(setName.calledWith("MyApp"), "sets the application name");

        setName.restore();
        t.end();
    });
});

test("SEY_APP_SHORTNAME", function (t) {
    const setShortName = sinon.spy(ConfigParser.prototype, "setShortName");

    seymour([], { SEY_APP_SHORTNAME: "MyApp" }).then(function () {
        t.ok(setShortName.calledWith("MyApp"), "sets the display name");

        setShortName.restore();
        t.end();
    });
});

test("SEY_APP_VERSION", function (t) {
    const setVer = sinon.spy(ConfigParser.prototype, "setVersion");

    seymour([], { SEY_APP_VERSION: "1.2.3-qa" }).then(function () {
        t.ok(setVer.calledWith("1.2.3-qa"), "sets the application version");

        setVer.restore();
        t.end();
    });
});

test("Preferences", function (t) {
    const setGlobalPref = sinon.spy(
        ConfigParser.prototype,
        "setGlobalPreference"
    );

    seymour([], { SEY_PREFERENCE_backgroundColor: "FF000000" }).then(
        function () {
            t.ok(
                setGlobalPref.calledWith("backgroundColor", "FF000000"),
                "sets the preferences"
            );

            setGlobalPref.restore();
            t.end();
        }
    );
});

test("Platform Preferences", function (t) {
    const setPlatformPref = sinon.spy(
        ConfigParser.prototype,
        "setPlatformPreference"
    );

    seymour([], { SEY_IOS_PREFERENCE_sas_api_key: "123456789" }).then(
        function () {
            t.ok(
                setPlatformPref.calledWith("sas_api_key", "ios", "123456789"),
                "sets the preferences"
            );

            setPlatformPref.restore();
            t.end();
        }
    );
});

test("config-only mode", function (t) {
    prepareStub.reset();
    compileStub.reset();

    const setID = sinon.spy(ConfigParser.prototype, "setPackageName");

    seymour(["node", "seymour", "--config-only"], {
        SEY_APP_ID: "com.example.app.id",
    }).then(function () {
        t.ok(setID.calledWith("com.example.app.id"), "sets the application id");

        t.notOk(cordova.prepare.call.called, "calls prepare");
        t.notOk(cordova.compile.call.called, "calls compile");

        setID.restore();

        t.end();
    });
});
