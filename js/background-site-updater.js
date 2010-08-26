/*
name: background-site-updater
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(BackgroundSiteUpdater) == 'undefined'){
	BackgroundSiteUpdater = {}
}

BackgroundSiteUpdater.Sites = function(obj){
	try {
		var len = obj.results.length;
		var timeout = 0;
		for (var i = 0; i < len; i++){
			var item = obj.results[i];
			timeout += 20000;
			setTimeout(BackgroundSiteUpdater.Update, timeout, item.domain, item.type, i);
		}
		timeout += 30000;
		setTimeout(BackgroundMetadata.GetEmptyMeta.request, timeout);
	} catch (e){
		BackgroundLog.Log("BackgroundSiteUpdater.Sites error: "+e);
	}
}

BackgroundSiteUpdater.WorkerMessage = function(e){
	console.log(e)
}

BackgroundSiteUpdater.Update = function(domain, type, num){
	try {
		switch (type){
			case "tumblr" :
				jQuery.ajax({ url: "http://"+domain+"/api/read/json?type=audio&start=0&num=50", cache: false, success: BackgroundSiteUpdater.Tumblr.response, "context" : domain});
			break;
			default: 
				switch (domain){
					case "tumblr.com/dashboard" :
						BackgroundSiteUpdater.TumblrDashboard.request();
					break;
					case "www.spinner.com" :
						jQuery.ajax({"url" : "http://www.spinner.com/winamp-mp3-of-the-day", "dataType" : "html", "complete" : BackgroundSiteUpdater.Complete, "cache" : false, "context" : domain});
					break;
					case "stereogum.com" :
						jQuery.ajax({"url" : "http://stereogum.com/the-gum-mix/", "dataType" : "html", "complete" : BackgroundSiteUpdater.Complete, "cache" : false, "context" : domain});
					break;
					case "pitchfork.com" :
						jQuery.ajax({"url" : "http://pitchfork.com/forkcast/", "dataType" : "html", "complete" : BackgroundSiteUpdater.Complete, "cache" : false, "context" : domain});
					break;
					case "www.archive.org" :
					break;
					default : 
						jQuery.ajax({"url" : "http://"+domain, "dataType" : "html", "complete" : BackgroundSiteUpdater.Complete, "cache" : false, "context" : domain});
					break;
				}
			break;
		}
	} catch (e){
		BackgroundLog.Log("BackgroundSiteUpdater.Update error: "+e);
	}
}

BackgroundSiteUpdater.Complete = function(XMLHttpRequest, textStatus){
	try {
		if (textStatus == "success"){
			BackgroundSiteUpdater.Tumblr.request(this.context, XMLHttpRequest.responseText);
			BackgroundSiteUpdater.Anchors(this.context, XMLHttpRequest.responseText);
			BackgroundSiteUpdater.AudioElements(this.context, XMLHttpRequest.responseText);
			BackgroundSiteUpdater.ApiScripts.scrape(this.context, XMLHttpRequest.responseText);
			BackgroundSiteUpdater.ApiScripts.remote.scrape(this.context, XMLHttpRequest.responseText);
			//BackgroundLog.Log("Updating Site Complete: "+this.context);
			//XMLHttpRequest = null;
		}
	} catch(e){
		BackgroundLog.Log("Updating Site Complete Error");
	}
}


/*****************************************************************
*
* Check to see if domain is a Tumblr site
*
******************************************************************/
BackgroundSiteUpdater.Tumblr = {
	request : function(domain, html){
		try {
			if (html.indexOf('tumblr_controls') != -1){
				jQuery.ajax({ url: "http://"+domain+"/api/read/json?type=audio&start=0&num=50", cache: false, success: BackgroundSiteUpdater.Tumblr.response, "context" : domain}); 
				BackgroundSQL.Sites.updateType([{"type" : "tumblr", "domain" : domain}]); 
			}
		} catch(e){
			BackgroundLog.Log("BackgroundSiteUpdater.Tumblr Error "+e);
		}
	},
	response : function(json){
		try {
			var str = json.substr(22);
			str = str.substr(0, str.length - 2);
			var obj = JSON.parse(str);
			var total = obj['posts-total'];
			var mp3Links = [];
			for (var i = 0; i < obj.posts.length; i++){
				var item = obj.posts[i];
				var src = item['audio-player'].split('audio_file=');
				var file = src[1].split('&color=');
				var songVO = new SongVO();
				var url = file[0]+'?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio';
				songVO.url = url;
				songVO.songtitle = item['audio-caption'].replace(/(<([^>]+)>)/ig,"");
				songVO.description = item['audio-caption'].replace(/(<([^>]+)>)/ig,"");
				var href = item['url-with-slug'];
				songVO.href = href;
				songVO.key = hex_md5(url);
				songVO.domain = this.context;
				songVO.domainkey = hex_md5(songVO.domain+url);
				songVO.publishdate = item['unix-timestamp'] * 1000;
				mp3Links.push(songVO);
			}
			if (mp3Links.length > 0){
				BackgroundSQL.Songs.insert(mp3Links);
	        	//BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.request(mp3Links);
			}
			//BackgroundLog.Log("Updating Tumblr Site Complete: "+this.context);
		} catch(e){
			BackgroundLog.Log("Updating Tumblr Site Complete Error");
		}
	}
}

