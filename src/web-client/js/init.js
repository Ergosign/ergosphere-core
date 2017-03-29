/*
 * This file has been created by Ergosign GmbH - All rights reserved - http://www.ergosign.de
 * DO NOT ALTER OR REMOVE THIS COPYRIGHT NOTICE OR THIS FILE HEADER.
 *
 * This file and the code contained in it are subject to the agreed contractual terms and conditions,
 * in particular with regard to resale and publication.
 */

/**
 * init.js file
 *
 * Class history:
 *  - 0.1: First release, working (albriggs)
 *
 * @author albriggs
 * @date 08/05/15
 */

var routingModule;

$(document).ready(function()
{
    "use strict";
    
    routingModule = new jQuery.routingModule();

    var body = $('body');

	//Disable contextmenu
	body.on("contextmenu",function(){
        return false;
	});

    //default
    $(body).find(".city-detail-content-tweets").addClass("show");
    $(body).find(".city-detail-header-default").addClass("show");

	//add img tags with ids to SB (switching between cameras)
	$("#city_SB .city-module__camera").empty();
	$("#city_SB .city-module__camera").append('<img class="show" id="HQ"><img id="QBUS0"><img id="QBUS1">');

    //TODO add color changes when active

	//register click handler
	$(".city-module__icons-toggle-item").click(function(){

		$(".active").removeClass("active");
		$(this).addClass("active");

		var text = $(this).text();

		$("#city_SB .city-module__camera img").removeClass("show");
		$("#"+text).addClass("show");

	});

    $( ".city-module__twitter" ).click(function() {

        //reset
        $(".city-detail .show").removeClass("show");

        //header
        $(body).find(".city-detail-header-default").addClass("show").text("Tweets");

        //detail
        $(body).find(".city-detail-content-tweets").addClass("show");
        $(body).find(".city-detail-header-default").addClass("show");

    });

	$( ".city-module__jabber" ).click(function() {
		showHeaderHalf("Online", "Jetzt", "Heute", "jabber", "jabber-now", "jabber-day");
	});

    $( ".city-module__lastfm" ).click(function() {
		showHeaderHalf("LastFM – Top Ten des Monats", "Artists", "Albums", "lastfm", "lastfm-artists", "lastfm-albums");
    });

    $(" .city-module__coffee-counter").click(function(){
		showHeaderHalf("Kaffeekonsum", "Jetzt", "Heute", "coffee", "coffee-now", "coffee-day");
    });

	var showHeaderHalf = function(mainHeading, heading1, heading2, mainContent, content1, content2){
		//reset
		$(".city-detail .show").removeClass("show");

		//header
		$(body).find(".city-detail-header-half-1").addClass("show").css("borderBottomWidth", "4px").text(heading1);
		$(body).find(".city-detail-header-half-2").addClass("show").css("borderBottomWidth", "2px").text(heading2);
		$(body).find(".city-detail-header-heading").addClass("show");
		$("#city_B").find(".city-detail-header-heading").html(mainHeading);

		//detail
		$(body).find(".city-detail-content-"+mainContent).addClass("show");
		$(body).find(".city-detail-content-"+content1).addClass("show");

		//header onclick
		$( ".city-detail-header-half-1" ).click(function()
		{
			$(body).find(".city-detail-header-half-1").css("borderBottomWidth", "4px");
			$(body).find(".city-detail-header-half-2").css("borderBottomWidth", "2px");
			$(body).find(".city-detail-content-"+content1).addClass("show");
			$(body).find(".city-detail-content-"+content2).removeClass("show");
		});
		$( ".city-detail-header-half-2" ).click(function()
		{
			$(body).find(".city-detail-header-half-2").css("borderBottomWidth", "4px");
			$(body).find(".city-detail-header-half-1").css("borderBottomWidth", "2px");
			$(body).find(".city-detail-content-"+content1).removeClass("show");
			$(body).find(".city-detail-content-"+content2).addClass("show");
		});
	};

	//City module buttons pressed state
	var $citybuttons = $( ".city-module__button" );
	$citybuttons.on( "click", function() {
		$citybuttons.removeClass("pressed");
		$(this).addClass("pressed");
	});

	//toggleFullScreen();
    
});
