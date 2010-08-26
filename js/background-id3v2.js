/*
name: background-remote-api-script
author: Dan Kantor
requires: jquery-1.3.2, md5
uses: song-vo
*/
if (typeof(Backgroundid3v2) == 'undefined'){
	Backgroundid3v2 = {}
}

Backgroundid3v2.Request = function(url, tabId, sessionKey, debugOn, locationHref, domain){
	jQuery.ajax({ "url": url, cache: false, success: Backgroundid3v2.Response, "context" : {'tabId' : tabId, 'sessionKey' : sessionKey, 'debugOn' : debugOn, "locationHref" : locationHref, "domain" : domain}, "dataType" : "json"});
}

Backgroundid3v2.Response = function(json){
	if (typeof(json) == "object"){
		Backgroundid3v2.Parse(json, this.context.tabId, this.context.sessionKey, this.context.debugOn, this.context.locationHref, this.context.domain);
	}
}

Backgroundid3v2.Parse = function(json, tabId, sessionKey, debugOn, locationHref, domain){
	var mp3Links = [];
	var songArrayLen = json.length;
	for (var j = 0; j < songArrayLen; j++){
		var obj = json[j];
		if (obj.url != undefined && obj.url != "" && obj.url != null && typeof(obj.url) == 'string'){
			var songVO = new SongVO();
			for (var k in APISettableSongVOFields){
				var field = APISettableSongVOFields[k]['field'];
				var type = APISettableSongVOFields[k]['type'];
				if (obj[field] != undefined){
					if (typeof(obj[field]) == type){
						songVO[field] = obj[field];
					} else {
						if (debugOn){
							console.log("exfm api wrong field type for", field, "Expected:", type, "Got:", typeof(obj[field]));
						}
					}
				}
			}
			if (songVO.href == ""){
				songVO.href = locationHref;
				if (debugOn){
					console.log("exfm api: no href found. Using current location.href");
				}
			}
			if (songVO.songtitle == ""){
				songVO.songtitle = "Unknown Title";
				if (debugOn){
					console.log("exfm api: no songtitle found. Using 'Unknown Title'");
				}
			}
			songVO.key = hex_md5(songVO.url);
			songVO.domain = domain;
			songVO.domainkey = hex_md5(domain+songVO.url);
			if (debugOn){
				console.log("exfm api song object:", songVO);
			}
			mp3Links.push(songVO);
		} else {
			if (debugOn){
				console.log('exfm api error: url field must be a string, not null, not undefined and not empty');
			}
		} 
	}
	if (mp3Links.length > 0){
		//chrome.tabs.sendRequest(tabId, {"msg" : "mp3Links", "mp3Links" : mp3Links});
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
}