/*****************************************************************
*
* Tumblr Dashboard
*
******************************************************************/
BackgroundSiteUpdater.TumblrDashboard = {
	request : function(){
		BackgroundTumblrDashboard.Request(null, null);
	}
}


/*****************************************************************
*
* Check for any anchors
*
******************************************************************/
BackgroundSiteUpdater.Anchors = function(domain, html){
	try {
		var anchors = jQuery(html).find('a');
		var len = anchors.length;
		var mp3Links = [];
		for (var i = 0; i < len; i++){
			var a = anchors[i];
		  	var lastIndex = a.href.lastIndexOf('.');
		  	var sub = a.href.substr(lastIndex, 4);
		  	if (sub == '.mp3' || sub == '.ogg'){
		  		var songVO = new SongVO();
		  		for (var k in APISettableSongVOFields){
					var field = APISettableSongVOFields[k]['field'];
					var type = APISettableSongVOFields[k]['type'];
					var attr = jQuery(a).attr(field);
					if (attr != undefined){
						if (type == 'number'){
							attr = parseInt(attr);
						}
						songVO[field] = attr;
					}
				}
				if (songVO.songtitle == ""){
					songVO.songtitle = "Unknown Title";
				}
				songVO.url = a.href;
	  			songVO.href = "http://"+domain;
	  			songVO.description = jQuery(a).text();
	  			songVO.key = hex_md5(a.href);
		  		songVO.domain = domain;
		  		songVO.domainkey = hex_md5(domain+a.href);
	  			mp3Links.push(songVO);
		  	}
		 }
		 if (mp3Links.length > 0){
			BackgroundSQL.Songs.insert(mp3Links);
	        //BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.request(mp3Links);
		}	
	} catch(e){
		BackgroundLog.Log("Updating Anchors Site Complete Error "+e);
	}
}

/*****************************************************************
*
* Check for any audio elements
*
******************************************************************/
BackgroundSiteUpdater.AudioElements = function(domain, html){
	try {
		var audioElements = jQuery(html).find('audio');
		var len = audioElements.length;
		var mp3Links = [];
		for (var i = 0; i < len; i++){
			var a = audioElements[i];
		  	if (a.src != "" && a.src != undefined){
		  		var src = a.src;
		  		var songVO = new SongVO();
		  		for (var k in APISettableSongVOFields){
					var field = APISettableSongVOFields[k]['field'];
					var type = APISettableSongVOFields[k]['type'];
					var attr = jQuery(a).attr(field);
					if (attr != undefined){
						if (type == 'number'){
							attr = parseInt(attr);
						}
						songVO[field] = attr;
					}
				}
				if (songVO.songtitle == ""){
					songVO.songtitle = "Unknown Title";
				}
				songVO.url = src;
		  		songVO.href = "http://"+domain;
		  		songVO.key = hex_md5(src);
		  		songVO.domain = domain;
		  		songVO.domainkey = hex_md5(domain+src);
				mp3Links.push(songVO);
		  	}
		 }
		 if (mp3Links.length > 0){
		 	BackgroundSQL.Songs.insert(mp3Links);
	        //BackgroundMain.Songs.selectSongsFromDomainKeysWithNoMeta.request(mp3Links);
		 }	
	} catch(e){
		BackgroundLog.Log("Updating Audio Elements Site Complete Error "+e);
	}
}

