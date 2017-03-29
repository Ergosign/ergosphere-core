/**
 * Dependencies
 */

var cacheModule = require('../cache-module/cacheModule.js');
var fs = require("fs");
var atob = require('atob')

var standorte = [
  "SB",
  "HH",
  "B",
  "ZH",
  "M"

];

exports.emitCachedValueToSocket = function(socket){
    var camera = cacheModule.readArray('camera');

    camera.forEach(function(camData){
        socket.emit('cam',camData);
    });

};

exports.writePhotoIntoCache = function(camData){

    var cachedPhotos = cacheModule.readArray('camera');
    var newCache = [];

    cachedPhotos.forEach(function(cachedPhoto){
        if(cachedPhoto.locationCode != camData.locationCode || cachedPhoto.kitchen != camData.kitchen){
            newCache.push(cachedPhoto);
        }
    });

    //Camera pictures of SB without kitchen definition are not cached!
    if (camData.locationCode != 'SB' || camData.kitchen != undefined){
        newCache.push(camData);
    }

   cacheModule.write('camera', newCache);

};

exports.writePhotoOnHardDrive = function(camData){

  //decode the dataURL to binary string
  var dataURI = camData.dataUrl;
  var byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = decodeURI(dataURI.split(',')[1]);
  }


  // separate out the mime component
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // write the bytes of the string to a typed array
  var ia = new Uint8Array(byteString.length);
  for (var i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }


  // convert the typed array to a node buffer
  var buf = new Buffer(ia, 'base64');

  imagenumbers = cacheModule.read("hires-pictures");


  // and finally write it all on the file system
  fs.writeFile("hires-pictures/" + camData.locationCode + "/" + imagenumbers[camData.locationCode]++ + ".png", buf);
  cacheModule.write("hires-pictures", imagenumbers)

};



exports.buildHiResPicturesCacheAndFolder = function(){
  if (!fs.existsSync(cacheModule.getCacheDirectory() + "hires-pictures.json")) {

    //if the cache file doesn't exist, delete all images
    var dirPath = "hires-pictures/";
    standorte.forEach(function(standort){
      try { var files = fs.readdirSync(dirPath + standort + "/"); }
      catch(e) { return; }
      for (var i = 0; i < files.length; i++) {
        var filePath = dirPath + standort + '/' + files[i];
        fs.unlinkSync(filePath);
      }
    });

    //and create the Cache file to track the image numbers
    cacheModule.write('hires-pictures',
      {
        SB: 0,
        HH: 0,
        B: 0,
        ZH: 0,
        M: 0
      });
  }

  // create directories for the images
  if (!fs.existsSync("hires-pictures")){
    fs.mkdirSync("hires-pictures");
  }

  standorte.forEach(function(standort){
    if (!fs.existsSync("hires-pictures/" + standort)){
      fs.mkdirSync("hires-pictures/" + standort);
    }
  });

};



exports.processWebcamPhoto = function(io, camData, buildHiResPictures){

    var base = this;

    //send image to clients
    io.emit('cam', camData);
    base.writePhotoIntoCache(camData);

  if (buildHiResPictures)
    base.writePhotoOnHardDrive(camData);

};
