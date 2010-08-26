/*
name: background-bandcamp
author: Dan Kantor
requires: jquery-1.3.2, song-vo, md5
*/
if (typeof(BackgroundBandcamp) == 'undefined'){
	BackgroundBandcamp = {}
}

BackgroundBandcamp.Key = "eyjafjallajokull";

BackgroundBandcamp.Resolve = {
	request : function(tabId, url, sessionKey, domain, albumId){
		if (albumId != ""){
			BackgroundBandcamp.Album.info.request(tabId, url, sessionKey, domain, albumId)
		}
	}
}

BackgroundBandcamp.Band = {
	info : {
		url : "http://api.bandcamp.com/api/band/1/info",
		request : function(pageObj, albumObj){
			jQuery.ajax({"url" : BackgroundBandcamp.Band.info.url, "data" : {"key" : BackgroundBandcamp.Key, "band_id" : albumObj.band_id}, "complete" : BackgroundBandcamp.Band.info.response, "cache" : false, "type" : "get", "context" : {"pageObj" : pageObj, "albumObj" : albumObj}});
		},
		response : function(XMLHttpRequest, textStatus){
			if (XMLHttpRequest.status == 200){
				var bandObj = JSON.parse(XMLHttpRequest.responseText);
				BackgroundBandcamp.Songs.parse(this.context.pageObj, bandObj, this.context.albumObj)
			}
		}
	},
	discography : {
		url : "http://api.bandcamp.com/api/band/1/discography",
		request : function(pageObj, bandObj){
			jQuery.ajax({"url" : BackgroundBandcamp.Band.discography.url, "data" : {"key" : BackgroundBandcamp.Key, "band_id" : bandObj.band_id}, "complete" : BackgroundBandcamp.Band.discography.response, "cache" : false, "type" : "get", "context" : {"pageObj" : pageObj, "bandObj" : bandObj}});
		},
		response : function(XMLHttpRequest, textStatus){
			if (XMLHttpRequest.status == 200){
				var discObj = JSON.parse(XMLHttpRequest.responseText);
			}
		}
	}
}

BackgroundBandcamp.Album = {
	info : {
		url : "http://api.bandcamp.com/api/album/1/info",
		request : function(tabId, url, sessionKey, domain, albumId){
			jQuery.ajax({"url" : BackgroundBandcamp.Album.info.url, "data" : {"key" : BackgroundBandcamp.Key, "album_id" : albumId}, "complete" : BackgroundBandcamp.Album.info.response, "cache" : false, "type" : "get", "context" : {"pageObj" : {"tabId" : tabId, "url" : url, "sessionKey" : sessionKey, "domain" : domain, "album_id" : albumId}}});
		},
		response : function(XMLHttpRequest, textStatus){
			if (XMLHttpRequest.status == 200){
				var albumObj = JSON.parse(XMLHttpRequest.responseText);
				BackgroundBandcamp.Band.info.request(this.context.pageObj, albumObj);
			}
		}
	}
}

BackgroundBandcamp.Songs = {
	parse : function(pageObj, bandObj, albumObj){
		var mp3Links = [];
		var len = albumObj.tracks.length;
		for (var i = 0; i < len; i++){
			var track = albumObj.tracks[i];
			if (track.streaming_url != "" && track.streaming_url != undefined){
				var songVO = new SongVO();
				songVO.url = track.streaming_url;
				if (track.title != undefined){
					songVO.songtitle = track.title;
				} else {
					songVO.songtitle = "Unknown Song";
				}
				if (track.artist != undefined){
					songVO.artist = track.artist;
				} else {
					if (bandObj.name != undefined){
						songVO.artist = bandObj.name;
					} 
				}
				if (albumObj.title != undefined){
					songVO.album = albumObj.title;
				} 
				if (track.small_art_url != undefined){
					songVO.smallimage = track.small_art_url;
				} else {
					if (albumObj.small_art_url != undefined){
						songVO.smallimage = albumObj.small_art_url;
					}
				}
				if (track.large_art_url != undefined){
					songVO.largeimage = track.large_art_url;
				} else {
					if (albumObj.large_art_url != undefined){
						songVO.largeimage = albumObj.large_art_url;
					}
				}
				songVO.href = pageObj.url;
				if (track.about != undefined){
					songVO.description = track.about;
				} else {
					if (albumObj.about != undefined){
						songVO.description = albumObj.about;
					}
				}
				if (track.number != undefined){
					songVO.tracksequence = track.number;
				}
				if (track.release_date != undefined){
					songVO.publishdate = track.release_date;
				} else {
					if (albumObj.release_date != undefined){
						songVO.publishdate = albumObj.release_date;
					}
				}
				if (track.url != undefined && bandObj.url != undefined){
					songVO.amazonmp3link = bandObj.url+track.url+"?action=download";
				}
				//songVO.timeseconds = trackObj.duration;
				songVO.key = hex_md5(songVO.url);
				songVO.domain = pageObj.domain;
				songVO.domainkey = hex_md5(songVO.domain+songVO.url);
				mp3Links.push(songVO);
			}
		}
		if (mp3Links.length > 0){
			BackgroundBandcamp.Insert(mp3Links, pageObj.tabId, pageObj.sessionKey);
		}
	}
}

BackgroundBandcamp.Insert = function(mp3Links, tabId, sessionKey){
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

