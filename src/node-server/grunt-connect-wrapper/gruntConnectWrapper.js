var cacheModule = require('../cache-module/cacheModule.js');

// connector modules
var coffeeCounter = require('../coffee-counter/coffeeCounter.js');
var weatherModule = require('../weather-module/weatherModule.js');
var twitterModule = require('../twitter-module/twitterModule.js');
var ergoboardModule = require('../ergoboard-module/ergoboardModule.js');
var lastfmModule = require('../lastfm-module/lastfmModule.js');
var spotifyModule = require('../lastfm-module/spotifyModule.js');
var camModule  = require('../cam-module/camModule.js');
var audioModule  = require('../audio-module/audioModule.js');
var socketManagerModule = require('../socket-manager-module/socketManagerModule.js');

var io;

var buildHiResPictures = false;


exports.onServerCreate = function (server, connect, options){
    //build new cache
    console.log("Server created");
    cacheModule.createCache();
    cacheModule.delete(cacheModule.cacheType.ERGOBOARD);

    //setup the web socket server
    io = require('socket.io').listen(server);

    //load latest data for relevant modules
    weatherModule.buildVariantsCache();
    weatherModule.updateCacheAndBroadcast(io,900000); //every 15 minutes update the weather
    twitterModule.updateCacheAndBroadcast(io);
    // xmppModule.updateCacheAndBroadcast(io);
    lastfmModule.updateCacheAndBroadcast(io);

    //setup the cache decay process for ergoboard - every 2000ms
    ergoboardModule.cacheDecayCleanupProcess(2000);


    //setup the xmpp and coffee stats update process - every hour
    // xmppModule.updateHourlyStats(io, 3600000);
    // xmppModule.listenForNewMessages(io);
    coffeeCounter.updateHourlyStats(io, 3600000);

    //sets up cache for the information about high resolution pictures saved on the server's file system
    if (buildHiResPictures) {
      camModule.buildHiResPicturesCacheAndFolder();
      console.log("Webcam Pictures are saved on the server file system! Turn this feature off if not needed.");
    }

	//forces client to send webcam image - every second
	var base = this;

	base.emitCam = function(){
		io.emit('sendCam');

		setTimeout(function(){
			base.emitCam();
		},1000);
	};

	base.emitCam();

	base.emitChanges = function()
	{
		io.emit('serverRestarted');
	};

	setTimeout(function() {
		base.emitChanges();
	}, 5000);

	//method for each client connect
    io.sockets.on('connection', function(socket) {
        console.log("New client connected:", socket.request.connection.remoteAddress);

        socket.on(socketManagerModule.socketMessageType.ERGOBOARD_CLIENT_UPDATE, function(data){
            ergoboardModule.clientErgoboardUpdate(data,io);
        });

        socket.on(socketManagerModule.socketMessageType.ERGOBOARD_CLIENT_DELETE_ALL, function(data){
            ergoboardModule.clientDeleteAll(io);
        });

        // socket.on('msg', function(ergoname, locationName){
        //     console.log("received");
        //     xmppModule.sendMessage(ergoname+'@ergosign.de', 'Viele Grüße vom Standort ' + locationName);
        // });

        socket.on('coffee', function(loc){
			coffeeCounter.incrementCoffeeCounter (io, loc);
        });

        socket.on('playArtist', function(data){
            spotifyModule.getURIbyArtistNameAndBroadcast(io, data);
        });
        socket.on('playAlbum', function(album){
            spotifyModule.getURIbyAlbumNameAndBroadcast(io, album);
        });

        socket.on('newWebcamPhoto', function(video){
            camModule.processWebcamPhoto(io, video, buildHiResPictures);
        });

		socket.on('newAudioTalk', function(audio){
			audioModule.processAudioTalk(io, audio);
		});

        socket.on('registerStandortBrowser', function(standortCode){
            socket.join(standortCode);
        });

        weatherModule.emitCachedValueToSocket(socket);
        twitterModule.emitCachedValueToSocket(socket);
        ergoboardModule.emitCachedValueToSocket(socket);
        coffeeCounter.emitCachedValueToSocket(socket);
        // xmppModule.emitCachedValueToSocket(socket);
        lastfmModule.emitCachedValueToSocket(socket);
        camModule.emitCachedValueToSocket(socket);
    });
};

