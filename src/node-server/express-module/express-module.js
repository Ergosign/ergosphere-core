
var gruntConnectWrapper = require('../grunt-connect-wrapper/gruntConnectWrapper.js');

var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');

var app = express();

var ergosphereConfig = JSON.parse(fs.readFileSync("config/ergosphere-configuration.json"));

var sslConfig = ergosphereConfig.ssl_config;

if (sslConfig && sslConfig.use_ssl) {

    var ssl_options = {
        key: fs.readFileSync(sslConfig.key_path),
        cert: fs.readFileSync(sslConfig.cert_path),
        ca: fs.readFileSync(sslConfig.ca_path)
    };


    app.set('port', process.env.PORT || 443);

    app.use(express.static('./www'));

//Error Handling
    app.use(function (req, res) {
        res.type('text/plain');
        res.status(404);
        res.send('404 - Not Found');
    });

    app.use(function (err, req, res, next) {
        console.log(err.stack);
        res.type('text/plain');
        res.status(500);
        res.send('500 - Internal Error');
    });

//var server = http.createServer(app);
    var secureServer = https.createServer(ssl_options, app);
}

    exports.start = function () {
    if (sslConfig && sslConfig.use_ssl) {

        secureServer.listen(443, function () {

            console.log('Server listening at port' + app.get('port'));

            gruntConnectWrapper.onServerCreate(this, null, null);
        });
    }else{
        console.log("No SSL configured - Server not started");
    }
    };



