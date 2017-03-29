var cacheModule = require('../cache-module/cacheModule.js');
var socketManagerModule = require('../socket-manager-module/socketManagerModule.js');

var moment = require('moment');

exports.clientErgoboardUpdate =  function(data,io){

    var ergoboardCache = cacheModule.read(cacheModule.cacheType.ERGOBOARD);

    if (ergoboardCache.backlog==null){
        ergoboardCache.backlog = [];
    }
    ergoboardCache.backlog.push(data);

    cacheModule.write(cacheModule.cacheType.ERGOBOARD, ergoboardCache);

    io.emit(socketManagerModule.socketMessageType.ERGOBOARD_SERVER_UPDATE, data);
}

exports.emitCachedValueToSocket = function(socket){
    // load from cache
    var ergoboardCache = cacheModule.read(cacheModule.cacheType.ERGOBOARD);

    // send cached values to the client
    socket.emit(socketManagerModule.socketMessageType.ERGOBOARD_CACHE_LOAD, ergoboardCache);
}

exports.clientDeleteAll = function(io){
    cacheModule.delete(cacheModule.cacheType.ERGOBOARD);
    // load from cache
    var ergoboardCache = cacheModule.read(cacheModule.cacheType.ERGOBOARD);

    // send cached values to the client
    io.emit(socketManagerModule.socketMessageType.ERGOBOARD_CACHE_LOAD, ergoboardCache);
}

exports.cacheDecayCleanupProcess = function(nextLoopRun){

    var base = this;

    var ergoboardCache = cacheModule.read(cacheModule.cacheType.ERGOBOARD);

    if (ergoboardCache.backlog){
        var newBacklog = [];

        var now = moment();

        ergoboardCache.backlog.forEach(function(ergoLine){
            var lineExpiryDate = moment(ergoLine.expiryDate);
            if (lineExpiryDate.isAfter(now)){
                newBacklog.push(ergoLine);
            }
        });

        ergoboardCache.backlog = newBacklog;

        cacheModule.write(cacheModule.cacheType.ERGOBOARD, ergoboardCache);

    }


    setTimeout(function(){
        base.cacheDecayCleanupProcess(nextLoopRun);
    },nextLoopRun);
}