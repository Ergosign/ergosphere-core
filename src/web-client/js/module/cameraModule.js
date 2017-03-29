/*
 * This file has been created by Ergosign GmbH - All rights reserved - http://www.ergosign.de
 * DO NOT ALTER OR REMOVE THIS COPYRIGHT NOTICE OR THIS FILE HEADER.
 *
 * This file and the code contained in it are subject to the agreed contractual terms and conditions,
 * in particular with regard to resale and publication.
 */

(function(jQuery)
{
	"use strict";
	/**
	 * This class represents the camera Module
	 *
	 * Class history:
	 *  - 0.1: First release
	 *
	 * @author jonasmohr
	 * @date 04.08.15
	 * @constructor
	 *
	 * @name modules.cameraModule
	 * @property {modules.cameraModule} base {@link modules.cameraModule.base base}
	 */
	jQuery.cameraModule = function(routingMoudule,el, options)
	{
		/**
		 * To  avoid scope issues, use 'base' instead of 'this'
		 * to reference this class from internal events and functions.
		 **/
		var base = this;

		/**
		 * configurable options
		 */
		base.options = {};

		/**
		 * init plugin on element
		 */
		base.init = function()
		{
			base.el = el;
			base.$el = $(base.el);
			base.io = io();
			base.routingModule = routingMoudule;

			var socket = base.io;

			base.misMatchPercentage = 3;
			base.paramTown = base.getUrlParameter("standort");
			base.paramKitchen = base.getUrlParameter("kueche");

			if(base.paramTown != undefined){

				base.cameraCanvas = document.createElement("canvas");
        base.cameraCanvas.width=200;
        base.cameraCanvas.height=150;
				base.photoCanvasContext = base.cameraCanvas.getContext("2d");
				base.video = document.createElement("video");
				base.videoOptions = true;

				// Grab elements, create settings, etc.
				base.camData = {
					'locationCode' : base.paramTown,
					'kitchen' :base.paramKitchen
				};

				navigator.getMedia = ( navigator.getUserMedia ||
				navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia ||
				navigator.msGetUserMedia);

				if (navigator.getMedia === navigator.mozGetUserMedia){
					base.videoOptions = { frameRate: { ideal: 10, max: 15 }, width: base.cameraCanvas.width, height: base.cameraCanvas.height  };
				}

				// Put video listeners into place
				navigator.getMedia(
					{
						video: base.videoOptions,
						audio: false
					},
					function(stream) {
						if (navigator.mozGetUserMedia) {
							base.video.mozSrcObject = stream;
						} else {
							var vendorURL = window.URL || window.webkitURL;
							base.video.src = vendorURL.createObjectURL(stream);
						}
						base.video.play();
					},
					function(err) {
						console.log("An error occured! " + err);
					}
				);

				socket.on('sendCam', base.sendWebCamToServer);
			}
		};

		base.getUrlParameter = function(sParam) {

			var sPageURL = window.location.search.substring(1);
			var sURLVariables = sPageURL.split('&');
			for (var i = 0; i < sURLVariables.length; i++)
			{
				var sParameterName = sURLVariables[i].split('=');
				if (sParameterName[0] == sParam)
				{
					return sParameterName[1];
				}
			}
		};

		base.cloneCanvas = function(oldCanvas) {

			//create a new canvas
			var newCanvas = document.createElement('canvas');
			var context = newCanvas.getContext('2d');

			//set dimensions
			newCanvas.width = oldCanvas.width;
			newCanvas.height = oldCanvas.height;

			//apply the old canvas to the new one
			context.drawImage(oldCanvas, 0, 0);

			//return the new canvas
			return newCanvas;
		};

		base.sendWebCamToServer = function(){

			//temp. clone old canvas
			var tmpCanvas = base.cloneCanvas(base.cameraCanvas);

			var tmpCanvasBlob, cameraCanvasBlob;

			//convert tmp canvas to image
			tmpCanvas.toBlob(function (blob) {
				tmpCanvasBlob = blob;
        //create new one
        base.photoCanvasContext.drawImage(base.video, 0, 0,base.cameraCanvas.width, base.cameraCanvas.height);
        base.camData.dataUrl = base.cameraCanvas.toDataURL();

        //convert new canvas to image
        base.cameraCanvas.toBlob(function (blob) {
          cameraCanvasBlob = blob;
          //compare both
          resemble(cameraCanvasBlob).compareTo(tmpCanvasBlob).onComplete(function(data){

            base.routingModule.initScreensaver();

            //only send to server if mismatch is high enough or the sending is being forced
            if(data.misMatchPercentage > base.misMatchPercentage){
              base.io.emit('newWebcamPhoto', base.camData);
            }
          });
        }, 'image/jpeg');
			}, 'image/jpeg');
		};

		base.init();
	};
})(jQuery);
