/*
name: player-home
author: Dan Kantor
requires: jquery-1.3.2
*/


if (typeof(PlayerHome) == 'undefined'){
	PlayerHome = {}
}

PlayerHome.HTML = null;

PlayerHome.Select = function(obj){
	if (obj.key == 'home'){
		PlayerUI.ListPane.hide();
		PlayerUI.UserSection.show();
		if (PlayerHome.SiteOfTheDay.initialLoad == false){
			PlayerHome.SiteOfTheDay.load.request();
		}
	}
}

PlayerHome.Init = function(){
	var account = PlayerMain.Background.BackgroundStorage.get('account');
	if (account == null){
	
	} else {
		jQuery('#userSection').html("Welcome "+account.username+"!<a href=\"options.html\" target=\"_blank\">Log Out</a><a href=\"options.html\" target=\"_blank\">Settings</a>");	
	}
	PlayerHome.SiteOfTheDay.init();
}


/*PlayerHome.Load = {
	updateInterval : 1800000,
	newsUpdated : 0,
	siteOfTheDayUpdated : 0,
	siteOfTheDayStart : 0,
	request : function(){
		var d = new Date();
		if (PlayerHome.Load.newsUpdated == null || d - PlayerHome.Load.newsUpdated > PlayerHome.Load.updateInterval){
			jQuery.ajax({ url: "http://blog.extension.fm/api/read/json?start=0&num=5&tagged=changelog", cache: false, success: PlayerHome.Load.response.news});
		}
		//if (PlayerHome.Load.siteOfTheDayUpdated == null || d - PlayerHome.Load.siteOfTheDayUpdated > PlayerHome.Load.updateInterval){
		//	jQuery.ajax({ url: "http://blog.extension.fm/api/read/json?start="+PlayerHome.Load.siteOfTheDayStart+"&num=5&tagged=siteoftheday", cache: false, success: PlayerHome.Load.response.siteOfTheDay});
		//}
	},
	response : {
		news : function(json){
			PlayerHome.Load.newsUpdated = new Date();
			var str = json.substr(22);
			str = str.substr(0, str.length - 2);
			var obj = JSON.parse(str);
			var len = obj.posts.length;
			var html = "";
			for (var i = 0; i < len; i++){
				var post = obj.posts[i];
				var title = post['regular-title'];
				var body = post['regular-body']; 
				var link = post['url-with-slug'];
				html += "<div class=\"changelogTitle\"><a href=\""+link+"\" target=\"_blank\">"+title+"</a></div><div class=\"changelogBody\">"+body+"</div>";
			}
			jQuery('#homeMiddleNewsBody').html(html);
		}
	}
}*/

PlayerHome.SiteOfTheDay = {
	sites : [],
	start : 0,
	num : 5,
	tagged : "siteoftheday",
	updateInterval : 1800000,
	url : "http://blog.extension.fm/api/read/json",
	lastUpdated : null,
	current : 0,
	currentSite : null,
	initialLoad : false,
	init : function(){
		jQuery('.homeSiteOfTheDayButton').bind('click', PlayerHome.SiteOfTheDay.click);
	},
	click : function(e){
		var id = jQuery(this).attr('id');
		if (id == 'homeSiteOfTheDayButtonRight'){
			if (PlayerHome.SiteOfTheDay.current > 0){
				PlayerHome.SiteOfTheDay.current--;
				PlayerHome.SiteOfTheDay.build();
			}
		}
		if (id == 'homeSiteOfTheDayButtonLeft'){
			if (PlayerHome.SiteOfTheDay.sites.length - 1 > PlayerHome.SiteOfTheDay.current){
				PlayerHome.SiteOfTheDay.current++;
				PlayerHome.SiteOfTheDay.build();
			} else {
				PlayerHome.SiteOfTheDay.current++;
				PlayerHome.SiteOfTheDay.start += 5;
				PlayerHome.SiteOfTheDay.load.request();
			}
		}
	},
	load : {
		request : function(){
			PlayerHome.SiteOfTheDay.initialLoad = true;
			jQuery.ajax({ url: PlayerHome.SiteOfTheDay.url, data : {"start" : PlayerHome.SiteOfTheDay.start, "num" : PlayerHome.SiteOfTheDay.num, "tagged" : PlayerHome.SiteOfTheDay.tagged}, cache: false, success: PlayerHome.SiteOfTheDay.load.response});
		},
		response : function(json){
			PlayerHome.SiteOfTheDay.lastUpdated = new Date();
			var str = json.substr(22);
			str = str.substr(0, str.length - 2);
			var obj = JSON.parse(str);
			var len = obj.posts.length;
			var html = "";
			for (var i = 0; i < len; i++){
				var site = {};
				var post = obj.posts[i];
				site.timestamp = post['unix-timestamp'] * 1000;
				var body = post['regular-body'];
				var link = jQuery(body).find('a');
				site.title = link[0].innerText;
				site.url = link[0].href
				site.host = link[0].host;
				site.description = body;
				PlayerHome.SiteOfTheDay.sites.push(site);
			}
			PlayerHome.SiteOfTheDay.build();
		}
	},
	build : function(){
		if (PlayerHome.SiteOfTheDay.sites[PlayerHome.SiteOfTheDay.current] == undefined){
			
		} else {
			PlayerHome.SiteOfTheDay.currentSite = PlayerHome.SiteOfTheDay.sites[PlayerHome.SiteOfTheDay.current];
			jQuery('#homeSiteOfTheDaySiteTitle').text(PlayerHome.SiteOfTheDay.currentSite.title);
			jQuery('#homeSiteOfTheDaySiteUrl').attr('href', PlayerHome.SiteOfTheDay.currentSite.url);
			jQuery('#homeSiteOfTheDaySiteUrl').text(PlayerHome.SiteOfTheDay.currentSite.host);
			jQuery('#homeSiteOfTheDaySiteDescription').html(PlayerHome.SiteOfTheDay.currentSite.description);
			jQuery('#homeSiteOfTheDaySiteDescription').find('a').remove('a');
			var d = new Date(PlayerHome.SiteOfTheDay.currentSite.timestamp);
			var dateString = Utils.DayStringsAbbreviated[d.getDay()]+", "+Utils.MonthStringsAbbreviated[d.getMonth()]+" "+d.getDate();
			jQuery('#homeSiteOfTheDayDate').text(dateString);
		}
	}
}

jQuery(window).bind("PlayerUI.Top.tab.select", PlayerHome.Select);
window.addEventListener('load', PlayerHome.Init);
