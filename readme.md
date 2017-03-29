# Ergosign ergosphere-new Style Guide & Examples

The source code for this project uses templates and SASS files to output the HTML, JavaScript and CSS of the required components.

The outputs of the project are built in the www folder using Grunt.

## Building the www folder

To build the www folder for this project we require that Node.js is installed.

To install Node.js - visit the [Node JS Website](http://nodejs.org).

Once node is installed it should be possible from the main directory (where the _Gruntfile.js is) to call:

    npm install
    
This will use the package.json file to install all the required components for Grunt to work.

To install grunt from the command line:

    npm install -g grunt-cli

The www can then be built with:

    grunt release

This builds the www directory.


## Making changes and running in Developer Mode

During development a local web server can be run that automatically rebuilds the www folder when changes are made.

To run this server use:

    grunt run
    
# Dependencies and licences

The project uses the following Javascript libraries:


## jQuery

This library is used to provide convenience functions and a framework for functions and re-use within our controls.

Website: http://jquery.com

Licence: MIT license

## Moment JS

This library is used for when manipulating times in JavaScript

Website: http://momentjs.com

Licence: MIT license