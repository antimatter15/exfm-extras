/*
name: popup-main
author: Dan Kantor
requires: jquery-1.3.2
uses: song-vo, background-main
*/
if (typeof(PopupMain) == 'undefined'){
	PopupMain = {}
}

PopupMain.Background = null;

PopupMain.Init = function(e){
	//jQuery('.songvo').live('click', PopupMain.Songs.click);
	PopupMain.Background = chrome.extension.getBackgroundPage();
	PopupMain.Background.BackgroundEvents.Register("PopupMain.EventHandler", PopupMain.EventHandler);
	jQuery('.smallplaybutton').live('click', PopupMain.Songs.play);
	jQuery('.queuebutton').live('click', PopupMain.Songs.queue);
	jQuery('#maximizePlayer').click(PopupMain.Player.click);
	jQuery('#closeMiniPlayer').click(PopupMain.Player.close);
	jQuery('#playAll').click(PopupMain.PlayAll.click);
	jQuery('#queueAll').click(PopupMain.QueueAll.click);
	//PopupMain.Background.BackgroundLog.Log("Popup Init");
	chrome.tabs.getSelected(null, PopupMain.Tab.getSelected);
}

PopupMain.EventHandler = function(data){
	jQuery(window).trigger(data);
}

PopupMain.Tab = {
	getSelected : function(tab){
		PopupMain.Songs.get(tab.id);
	}
}

PopupMain.Songs = {
	array : [],
	get : function(id) {
		var sessionKey = PopupMain.Background.BackgroundMain.PageSessionKey[id];
		//PopupMain.Background.BackgroundMain.BrowseHistory.selectSongsBySessionKey.request(sessionKey);
		PopupMain.Background.BackgroundSQL.BrowseHistory.select.songsBySessionKey(sessionKey);
	},
	got : function(obj){
		PopupMain.Songs.array = obj.results;
		PopupMain.Songs.build();	
	},
	build : function(){
		if (PopupMain.Songs.array != undefined){
			var len = PopupMain.Songs.array.length;
			if (len > 0){
				jQuery('#top').removeClass('hidden');
				chrome.tabs.getSelected(null, function (tab){
					var tabUrlIndex = tab.url.indexOf('://');
					var tabUrl = tab.url.substr(tabUrlIndex+3);
					
					var firstSlash = tabUrl.indexOf("/");
					if (firstSlash != -1){
						tabUrl = tabUrl.substr(0, firstSlash);
					}
					
					/*var tabUrlLength = tabUrl.length;
					if (tabUrl[tabUrlLength-1] == "/"){
						tabUrl = tabUrl.substr(0, tabUrlLength-1);
					}*/
					if (tab.favIconUrl != "" && tab.favIconUrl != undefined){
						jQuery('#favicon').css('background-image', 'url('+tab.favIconUrl+')');
					}
					jQuery('#pageTitle').html(tabUrl+" has <span class=\"numSongs\">"+len+" "+Utils.Pluralize(len, 'song')+"</span>");
				})
			} else {
				jQuery('#playerControls').addClass('playerAlone');
			}
			var html = "";
			var tf = false;
			//for (var i = 0; i < len; i++){
			for (var i = len - 1; i >= 0; i--){
				if (tf == true){
					tf = false;
				} else {
					tf = true;
				}
				var songVO = PopupMain.Songs.array[i];
				var attributes = "";
				for (var j in songVO){
					if (songVO[j] != null){
						attributes += " "+j+"=\""+escape(songVO[j])+"\"";
					}
				}
				html += "<div class=\"songVOList "+tf+" \" "+attributes+" id=\""+songVO.key+"\" position=\""+i+"\"><div class=\"queuebutton icon\" title=\"Queue this Song\"></div><div class=\"smallplaybutton icon\" title=\"Play this Song\"></div><div class=\"info\"><div class=\"coverArt\" style=\"background: "+Utils.GetCoverArt(songVO.smallimage, '45x45')+"\"></div><div class=\"title\">"+songVO.songtitle+"</div><div class=\"artist\">"+songVO.artist+"</div><div class=\"album\">"+songVO.album+"</div></div><div class=\"clear\"></div></div>";
			}
			jQuery('#songlist').html(html);
			try {
				jQuery(window).bind("Site.selectDeleted", songVO.domain, PopupMain.Songs.domainDeleted);
				PopupMain.Background.BackgroundSQL.Sites.selectDeleted(songVO.domain);
			} catch(e){}
		}
	},
	domainDeleted : function(obj){
		jQuery(window).unbind("Site.selectDeleted", PopupMain.Songs.domainDeleted);
		var deleted = obj.results[0].deleted;
		if (deleted == 1){
			var html = "<div class=\"popupMessage\" id=\"undeleteMessage\">You've previously deleted this site. <span class=\"fakeLink\" id=\"undeleteDomain\" domain=\""+escape(obj.data)+"\">Undelete?</span></div>";
			jQuery('#top').append(html);
			jQuery('#top').css('height', '63px');
			jQuery('#undeleteDomain').bind('click', PopupMain.Songs.unDeleteDomain.click);
		}
	},
	unDeleteDomain : {
		click : function(e){
			var domain = jQuery(this).attr('domain');
			PopupMain.Songs.unDeleteDomain.request(domain);
		},
		request : function(domain){
			jQuery(window).bind("Site.unDeleteSite", PopupMain.Songs.unDeleteDomain.responseSites);
			PopupMain.Background.BackgroundSQL.Sites.unDeleteSite(domain);
			jQuery(window).bind("Song.unDeleteSongsByDomain", PopupMain.Songs.unDeleteDomain.responseSongs);
			PopupMain.Background.BackgroundSQL.Songs.unDeleteSongsByDomain(domain);
		},
		responseSites : function(obj){
			jQuery(window).unbind("Site.unDeleteSite", PopupMain.Songs.unDeleteDomain.responseSites);
		},
		responseSongs : function(obj){
			jQuery(window).unbind("Song.unDeleteSongsByDomain", PopupMain.Songs.unDeleteDomain.responseSongs);
			jQuery('#undeleteMessage').html("Site successfully undeleted");
			jQuery('.popupMessage').css('background-image', 'url(../images/check_green.png)');
		}
	},
	play : function(e){
		var target = e.target.parentNode;
		var songVO = new SongVO();
		var len = SongVOFields.length;
		for (var i = 0; i < len; i++){
			songVO[SongVOFields[i]] = unescape(jQuery(target).attr(SongVOFields[i]));
		}
		var queueNumber = PopupMain.Background.BackgroundPlayer.Queue.add(songVO);
		PopupMain.Background.BackgroundPlayer.Queue.play(queueNumber);
	},
	queue : function(e){
		jQuery(this).addClass('checkIcon');
		var target = e.target.parentNode;
		var songVO = new SongVO();
		var len = SongVOFields.length;
		for (var i = 0; i < len; i++){
			songVO[SongVOFields[i]] = unescape(jQuery(target).attr(SongVOFields[i]));
		}
		var queueNumber = PopupMain.Background.BackgroundPlayer.Queue.add(songVO);
	}
}

