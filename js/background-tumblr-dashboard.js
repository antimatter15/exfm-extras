/*
name: background-dashboard
author: Dan Kantor
requires: jquery-1.3.2
*/
if (typeof(BackgroundTumblrDashboard) == 'undefined'){
	BackgroundTumblrDashboard = {}
}	

// possible value - 'oauth', 'basic'
BackgroundTumblrDashboard.AuthType = "";


BackgroundTumblrDashboard.Consumer = {
	consumerKey : "pcl5TN5jEGFLYaNhATTyujwTYGvz13QCEfesZPkcRvEarJsALm",
	consumerSecret : "4eurKzryInb09a6xH6Q0GqRyI0AwvOP6o9ka532zQfGn7MaRUE",
	serviceProvider : {
		signatureMethod : "HMAC-SHA1",
		apiURL : "http://www.tumblr.com/api/dashboard",
	}
}

// check to see if user is logged in. For legacy username/password users, check if we have both. If there is only a username, check to see if we have an oauth token
BackgroundTumblrDashboard.IsLoggedIn = function(){
	var loggedIn = false;
	var tumblr = BackgroundStorage.get("tumblr");
	var tumblrOAuth = BackgroundStorage.get("tumblrOAuth");
	if (tumblr == null && tumblrOAuth == null){
		loggedIn = false;
	} else {
		if (tumblr != null){	
			if (tumblr.username != "" && tumblr.username != undefined && tumblr.password != "" && tumblr.password != undefined){
				loggedIn = true;
				BackgroundTumblrDashboard.AuthType = 'basic';
			} else {
				if (tumblr.username != "" && tumblr.username != undefined && tumblrOAuth != null){
					if (tumblrOAuth.oauth_token != "" && tumblrOAuth.oauth_token != undefined && tumblrOAuth.oauth_token_secret != "" && tumblrOAuth.oauth_token_secret != undefined){
						loggedIn = true;
						BackgroundTumblrDashboard.AuthType = 'oauth';
					} else {
						BackgroundStorage.remove("tumblr");
						BackgroundStorage.remove("tumblrOAuth");
						loggedIn = false;
					}
				} else {
					loggedIn = false;
				}
			}
		}
	}
	var obj = {"loggedIn" : loggedIn, "tumblr" : tumblr, "tumblrOAuth" : tumblrOAuth};
	return obj;
}

BackgroundTumblrDashboard.Request = function(tabId, sessionKey){
	var obj = BackgroundTumblrDashboard.IsLoggedIn();
	if (obj.loggedIn == true){
		if (BackgroundTumblrDashboard.AuthType == 'basic'){
			var tumblr = obj.tumblr;
			jQuery.ajax({"url" : BackgroundTumblrDashboard.Consumer.serviceProvider.apiURL, "data" : {"email" : tumblr.username, "password" : tumblr.password, "start" : 0, "num" : 50, "type" : "audio"}, "complete" : BackgroundTumblrDashboard.Response, "cache" : false, "type" : "post", "context" : {"tabId" : tabId, "sessionKey" : sessionKey}});
		}
		if (BackgroundTumblrDashboard.AuthType == 'oauth'){
			var tumblrOAuth = obj.tumblrOAuth;
			var message = {
					method: "post", 
					action: BackgroundTumblrDashboard.Consumer.serviceProvider.apiURL, 
					parameters: [["start", 0], ["num", 50], ["type", "audio"]]
    			}
				var requestBody = OAuth.formEncode(message.parameters);
				OAuth.completeRequest(message, {
					"consumerKey" : BackgroundTumblrDashboard.Consumer.consumerKey, 
					"consumerSecret" : BackgroundTumblrDashboard.Consumer.consumerSecret, 
					"token" : tumblrOAuth.oauth_token,
                    "tokenSecret" : tumblrOAuth.oauth_token_secret
				});
				var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
				jQuery.ajax({"url" : message.action, "type" : message.method, "beforeSend" : function(x){ x.setRequestHeader("Authorization", authorizationHeader); }, "complete" : BackgroundTumblrDashboard.Response, "cache" : false, "data" : requestBody, "context" : {"tabId" : tabId, "sessionKey" : sessionKey}});
		}
	}
	return obj.loggedIn;
}

BackgroundTumblrDashboard.Response = function(XMLHttpRequest, textStatus){
	if (XMLHttpRequest.status == 200){
		var mp3Links = [];
		var xml = XMLHttpRequest.responseXML;
		var posts = xml.getElementsByTagName("post");
		var len = posts.length;
		for (var i = 0; i < len; i++){
			var post = posts[i];
			try {
				var audioPlayer = post.getElementsByTagName('audio-player');
				var audioPlayerText = audioPlayer[0].textContent;
				var src = audioPlayerText.indexOf("src=");
				var height = audioPlayerText.indexOf("height=");
				var str = audioPlayerText.substring(src+4, height);
				var songVO = new SongVO();
				songVO.url = jQuery.parseQuery(str.split("?")[1])['audio_file']+'?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio';
				songVO.key = hex_md5(songVO.url);
				songVO.songtitle = post.getElementsByTagName('audio-caption')[0].textContent.replace(/(<([^>]+)>)/ig,"");
				songVO.description = post.getElementsByTagName('audio-caption')[0].textContent.replace(/(<([^>]+)>)/ig,"");
				songVO.href = post.getAttribute('url-with-slug');
				songVO.domain = "tumblr.com/dashboard";
				songVO.domainkey = hex_md5('tumblr.com/dashboard'+songVO.href);
				songVO.publishdate = post.getAttribute('unix-timestamp');
				try {
					songVO.songtitle = post.getElementsByTagName('id3-title')[0].textContent;
				} catch(e){}
				try {
					songVO.artist = post.getElementsByTagName('id3-artist')[0].textContent;
				} catch(e){}
				try {
					songVO.album = post.getElementsByTagName('id3-album')[0].textContent;
				} catch(e){}
				try {
					songVO.tracksequence = parseInt(post.getElementsByTagName('id3-track')[0].textContent);
				} catch(e){}
				try {
					songVO.year = parseInt(post.getElementsByTagName('id3-year')[0].textContent);
				} catch(e){}
				mp3Links.push(songVO);
			} catch(e){}
		}
		if (mp3Links.length > 0){
			var tabId = this.context.tabId;
			var sessionKey = this.context.sessionKey;
			// check if it came from a content script or auto-updater. auto-updater will have a null tabId and null sessionKey
			if (tabId != null && sessionKey != null){
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
        	} else {
        		BackgroundSQL.Songs.insert(mp3Links);
        	}
		}
	}
}