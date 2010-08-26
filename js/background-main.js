/*
name: background-main
author: Dan Kantor
requires: jquery-1.3.2
*/
if (typeof(BackgroundMain) == 'undefined'){
	BackgroundMain = {}
}	

BackgroundMain.TempPageSongs = {};
BackgroundMain.PageSessionKey = {};
BackgroundMain.Version = 0;
//BackgroundMain.TempPageSongs

BackgroundMain.Listener = function(request, sender, sendResponse){
	switch (request.msg){
		case 'pageSongs' :
			BackgroundMain.TempPageSongs[sender.tab.id] = request.data.length;
			BackgroundMain.PageSessionKey[sender.tab.id] = request.sessionKey;
			BackgroundSQL.Songs.insert(request.data);
        	BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.request(request.data);
        	jQuery(window).bind('BrowseHistory.insert', sender.tab.id, BackgroundMain.Page.setBadgeText);
        	BackgroundSQL.BrowseHistory.insert(request.sessionKey, request.data);
        	BackgroundMain.ContentScript.add(sender.tab.id);
        	chrome.tabs.insertCSS(sender.tab.id, {"file" : "css/page.css"}, function (){});
		break;
		case 'pageSongsMore' :
			var old = BackgroundMain.TempPageSongs[sender.tab.id];
			var data = request.data.length;
			if (old != undefined){
				data += old;
			}
			BackgroundMain.TempPageSongs[sender.tab.id] = data;
			BackgroundMain.PageSessionKey[sender.tab.id] = request.sessionKey;
			BackgroundSQL.Songs.insert(request.data);
        	BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.request(request.data);
        	jQuery(window).bind('BrowseHistory.insert', sender.tab.id, BackgroundMain.Page.setBadgeText);
        	BackgroundSQL.BrowseHistory.insert(request.sessionKey, request.data);
        	BackgroundMain.ContentScript.add(sender.tab.id);
        	chrome.tabs.insertCSS(sender.tab.id, {"file" : "css/page.css"}, function (){});
		break;
		case 'pageSongsClear' :
			delete BackgroundMain.TempPageSongs[sender.tab.id];
		break;
		case 'archiveOrgRequest' : 
			BackgroundArchiveOrg.Request(request.url);
		break;
		case 'selectAndPlayByDomainKey' : 
			BackgroundMain.ContentScript.select(sender.tab.id);
			BackgroundMain.Songs.selectAndPlayByDomainKey.request(request.data);
		break;
		case 'selectAndQueueByDomainKeys' : 
			BackgroundMain.ContentScript.select(sender.tab.id);
			BackgroundMain.Songs.selectAndQueueByDomainKeys.request(request.data);
		break;
		case 'playPauseSong' : 
			if (BackgroundPlayer.IsPlaying){
				BackgroundPlayer.Transport.pause();
			} else {
				BackgroundPlayer.Transport.play();
			}
		break;
		case 'prevSong' : 
			BackgroundPlayer.Transport.previous();
		break;
		case 'nextSong' : 
			BackgroundPlayer.Transport.next();
		break;
		case 'playQueue' : 
			BackgroundPlayer.QueueNumber = request.data;
			BackgroundPlayer.Queue.play(request.data);
		break;
		case 'hasPlayer' : 
			chrome.tabs.insertCSS(sender.tab.id, {"file" : "css/page.css"}, function (){});
			BackgroundMain.ContentScript.select(sender.tab.id);
			//BackgroundMain.Page.sendCurrentSongVO(sender.tab.id);
			//BackgroundPlayer.SendAllMetaToPageTab();
		break;
		case 'openOrSwitchTab' : 
			Utils.openOrSwitchTab(null, null, request.url);
		break;
		case 'seek' : 
			BackgroundPlayer.Transport.seekTo(request.seconds);
		break;
		case "setVolume" :
			BackgroundPlayer.Volume.set(request.volume);
		break;
		case "saveVolume" :
			BackgroundStorage.set("PlayerMain.Volume.saved", request.saved);
		break;
		case "tumblrDashboard" :
			var loggedIn = BackgroundTumblrDashboard.Request(sender.tab.id, request.sessionKey);
			chrome.tabs.sendRequest(sender.tab.id, {"msg" : "tumblrDashboard", "loggedIn" : loggedIn});
		break;
		case "openLargePlayer" : 
			var tab = BackgroundMain.Tabs.getPlayerTab();
			if (tab == null){
				chrome.tabs.create({url: "player.html"});
			} else {
				try {
					chrome.tabs.update(BackgroundMain.Tabs.playerTabId, {"selected" : true});
				} catch(e) {
					chrome.tabs.create({url: "player.html"});
				}
			}
		break;
		case "closePagePlayer" :
			BackgroundMain.Page.pagePlayerRemoved[sender.tab.id] = true;
		break;
		case "remoteApiScriptRequest" :
			BackgroundRemoteApiScript.Request(request.url, sender.tab.id, request.sessionKey, request.debugOn, request.locationHref, request.domain);
		break;
		case "soundCloudSite" :
			BackgroundSoundCloud.Resolve.request(sender.tab.id, request.url, request.sessionKey, request.currentUser, request.domain);
		break;
		case "bandcampSite" :
			BackgroundBandcamp.Resolve.request(sender.tab.id, request.url, request.sessionKey, request.domain, request.albumId);
		break;
		default : 
		break;
	}
	sendResponse({"closePagePlayer" : BackgroundMain.Page.pagePlayerRemoved[sender.tab.id]});
}

