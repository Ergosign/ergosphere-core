/**
 * Dependencies
 */
var Twitter = require('twitter');
var cacheModule = require('../cache-module/cacheModule.js');
var userModule = require('../user-module/userModule.js');
var Autolinker = require('autolinker');

var moment = require('moment');
var fs = require("fs");
var ergosphereConfig = JSON.parse(fs.readFileSync("config/ergosphere-configuration.json"));

exports.calculateTweetsFromCurrentMonth = function(twitterCache)
{
    var todayMoment = new moment();
    var thirtyDaysAgoMoment = todayMoment.subtract(30, 'days');

    //recalculate the tweets in the last month
    twitterCache.forEach(function(locationData)
    {
        if (locationData.hasOwnProperty('tweets'))
        {
            var thisMonthCounter = 0;
            locationData.tweets.forEach(function(tweet)
            {
                if (thirtyDaysAgoMoment.isBefore(tweet.fulldate))
                {
                    thisMonthCounter++;
                }
            });
            locationData.numberOfTweetsThisMonth = thisMonthCounter;
        }
    });
};


exports.emitCachedValueToSocket = function(socket){
    var twitterCache = cacheModule.readArray('twitterCache');

    this.calculateTweetsFromCurrentMonth(twitterCache);

    socket.emit('twitter', twitterCache);

};

exports.updateCacheAndBroadcast = function(io) {

    var twiiterRef = this;

        console.log("In twitter update loop");
        this.fetchErgotweetsAndCacheByLocation(function(twitterCache){
            twiiterRef.calculateTweetsFromCurrentMonth(twitterCache);
            io.emit("twitter",twitterCache);
        });


    //start twitter update loop - every 5 minutes
    setTimeout(function(){
        twiiterRef.updateCacheAndBroadcast(io);
    },300000);
};

exports.fetchErgotweetsAndCacheByLocation = function(callback){
    var twitterClient = new Twitter(ergosphereConfig.twitter_config);

    //load the tweet index cache
    var twitterIndex = cacheModule.readArray("twitterIndex");

    //get last id from index
    var maxCachedId = 0;

    twitterIndex.forEach(function(existingTweetId){
        if (existingTweetId>maxCachedId){
            maxCachedId = existingTweetId;
        }
    });

    var twitterCallOptions = {
        owner_screen_name: "ergosign",
        slug: "colleagues-ergosign",
        count:"500",
        include_entities:false,
        include_rts:false
    };

    if (maxCachedId>0){
        twitterCallOptions.since_id = maxCachedId;
    }

    twitterClient.get('lists/statuses', twitterCallOptions, function(error, newTweets, response){

        //check for errors
        if(newTweets.hasOwnProperty('errors')) {
            // write errors comming from twitter
            newTweets.errors.forEach(function(error){
                console.log("ERROR in twitterModule: (message: " + error.message + ", code: " + error.code + ")");
            });
            return;
        }

        //load the tweet cache
        var twitterCache = cacheModule.readArray("twitterCache");

        //loop through the tweets
        newTweets.forEach(function(tweet){

            var tweetId = tweet.id;

            //check if the tweet is already in cache
            if (twitterIndex.indexOf(tweetId)<0){
                var date = new Date(tweet.created_at);
                var dateMoment = new moment(tweet.created_at, 'ddd MMM DD HH:mm:ss ZZ YYYY');
                var twitterUser = tweet.user;
                var twitterHandle = twitterUser.screen_name.toLowerCase();

                //lookup location for user
                var esUserInfo = userModule.fetchUserWithTwitterHandle(twitterHandle);
                if (!esUserInfo){
                    console.log("Could not map twitter user: "+twitterHandle+" to ES location - assuming SB - please updated city.list.json");
                    esUserInfo = {};
                    esUserInfo.locationCode = "SB";
                }

                //save the tweet
                twitterIndex.push(tweetId);
                var locationData =null;
                twitterCache.forEach(function(compareLocationData){
                   if (compareLocationData.locationCode == esUserInfo.locationCode){
                       locationData = compareLocationData;
                   }
                });

                if (!locationData){
                    locationData = {};
                    locationData.locationCode = esUserInfo.locationCode;
                    locationData.tweets = [];
                    locationData.numberOfTweetsThisMonth = 0;
                    twitterCache.push(locationData);
                }

                var ergoTweet = {
                    id:tweetId,
                    name : twitterUser.name,
                    screen_name : twitterHandle,
                    profile_image_url: twitterUser.profile_image_url,
                    text: Autolinker.link( tweet.text , {  className: 'twitter-popup', hashtag: 'twitter' }),
                    dateString:dateMoment.format('DD MMM'),
                    fulldate: date
                };

                locationData.tweets.push(ergoTweet);
            }
        });

        //sort the array with newest first
        twitterCache.forEach(function(locationData){
           locationData.tweets.sort(function(a, b) {
               return (b.id - a.id);
           })
        });


        //update the cache
        cacheModule.write('twitterIndex',twitterIndex);
        cacheModule.write('twitterCache',twitterCache);

        callback(twitterCache);
    });
};


