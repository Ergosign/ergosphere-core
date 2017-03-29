#!/usr/bin/env node

var gruntConnectWrapper = require('./lib/grunt-connect-wrapper/gruntConnectWrapper.js');
var server = require('./lib/express-module/express-module.js');


exports.loadGruntConnectWrapper = function(){
    return gruntConnectWrapper;
};


if (process.argv[2]==='startServer'){
    server.start();
}