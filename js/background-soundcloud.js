/*
name: background-soundcloud
author: Dan Kantor
requires: jquery-1.3.2, song-vo, md5
*/
if (typeof(BackgroundSoundCloud) == 'undefined'){
	BackgroundSoundCloud = {}
}

BackgroundSoundCloud.Blacklist = [
	"api.soundcloud.com",
	"i1.soundcloud.com",
	"blog.soundcloud.com"
]

BackgroundSoundCloud.Resolve = {
	url : "http://api.soundcloud.com/resolve",
	request : function(tabId, url, sessionKey, currentUser, domain){
		var doResolve = true;
		// don't try and resolve if the url matches one in the blacklist
		for (var i = 0; i < BackgroundSoundCloud.Blacklist.length; i++){
			var blacklist = BackgroundSoundCloud.Blacklist[i];
			if (url.indexOf(blacklist) != -1){
				doResolve = false;
				break;
			}
		}
		if (url.indexOf("http://soundcloud.com/tracks/hot") != -1){
			BackgroundSoundCloud.Tracks.request(tabId, url, sessionKey, currentUser, domain, {"order" : "hotness", "format" : "json"})
			doResolve = false;
		}
		if (url.indexOf("http://soundcloud.com/tracks/latest") != -1){
			var createAtTo = "2020-09-30%2012:29:10";
			BackgroundSoundCloud.Tracks.request(tabId, url, sessionKey, currentUser, domain, {"order" : "created_at", "created_at[to]" : createAtTo, "format" : "json"})
			doResolve = false;
		}
		if (url == "http://soundcloud.com/tracks"){
			BackgroundSoundCloud.Tracks.request(tabId, url, sessionKey, currentUser, domain, {"order" : "hotness", "format" : "json"})
			doResolve = false;
		}
		if (url.indexOf("http://soundcloud.com/search") != -1 || url.indexOf("http://soundcloud.com/tracks/search") != -1){
			var searchUrl = jQuery.parseQuery(url.split("?")[1]);
			var query = searchUrl['q%5Bfulltext%5D'];
			BackgroundSoundCloud.Tracks.request(tabId, url, sessionKey, currentUser, domain, {"q" : query, "format" : "json"})
			doResolve = false;
		}
		if (doResolve == true){
			if (url.indexOf('/you/') != -1){
				url = url.replace("/you/", "/"+currentUser+"/");
			}
			jQuery.ajax({"url" : BackgroundSoundCloud.Resolve.url, "data" : {"url" : url, "format" : "json"}, "complete" : BackgroundSoundCloud.Resolve.response, "cache" : false, "type" : "get", "context" : {"tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "currentUser" : currentUser, "domain" : domain}});
		}
	},
	response : function(XMLHttpRequest, textStatus){
		if (XMLHttpRequest.status == 200){
			var obj = JSON.parse(XMLHttpRequest.responseText);
			// check if this url is a user
			if (obj.username != undefined){
				BackgroundSoundCloud.User.tracks.request(obj, this.context.tabId, this.context.url, this.context.sessionKey, this.context.currentUser, this.context.domain);
			}
			// check if this url is a track
			if (obj.stream_url != undefined){
				BackgroundSoundCloud.Track.request(obj, this.context.tabId, this.context.url, this.context.sessionKey, this.context.currentUser, this.context.domain);
			}
			// check if this url is a set
			if (obj.permalink_url.indexOf("/sets/") != -1){
				BackgroundSoundCloud.Set.request(obj, this.context.tabId, this.context.url, this.context.sessionKey, this.context.currentUser, this.context.domain);
			}
			// check if this url is a group
			if (obj.permalink_url.indexOf("/groups/") != -1){
				BackgroundSoundCloud.Group.tracks.request(obj, this.context.tabId, this.context.url, this.context.sessionKey, this.context.currentUser, this.context.domain);
			}
		}
	}
}

BackgroundSoundCloud.Insert = function(mp3Links, tabId, sessionKey){
	var old = BackgroundMain.TempPageSongs[tabId];
	var data = mp3Links.length;
	if (old != undefined){
		data += old;
	}
	BackgroundMain.TempPageSongs[tabId] = data;
	BackgroundMain.PageSessionKey[tabId] = sessionKey;
	BackgroundSQL.Songs.insert(mp3Links);
	BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.request(mp3Links);
	jQuery(window).bind('BrowseHistory.insert', tabId, BackgroundMain.Page.setBadgeText);
	BackgroundSQL.BrowseHistory.insert(sessionKey, mp3Links);
	BackgroundMain.ContentScript.add(tabId);
	chrome.tabs.insertCSS(tabId, {"file" : "css/page.css"}, function (){});
}

BackgroundSoundCloud.ParseTracks = function(trackObj, domain, album){
	var songVO = null;
	if (trackObj.streamable == true && trackObj.sharing == "public"){
		try {
			songVO = new SongVO();
			songVO.url = trackObj.stream_url;
			songVO.songtitle = trackObj.title;
			songVO.href = trackObj.permalink_url;
			songVO.artist = trackObj.user.username;
			if (trackObj.artwork_url != null){
				songVO.smallimage = trackObj.artwork_url;
			}
			if (trackObj.genre != null){
				songVO.genre = trackObj.genre;
			}
			if (trackObj.description != null){
				songVO.description = trackObj.description;
			}
			if (trackObj.label_name != null && trackObj.label_name != ""){
				songVO.label = trackObj.label_name;
			}
			if (album != null){
				songVO.album = album;
			}
			if (trackObj.purchase_url != null){
				songVO.amazonmp3link = trackObj.purchase_url;
			}
			songVO.key = hex_md5(songVO.url);
			songVO.domain = domain;
			songVO.domainkey = hex_md5(songVO.domain+songVO.url);
		} catch(e){
			
		}
	}
	return songVO;
}

BackgroundSoundCloud.User = {
	url : "http://api.soundcloud.com",
	tracks : {
		request : function(userObj, tabId, url, sessionKey, currentUser, domain){
			var hasContext = false;
			// check if we are on /tracks
			if (url.indexOf('/tracks') != -1){
				hasContext = true;
				jQuery.ajax({"url" : BackgroundSoundCloud.User.url+"/users/"+userObj.id+"/tracks", "data" : {"format" : "json"}, "complete" : BackgroundSoundCloud.User.tracks.response, "cache" : false, "type" : "get", "context" : {"userObj": userObj, "tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "domain" : domain}});
			}
			// check if we are on /favorites
			if (url.indexOf('/favorites') != -1){
				hasContext = true;
				jQuery.ajax({"url" : BackgroundSoundCloud.User.url+"/users/"+userObj.id+"/favorites", "data" : {"format" : "json"}, "complete" : BackgroundSoundCloud.User.tracks.response, "cache" : false, "type" : "get", "context" : {"userObj": userObj, "tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "domain" : domain}});
			}
			// check if we are on /sets
			if (url.indexOf('/sets') != -1){
				hasContext = true;
			}
			// check if we are on /comments
			if (url.indexOf('/comments') != -1){
				hasContext = true;
			}
			// check if we are on /dropbox
			if (url.indexOf('/dropbox/profile') != -1){
				hasContext = true;
			}
			// could not determine page. if track_count > 0 use tracks otherwise use faorites
			if (hasContext == false){
				var context = "favorites";
				if (userObj.track_count > 0){
					context = "tracks";
				} 
				jQuery.ajax({"url" : BackgroundSoundCloud.User.url+"/users/"+userObj.id+"/"+context, "data" : {"format" : "json"}, "complete" : BackgroundSoundCloud.User.tracks.response, "cache" : false, "type" : "get", "context" : {"userObj": userObj, "tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "domain" : domain}});
			}
		},
		response : function(XMLHttpRequest, textStatus){
			if (XMLHttpRequest.status == 200){
				var tabId = this.context.tabId;
				var sessionKey = this.context.sessionKey;
				var domain = this.context.domain;
				var array = JSON.parse(XMLHttpRequest.responseText);
				var mp3Links = [];
				var len = array.length;
				for (var i = 0; i < len; i++){
					try {
						var trackObj = array[i];
						var songVO = BackgroundSoundCloud.ParseTracks(trackObj, domain);
						if (songVO != null){
							mp3Links.push(songVO);
						}
					} catch(e){
			
					}
				}
				if (mp3Links.length > 0){
					BackgroundSoundCloud.Insert(mp3Links, tabId, sessionKey);
				}
			}
		}
	}
}

BackgroundSoundCloud.Track = {
	request : function(trackObj, tabId, url, sessionKey, currentUser, domain){
		var mp3Links = [];
		try {
			var songVO = BackgroundSoundCloud.ParseTracks(trackObj, domain);
			if (songVO != null){
				mp3Links.push(songVO);
			}
			if (mp3Links.length > 0){
				BackgroundSoundCloud.Insert(mp3Links, tabId, sessionKey);
			}
		} catch(e){
			
		}
	}
}

BackgroundSoundCloud.Set = {
	request : function(setObj, tabId, url, sessionKey, currentUser, domain){
		var mp3Links = [];
		var len = setObj.tracks.length;
		for (var i = 0; i < len; i++){
			try {
				var trackObj = setObj.tracks[i];
				var songVO = BackgroundSoundCloud.ParseTracks(trackObj, domain, setObj.title);
				if (songVO != null){
					mp3Links.push(songVO);
				}
			} catch(e){
				
			}
		}
		if (mp3Links.length > 0){
			BackgroundSoundCloud.Insert(mp3Links, tabId, sessionKey);
		}
	}
}

BackgroundSoundCloud.Group = {
	url : "http://api.soundcloud.com",
	tracks : {
		request : function(groupObj, tabId, url, sessionKey, currentUser, domain){
			jQuery.ajax({"url" : BackgroundSoundCloud.Group.url+"/groups/"+groupObj.id+"/tracks", "data" : {"format" : "json"}, "complete" : BackgroundSoundCloud.Group.tracks.response, "cache" : false, "type" : "get", "context" : {"groupObj": groupObj, "tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "domain" : domain, "currentUser" : currentUser}});
		},
		response : function(XMLHttpRequest, textStatus){
			if (XMLHttpRequest.status == 200){
				var tabId = this.context.tabId;
				var sessionKey = this.context.sessionKey;
				var domain = this.context.domain;
				var array = JSON.parse(XMLHttpRequest.responseText);
				var mp3Links = [];
				var len = array.length;
				for (var i = 0; i < len; i++){
					try {
						var trackObj = array[i];
						var songVO = BackgroundSoundCloud.ParseTracks(trackObj, domain);
						if (songVO != null){
							mp3Links.push(songVO);
						}
					} catch(e){
			
					}
				}
				if (mp3Links.length > 0){
					BackgroundSoundCloud.Insert(mp3Links, tabId, sessionKey);
				}
			}
		}
	}
}

BackgroundSoundCloud.Tracks = {
	url : "http://api.soundcloud.com",
	request : function(tabId, url, sessionKey, currentUser, domain, dataObj){
		jQuery.ajax({"url" : BackgroundSoundCloud.Tracks.url+"/tracks", "data" : dataObj, "complete" : BackgroundSoundCloud.Tracks.response, "cache" : false, "type" : "get", "context" : {"dataObj": dataObj, "tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "domain" : domain, "currentUser" : currentUser}});
	},
	response : function(XMLHttpRequest, textStatus){
		if (XMLHttpRequest.status == 200){
			var tabId = this.context.tabId;
			var sessionKey = this.context.sessionKey;
			var domain = this.context.domain;
			var array = JSON.parse(XMLHttpRequest.responseText);
			var mp3Links = [];
			var len = array.length;
			for (var i = 0; i < len; i++){
				try {
					var trackObj = array[i];
					var songVO = BackgroundSoundCloud.ParseTracks(trackObj, domain);
					if (songVO != null){
						mp3Links.push(songVO);
					}
				} catch(e){
		
				}
			}
			if (mp3Links.length > 0){
				BackgroundSoundCloud.Insert(mp3Links, tabId, sessionKey);
			}
		}
	}
}