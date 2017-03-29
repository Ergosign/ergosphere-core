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
     * This class represents the routingModule Module
     *
     * Class history:
     *  - 0.1: First release
     *
     * @author albriggs
     * @date 09.05.15
     * @constructor
     *
     * @name modules.routingModule
     * @property {modules.routingModule} base {@link modules.routingModule.base base}
     */
    jQuery.routingModule = function(el, options)
    {
        /**
         * To  avoid scope issues, use 'base' instead of 'this'
         * to reference this class from internal events and functions.
         * @member {modules.toggleButton} base
         *
         *
         * @property {{}} options {@link modules.toggleButton.base.options base.options}
         *
         * @property {Function} init {@link modules.toggleButton.base.init base.init}
         *
         *
         * @memberOf modules.toggleButton
         **/
        var base = this;

        /**
         * configurable options
         */
        base.options = {
			screensaverIdleTime: 300,			//Idletime for the screensaver in seconds
			screensaverSpeedModifier: 0.1		//Speed modifier for the screensaver
		};

        /**
         * init plugin on element
         */
        base.init = function()
        {
            base.el = el;
            base.$el = $(base.el);
			base.$screensaver = $('#screensaver');
            base.io = io();
			base.popupWindow = null;

			base.mouseTimeout = null;
			base.screensaverActive = false;

			base.msgTimer = null;

            var socket = base.io;

            // in the future with more ergoboards (one for each location?) then this will have to be modified
            base.ergoboard =  new jQuery.ergoboardModule($(".ergoboard-container")[0]);

			base.camera = new jQuery.cameraModule(base);
			base.audio = new jQuery.audioModule();

			socket.on('connect',function(data){
				var standortCode = base.getUrlParameter('standort');
				if (standortCode){
					socket.emit('registerStandortBrowser',standortCode);
				}
			});

            socket.on('error', console.error.bind(console));

            socket.on('message', base.onMessage);

            socket.on('twitter',base.onTwitterUpdate);

            socket.on('weather', base.onWeatherUpdate);

            socket.on('jabber', base.onXMPPUpdate);
            socket.on('chatStats', base.onChatStatsUpdate);
			socket.on('onNewMsgReceive', base.onNewMsgReceive);

            socket.on('lastfmArtists', base.onLastfmArtistsUpdate);
            socket.on('lastfmAlbums', base.onLastfmAlbumsUpdate);
            socket.on('play', base.onPlaySong);


            socket.on('cam', base.onCamUpdate);
			socket.on('audio', base.audio.onAudioUpdate);

            socket.on('ergoboard-server-update', base.ergoboard.onServerUpdate);

            socket.on('ergoboard-cache-load', base.ergoboard.onServerCacheLoad);

            socket.on('counterUpdate', base.onCounterUpdate);
            socket.on('coffeeStats', base.onCoffeeStatsUpdate);

			socket.on('serverRestarted', base.refreshClientPage);

			base.initScreensaver = function(){
				clearTimeout(base.mouseTimeout);

				if (base.screensaverActive)
					base.stopScreensaver();

				base.mouseTimeout = setTimeout(function()
				{
					base.showScreensaver();
				}, 1000 * base.options.screensaverIdleTime);
			};

			//Bind mousemove for the screensaver
			$(document).mousemove(function()
			{
				base.initScreensaver();
			});
        };

		//Start and show screensaver
		base.showScreensaver = function()
		{
			base.$screensaver.fadeIn();

			base.screensaverActive = true;
			base.screensaverAnimateDiv();
		};

		//Stop and fadeout screensaver
		base.stopScreensaver = function()
		{
			base.$screensaver.fadeOut();
			base.screensaverActive = false;
		};

		//Generate new random position for the screensaver logo
		base.screensaverMakeNewPosition = function()
		{
			// Get viewport dimensions (remove the dimension of the div)
			var h = $('#screensaver').height() - $('#logo-container .logo-text').width();
			var w = $('#screensaver').width() - $('#logo-container .logo-text').height();

			var nh = Math.floor(Math.random() * h);
			var nw = Math.floor(Math.random() * w);

			return [nh,nw];

		}

		//Animate the screensaver logo movement
		base.screensaverAnimateDiv = function()
		{
			var newq = base.screensaverMakeNewPosition();
			var oldq = $('#logo-container').offset();
			var speed = base.screensaverCalcSpeed([oldq.top, oldq.left], newq);

			if(base.screensaverActive)
			{
				$('#logo-container').animate({top: newq[0], left: newq[1]}, speed, function()
				{
					base.screensaverAnimateDiv();
				});
			}

		};

		//Generate random movement speed for the screensaver logo
		base.screensaverCalcSpeed = function(prev, next)
		{
			var x = Math.abs(prev[1] - next[1]);
			var y = Math.abs(prev[0] - next[0]);

			var greatest = x > y ? x : y;
			var speed = Math.ceil(greatest/base.options.screensaverSpeedModifier);

			return speed;

		}

		//Refresh the client page after a server restart
		base.refreshClientPage = function()
		{
			//FALSE reload the site from cache
			location.reload(true);
		};

        base.onTwitterUpdate = function(twitterData){
          twitterData.forEach(function(locationData){
                var locationDiv = $("#city_" + locationData.locationCode);
                var container = locationDiv.find(".city-detail-content-tweets");

                container.html('');

                //load the tweets
                locationData.tweets.forEach(function(tweet){

                    container.append(
                        "<div class='tweet'>" +
							"<div class='tweet-author-image'><img src='" + tweet.profile_image_url +"'></div>" +
							"<div class='tweet-author-name'>" + tweet.name + "</div>" +
							"<div class='tweet-author-handle'>@" + tweet.screen_name +"</div>" +
							"<div class='tweet-date'>" + tweet.dateString + "</div>" +
							"<div class='tweet-text'>" + tweet.text + "</div>" +
                        "</div>"
                    );
                });

			    //Bind new click event to all autolinked twitter text links
				container.find(".tweet-text .twitter-popup").each(function(i, el)
				{
					$(el).on('click', function(event){base.openTwitterPopup(event)});
				});

                locationDiv.find(".city-module__twitter").find(".city-module__counter").html(locationData.numberOfTweetsThisMonth);
            });
        };

		base.openTwitterPopup = function(event)
		{
			event.preventDefault();

			if(base.popupWindow != null && !base.popupWindow.closed)
				base.popupWindow.close();

			var windowWidth = window.screen.availWidth,
				windowHeight = window.screen.availHeight,
				positionX = 0,
				positionY = 0,
				popupWidth = 0,
				popupHeight = 0;

			if(window.screen)
			{
				popupWidth = windowWidth * 70 / 100;
				popupHeight = windowHeight * 70 / 100;
			}

			positionX = (windowWidth - popupWidth) / 2;
			positionY = (windowHeight - popupHeight) / 2;

			var url = $(event.currentTarget).attr('href');
			base.popupWindow = window.open(url, "externalLinkPopup", "screenX=" + positionX + ", screenY=" + positionY + ", width=" + popupWidth + ", height=" + popupHeight + ", dialog=yes, directories=no, titlebar=no, toolbar=no, location=no, fullscreen=no, status=no, scrollbars=yes, resizable=no, menubar=no");
			base.popupWindow.focus();
		}

        base.onXMPPUpdate = function(xmppData){

            xmppData.forEach(function(locationData){

                var locationDiv = $("#city_" + locationData.locationCode);
                locationDiv.find(".city-module__jabber").find(".badge").html(locationData.percentOnline+'%').attr("title", locationData.totalOnline + " Personen online");

                var container = locationDiv.find(".city-detail-content-jabber-now");

                container.html('');

                locationData.people.forEach(function(user)
                {
                    if(user.state == "online"){
                        var content = "";
                        if(user.photo.type !== undefined){
                            content = "<img src='data:" + user.photo.type + ";base64," + user.photo.binval +"'>";
                        }
                        else{
                            var nameArr = user.name.split(" ");
                            var initials = nameArr[0].slice(0, 1) + nameArr[1].slice(0, 1);
                            content = "<span>"+initials+"</span>";
                        }

                        var status = "Online";
                        if(user.lastStatus !== null){
                            status = user.lastStatus;
                        }

                        var since = new Date().getTime() - user.since;
                        since = Math.floor(since/1000/60);

						var locationName = "";

						//Resolve locationCode to the name
						switch(base.getUrlParameter('standort')){
							case "B":
								locationName = "Berlin";
								break;
							case "SB":
								locationName = "Saarbrücken";
								break;
							case "HH":
								locationName = "Hamburg";
								break;
							case "M":
								locationName = "München";
								break;
							case "ZH":
								locationName = "Zürich";
								break;
						}

                        container.append(
                            "<div class='user'>" +
                            "<div class='user-image' data-bubble-ergoname='" + user.ergoname + "@ergosign.de'>"+content+"</div>" +
                            "<div class='user-name'>" + user.name + "</div>" +
                            "<div class='user-status'>" + status + " <span>"+since +"min </span></div>" +
                            "<div class='user-msg'> &#xE65C;  </div>" +
                            "</div>"
                        );

						//Get actual appended element
						// var $userMsgBtn = container.find('.user-msg').eq(-1);

						// //Bind click logic to this element (disable btn for 5 sec -> give user feedback that btn was clicked and prevent spam)
						// $userMsgBtn.on('click', function(event)
						// {
						// 	if(timer)
						// 		return;
                        //
						// 	io().emit("msg", user.ergoname, locationName);
                         //    console.log("emitted");
						// 	$(event.currentTarget).addClass('disabled');
                        //
						// 	var timer = setTimeout(function()
						// 	{
						// 		$(event.currentTarget).removeClass('disabled');
						// 		clearTimeout(timer);
						// 	}, 5000);
						// });
                    }

                });

            });
        };

		base.onNewMsgReceive = function(msgData)
		{
			base.audioNotification.stop();

			//Clear timeout if new message comes in
			if(base.msgTimer)
				clearTimeout(base.msgTimer);

			var locationDiv = $("#city_" + msgData.locationCode),
				container = locationDiv.find('.city-module__jabber-bubble');

			var content = "<div class='user-image'>";

			if(msgData.gravatar.type !== undefined)
			{
				content += "<img src='data:" + msgData.gravatar.type + ";base64," + msgData.gravatar.binval +"'>";
			}
			else
			{
				var nameArr = msgData.name.split(" ");
				var initials = nameArr[0].slice(0, 1) + nameArr[1].slice(0, 1);
				content += "<span>"+initials+"</span>";
			}

			content += "</div>";

			//Set text and user image and show message
			container.addClass('show');
			container.html(content + msgData.text);

			//Play notification sound if new message comes in
			base.audioNotification.play();

			setTimeout(function()
			{
				base.textToSpeech(msgData.text);
			}, 500);

			//Hide message after 20sec
			base.msgTimer = setTimeout(function()
			{
				container.removeClass('show');
			}, 20000);
		};

		//Funny shit -> Gives ergosphere emotions xD
		/*$(document).on('click touchstart', function()
		{
			var randomSpeech = [
				'aua',
				'',
				'das tut weh',
				'',
				'ich habe auch gefühle',
				'',
				'nicht so fest',
				'',
				'ich zerstöre mich gleich selbst',
				'',
				'streichel mich doch auchmal'
			];

			var randomIndex = Math.round(Math.random() * ((randomSpeech.length - 1) - 0)) + 0;

			if(!randomSpeech[randomIndex].length)
				base.textToSpeech(randomSpeech[randomIndex]);
		});*/

		base.textToSpeech = function(textToSpeech)
		{
			window.speechSynthesis.cancel();

			//Text to speech -> Is working and funny :-)
			var msg = new SpeechSynthesisUtterance(textToSpeech);
			var voices = window.speechSynthesis.getVoices();

			msg.voice = voices[6];	//Set a german voice
			msg.lang = "de-DE";		//Set german lang
			msg.volume = 1;			//Set max volume

			window.speechSynthesis.speak(msg);
		}

        base.onChatStatsUpdate = function(statData){

            statData.forEach(function(locationData)
            {
                var locationDiv = $("#city_" + locationData.locationCode);
                var container = locationDiv.find(".city-detail-content-jabber-day");

                container.html(

                    '<svg class="reviewspeed linegraph" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">'+
                        '<g class="surfaces">'+
                            '<path class="day"></path>'+
                        '</g>'+
                        '<g class="grid x-grid">'+
                            '<line x1="15%" x2="15%" y1="10" y2="380"></line>'+
                            '<line x1="25%" x2="25%" y1="10" y2="380"></line>'+
                            '<line x1="35%" x2="35%" y1="10" y2="380"></line>'+
                            '<line x1="45%" x2="45%" y1="10" y2="380"></line>'+
                            '<line x1="55%" x2="55%" y1="10" y2="380"></line>'+
                            '<line x1="65%" x2="65%" y1="10" y2="380"></line>'+
                            '<line x1="75%" x2="75%" y1="10" y2="380"></line>'+
                            '<line x1="85%" x2="85%" y1="10" y2="380"></line>'+
                        '</g>' +
                        '<g class="grid y-grid">'+
                            '<line x1="5%" x2="100%" y1="0%" y2="0%"></line>'+
                            '<line x1="5%" x2="100%" y1="9%" y2="9%"></line>'+
                            '<line x1="5%" x2="100%" y1="18%" y2="18%"></line>'+
                            '<line x1="5%" x2="100%" y1="27%" y2="27%"></line>'+
                            '<line x1="5%" x2="100%" y1="36%" y2="36%"></line>'+
                            '<line x1="5%" x2="100%" y1="45%" y2="45%"></line>'+
                            '<line x1="5%" x2="100%" y1="54%" y2="54%"></line>'+
                            '<line x1="5%" x2="100%" y1="63%" y2="63%"></line>'+
                            '<line x1="5%" x2="100%" y1="72%" y2="72%"></line>'+
                            '<line x1="5%" x2="100%" y1="81%" y2="81%"></line>'+
                        '</g>'+
                        '<g class="labels y-labels">'+
                            '<text x="5%" y="5%">100%</text>'+
                            '<text x="5%" y="14%">90%</text>'+
                            '<text x="5%" y="23%">80%</text>'+
                            '<text x="5%" y="32%">70%</text>'+
                            '<text x="5%" y="41%">60%</text>'+
                            '<text x="5%" y="50%">50%</text>'+
                            '<text x="5%" y="59%">40%</text>'+
                            '<text x="5%" y="68%">30%</text>'+
                            '<text x="5%" y="77%">20%</text>'+
                            '<text x="5%" y="86%">10%</text>'+
                        '</g>'+
                        '<g class="labels x-labels">'+
                            '<text x="15%" y="95%">8</text>'+
                            '<text x="25%" y="95%">9</text>'+
                            '<text x="35%" y="95%">10</text>'+
                            '<text x="45%" y="95%">11</text>'+
                            '<text x="55%" y="95%">12</text>'+
                            '<text x="65%" y="95%">13</text>'+
                            '<text x="75%" y="95%">14</text>'+
                            '<text x="85%" y="95%">15</text>'+
                            '<text x="95%" y="95%">16</text>'+
                        '</g>'+
                    '</svg>'

                );

                Array.prototype.repeat= function(what, L){
                    while(L) this[--L]= what;
                    return this;
                };

                //default value 280 = 0%
                var mappedValues = [].repeat(280, 24);

                //map percentage to px values
                var output_start = 0,
                    output_end = 280,
                    input_start = 100,
                    input_end = 0;

                locationData.stats.forEach(function(stat){

                    mappedValues[stat.hour] = output_start + ((output_end - output_start) / (input_end - input_start)) * (stat.percent - input_start);

                });

                //build svg path
                //start point
                var path = "M40 280 ";
                //default end point
                var endpoint = " L40 280";

                //i = y-value; l = x-value
                for(var i = 8, l = 50; i <= 16; i++, l += 35){
                    if(mappedValues[i] !== 281){
                        path += ' L' + l + ' ' + mappedValues[i];
                        endpoint = ' L'+l + ' 280';
                    }
                }

                //end point
                path += endpoint;

                //add path to DOM
                container.find(".day").attr("d", path);

            });
        };

        base.onCoffeeStatsUpdate = function(statData){

            statData.forEach(function(locationData)
            {
                var locationDiv = $("#city_" + locationData.locationCode);
                var container = locationDiv.find(".city-detail-content-coffee-day");

                container.html(
                    '<div class="counterButton">+1</div>'+
                    '<svg class="reviewspeed linegraph" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg">'+
                        '<g class="surfaces">'+
                            '<path class="day"></path>'+
                        '</g>'+
                        '<g class="grid x-grid">'+
                            '<line x1="15%" x2="15%" y1="10" y2="380"></line>'+
                            '<line x1="25%" x2="25%" y1="10" y2="380"></line>'+
                            '<line x1="35%" x2="35%" y1="10" y2="380"></line>'+
                            '<line x1="45%" x2="45%" y1="10" y2="380"></line>'+
                            '<line x1="55%" x2="55%" y1="10" y2="380"></line>'+
                            '<line x1="65%" x2="65%" y1="10" y2="380"></line>'+
                            '<line x1="75%" x2="75%" y1="10" y2="380"></line>'+
                            '<line x1="85%" x2="85%" y1="10" y2="380"></line>'+
                        '</g>' +
                        '<g class="grid y-grid">'+
                            '<line x1="5%" x2="100%" y1="7%" y2="7%"></line>'+
                            '<line x1="5%" x2="100%" y1="25%" y2="25%"></line>'+
                            '<line x1="5%" x2="100%" y1="43%" y2="43%"></line>'+
                            '<line x1="5%" x2="100%" y1="61%" y2="61%"></line>'+
                            '<line x1="5%" x2="100%" y1="79%" y2="79%"></line>'+
                        '</g>'+
                        '<g class="labels y-labels">'+
                            '<text x="5%" y="4%">pro Kopf</text>'+
                            '<text x="5%" y="12%">5</text>'+
                            '<text x="5%" y="30%">4</text>'+
                            '<text x="5%" y="48%">3</text>'+
                            '<text x="5%" y="66%">2</text>'+
                            '<text x="5%" y="84%">1</text>'+
                        '</g>'+
                        '<g class="labels x-labels">'+
                            '<text x="15%" y="95%">8</text>'+
                            '<text x="25%" y="95%">9</text>'+
                            '<text x="35%" y="95%">10</text>'+
                            '<text x="45%" y="95%">11</text>'+
                            '<text x="55%" y="95%">12</text>'+
                            '<text x="65%" y="95%">13</text>'+
                            '<text x="75%" y="95%">14</text>'+
                            '<text x="85%" y="95%">15</text>'+
                            '<text x="95%" y="95%">16</text>'+
                        '</g>'+
                    '</svg>'

                );

                Array.prototype.repeat= function(what, L){
                    while(L) this[--L]= what;
                    return this;
                };

                //default value 285 = 0%
                var mappedValues = [].repeat(285, 24);

                //map percentage to px values
                var output_start = 21,
                    output_end = 285,
                    input_start = 5,
                    input_end = 0;

                locationData.stats.forEach(function(stat){

                    mappedValues[stat.hour] = output_start + ((output_end - output_start) / (input_end - input_start)) * (stat.coffeePerHead - input_start);

                });

                //build svg path
                //start point
                var path = "M40 285 ";
                //default end point
                var endpoint = " L40 285";

                //i = y-value; l = x-value
                for(var i = 8, l = 50; i <= 16; i++, l += 35){
                    if(mappedValues[i] !== 286){
                        path += ' L' + l + ' ' + mappedValues[i];
                        endpoint = ' L'+l + ' 285';
                    }
                }

                //end point
                path += endpoint;

                //add path to DOM
                container.find(".day").attr("d", path);

				//Ensure that a user cannot click the coffee counter of another location
				if(locationData.locationCode === base.getUrlParameter('standort'))
				{
					$(container).find(".counterButton").click(function()
					{
						var that = this;

						//spam protection
						$(that).addClass('disabled');

						var timer = setTimeout(function()
						{
							$(that).removeClass('disabled');
							clearTimeout(timer);
						}, 5000);

						io().emit("coffee", locationData.locationCode);
					})
				}
				else
					$(container).find(".counterButton").addClass('disabled');
            });
        };

        base.onLastfmArtistsUpdate = function(lastfmData){

            function compare(a,b) {
                if (a.playCount > b.playCount)
                    return -1;
                if (a.playCount < b.playCount)
                    return 1;
                return 0;
            }

			if(jQuery.isEmptyObject(lastfmData))
				return;

            lastfmData.forEach(function(locationData){

                if(locationData.charts.length > 0){

					var locationDiv = $("#city_" + locationData.locationCode);
					var container = locationDiv.find(".city-detail-content-lastfm-artists");
					var containerWidth = locationDiv.find(".city-detail").width();
					var maxWidth = containerWidth - 55 - 33 + 12;

					//Sort artists by play count
					locationData.charts.sort(compare);

					//Recognize same artists and summarize playCount
					for(var i = 0, l = locationData.charts.length; i < l; i++)
					{
						for(var j = i, ll = locationData.charts.length; j < ll; j++)
						{
							if(locationData.charts[j] != undefined && locationData.charts[i].artist === locationData.charts[j].artist && i != j)
							{
								locationData.charts[i].playCount += locationData.charts[j].playCount;
								locationData.charts.splice(j, 1);
							}
						}
					}

					container.html('');

                    var lastArtist = locationData.charts.length-1;
                    if(lastArtist > 9) lastArtist = 9;
                    var input_start = locationData.charts[lastArtist].playCount;
                    var input_end = locationData.charts[0].playCount;

                    locationData.charts.forEach(function(artist, ind)
                    {
                        if(ind < 10)
						{
                            var rank = ind+1;

                            if (rank < 10)
								rank = "0" + rank;

                            var mappedValue = 45 + ((maxWidth - 45) / (input_end - input_start)) * (parseInt(artist.playCount, 10) - input_start);

                            container.append(
                                "<div class='lastfm' id='play-btn-"+ ind +"'>" +
                                "<div class='lastfm-image'><img src='"+artist.img+"'><i class='fa fa-play fa-lg'></i></div>" +
                                "<div class='lastfm-chart'> <div class='rank'>"+rank+"</div> <div class='playCount' style='width:"+mappedValue+"px;'>"+ artist.playCount + "</div></div>" +
                                "<div class='lastfm-name' >" + artist.artist + "</div>" +
                                "</div>"
                            );

							//Bind click event to btn
							container.on('click', '#play-btn-' + ind, function()
							{
								io().emit("playArtist", {artist: artist.artist, locationCode: base.getUrlParameter('standort')});
							});

                        }

                    });

                    $(".lastfm").hover(
                        function(){
                            $(this).find(".fa-play").addClass("show");
                        },
                        function(){
                            $(this).find(".fa-play").removeClass("show");
                        });

                }

            });

        };

        base.onLastfmAlbumsUpdate = function(lastfmData){

            if (!Array.isArray(lastfmData)){
                return;
            }


            function compare(a,b) {
                if (a.playCount > b.playCount)
                    return -1;
                if (a.playCount < b.playCount)
                    return 1;
                return 0;
            }


            lastfmData.forEach(function(locationData){

                if(locationData.charts.length > 0){

                    var locationDiv = $("#city_" + locationData.locationCode);
                    var container = locationDiv.find(".city-detail-content-lastfm-albums");

                    container.html('');

                    locationData.charts.sort(compare);

                    var lastArtist = locationData.charts.length-1;
                    if(lastArtist > 9) lastArtist = 9;
                    var input_start = locationData.charts[lastArtist].playCount;
                    var input_end = locationData.charts[0].playCount;

                    locationData.charts.forEach(function(album, ind)
                    {

                        if(ind < 10){
                            var rank = ind+1;
                            if (rank < 10) rank = "0" + rank;
                            //output = output_start + ((output_end - output_start) / (input_end - input_start)) * (input - input_start);
                            var mappedValue = 45 + ((260 - 45) / (input_end - input_start)) * (parseInt(album.playCount, 10) - input_start);

                            container.append(
                                "<div class='lastfm' onclick='io().emit(\"playAlbum\",\""+album.album+"\");'>" +
                                "<div class='lastfm-image'><img src='"+album.img+"'><i class='fa fa-play fa-lg'></i></div>" +
                                "<div class='lastfm-chart'> <div class='rank'>"+rank+"</div> <div class='playCount' style='width:"+mappedValue+"px;'>"+ album.playCount + "</div></div>" +
                                "<div class='lastfm-name'>" + album.artist + " - "+album.album+"</div>" +
                                "</div>"
                            );
                        }

                    });

                    $(".lastfm").hover(
                        function(){
                            $(this).find(".fa-play").addClass("show");
                        },
                        function(){
                            $(this).find(".fa-play").removeClass("show");
                        });
                }

            })

        };

        base.onPlaySong = function(data)
		{
			console.log('PLAY', data);
			if(data.locationCode === base.getUrlParameter('standort'))
            	$('#spotifyPlayer').addClass("show").attr("src", "https://embed.spotify.com/?uri="+data.url);
        };

        base.onCamUpdate = function(camData){

			//extra param for SB
			if(camData.kitchen != undefined){
				$("#city_"+camData.locationCode).find("#"+camData.kitchen).attr('src', camData.dataUrl);
			}
			else{
            	$("#city_"+camData.locationCode).find(".city-module__camera > img").attr('src', camData.dataUrl);
			}

            var currentLoc = base.getUrlParameter("standort");
            var currentKitchen = base.getUrlParameter("kueche");

            //motion animation only for other locations
            if(currentLoc != camData.locationCode || currentKitchen != camData.kitchen){

                var cityClass = $("#city_"+camData.locationCode).find(".city-module__animation");

                cityClass.addClass('animate');

                setTimeout(function(){
                    cityClass.removeClass('animate');
                }, 3000);

            }
        };

        base.onMessage = function(data){
            console.log(data);
        };
        

        base.onWeatherUpdate = function(cities) {

            cities.forEach(function(city){

                var currentCity =  $("#city_"+city.locationCode);

                currentCity.find(".weather").html(city.temp);

                var currentSrc = currentCity.find("img").first().attr('src');

				var currentImageName = currentSrc.split("/")[5];

                currentSrc = currentSrc.replace(currentImageName, city.backgroundImageName);
                currentCity.find("img").first().attr("src", currentSrc);

            });

        };


		base.buttonSpamProtect = false;
        base.onCounterUpdate = function(data){


            data.forEach(function(location)
            {

                var locationDiv = $("#city_"+location.locationCode);
                locationDiv.find(".coffee-counter").find(".city-module__counter").html(location.coffee);
                var container = locationDiv.find(".city-detail-content-coffee-now");

                container.html('');

                var percent = Math.round((location.coffee / location.employees) * 100);

                if(location.last != 0){
                    var date = new Date(location.last);
                    var time = date.getHours() + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes();
                }
                else{
                    var time = "--:--";
                }

                container.append('<div class="counterButton">+1</div>' +
                '<svg version="1.1" id="Ebene_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1680 900" enable-background="new 0 0 1680 900" xml:space="preserve">' +
                '<defs>' +
                '<linearGradient id="grad1" x1="0%" y1="100%" x2="0%" y2="0%">' +
                '<stop offset="0%" class="cupGradient1" />' +
                '<stop offset="' + percent + '%" class="cupGradient1" />' +
                '<stop offset="' + percent + '%" class="cupGradient2" />' +
                '<stop offset="100%" class="cupGradient2" />' +
                '</linearGradient>' +
                '</defs>' +
                '<path fill="url(#grad1)"' +
                'd="M1163.1,558.5c0.5,30.6-25.2,56.2-55.8,56.2S1052,590,1052,558.9s24.3-55.8,55.3-55.8C1137.5,503.1,1162.7,527.9,1163.1,558.5z M769.8,267.3c0,23.9,0,47.7,0,71.5c0,2.2,0.5,4.1,0.5,7.2c3.1-1.4,5-2.7,7.2-3.6c19.8-11.2,37.8-25.6,52.6-42.8c45-51.3,64.4-110.7,54.5-178.6c-2.2-14.8-6.8-29.7-9.9-44.5h-3.1c-2.7,75.6-34.6,135.9-96.3,180C771.1,259.6,769.8,262.8,769.8,267.3z M536.2,447.8c86.8,20.7,175.5,30.1,264.6,30.1c81,0,237.6-18.5,264.6-31.1C888.6,393.8,712.2,393.8,536.2,447.8z M1212.2,558.9c0-58-47.2-105.3-105.3-105.3c-13,0-25.6,2.2-36.9,6.8l0,0c-3.6,1.4-6.8,2.2-10.4,3.1c-103.5,22.5-207.9,31.9-313.6,27c-54.4-2.7-108.4-8.1-162-18.4c-22.5-4.1-44.5-9-67-13.5c-0.9,2.2-1.8,4-2.2,6.3v46.8c2.7,14.9,5,30.1,8.5,45c27.5,112.5,121.1,197.1,235.4,213.8c1.8,0.5,3.1,0.9,4.5,1.4h73.3c14-3.1,27.9-5.4,41.4-9.5c66.6-19.4,119.2-57.6,158.4-114.8c1.3-2.2,2.7-4,4.5-6.3c0.9,0.5,1.8,0.9,2.7,1.4c17.6,13,39.6,21.1,63,21.1C1164.9,664.2,1212.2,617,1212.2,558.9z"/>' +
                '</svg>' +
                '<div>' +
                '<p>' + location.coffee + ' Tassen <br>' +
                location.employees + ' Mitarbeiter</p>' +
                '<p>' + percent + '% wach </p>' +
                '<p>Letzter Kaffee</p>' +
                '<p> &#xE61A; ' + time + ' Uhr</p>' +
                '</div>');

				//Ensure that a user cannot click the coffee counter of another location
				if(location.locationCode === base.getUrlParameter('standort'))
				{
					if(base.buttonSpamProtect)
						$(container).find(".counterButton").addClass('disabled');

					$(container).find(".counterButton").click(function()
					{
						//spam protection
						base.buttonSpamProtect  = true;

						var timer = setTimeout(function()
						{
							base.buttonSpamProtect = false;
							$(container).find(".counterButton").removeClass('disabled');
							clearTimeout(timer);
						}, 5000);

						io().emit("coffee", location.locationCode);
					})
				}
				else
					$(container).find(".counterButton").addClass('disabled');

            });
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


        base.init();
    };

})(jQuery);