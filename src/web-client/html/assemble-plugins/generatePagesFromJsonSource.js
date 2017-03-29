
var _ = require('lodash');

var pushSubPages = function (previousStem,subPageTemplateName,subPagesData,pages,options)
{
    var subTargetStem = "";
    if (previousStem && previousStem.length>0){
        subTargetStem =previousStem+"-";
    }
    subTargetStem += subPageTemplateName.substr(0, subPageTemplateName.indexOf("-layout.hbs"));

    //loop through each page and generate a sub-page
    var counter = 0;
    subPagesData.forEach(function(subPageData)
    {
        var subPageTargetStem = subTargetStem + "-" + counter;
        var subPage = {
            data: {
                layout: subPageTemplateName
            },
            dest: options.dest + "/" + subPageTargetStem + options.target_extension
        };

        subPage.data = _.merge(subPage.data, subPageData);

        if (subPageData.subPages){
            subPage.data.jsonPageSubPageStem = subPageTargetStem +"-"+subPageData.subPageTemplateName.substr(0, subPageData.subPageTemplateName.indexOf("-layout.hbs"));
        }

        pages.push(subPage);

        if (subPageData.subPages){
            pushSubPages(subPageTargetStem,subPageData.subPageTemplateName,subPageData.subPages,pages,options);
        }


        counter++;
    });
};


module.exports  = function (params, callback) {


    var assemble  = params.assemble;
    var grunt     = params.grunt;
    var pages     = assemble.options.pages;
    var options   = assemble.options.json_generator || {};

    if (!options.src){
        callback();
        return;
    }

    var dataFile = grunt.file.exists(options.src) ? grunt.file.readJSON(options.src) : '';

    var indexPageTemplateName = dataFile["index-page-template"];

    var targetFileNameStem = indexPageTemplateName.substr(0,indexPageTemplateName.indexOf("-layout.hbs"));

    var currentPage = {
        data : {
            layout:indexPageTemplateName
        },
        dest:options.dest+"/"+targetFileNameStem+options.target_extension
    };

    //merge the page data into the context
    currentPage.data = _.merge(currentPage.data, dataFile);

    pages.push(currentPage);

    //pass the sub pages to another funtion to do the same
    if (dataFile.subPages){
        pushSubPages("",dataFile.subPageTemplateName,dataFile.subPages,pages,options);
    }

    callback();

};

module.exports.options = {
    stage: 'assemble:post:pages'
};