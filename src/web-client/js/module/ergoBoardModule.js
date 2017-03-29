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
     * This class represents the ergoboard Module
     *
     * Class history:
     *  - 0.1: First release
     *
     * @author albriggs
     * @date 03.06.15
     * @constructor
     *
     * @name modules.ergoboardModule
     * @property {modules.ergoboardModule} base {@link modules.ergoboardModule.base base}
     */
    jQuery.ergoboardModule = function(el, options)
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
        base.decayContext = null;
        base.cachedContext = null;
        base.foregroundContext = null;
		base.bufferContext = null;
        base.lastMousePositions = [];
        base.lastCounter=0;
        base.paint = false;
        base.penColor = "#df4b26";
        base.penSize = 10;
        base.lastPaint = 0;
        base.lineBeingDrawn = {
			color: '',
			start: null,
			segments: []
		};
        base.pngPreview = null;
        base.headerHeight = 0;
        base.cachedLines = [];
        base.decayingLines = [];
        base.decayInProgress = false;
		base.supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

        /**
         * init plugin on element
         */
        base.init = function()
        {
            base.el = el;
            base.$el = $(base.el);

            var canvasHeight = window.innerHeight - base.headerHeight;
            //setup the context

            var decayCanvasElement = base.$el.children(".ergoboard-canvas__decay")[0];
            decayCanvasElement.width = base.el.clientWidth;
            decayCanvasElement.height = canvasHeight;

            base.decayContext = decayCanvasElement.getContext("2d");
            base.decayContext.lineJoin = "round";
			base.decayContext.lineCap = "round";
            base.decayContext.lineWidth = base.penSize;

            var cachedCanvasElement = base.$el.children(".ergoboard-canvas__cached")[0];
            cachedCanvasElement.width = base.el.clientWidth;
            cachedCanvasElement.height = canvasHeight;

            base.cachedContext = cachedCanvasElement.getContext("2d");
            base.cachedContext.lineJoin = "round";
			base.cachedContext.lineCap = "round";
            base.cachedContext.lineWidth = base.penSize;

            var foregroundCanvasElement = base.$el.children(".ergoboard-canvas__foreground")[0];
            foregroundCanvasElement.width = base.el.clientWidth;
            foregroundCanvasElement.height = canvasHeight;

            base.foregroundContext = foregroundCanvasElement.getContext("2d");
            base.foregroundContext.lineJoin = "round";
			base.foregroundContext.lineCap = "round";
            base.foregroundContext.lineWidth = base.penSize;
            base.foregroundContext.strokeStyle = 'white';

			var bufferCanvasElement = base.$el.children(".ergoboard-canvas__buffer")[0];
			bufferCanvasElement.width = base.el.clientWidth;
			bufferCanvasElement.height = canvasHeight;

			base.bufferContext = bufferCanvasElement.getContext("2d");


            //Bind events for the respective device
			if(!base.supportsTouch)
			{
				//register for mouse events
				foregroundCanvasElement.addEventListener("mousedown", base._mouseDown, false);
				foregroundCanvasElement.addEventListener("mousemove", base._mouseMove, false);
				foregroundCanvasElement.addEventListener("mouseup", base._mouseUp, false);
				foregroundCanvasElement.addEventListener("mouseleave", base._mouseUp, false);
			}
			else
			{
				//register for touch events
				foregroundCanvasElement.addEventListener("touchstart", base._mouseDown, false);
				foregroundCanvasElement.addEventListener("touchmove", base._mouseMove, false);
				foregroundCanvasElement.addEventListener("touchend", base._mouseUp, false);
				foregroundCanvasElement.addEventListener("touchcancel", base._mouseUp, false);
				foregroundCanvasElement.addEventListener("touchleave", base._mouseUp, false);
			}

            var deleteAllButton = base.$el.find(".ergoboard-button")[0];
            deleteAllButton.onclick = base._onDeleteAllClick;

			function getUrlParameter(sParam)
			{
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
			}

			//changes color if parameter 'standort' is set
			switch(getUrlParameter('standort')){
				case "B":
					base.penColor = "#FFDE1D";
					break;
				case "SB":
					base.penColor = "#028919";
					break;
				case "HH":
					base.penColor = "#009DE0";
					break;
				case "M":
					base.penColor = "#D6007F";
					break;
				case "ZH":
					base.penColor = "#040470";
					break;
			}

            //start the processing of decaying items
            base._decayingLinesCheck(1000);
			//TODO - BUG decaying lines sometimes disappearing to fast (directly after we painted it)

            //on window resize, resize canvas elements too
            $( window ).resize(function() {

                //save the entire canvas itself by drawing it to an in-memory canvas, setting the original width, and drawing the in-memory canvas back to the original canvas.
                function resizeCanvas(canvasRef, ctx) {
                    var inMemCanvas = document.createElement('canvas');
                    var inMemCtx = inMemCanvas.getContext('2d');

                    inMemCanvas.width = canvasRef.width;
                    inMemCanvas.height = canvasRef.height;
                    inMemCtx.drawImage(canvasRef, 0, 0);
                    canvasRef.width =  base.el.clientWidth;
                    canvasRef.height = window.innerHeight - base.headerHeight;
                    ctx.drawImage(inMemCanvas, 0, 0);
                    ctx.lineWidth = base.penSize;
                }

                resizeCanvas(decayCanvasElement, base.decayContext);
                resizeCanvas(cachedCanvasElement, base.cachedContext);
                resizeCanvas(foregroundCanvasElement, base.foregroundContext);

            });
        };

        base._mouseRelativePositionFromEvent = function(event)
        {
			//If user draw on a touch screen, get the touch points instead the mouse points
			if(event.touches)
			{
				// Only deal with one finger
				if (event.touches.length == 1)
				{
					var touch = event.touches[0];
					var touchX = touch.pageX - base.el.offsetLeft;
					var touchY = touch.pageY - base.el.offsetTop - base.headerHeight;

					return {x: touchX, y: touchY};
				}
			}
			else
			{
				var mouseX = event.pageX - base.el.offsetLeft;
				var mouseY = event.pageY - base.el.offsetTop - base.headerHeight;

				return {x: mouseX, y: mouseY};
			}
        };

        base._mouseDown = function(event){
			if(event.touches)
			{
				if (event.touches.length != 1)
				{

					base._mouseUp(event);

					return;
				}
			}
            var mousePosition = base._mouseRelativePositionFromEvent(event);

            base.foregroundContext.strokeStyle = base.penColor;

            base.lastForegroundPoint = mousePosition;
            base.paint = true;
            base.lastCounter = 0;
            base.lastPaint = 0;
            base.$el.mousemove(base._mouseMove);
            base.lineBeingDrawn = {
                color:base.penColor,
                start:mousePosition,
                segments: []
            };
        };

        base._mouseMove = function(event) {
            if(base.paint){
                event.preventDefault();
                var timedifference = event.timeStamp - base.lastPaint;
                if (timedifference > 25){
                    base.lastPaint = event.timeStamp;


                    var mousePosition = base._mouseRelativePositionFromEvent(event);

                    switch(base.lastCounter){
                        case 0:
                            base.lastMousePositions[1] = mousePosition;
                            base.lastCounter++;
                            break;
                        case 1:
                            base.lastMousePositions[0] = mousePosition;
                            base.lastCounter++;
                            break;
                        default:

                            var lineSegment = [base.lastMousePositions[1],
                                base.lastMousePositions[0],
                                mousePosition];
                            base.lineBeingDrawn.segments.push(lineSegment);

                            base.lastCounter=0;
                            break;
                    }

                    base.foregroundContext.beginPath();
                    base.foregroundContext.moveTo(base.lastForegroundPoint.x, base.lastForegroundPoint.y);
                    base.foregroundContext.lineTo(mousePosition.x, mousePosition.y);
					base.foregroundContext.stroke();

                    base.lastForegroundPoint = mousePosition;

                }
            }
        };

        base._mouseUp = function(event){
            if (base.paint)
            {
                base.paint = false;

                //add the last point
                var mousePosition = base.lastForegroundPoint;
                var lineSegment = [mousePosition, mousePosition, mousePosition];

                base.lineBeingDrawn.segments.push(lineSegment);
                base.lineBeingDrawn.expiryDate = moment().add(30, 'minutes');

                //send line to server
                routingModule.io.emit('ergoboard-client-update', base.lineBeingDrawn);

                /*base._refreshPreviewImage();*/
            }
        };

		base._refreshPreviewImage = function()
		{
            var buffer_img = new Image();

			//Clear buffer canvas
			base.bufferContext.clearRect(0,0,base.bufferContext.canvas.width,base.bufferContext.canvas.height);

            //Combine the canvases into one
			base.bufferContext.drawImage(base.cachedContext.canvas, 0, 0);
			base.bufferContext.drawImage(base.decayContext.canvas, 0, 0);

			buffer_img.src = base.bufferContext.canvas.toDataURL("image/png");

			base.pngPreview = buffer_img.src;

			//Update ergoboard preview image in the navigation
			$('#ergoboardPreview').css({'background': 'url(' + base.pngPreview + ') center no-repeat', 'background-size': '48px'});
		};


        base.onServerUpdate = function(ergoLine){
                //save the line in the local cache
                base.cachedLines.push(ergoLine);
                //draw the new line or check if we only touch one point and draw a arc

                base.drawLine(ergoLine);

                base._refreshPreviewImage();
                //clear the foreground context as the line is now drawn on the cache
                base.foregroundContext.clearRect(0,0,base.foregroundContext.canvas.width,base.foregroundContext.canvas.height);
        };

        base.onServerCacheLoad = function(drawingCache){
			//Reset png preview image
			//$('#ergoboardPreview').css({'background': 'none'});

            base.cachedLines = [];
            base.cachedContext.clearRect(0,0,base.cachedContext.canvas.width,base.cachedContext.canvas.height);
            if (drawingCache.backlog){
                base.cachedLines = drawingCache.backlog;
                drawingCache.backlog.forEach(base.drawLine);
            }

			base._refreshPreviewImage();
        };

        base._onDeleteAllClick = function(event){

            routingModule.io.emit("ergoboard-client-delete-all", {});
        };

        base._decayingLinesCheck = function(delayUntilNextLoop){

            var now = moment();

            var newCachedLines = [];

            //check though all local cached lines - if any are about to expire then move them into the decay process
            base.cachedLines.forEach(function(ergoLine){
                var lineExpiryDate = moment(ergoLine.expiryDate);
                if (lineExpiryDate.isBefore(now)){
                    //add to decaying lines
                    base.decayingLines.push(ergoLine);
                    ergoLine.decayCounter=0;
                }else{
                    newCachedLines.push(ergoLine);
                }
            });

            base.cachedLines = newCachedLines;

            //process the decay list
            if (base.decayingLines.length>0){
                //draw the decay layer with the new items
                if (!base.decayInProgress){
                    //start the decayProcess - on a 100ms loop
                    base._processDecayingLines(100);
                }

                //redraw the cachedLayer
                base.cachedContext.clearRect(0,0,base.cachedContext.canvas.width,base.cachedContext.canvas.height);
                base.cachedLines.forEach(base.drawLine);
                base._refreshPreviewImage();
            }

            window.setTimeout(base._decayingLinesCheck,delayUntilNextLoop,delayUntilNextLoop);
        };

        base._processDecayingLines = function(nextLoopDelay){

            base.decayInProgress = true;

            var stillProcessing = false;

            base.decayContext.clearRect(0,0,base.decayContext.canvas.width,base.decayContext.canvas.height);


            base.decayingLines.forEach(function(ergoLine){
                //remove lines that are too old
                if (ergoLine.decayCounter>300){
                    return;
                }

                stillProcessing = true;

                var baseOpacity = 0.8;

                var opacityReductionFactor = ergoLine.decayCounter/200 ;

                baseOpacity = baseOpacity - opacityReductionFactor;

                var lastPoint = ergoLine.start;

                //draw the decaying line
                ergoLine.segments.forEach(function(segment,segmentIndex,segments){

                    var segmentIncreaseFactor = segmentIndex/segments.length*0.7;

                    var segmentOpacity = baseOpacity + segmentIncreaseFactor;

                    var bigint = parseInt( ergoLine.color.replace(/[^0-9A-F]/gi, ''), 16);
                    var r = (bigint >> 16) & 255;
                    var g = (bigint >> 8) & 255;
                    var b = bigint & 255;

                    var segmentColor = 'rgba('+ r +','+ g +','+ b +','+segmentOpacity+')';

                    base.decayContext.strokeStyle = segmentColor;
                    base.decayContext.beginPath();
                    base.decayContext.moveTo(lastPoint.x, lastPoint.y);

                    base.decayContext.bezierCurveTo(segment[0].x,segment[0].y,segment[1].x,segment[1].y,segment[2].x,segment[2].y);
                    base.decayContext.stroke();
                    lastPoint = segment[2];
                });


                ergoLine.decayCounter++;
            });

            if (stillProcessing){
                window.setTimeout(base._processDecayingLines,nextLoopDelay,nextLoopDelay)
            }else{
                base.decayInProgress = false;
            }
        };

        base.drawLine = function(ergoLine)
		{
			base.cachedContext.strokeStyle = ergoLine.color;

			//Other drawing options set in _init function

            base.cachedContext.beginPath();
            base.cachedContext.moveTo(ergoLine.start.x, ergoLine.start.y);

			ergoLine.segments.forEach(function(lineSegment)
			{
				base.cachedContext.bezierCurveTo(lineSegment[0].x, lineSegment[0].y, lineSegment[1].x, lineSegment[1].y, lineSegment[2].x, lineSegment[2].y);
				base.cachedContext.moveTo(lineSegment[2].x, lineSegment[2].y);
			});

			//base.cachedContext.closePath();
			base.cachedContext.stroke();

        };

        base.init();
    };
})(jQuery);