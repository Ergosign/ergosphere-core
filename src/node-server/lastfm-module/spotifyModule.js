var SpotifyWebApi = require('spotify-web-api-node');

var fs = require("fs");
var ergosphereConfig = JSON.parse(fs.readFileSync("config/ergosphere-configuration.json"));


// credentials are optional
var spotifyApi = new SpotifyWebApi(ergosphereConfig.spotify_config);

exports.getURIbyArtistNameAndBroadcast = function (io, playData) {
    console.log(playData);
    spotifyApi.searchArtists(playData.artist)
        .then(function (data) {
            io.emit('play', {locationCode: playData.locationCode, url: data.body.artists.items[0].uri});
        }, function (err) {
            console.error(err);
        });
};

exports.getURIbyAlbumNameAndBroadcast = function (io, album) {

    spotifyApi.searchAlbums(album)
        .then(function (data) {
            io.emit('play', data.body.albums.items[0].uri);
        }, function (err) {
            console.log(err);
        });
};
