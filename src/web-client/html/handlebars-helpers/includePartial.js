
module.exports.register = function(Handlebars, options, params) {

    Handlebars.registerHelper('includePartial', function(name,context) {

        var template = Handlebars.partials[name];
        var output;
        if (typeof template == 'function'){
            output = template(context)
        }else{
            var fn = Handlebars.compile(template);

            output = fn(context);//.replace(/^\s+/, '');
        }

        return new Handlebars.SafeString(output);
    });


};
