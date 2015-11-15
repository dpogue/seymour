Seymour
=======

<p align="center">
  <img alt="" width="481" src="https://github.com/dpogue/seymour/blob/master/seymour.png">
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


### SEY_APP_NAME

This will override the application name defined in config.xml.

### SEY_APP_ID

This will override the application identifier defined in config.xml.

### SEY_APP_VERSION

This will override the application version defined in config.xml.

### SEY_VERBOSE

This will enable verbose logging from the Cordova build commands.


Licence
-------

Copyright © 2015 Darryl Pogue & Ayogo Health Inc.  
Licensed under the Apache 2.0 Licence.
