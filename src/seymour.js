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

import path from 'node:path';
import { createRequire } from 'node:module';
import cordovaLib from 'cordova-lib';
import cordovaCommon from 'cordova-common';
import cordovaUtil from 'cordova-lib/src/cordova/util.js';
import HooksRunner from 'cordova-lib/src/hooks/HooksRunner.js';

const { ConfigParser, CordovaError, events, CordovaLogger } = cordovaCommon;
const { cordova } = cordovaLib;

export default function run(args, env) {
    if (args.indexOf('-v') !== -1 || args.indexOf('--version') !== -1) {
        const require = createRequire(import.meta.url);
        const cdvPkg = require('cordova-lib/package.json');
        const seyPkg = require('../package.json');

        console.log(`Seymour ${seyPkg.version}`);
        console.log(`Cordova ${cdvPkg.version}`);
        return Promise.resolve();
    }

    const projectRoot = cordova.findProjectRoot(process.cwd());
    if (!projectRoot) {
        return Promise.reject(new CordovaError(`Current working directory is not a Cordova-based project: ${process.cwd()}`));
    }

    const logger = CordovaLogger.get();
    logger.subscribe(events);

    const configPath = path.join(projectRoot, 'config.xml');
    const config = new ConfigParser(configPath);

    const opts = {
        platforms: [],
        options: { device: true },
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
                        .map((p) => p.toLowerCase());
    }

    if (env.SEY_BUILD_MODE && env.SEY_BUILD_MODE.toLowerCase() === 'release') {
        opts.options.release = true;
    } else {
        opts.options.debug = true;
    }

    if (env.SEY_BUILD_CONFIG) {
        opts.options.buildConfig = env.SEY_BUILD_CONFIG;
    }

    if (env.SEY_BUILD_NUMBER) {
        const attrs = [
            'android-versionCode',
            'ios-CFBundleVersion',
            'osx-CFBundleVersion'
            // We don't set the Windows version because that's required to be a
            // 4-digit version
        ];

        attrs.forEach(function(attr) {
            config.doc.getroot().attrib[attr] = env.SEY_BUILD_NUMBER;
        });
    }

    Object.keys(env)
        .filter((v) => v.match(/^SEY_PREFERENCE_/))
        .forEach(function(envName) {
            const name = envName.replace(/^SEY_PREFERENCE_/, '');
            config.setGlobalPreference(name, env[envName]);
        });

    Object.keys(env)
        .filter((v) => v.match(/^SEY_([A-Za-z]+)_PREFERENCE_/))
        .forEach(function(envName) {
            const name = envName.replace(/^SEY_([A-Za-z]+)_PREFERENCE_/, '');
            const platform = envName.match(/^SEY_([A-Za-z]+)(?=_)/)[0] //e.g. SEY_IOS
                                    .replace(/^SEY_/, '') // Remove SEY_
                                    .toLowerCase();
            config.setPlatformPreference(name, platform, env[envName]);
        });

    config.write();

    if (args.indexOf('--config-only') !== -1) {
        // Exit without building if we've been asked to only update the config
        return Promise.resolve();
    }


    const base_opts = JSON.stringify(opts);
    const prep_opts = JSON.parse(base_opts);

    return cordova.prepare.call(null, prep_opts)
        .then(() => {
            // Some plugins (Crosswalk *shakefist*) add a bunch of their own stuff
            // to config.xml that overrides user-defined variables.
            // We re-save the config.xml file after installing plugins to ensure
            // we have the data that we want and not extra garbage.
            config.write();

            const projectRoot = cordovaUtil.cdProjectRoot();
            const build_opts = cordovaUtil.preProcessOptions(JSON.parse(base_opts));

            const hooksRunner = new HooksRunner(projectRoot);

            return hooksRunner.fire('before_build', build_opts)
                .then(() => cordova.compile.call(null, build_opts))
                .then(() => hooksRunner.fire('after_build', build_opts));
        });
}
