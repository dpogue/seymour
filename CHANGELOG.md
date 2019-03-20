Seymour Changelog
=================

### v4.0.1

* Fix the `.git` folder accidentally included in the published v4.0.0 package

### v4.0.0

* Update to cordova-lib@9.0.0 and cordova-common@3.1.0
* **BREAKING:** Remove `SEY_NOBROWSERIFY` because all browserify code has been
  removed from Cordova
* Set up TravisCI to run tests
* Update [Code of Conduct]

### v3.2.1

* Fix `seymour --version` command

### v3.2.0

* Update npm dependencies to resolve npm audit warnings
* Improve error message reporting

### v3.1.0

* Add support for platform-specific preferences by way of
  `SEY_[platform]_PREFERENCE_*`  
  e.g., `SEY_IOS_PREFERENCE_DisallowOverscroll=True`

  Credit: @evanuk

### v3.0.0

* Update to cordova-lib@8.0.0
* **BREAKING:** Remove `SEY_NOFETCH` since the old fetch code has been
  entirely removed from Cordova

### v2.1.0

* Enable cordova-fetch by default (matching Cordova 7.x behaviour)
* Add `SEY_NOFETCH` environment variable to use the old installation method for
  platforms/plugins

### v2.0.0

* Update to use the new cordova-lib@7.1.0 API

### v1.4.0

* Add support for `SEY_APP_SHORTNAME` variable to set the app display name
* Update Cordova dependencies to latest versions (cordova-common, cordova-lib)
* Update testing dependencies
* Add more tests for 100% test coverage

### v1.3.0

* Add support for `SEY_PREFERENCE_*` variables to set global preferences.  
  Platform-specific preferences are still not supported.

### v1.2.0

* Run `cordova compile` instead of `cordova build`

### v1.1.1

* Add `SEY_NOBROWSERIFY` option to disable the `--browserify` flag

### v1.1.0

* Add support for `SEY_BUILD_CONFIG` to support build.json files

### v1.0.2

* Properly capture Cordova build output
* Better logging output with `SEY_VERBOSE`
* Fix for build reusing a modified options hash from prepare.  
  This could potentially cause build-step hooks to fail because parts of the
  options hash were incorrectly populated.

### v1.0.1

* Update Cordova version to 6.0.0
* Add [Code of Conduct]

### v1.0.0

* Initial release


[Code of Conduct]: https://github.com/dpogue/seymour/blob/master/CODE_OF_CONDUCT.md
