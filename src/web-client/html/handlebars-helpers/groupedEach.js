module.exports.register = function (Handlebars, options)
{
    Handlebars.registerHelper('groupedEach', function(every, inputArray, options)
    {
        var out = "", rowContext, i;

        rowContext = {
            groupedRowItems:[]
        };

        if (!inputArray){
            console.log("Grouped Each requires an input Array");
            return out;
        }

        for (i = 0; i < inputArray.length; i++)
        {
            if (i > 0 && i % every === 0)
            {
                //use the row context to generate the HTML for that row
                out += options.fn(rowContext);
                //reset the row context
                rowContext.groupedRowItems = [];
            }
            rowContext.groupedRowItems.push(inputArray[i]);
        }
        //use the final row context to generate any required extra items
        if (rowContext.groupedRowItems.length>0){
            out += options.fn(rowContext);
        }

        return out;
    });
}