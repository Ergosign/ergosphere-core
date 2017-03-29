var cacheModule = require('../cache-module/cacheModule.js');
var userModule = require('../user-module/userModule.js');
var fs = require("fs");
var YQL = require('yql');

var ergosphereConfig = JSON.parse(fs.readFileSync("config/ergosphere-configuration.json"));


exports.emitCachedValueToSocket = function (socket) {
  var base = this;
  var cached = cacheModule.read('weather');

  cached.forEach(function (cityObject) {
    cityObject.backgroundImageName = base.randomVariantImageForWeatherCodeAndCity(cityObject.conditionCode, cityObject.locationCode);
  });

  socket.emit('weather', cached);
};

exports.buildVariantsCache = function () {

  var cityCodes = userModule.fetchCityCodes();
  var varaintsByCity = {};
  cityCodes.forEach(function (cityCode) {
    var cityVariants = {};
    var filesForCity = fs.readdirSync("www/img/resp-images/weather/city/" + cityCode);
    filesForCity.forEach(function (file) {
      var fileSplit = file.split('.');
      if (fileSplit[1] != "jpg") {
        return;
      }
      var filenameComponents = fileSplit[0].split('-');
      var prefix = filenameComponents[0];
      if (!cityVariants[prefix]) {
        cityVariants[prefix] = 1;
      } else {
        cityVariants[prefix]++;
      }
    });
    varaintsByCity[cityCode] = cityVariants;
  });


  cacheModule.write('weather-variants', varaintsByCity);
};

exports.mapWeatherCodeToFileNamePrefix = function (conditionCode) {

  var weatherMappings = JSON.parse(fs.readFileSync(ergosphereConfig.weather_mappings_path));

  return weatherMappings.mappings[conditionCode];
};

exports.randomVariantImageForWeatherCodeAndCity = function (conditionCode, cityCode) {
  var base = this;
  var fileNamePrefix = base.mapWeatherCodeToFileNamePrefix(conditionCode);

  var weatherVaraints = cacheModule.read("weather-variants");

  var numberOfVaraints = weatherVaraints[cityCode][fileNamePrefix];

  var randomSuffix = Math.floor(Math.random() * numberOfVaraints + 1) - 1;

  if (randomSuffix == 0) {
    numberOfVaraints = 1;
  }
  if (numberOfVaraints == 1) {
    return fileNamePrefix + "-shrunk.jpg";
  }

  return fileNamePrefix + "-" + randomSuffix + "-shrunk.jpg";
};

exports.updateCacheAndBroadcast = function (io, nextLoopRun) {
  var base = this;

  //build the loctionIds
  var locationIds = base.yahooLocationCodesArray();

  locationIds.forEach(function (yahooWoeId) {

    var query = new YQL('select item.condition.code,item.condition.temp from weather.forecast where woeid = ' + yahooWoeId + ' and u= \'c\'');

    query.exec(function (err, data) {

      var cachedWeather = cacheModule.readArray('weather');

      var updatedCityWeather = [];

      //loop through the results
      var result = data.query.results.channel;

      var conditionCode = result.item.condition.code.trim();
      var temperature = result.item.condition.temp.trim();

      //map the localtion codes to our location codes
      var ergoCity = base.mapWoeIdToCity(yahooWoeId);

      var foundCachedCity = null;

      cachedWeather.forEach(function (cachedCity) {
        //find our city in the cache
        if (cachedCity.locationCode === ergoCity.code) {
          foundCachedCity = cachedCity;
        }
      });

      var cityObject = {};
      cityObject.locationCode = ergoCity.code;
      cityObject.temp = temperature;
      cityObject.conditionCode = conditionCode;
      cityObject.backgroundImageName = base.randomVariantImageForWeatherCodeAndCity(conditionCode, ergoCity.code);

      if (!foundCachedCity) {
        updatedCityWeather.push(cityObject);
        cachedWeather.push(cityObject);
      } else {
        if (foundCachedCity.temp !== cityObject.temp || foundCachedCity.code !== cityObject.code) {
          updatedCityWeather.push(cityObject);
          //replace in cache
          var cachedCityIndex = cachedWeather.indexOf(foundCachedCity);
          cachedWeather = cachedWeather.splice(cachedCityIndex, 1);
          cachedWeather.push(cityObject);
        }
      }

      cacheModule.write('weather', cachedWeather);

      //emit any new results
      if (updatedCityWeather.length > 0) {
        io.emit('weather', updatedCityWeather);
      }

    });


  });


  //loop
  setTimeout(function () {
    base.updateCacheAndBroadcast(io, nextLoopRun);
  }, nextLoopRun);


};
/**
 *
 * @param {string} requiredCode The Yahoo region code for the city
 * @return {string} the reference used by ergosphre for the city
 */
exports.mapWoeIdToCity = function (yahooWoeId) {

  //load the cities JSON
  var citiesList = JSON.parse(fs.readFileSync(ergosphereConfig.city_data_path));

  var foundCity;

  citiesList.cities.forEach(function (city) {
    if (city.yahooWeatherId === yahooWoeId) {
      foundCity = city;
    }
  });

  if (!foundCity) {
    throw new Error("No City found for Yahoo Code:" + yahooWoeId);
  }


  //return the user or []
  return foundCity;

};
/**
 * This method looks up all the cities from the city-list.json and returns any found Yahoo Location Ids
 *
 * @return {number[]} an array of the yahoo locaiton codes
 */
exports.yahooLocationCodesArray = function () {

  //load the cities JSON
  var citiesList = JSON.parse(fs.readFileSync(ergosphereConfig.city_data_path));

  var foundYahooLocationIds = [];

  citiesList.cities.forEach(function (city) {
    if (city.yahooWeatherId != null) {
      foundYahooLocationIds.push(city.yahooWeatherId);
    }
  });

  return foundYahooLocationIds;

};