/*****************************************************************
*
* Check for any api scripts
*
******************************************************************/
BackgroundSiteUpdater.ApiScripts = {
	scrape : function(domain, html){
		try {
			var mp3Links = [];
			var scripts = jQuery(html).find('script.exfm_songs');
			var len = scripts.length;
			for (var i = 0; i < len; i++){
				var script = scripts[i];
				var text = jQuery(script).text();
				mp3Links = BackgroundSiteUpdater.ApiScripts.parse(text, domain);
			}
			if (mp3Links.length > 0){
		 		BackgroundSQL.Songs.insert(mp3Links);
		 	}
		 } catch (e){
		 	BackgroundLog.Log("Updating API Scripts scrape Site Complete Error "+e);
		 }
	},
	parse : function(text, domain){
		var mp3Links = [];
		try {
			var songArray = JSON.parse(text);
			var songArrayLen = songArray.length;
			for (var j = 0; j < songArrayLen; j++){
				var obj = songArray[j];
				if (obj.url != undefined && obj.url != "" && obj.url != null && typeof(obj.url) == 'string'){
					var songVO = new SongVO();
					for (var k in APISettableSongVOFields){
						var field = APISettableSongVOFields[k]['field'];
						var type = APISettableSongVOFields[k]['type'];
						if (obj[field] != undefined){
							if (typeof(obj[field]) == type){
								songVO[field] = obj[field];
							}
						}
					}
					if (songVO.href == ""){
						songVO.href = "http://"+domain;
					}
					if (songVO.songtitle == ""){
						songVO.songtitle = "Unknown Title";
					}
					songVO.key = hex_md5(songVO.url);
  					songVO.domain = domain;
  					songVO.domainkey = hex_md5(domain+songVO.url);
					mp3Links.push(songVO);
				} 
			}
		} catch(e){
			BackgroundLog.Log("Updating API Scripts parse Site Complete Error "+e);
		}
		return mp3Links;
	},
	remote : {
		scrape : function(domain, html){
			try {
				var links = jQuery(html).find('link');
				var linkLen = links.length;
				for (var i = 0; i < linkLen; i++){
					var link = links[i];
					var rel = jQuery(link).attr('rel');
					if (rel == "exfm_songs"){
						var href = jQuery(link).attr('href');
						if (href != ""){
							BackgroundSiteUpdater.ApiScripts.remote.request(href, domain);
						}
					}
				}
			} catch (e){
				BackgroundLog.Log("Updating API Scripts remote scrape Site Complete Error "+e);
			}
		},
		request : function(href, domain){
			try {
				if (href != "" & href != null){
					var url;
					if (href.indexOf('http://') == -1){
						url = 'http://'+href;
					} else {
						url = href;
					}
					jQuery.ajax({ "url": url, cache: false, success: BackgroundSiteUpdater.ApiScripts.remote.response, "context" : {'domain' : domain}, "dataType" : "text"});
				} 
			} catch (e){
				BackgroundLog.Log("Updating API Scripts remote request Site Complete Error "+e);
			}
		},
		response : function(json){
			try {
				var mp3Links = [];
				if (json != ""){
					mp3Links = BackgroundSiteUpdater.ApiScripts.parse(json, this.context.domain);
				}
				if (mp3Links.length > 0){
					BackgroundSQL.Songs.insert(mp3Links);
				}
			} catch (e){
				BackgroundLog.Log("Updating API Scripts remote response Site Complete Error "+e);
			}
		}
	}
}

//(c) 2008 Michael Manning 
jQuery.parseQuery=function(A,B){var C=(typeof A==="string"?A:window.location.search),E={f:function(F){return unescape(F).replace(/\+/g," ")}},B=(typeof A==="object"&&typeof B==="undefined")?A:B,E=jQuery.extend({},E,B),D={};jQuery.each(C.match(/^\??(.*)$/)[1].split("&"),function(F,G){G=G.split("=");G[1]=E.f(G[1]);D[G[0]]=D[G[0]]?((D[G[0]] instanceof Array)?(D[G[0]].push(G[1]),D[G[0]]):[D[G[0]],G[1]]):G[1]});return D};


jQuery(window).bind("Sites.sitesNeedUpdating", BackgroundSiteUpdater.Sites);