BackgroundMain.BrowseHistory = {
	insert : function(sessionKey, array){
	},
	selectSongsBySessionKey : {
		request : function(sessionKey){
			//jQuery(window).bind("BrowseHistory.songsBySessionKey", BackgroundMain.BrowseHistory.selectSongsBySessionKey.result);
			BackgroundSQL.BrowseHistory.select.songsBySessionKey(sessionKey);
		},
		result : function(array){
		
		}
	},
	selectByDate : {
		request : function(page){
			//jQuery(window).bind("BrowseHistory.songsBySessionKey", BackgroundMain.BrowseHistory.selectSongsBySessionKey.result);
			BackgroundSQL.BrowseHistory.select.songsByDate(page);
		},
		result : function(array){
		}
	},
	selectDomains : {
		request : function(){
			BackgroundSQL.BrowseHistory.select.domainsFromSongs();
		},
		result : function(array){
		}
	},
	selectArtists : {
		request : function(){
			BackgroundSQL.BrowseHistory.select.artistsFromSongs();
		},
		result : function(array){
		}
	},
	selectArtistsByDomain : {
		request : function(domain){
			BackgroundSQL.BrowseHistory.select.artistsFromSongsByDomain(domain);
		},
		result : function(array){
			
		}
	},
	selectAlbums : {
		request : function(){
			BackgroundSQL.BrowseHistory.select.albumsFromSongs();
		},
		result : function(array){
		}
	},
	selectAlbumsByDomain : {
		request : function(domain){
			BackgroundSQL.BrowseHistory.select.albumsFromSongsByDomain(domain);
		},
		result : function(array){
			
		}
	},
	selectSongs : {
		request : function(orderBy){
			BackgroundSQL.BrowseHistory.select.songsFromSongs(orderBy);
		},
		result : function(array){
		}
	},
	selectSongsByDomain : {
		request : function(domain){
			BackgroundSQL.BrowseHistory.select.songsFromSongsByDomain(domain, 'domain');
		},
		result : function(array){
			
		}
	}
}

