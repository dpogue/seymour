Seymour
=======

<p align="center">
  <img alt="" width="481" src="https://raw.githubusercontent.com/dpogue/seymour/master/seymour.png">
</p>

Seymour is a build helper for [Apache Cordova](http://cordova.io) projects.

It takes configuration from environment variables, making it ideal for use in
continuous integration environments with a matrix of platforms and build types.


Usage
-----

Install Seymour:

```
npm install --save-dev seymour
```

Run Seymour on your Cordova project:

```
$(npm bin)/seymour
```


How it works
------------

Seymour requires your Cordova platforms and plugins to be listed in your
config.xml file. It will effectively run the following:

```
cordova prepare --browserify
cordova build --browserify --device
```

You can control additional behaviour through environment variables.

### Future Features

* Collect the resulting build artefacts into a top-level `output` directory


Configuration
-------------

The following environment variables will be used by Seymour to alter the
resulting build:

### SEY_BUILD_TYPE

* **Valid options:** `debug`, `release`
* **Default value:** `debug`

### SEY_BUILD_PLATFORMS

* **Valid options:** A comma-separated list of Cordova platforms to build
* **Default value:** Use the platforms listed in config.xml

You cannot use this to add new platforms that are not listed in config.xml. You
can only use this to restrict to a subset of platforms.

### SEY_BUILD_CONFIG

The name of a JSON file containing build signing information.

See the following Cordova documentation for JSON options:
* [Android](http://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#using-buildjson)
* [iOS](http://cordova.apache.org/docs/en/latest/guide/platforms/ios/index.html#using-buildjson)
* [Windows](http://cordova.apache.org/docs/en/latest/guide/platforms/win8/index.html#signing-an-app)

### SEY_APP_NAME

This will override the application name defined in config.xml.

### SEY_APP_SHORTNAME

This will override the application display name defined in config.xml.

### SEY_APP_ID

This will override the application identifier defined in config.xml.

### SEY_APP_VERSION

This will override the application version defined in config.xml.

### SEY_VERBOSE

This will enable verbose logging from the Cordova build commands.

### SEY_NOBROWSERIFY

This will disable passing the `--browserify` flag to the Cordova build
commands.

### SEY_PREFERENCE_*

This will allow you to set and override preferences globally in config.xml.

For example, you could specify `SEY_PREFERENCE_backgroundColor=FF0000FF` to
override the `backgroundColor` preference in config.xml.

### SEY_\*\_PREFERENCE\_\*

This will allow you to set and override platform specific preferences in config.xml.

For example, you could specify `SEY_IOS_PREFERENCE_SasApiKey=123456789` to
override the `SasApiKey` preference nested in the ios platform in config.xml.


Contributing
------------

Contributions of bug reports, feature requests, and pull requests are greatly appreciated!

Please note that this project is released with a [Contributor Code of Conduct](https://github.com/dpogue/seymour/blob/master/CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

Licence
-------

Copyright © 2015 Darryl Pogue & Ayogo Health Inc.  
Licensed under the Apache 2.0 Licence.
