/**
 * Dependencies
 */
var fs = require("fs");

/*
 * Constants.
 */
 var cacheDircetory = "cache/";


exports.cacheType = {ERGOBOARD:"ergoboard"};

/*
 *	Creates cache.
 */
exports.createCache = function() {
    if(!fs.existsSync(cacheDircetory)){
        fs.mkdirSync(cacheDircetory);
    }
};

/*
 *	Oupputs the cache directory
 */
exports.getCacheDirectory = function(){
  return cacheDircetory;
};


/*
 * Write object to cache.
 */
exports.write = function(key, object){
	fs.writeFileSync(cacheDircetory + key + ".json", JSON.stringify(object));
};

/*
 * Read object from cache.
 */
exports.read = function(key) {
    try {
        // Query the entry
        if(fs.existsSync(cacheDircetory + key + ".json")){
            return JSON.parse(fs.readFileSync(cacheDircetory + key + ".json").toString());
        }
        return {};
    }
    catch (e) {
        console.log(e);
        return {};
    }
};

/*
 * Read object from cache.
 */
exports.readArray = function(key) {
    try {
        // Query the entry
        if(fs.existsSync(cacheDircetory + key + ".json")){
            return JSON.parse(fs.readFileSync(cacheDircetory + key + ".json").toString());
        }
        return [];
    }
    catch (e) {
        console.log(e);
        return [];
    }
};

/*
 * Delete object from cache.
 */
exports.delete = function(key) {
    try {
        if(fs.existsSync(cacheDircetory + key + ".json")){
            fs.unlinkSync(cacheDircetory + key + ".json")
        }
    }
    catch (e) {
        console.log(e);
    }
};