BackgroundMain.Songs = {
	insert : function(array){
	},
	selectSongsFromKeys : {
		request : function(array){
			var len = array.length;
			var values = [];
			for (var i = 0; i < len; i++){
				values.push(array[i].key);
			}
			jQuery(window).bind("Song.onSongsByKeys", BackgroundMain.Songs.selectSongsFromKeys.result);
			BackgroundSQL.Songs.select.songsByKeys(values);
		},
		result : function(obj){	
			jQuery(window).unbind("Song.onSongsByKeys", BackgroundMain.Songs.selectSongsFromKeys.result);
			var len = obj.results.length;
			var needMeta = [];
			for (var i = 0; i < len; i++){
				var songVO = obj.results[i];
				if (songVO.meta == 0){
					needMeta.push(songVO);
				}
			}
			BackgroundMetadata.Request(needMeta);
		}
	},
	selectSongsFromDomainKeysWithNoMeta : {
		request : function(array){
			var len = array.length;
			var values = [];
			for (var i = 0; i < len; i++){
				values.push(array[i].domainkey);
			}
			jQuery(window).bind("Song.onSongsByDomainKeysWithNoMeta", BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.result);
			BackgroundSQL.Songs.select.songsByDomainKeysWithNoMeta(values);
		},
		result : function(obj){	
			jQuery(window).unbind("Song.onSongsByDomainKeysWithNoMeta", BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.result);
			try {
				if (obj.results.length > 0){
					BackgroundMetadata.Request(obj.results);
				}
			} catch(e){}
		}
	},
	update : function(data){
		/*for (var i in BackgroundMain.TempPageSongs){
			if (BackgroundMain.TempPageSongs[i].key == data.key){
				for (var j in data.meta){
					BackgroundMain.TempPageSongs[i][j] = data.meta[j];
				}
			}
		}*/
	},
	selectAndPlayByDomainKey : {
		request : function(domainKey){
			jQuery(window).bind("Song.songByDomainKey", BackgroundMain.Songs.selectAndPlayByDomainKey.response);
			BackgroundSQL.Songs.select.songByDomainKey(domainKey);
		},
		response : function(obj){
			jQuery(window).unbind("Song.songByDomainKey", BackgroundMain.Songs.selectAndPlayByDomainKey.response);
			try {
				var songVO = obj.results[0];
				var queueNumber = BackgroundPlayer.Queue.add(songVO);
				BackgroundPlayer.Queue.play(queueNumber);
			} catch(e) {}
		}
	},
	selectAndQueueByDomainKeys : {
		request : function(domainKeyArray){
			jQuery(window).bind("Song.songsByDomainKeys", BackgroundMain.Songs.selectAndQueueByDomainKeys.response);
			BackgroundSQL.Songs.select.songsByDomainKeys(domainKeyArray);
		},
		response : function(obj){
			jQuery(window).unbind("Song.songByDomainKey", BackgroundMain.Songs.selectAndQueueByDomainKeys.response);
			for (var i = 0; i < obj.results.length; i++){
				var songVO = obj.results[i];
				BackgroundPlayer.Queue.add(songVO);
			}
		}
	}
}

BackgroundMain.Popup = {
	songClick : function(songVO){
		var queueNumber = BackgroundPlayer.Queue.add(songVO);
		return queueNumber;
	}
}

BackgroundMain.Tabs = {
	playerTab : null,
	playerTabId : null,
	getPlayerTab : function(){
		BackgroundMain.Tabs.playerTab = BackgroundMain.Tabs.get("player.html");
		BackgroundPlayer.SendAllMetaToPlayerTab(); 
		return BackgroundMain.Tabs.playerTab;
	},
	setPlayerTabId : function(tab){
		BackgroundMain.Tabs.playerTabId = tab.id;
	},
	removePlayerTab : function(){
		BackgroundMain.Tabs.playerTab = null;
	},
	popupTab : null,
	popupTabId : null,
	getPopupTab : function(){
		BackgroundMain.Tabs.popupTab = BackgroundMain.Tabs.get("popup.html");
		BackgroundPlayer.SendAllMetaToPopupTab(); 
		return BackgroundMain.Tabs.popupTab;
	},
	removePopupTab : function(){
		BackgroundMain.Tabs.popupTab = null;
	},
	setPopupTabId : function(tab){
		BackgroundMain.Tabs.popupTabId = tab.id;
	},
	get : function(url){
		var viewTabUrl = chrome.extension.getURL(url);
		var views = chrome.extension.getViews();
		var theView = null;
		for (var i = 0; i < views.length; i++) {
    		var view = views[i];
			if (view.location.href == viewTabUrl) {
				theView = view;
      			break; 
    		}
    	}
    	return theView;
	}
}