PopupMain.Player = {
	click : function(e){
		var tab = Back.BackgroundMain.Tabs.getPlayerTab();
		if (tab == null){
			chrome.tabs.create({url: "player.html"});
		} else {
			try {
				chrome.tabs.update(Back.BackgroundMain.Tabs.playerTabId, {"selected" : true});
			} catch(e) {
				chrome.tabs.create({url: "player.html"});
			}
		}
	},
	close : function(){
		window.close();
	}
}


PopupMain.PlayAll = {
	click : function(e){
		var len = PopupMain.Songs.array.length;
		var queueNumber = PopupMain.Background.BackgroundPlayer.Queue.add(PopupMain.Songs.array[len - 1]);
		PopupMain.Background.BackgroundPlayer.Queue.play(queueNumber);
		try {
			for (var i = len - 2; i >= 0; i--){
				PopupMain.Background.BackgroundPlayer.Queue.add(PopupMain.Songs.array[i]);
			}
		} catch(e) {}
	}
}

PopupMain.QueueAll = {
	click : function(e){
		var len = PopupMain.Songs.array.length;
		for (var i = len - 1; i >= 0; i--){
			PopupMain.Background.BackgroundPlayer.Queue.add(PopupMain.Songs.array[i]);
		}
		jQuery('#queueAll').addClass('checkIcon');
		jQuery('#queueAll').text('Queued');
		var queueButtons = jQuery('.queuebutton');
		for (var i = 0; i < queueButtons.length; i++){
			var queueButton = queueButtons[i];
			jQuery(queueButton).addClass('checkIcon');
		}
	}
}

window.addEventListener("load", PopupMain.Init);
//window.addEventListener("onunload", function(e){Back.BackgroundPlayer.Transport.pause();console.log(e, 'unloaded')})
jQuery(window).bind("BrowseHistory.songsBySessionKey", PopupMain.Songs.got);
