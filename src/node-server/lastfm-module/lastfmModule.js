/**
 * Dependencies
 */
var LastFmNode = require('lastfm').LastFmNode;
var cacheModule = require('../cache-module/cacheModule.js');
var userModule = require('../user-module/userModule.js');

var fs = require("fs");
var ergosphereConfig = JSON.parse(fs.readFileSync("config/ergosphere-configuration.json"));


var artists = [];
var albums = [];
var waitForLastfmUserDataArtists = 0;
var waitForLastfmUserDataAlbums = 0;

exports.emitCachedValueToSocket = function(socket){
    var lastfmArtistsCache = cacheModule.read('lastFM-artists');
    var lastfmAlbumsCache = cacheModule.read('lastFM-albums');

    socket.emit('lastfmAlbums', lastfmAlbumsCache);
    socket.emit('lastfmArtists', lastfmArtistsCache);

};

exports.getLastfmData = function(count, lastfm, esUserInfo, io){

    lastfm.request("user.getTopArtists", {
        user: esUserInfo[count].lastfm,
        period: '1month',
        limit: 5,
        handlers: {
            success: function(data) {

                var charts = [];

                if(data.topartists.artist !== undefined){

                    data.topartists.artist.forEach(function(artist){

                        var chart = {
                            artist: artist.name,
                            playCount : parseInt(artist.playcount, 10),
                            img: artist.image[2]['#text'] //2 = large
                        };
                        charts.push(chart);
                    });
                }

                var locationData = null;
                artists.forEach(function(compareLocationData){
                    if (compareLocationData.locationCode == esUserInfo[count].locationCode){
                        locationData = compareLocationData;
                    }
                });

                if (!locationData){
                    locationData = {};
                    locationData.locationCode = esUserInfo[count].locationCode;
                    locationData.charts = [];
                    artists.push(locationData);
                }

                locationData.charts = locationData.charts.concat(charts);

                waitForLastfmUserDataArtists--;

                if(waitForLastfmUserDataArtists === 0){
                    cacheModule.write('lastFM-artists', artists);
                    io.emit("lastfmArtists", artists);
                    waitForLastfmUserDataArtists = 0;
                }



            },
            error: function(error) {
                console.log("Error: "+ error.message);
            }
        }
    });

    lastfm.request("user.getTopAlbums", {
        user: esUserInfo[count].lastfm,
        period: '1month',
        limit: 5,
        handlers: {
            success: function(data) {

                var charts = [];

                if(data.topalbums.album !== undefined){

                    data.topalbums.album.forEach(function(album){
                        var chart = {
                            album: album.name,
                            artist: album.artist.name,
                            playCount : parseInt(album.playcount, 10),
                            img: album.image[2]['#text'] //2 = large
                        };
                        charts.push(chart);
                    });

                }

                var locationData = null;
                albums.forEach(function(compareLocationData){
                    if (compareLocationData.locationCode == esUserInfo[count].locationCode){
                        locationData = compareLocationData;
                    }
                });

                if (!locationData){
                    locationData = {};
                    locationData.locationCode = esUserInfo[count].locationCode;
                    locationData.charts = [];
                    albums.push(locationData);
                }

                locationData.charts = locationData.charts.concat(charts);

                waitForLastfmUserDataAlbums--;

                if(waitForLastfmUserDataAlbums === 0){
                    cacheModule.write('lastFM-albums', albums);
                    io.emit("lastfmAlbums", albums);
                    waitForLastfmUserDataAlbums = 0;
                }



            },
            error: function(error) {
                console.log("Error: "+ error.message);
            }
        }
    });
};

exports.updateCacheAndBroadcast = function(io) {

    console.log("lastfm called");

    var lastfm = new LastFmNode(ergosphereConfig.lastfm_config);

    var esUserInfo = userModule.fetchUserByLocationWithLastFM();

    waitForLastfmUserDataAlbums = esUserInfo.length;
    waitForLastfmUserDataArtists = esUserInfo.length;

    for(var count = 0, len = esUserInfo.length; count < len; count++){

        this.getLastfmData(count, lastfm, esUserInfo, io);

    }

};