BackgroundMain.ContentScript = {
	selected : null,
	obj : {},
	port : null, 
	add : function(tabId){
		BackgroundMain.ContentScript.obj[tabId] = tabId;
	},
	remove : function(tabId){
		delete BackgroundMain.ContentScript.obj[tabId];
		if (tabId == BackgroundMain.ContentScript.selected){
			BackgroundMain.ContentScript.selected = null;
			BackgroundMain.ContentScript.port = null;
		}
	},
	select : function(tabId){
		BackgroundMain.ContentScript.selected = tabId;
		BackgroundMain.ContentScript.port = chrome.tabs.connect(BackgroundMain.ContentScript.selected, {name: "background"});
		//chrome.tabs.insertCSS(tabId, {"file" : "css/page.css"}, function (){});
	}
}

BackgroundMain.Page = {
	pagePlayerRemoved : {},
	onRemoved : function(tabId){
		if (BackgroundMain.PageSessionKey[tabId] != undefined){
			BackgroundSQL.BrowseHistory.deleteBySessionKey(BackgroundMain.PageSessionKey[tabId]);
			delete BackgroundMain.PageSessionKey[tabId];
		}
		delete BackgroundMain.TempPageSongs[tabId];
		delete BackgroundSQL.BrowseHistory.insertCount[BackgroundMain.PageSessionKey[tabId]];
		delete BackgroundMain.Page.pagePlayerRemoved[tabId];
		BackgroundMain.ContentScript.remove(tabId);
	},
	onUpdated : function(tabId, obj, tab){
		if (obj.status == "loading"){
			if (BackgroundMain.PageSessionKey[tabId] != undefined){
				BackgroundSQL.BrowseHistory.deleteBySessionKey(BackgroundMain.PageSessionKey[tabId]);
				delete BackgroundMain.PageSessionKey[tabId];
			}
			delete BackgroundMain.TempPageSongs[tabId];
			delete BackgroundSQL.BrowseHistory.insertCount[BackgroundMain.PageSessionKey[tabId]];
		}
		if (obj.status == "complete"){
			BackgroundMain.Page.sendCurrentSongVO(tabId);
		}
	},
	onCreated : function(tab){
		if (chrome.extension.getURL('player.html') == tab.url){
			BackgroundMain.Tabs.setPlayerTabId(tab);
		}
	},
	onSelectionChanged : function(tabId, selectInfo){
		if (BackgroundMain.ContentScript.obj[tabId] != undefined){
			BackgroundMain.ContentScript.select(tabId);
			BackgroundMain.Page.sendCurrentSongVO(tabId);
		} else {
			BackgroundMain.ContentScript.port = null;
		}
	},
	setBadgeText : function(obj){
		jQuery(window).unbind('BrowseHistory.insert', BackgroundMain.Page.setBadgeText);
		chrome.browserAction.setBadgeText({"text" : obj.count+"", "tabId" : obj.data});
		chrome.tabs.sendRequest(obj.data, {"msg" : "setBadgeText", "count" : obj.count});
	},
	sendCurrentSongVO : function(tabId){
		try {
			var volume = BackgroundStorage.get("PlayerMain.Volume.saved");
			var percentage = BackgroundPlayer.CurrentAudio.currentTime / BackgroundPlayer.CurrentAudio.duration;
			chrome.tabs.sendRequest(tabId, {"msg" : "currentSongVO", "songVO" : BackgroundPlayer.CurrentSongVO, "queueNumber" : BackgroundPlayer.QueueNumber, "duration" : BackgroundPlayer.CurrentAudio.duration, "currentTime" : BackgroundPlayer.CurrentAudio.currentTime, "percentage" : percentage, "volume" : volume, "isPlaying" : BackgroundPlayer.IsPlaying, "isStopped" : BackgroundPlayer.IsStopped, "closePagePlayer" : BackgroundMain.Page.pagePlayerRemoved[tabId]}, function(response){});
		} catch(e){}
	}
}


