
var _ = require('lodash');

//Read json config file for a page
module.exports  = function (params, callback)
{
    var assemble  = params.assemble;
    var grunt     = params.grunt;
    var jsonFilePath,jsonFileData;

    //Loop through all pages
    assemble.options.pages.forEach(function(currentPage){
        //Generate json filepath (json file has same name like the page .hbs file)
        jsonFilePath = currentPage.filePair.orig.cwd + '/' + currentPage.basename + '.json';

        //Check if json file exists for a page and merge data to the page.data object
        if (grunt.file.exists(jsonFilePath))
        {
            jsonFileData = grunt.file.readJSON(jsonFilePath);
            currentPage.data = _.merge(currentPage.data, jsonFileData);
        }
    });

    callback();

};

module.exports.options = {
    stage: 'assemble:post:pages'
};