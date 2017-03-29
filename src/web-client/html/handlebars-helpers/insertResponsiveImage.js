
var imageSizes = {
    'S':[160,320,640],
    'L':[320,640,1280],
    'XL':[320,640,1280],
    '169':[320,640,960,1920],
    '169-infobox-half':[320,640,960,1920],
    '169-infobox-full':[320,640,960,1920]
};

var sizes = {
    'S':"(min-width:900px) 33vw, 50vw",
    'L':"(min-width:900px) 66vw, 100vw",
    'XL':"(min-width:900px) 66vw, 100vw",
    '169':"100vw",
    '169-infobox-half':"(min-width:900px) 33vw, 100vw",
    '169-infobox-full':"(min-width:900px) 66vw, 100vw"
};


module.exports.register = function(Handlebars) {
    Handlebars.registerHelper('insertResponsiveImage', function(imageName,imageSizing) {

        if (!imageName || imageName.length==0){
            return "";
        }
        var imageFolderPath = 'img/resp-images/';

        if(imageSizing=='thumb'){
            return '<img src="' + imageFolderPath+imageName+'-thumb.jpg" alt="Image Alt Text">';
        }

        var imageRatioSuffix = '1x1';
        if (imageSizing=='L'){
            imageRatioSuffix = '2x1';
        }else if(imageSizing.indexOf('169')==0){
            imageRatioSuffix = '169';
        }
        var imageStem = imageName + '-' + imageRatioSuffix;

        var responsiveImageHTML;
        //create the srcset relevant for this image size
        var srcset = '';
        imageSizes[imageSizing].forEach(function(size){
            srcset +=  imageFolderPath+imageStem+'-'+size+'.jpg'+' '+size+'w,';
        });
        //remove the last comma
        srcset = srcset.substring(0,srcset.length-1);

        responsiveImageHTML = '<img src="' + imageFolderPath+imageStem + '-'+imageSizes[imageSizing][0]+'.jpg" srcset="'+srcset+'" sizes="'+sizes[imageSizing]+'" title="Image Title" alt="Image Alt Text">';


        return new Handlebars.SafeString(responsiveImageHTML);
    });


};