BackgroundMain.Track = {
	page : function(page){
		try {
			//_gaq.push(['_trackPageview', page]);
			//var obj = {'type' : '_trackPageview', 'page' : page};
			//document.getElementById('gaData').contentWindow.postMessage(obj, 'http://static.extension.fm');
        } catch(e){}
	},
	event : function(category, action, opt_label, opt_value){
		try {
			//_gaq.push(['_trackEvent', category, action, opt_label, opt_value]);
			//var obj = {'type' : '_trackEvent', 'category' : category, 'action' : action, 'opt_label' : opt_label, 'opt_value' : opt_value};
			//document.getElementById('gaData').contentWindow.postMessage(obj, 'http://static.extension.fm');
		} catch(e){}
	},
	analytics : {
		determine : function(){
			var lastPing = BackgroundStorage.get('lastPing');
			if (lastPing != null){
				var d = new Date(lastPing).getTime();
				var now = new Date().getTime();
				if (now - d > 86400000){
					BackgroundMain.Track.analytics.request();
				} 
			} else {
				BackgroundMain.Track.analytics.request();
			}
		},
		request : function(){
			jQuery.post(Utils.remoteServiceEndpoint()+"/analytics.php", {'version' : BackgroundMain.Version, 'navigator' : navigator.appVersion}, BackgroundMain.Track.analytics.response, 'json');
			var now = new Date().getTime();
			BackgroundStorage.set('lastPing', now);
		},
		response : function(json){
			//console.log('BackgroundMain.Track.analytics.response', json);
		}
	}
}

//setInterval(BackgroundMain.Track.analytics.determine, 86400000);

BackgroundMain.Notifications = {
	song : {
		notification : null,
		timeout : null,
		show : function(){
			try {
				BackgroundMain.Notifications.song.notification.show();
			} catch(e){}
		},
		cancel : function(){
			try {
				BackgroundMain.Notifications.song.clearTimeout();
				BackgroundMain.Notifications.song.notification.cancel();
			} catch(e){}
		},
		setTimeout : function(){
			try {
				BackgroundMain.Notifications.song.timeout = setTimeout(BackgroundMain.Notifications.song.cancel, 5000);
			} catch(e){}
		},
		clearTimeout : function(){
			try {
				clearTimeout(BackgroundMain.Notifications.song.timeout);
			} catch(e){}
		}
	}
}


BackgroundMain.Log = function(obj){
	console.log(obj);
}


chrome.extension.onRequest.addListener(BackgroundMain.Listener);
chrome.tabs.onRemoved.addListener(BackgroundMain.Page.onRemoved);
chrome.tabs.onUpdated.addListener(BackgroundMain.Page.onUpdated);
chrome.tabs.onCreated.addListener(BackgroundMain.Page.onCreated);
chrome.tabs.onSelectionChanged.addListener(BackgroundMain.Page.onSelectionChanged);



jQuery.ajax({"url" : "manifest.json", "complete" : function(xmlRequest){
		try { 
			var json = JSON.parse(xmlRequest.responseText);
			BackgroundMain.Version = json.version;
			//BackgroundMain.Track.page("/version/"+BackgroundMain.Version);
			//BackgroundMain.Track.analytics.determine();
		} catch (e) {}
	}
})


window.addEventListener("load", function(){
	BackgroundLog.Log("Start");
});

chrome.browserAction.setBadgeBackgroundColor({'color' : [42,168,235,255]});
