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

var pkg             = require('../package.json');
var cordova         = require('cordova-lib').cordova;
var ConfigParser    = require('cordova-common').ConfigParser;
var CordovaError    = require('cordova-common').CordovaError;
var events          = require('cordova-common').events;
var CordovaLogger   = require('cordova-common').CordovaLogger;
var path            = require('path');
var HooksRunner     = require('cordova-lib/src/hooks/HooksRunner');
var cordovaUtil     = require('cordova-lib/src/cordova/util');
var et              = require('elementtree');

function run(args, env)
{
    if (args.indexOf('-v') !== -1 ||
        args.indexOf('--version') !== -1)
    {
        var cdvVer = require('cordova-lib/package').version;

        console.log('Seymour ' + pkg.version);
        console.log('Cordova ' + cdvVer);
        return Promise.resolve();
    }


    var projectRoot = cordova.findProjectRoot();
    if (!projectRoot) {
        return Promise.reject(new CordovaError('Current working directory is not a Cordova-based project.'));
    }

    var logger = CordovaLogger.get();
    logger.subscribe(events);

    var configPath = path.join(projectRoot, 'config.xml');
    var config = new ConfigParser(configPath);

    var opts = {
        platforms: [],
        options: {device: true},
        verbose: false,
        silent: false,
        fetch: true
    };


    if (env.SEY_APP_ID) {
        config.setPackageName(env.SEY_APP_ID);
    }

    if (env.SEY_APP_NAME) {
        config.setName(env.SEY_APP_NAME);
    }

    if (env.SEY_APP_SHORTNAME) {
        config.setShortName(env.SEY_APP_SHORTNAME);
    }

    if (env.SEY_APP_VERSION) {
        config.setVersion(env.SEY_APP_VERSION);
    }

    if (env.SEY_VERBOSE) {
        opts.verbose = true;
        opts.options.verbose = true;
        logger.setLevel('verbose');
    }

    if (env.SEY_BUILD_PLATFORMS) {
        opts.platforms = env.SEY_BUILD_PLATFORMS
                        .split(',')
                        .map(function(p) { return p.toLowerCase(); });
    }

    if (env.SEY_BUILD_MODE &&
        env.SEY_BUILD_MODE.toLowerCase() === 'release')
    {
        opts.options.release = true;
    } else {
        opts.options.debug = true;
    }

    if (env.SEY_BUILD_CONFIG) {
        opts.options.buildConfig = env.SEY_BUILD_CONFIG;
    }

    Object.keys(env)
        .filter(function(v) {
            return v.match(/^SEY_PREFERENCE_/);
        })
        .forEach(function(envName) {
            var name = envName.replace(/^SEY_PREFERENCE_/, '');
            config.setGlobalPreference(name, env[envName]);
        });

    Object.keys(env)
        .filter(function(v) {
            return v.match(/^SEY_([A-Za-z]+)_PREFERENCE_/);
        })
        .forEach(function(envName) {
            var platform = envName.match(/^SEY_([A-Za-z]+)(?=_)/)[0] //e.g. SEY_IOS
                                  .replace(/^SEY_/, '') // Remove SEY_
                                  .toLowerCase();

            var name = envName.replace(/^SEY_([A-Za-z]+)_PREFERENCE_/, '');

            var plat = config.doc.find('platform[@name=\"' + platform + '\"]');
            if(!plat) {
                plat = new et.Element('platform', { name: platform });
                config.doc.getroot().append(plat);
            }

            var pref = plat.find('preference[@name="' + name + '"]');
            if (!pref) {
                pref = new et.Element('preference');
                pref.attrib.name = name;
                plat.append(pref);
            }
            pref.attrib.value = env[envName];
        });

    config.write();

    if (args.indexOf('--config-only') !== -1) {
        // Exit without building if we've been asked to only update the config
        return Promise.resolve();
    }


    var base_opts = JSON.stringify(opts);

    var prep_opts = JSON.parse(base_opts);

    return cordova.prepare.call(null, prep_opts)
    .then(function() {
        // Some plugins (Crosswalk *shakefist*) add a bunch of their own stuff
        // to config.xml that overrides user-defined variables.
        // We re-save the config.xml file after installing plugins to ensure
        // we have the data that we want and not extra garbage.
        config.write();

        var projectRoot = cordovaUtil.cdProjectRoot();
        var build_opts = cordovaUtil.preProcessOptions(JSON.parse(base_opts));

        var hooksRunner = new HooksRunner(projectRoot);

        return hooksRunner.fire('before_build', build_opts)
        .then(function() {
            return cordova.compile.call(null, build_opts);
        })
        .then(function() {
            return hooksRunner.fire('after_build', build_opts);
        });
    });
}
module.exports = run;
