var fs = require("fs");

var ergosphereConfig = JSON.parse(fs.readFileSync("config/ergosphere-configuration.json"));

exports.fetchUserWithTwitterHandle = function(twitterName){

    //load the cities JSON
    var citiesList =  JSON.parse(fs.readFileSync(ergosphereConfig.city_data_path));

    var foundUser = null;

    //find the user
    citiesList.cities.forEach(function(city){
       city.people.forEach(function(person){
           var profileTwiiterName = person.twitter;
         if (profileTwiiterName && profileTwiiterName.toLowerCase()==twitterName){
                foundUser = person;
                foundUser.locationCode = city.code;
            }
       });
    });


    //return the user or null
    return foundUser;
};

exports.fetchUserByLocationWithLastFM = function(){

    //load the cities JSON
    var citiesList =  JSON.parse(fs.readFileSync(ergosphereConfig.city_data_path));

    var foundUser = [];

    //find users with lastfm account
    citiesList.cities.forEach(function(city){
        city.people.forEach(function(person){
            if(person.lastfm){
                foundUser.push({
                    'name' : person.name,
                    'lastfm' : person.lastfm,
                    'locationCode' : city.code
                });
            }
        });
    });


    //return the user or []
    return foundUser;

};

exports.fetchUserByLocation = function(){

    //load the cities JSON
    var citiesList =  JSON.parse(fs.readFileSync(ergosphereConfig.city_data_path));

    var foundUser = [];

    //find users with lastfm account
    citiesList.cities.forEach(function(city){
        city.people.forEach(function(person){
            foundUser.push({
                'ergoname' : person.ergoname,
                'locationCode' : city.code,
                'name': person.name
            });
        });
    });


    //return the user or []
    return foundUser;

};

exports.fetchCityCodes = function(){

    //load the cities JSON
    var citiesList =  JSON.parse(fs.readFileSync(ergosphereConfig.city_data_path));

    var foundCityCode = [];

    //find users with lastfm account
    citiesList.cities.forEach(function(city){
        foundCityCode.push(city.code);
    });


    //return the user or []
    return foundCityCode;

};
