
var cacheModule = require('../cache-module/cacheModule.js');

exports.generateTemplate = function(){

    var counter = [],
        loc = ["B", "SB", "HH", "M", "ZH"],
        employees = [5, 68, 9, 11, 5];

    for ( var i=0; i<5; i++ ){
        counter.push({
            "locationCode": loc[i],
            "coffee": 0,
            "employees": employees[i],
            "last": 0
        })
    }
    return counter;
};

exports.emitCachedValueToSocket = function(socket){
    var counter = cacheModule.readArray("coffeeCounter");

    if (counter.length === 0){
        counter = this.generateTemplate();
        cacheModule.write("coffeeCounter",counter);
    }

    socket.emit("counterUpdate",counter);

    var stats = cacheModule.read('coffeeCounterStats');
    socket.emit('coffeeStats',stats);
};

exports.updateHourlyStats = function(io, nextLoopRun){

    var base = this;

    var d = new Date();

    //reset daily counter
    if(d.getHours() === 0){
        cacheModule.delete('coffeeCounter');
    }

    var cachedStats = cacheModule.readArray('coffeeCounterStats');
    var cachedCounter = cacheModule.readArray('coffeeCounter');

    //no stat file available, generate structure
    if(cachedStats.length === 0){
        cachedCounter.forEach(function(location){
            cachedStats.push({
                'locationCode': location.locationCode,
                'stats' : []
            });
        });
    }

    //run through coffee cache
    cachedCounter.forEach(function(loc){
        //run through stats cache
        cachedStats.forEach(function(location){
            if(loc.locationCode === location.locationCode){

                var flag = false;
                //check if there's an existing value for current hour
                location.stats.forEach(function(stat){
                    if(stat.hour === d.getHours()){
                        stat.coffeePerHead = loc.coffee / loc.employees;
                        flag = true;
                    }
                });

                //if no existing value for current hour
                if(!flag){
                    location.stats.push({
                        'hour': d.getHours(),
                        'coffeePerHead':   loc.coffee / loc.employees
                    });
                }

            }
        });
    });

    cacheModule.write('coffeeCounterStats', cachedStats);
    io.emit('coffeeStats', cachedStats);

    setTimeout(function(){
        base.updateHourlyStats(io, nextLoopRun);
    },nextLoopRun);
};


exports.incrementCoffeeCounter = function(io, loc){

    var counter = cacheModule.readArray("coffeeCounter");

    counter.forEach(function(location){
        if(location.locationCode == loc){


            if (location.coffee==null){
                location.coffee=0;
            }

            location.coffee++;

            location.last = new Date().getTime();

            cacheModule.write("coffeeCounter",counter);

            io.emit("counterUpdate",counter);

        }
    });

};