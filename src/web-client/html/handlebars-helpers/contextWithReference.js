var _ = require('lodash');

module.exports.register = function(Handlebars,options){

    var containerAppOptions = options;

    Handlebars.registerHelper('contextWithReference', function(sourceName,referenceKey,options) {

        var returnHTML= "";

        var originalContext = this;

        var sourceArray = [];

        //load the sourceArray using the sourceName
       if (containerAppOptions.data){
           //try to load the data from the assemble data items
           sourceArray = containerAppOptions.data[sourceName];
        }else if (this[sourceName]){
           //or load from the local context
           sourceArray = originalContext[sourceName];
       }

        //the context found from the sourceArray
        var foundContext = sourceArray[referenceKey];

        if (!foundContext){
            console.log("Error loading Key:"+referenceKey);
            return;
        }

        //merge the
        var mergedContext = _.merge(originalContext,foundContext);

        try{
            returnHTML +=  options.fn(mergedContext);
        }catch(err){
            console.log("Error loading context with reference: "+referenceKey+" error: "+err);
        }

        return new Handlebars.SafeString(returnHTML);
    });


};
