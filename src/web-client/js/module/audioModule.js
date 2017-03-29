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
	 * This class represents the audio Module
	 *
	 * Class history:
	 *  - 0.1: First release
	 *
	 * @author alexanderspies
	 * @date 13.08.15
	 * @constructor
	 *
	 * @name modules.audioModule
	 * @property {modules.audioModule} base {@link modules.cameraModule.base base}
	 */
	jQuery.audioModule = function(el, options)
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
			base.audioData = {};

			//Creates the audio context
			var AudioContext = window.AudioContext || window.webkitAudioContext;
			base.audioContext = new AudioContext();

			//Feature detection
			if (!navigator.getUserMedia)
				navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
				navigator.mozGetUserMedia || navigator.msGetUserMedia;

			if (navigator.getUserMedia)
			{
				navigator.getUserMedia({audio:true}, base.browserCanRecordAudio, function()
				{
					console.log('Error capturing audio.');
				});
			}
			else
				console.log('getUserMedia not supported in this browser.');

		};

		base.startTalking = function(event)
		{

			event.preventDefault();
			base.recorder.clear();
			base.recorder.record();

			$(this).addClass("pressed");

		};

		base.stopTalking = function(event)
		{
			var pushToTalkButton = event.currentTarget;

			base.audioData.locationCode = $(pushToTalkButton).data('city-code');
			base.audioData.comesFrom = base.getUrlParameter('kueche') ? base.getUrlParameter('kueche') : base.getUrlParameter('standort');

			window.setTimeout(function(){
				base.recorder.stop();

				base.recorder.exportWAV(function(dataview) {

					base.audioData.dataUrl = dataview.buffer;

					base.io.emit('newAudioTalk',base.audioData);

					$(pushToTalkButton).removeClass("pressed");
				});
			}, 1000);

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


		base.browserCanRecordAudio = function(stream)
		{
			var input = base.audioContext.createMediaStreamSource(stream);
			base.recorder = new Recorder(input);

			$('.city-module__audio').each(function(index, element)
			{
				var $pushToTalkBtn = $(element);

				//If mouse/finger goes down
				$pushToTalkBtn.on('mousedown touchstart', base.startTalking);

				//If mouse/finger goes up
				$pushToTalkBtn.on('mouseup touchend touchleave',base.stopTalking);
			});
		};

		base.onAudioUpdate = function(audioData)
		{
			if (audioData.comesFrom != base.getUrlParameter('kueche'))
			{
				base.recorder.playback(audioData.dataUrl);
			}
		};

		base.init();
	};
})(jQuery);