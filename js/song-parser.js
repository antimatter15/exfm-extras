/*
name: song-parser
author: Dan Kantor
requires: jquery-1.3.2, md5
uses: song-vo
*/

function guessSong(n){
  var parts = unescape(n)
    .replace(/^.*(music|desktop|document|video|home)/gi,'')
    .replace(/\[[^\]]+\]/g,'')
    .replace(/_/g,' ')
    .replace(/[0-9]+\s*(kbps|\-)/,'')
    .split(/[\/]/)
    .reverse();
    
  var name = parts[0]
    .replace(/\.(mp3|ogg|flac)/,'')
    .replace(/^\s|\s$/g,'')
    .replace(/^\d+\s*/,'');
    
  var artist='Unknown',album='Unknown';
  console.log(parts);

  if(/\-/.test(name)){
    console.log('DashInName');
    var np = name.split('-').reverse();
    name = np[0];
    if(np.length >= 2){
      artist = np[1];
    }
    if(np.length >= 3){
      artist = np[2];
      album = np[1]
    }
    if(parts[1] && parts[2]){
      var album = parts[2]
        .replace(/^\s|\s$/g,'');
      if(!album){
        console.log('UndefinedAlbum');
        album = parts[1]
        .replace(/^\s|\s$/g,'');
      }
    }
  }else{
    if(parts[1]){
      console.log('DefaultCase');
      var album = parts[1]
      .replace(/^\s|\s$/g,'')
    }
    if(parts[2]){
      var artist = parts[2]
        .replace(/^\s|\s$/g,'')
        .replace(/^\d+\s*/,'');
    }
  }
  if(/\-/.test(album)){
    console.log('DashInAlbum');
    var as = album.split('-');
    album = as[1];
    if(!artist){
      artist = as[0];
    }
  }
  console.log(name, 'artist',artist,'album',album);
  return {
    Title: name,
    Artist: artist,
    Album: album
  }
}


if (typeof(songParser) == 'undefined'){
	songParser = {}
}
songParser.Songs = [];
songParser.SessionKey = null;
songParser.ParseAnchors = true;


songParser.Init = function(){
	var d = new Date();
	var r = Math.random();
	songParser.SessionKey = hex_md5(d+r);
	songParser.Songs = [];
	songParser.FindSongs();
	songParser.Utils.removeYMP.request();
	songParser.Utils.removeYMP.response();
}

songParser.FindSongs = function(){
	// check if on Tumblr blog (async)
	songParser.Parse.tumblrAPI.request();
	
	// check if on Tumblr Dashboard
	songParser.Parse.tumblrDasboard.request();
	
	
	// check if on archive.org
	var archives = songParser.Parse.archiveOrg.scrape();
	jQuery.merge(songParser.Songs, archives);
	
	// check if on SoundCloud
	songParser.Parse.soundCloud.onSite();
	
	// check for soundcloud embeds
	songParser.Parse.soundCloud.scrape();
	
	// check if on Bandcamp
	//songParser.Parse.bandcamp.onSite();
	
	// check for anchors
	if (songParser.ParseAnchors == true){
		var anchors = songParser.Parse.anchors();
		jQuery.merge(songParser.Songs, anchors);
	}
	
	// check for audio elements
	if (songParser.ParseAnchors == true){
		var audioElements = songParser.Parse.audioElements();
		jQuery.merge(songParser.Songs, audioElements);
	}
	
	// check for api scripts
	var apiScripts = songParser.Parse.apiScripts.scrape();
	jQuery.merge(songParser.Songs, apiScripts);
	
	// check for remote api scripts
	songParser.Parse.apiScripts.remote.scrape();
	
	if (songParser.Songs.length > 0){
		var obj = {"msg" : "pageSongs", "sessionKey" : songParser.SessionKey, "data" : songParser.Songs};
		songParser.Comm.send(obj);
	}
}

songParser.Parse = {
	anchors : function(){
		var anchors = jQuery('a');
	  	var len = anchors.length;
	  	var mp3Links = [];
	  	for (var i = 0; i < len; i++){
	  		var a = anchors[i];
	  		var lastIndex = a.href.lastIndexOf('.');
	  		var sub = a.href.substr(lastIndex, 4);
	  		if (sub == '.mp3' || sub == '.ogg'){
	  		  //possibilities: music/song
	  		  //music/album/song
	  		  //music/artist/
	  		
	  		
	  			;(function(a){
	  			  var handleSong = function(tags){
	  			    console.log('handling a song');
	  					var songVO = new SongVO();
							songVO.url = a.href;
							songVO.href = location.href;
							songVO.songtitle = tags.Title || jQuery(a).text();
							songVO.description = jQuery(a).text();
							songVO.key = hex_md5(a.href);
							songVO.domain = location.hostname;
							songVO.domainkey = hex_md5(location.hostname+a.href);
						
							songVO.artist = tags.Artist || '';
							songVO.album = tags.Album || '';
						  if(tags.pictures){
							  songVO.smallimage = tags.pictures.length?tags.pictures[0].dataURL:null;
	  			    }
	  			
	  					console.log(tags, songVO);
	  					
	  					
	  					mp3Links.push(songVO);
							songParser.PagePlayer.position++;
							jQuery(a).addClass('exfm'+songVO.domainkey);
							jQuery(a).addClass('exfmSinglePlayer');
							jQuery(a).attr('exfmDomainKey', songVO.domainkey);
							jQuery(a).attr('exfmPosition', songParser.PagePlayer.position);
							jQuery(a).click(songParser.PagePlayer.click);
							songParser.PagePlayer.players.push(a);
							
							var o = {"msg" : "pageSongsMore", "sessionKey" : songParser.SessionKey, "data" : [songVO]};
							songParser.Comm.send(o);
	  				};
	  				
	  			  try{
	  				  ID3v2.parseURL(a.href, handleSong)
	  				}catch(err){
              handleSong(guessSong(a.href));
            }
	  			})(a);
	  		}	
	  	}
	  	return mp3Links;
	},
	tumblrDasboard : {
		urls : [],
		request : function(){
			if (location.href.indexOf('tumblr.com/dashboard') != -1){
				var o = {"msg" : "tumblrDashboard", "sessionKey" : songParser.SessionKey};
				songParser.Comm.send(o);
			}
		},
		api : {
			timeout : null,
			request : function(loggedIn){
				if (loggedIn == true){
					setInterval(songParser.Parse.tumblrDasboard.loadMore, 5000);
				} else {
					songParser.Parse.tumblrDasboard.loadMore();
				}
			}
		},
		loadMore : function(){
			var mp3Links = songParser.Parse.tumblrDasboard.scrape();
			if (mp3Links.length > 0){
				var o = {"msg" : "pageSongsMore", "sessionKey" : songParser.SessionKey, "data" : mp3Links};
				songParser.Comm.send(o);
			}
		},
		scrape : function(){
			var mp3Links = [];
			var lis = jQuery('li.audio');
			var len = lis.length;
			for (var i = 0; i < len; i++){
				try {
					var li = lis[i];
					var songVO = new SongVO();
					var embeds = jQuery(li).find('embed');
					var embed = embeds[0];
					var srcAttr = jQuery(embed).attr('src');
					var src = srcAttr.split('audio_file=');
					var file = src[1].split('&color=');
					var url = file[0]+'?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio';
					
					if (jQuery.inArray(url, songParser.Parse.tumblrDasboard.urls) == -1){
						
						songParser.Parse.tumblrDasboard.urls.push(url);
						
						songVO.url = url;
						songVO.key = hex_md5(url);
						var postBodies = jQuery(li).find('.post_body');
						var postBody = postBodies[0];
						var albumArts = jQuery(li).find('.album_art');
						if (albumArts.length > 0){
							var albumArt = albumArts[0];
							songVO.smallimage = jQuery(albumArt).attr('src');
							var title = jQuery(albumArt).attr('title');
							var titleSplit = title.split(' - ');
							songVO.artist = titleSplit[0];
							songVO.songtitle = titleSplit[1];
						} else {
							songVO.songtitle = jQuery.trim(jQuery(postBody).html().replace(/(<([^>]+)>)/ig,""));
						}
						songVO.description = jQuery.trim(jQuery(postBody).html().replace(/(<([^>]+)>)/ig,""));
						var as = jQuery(li).find('.so_ie_doesnt_treat_this_as_inline a');
						for (var j = 0; j < as.length; j++){
							var a = as[j];
							if (jQuery(a).attr('title') == 'Permalink'){
								songVO.href = jQuery(a).attr('href');
							}
						}
						songVO.domain = "tumblr.com/dashboard";
						songVO.domainkey = hex_md5('tumblr.com/dashboard'+songVO.href);
						mp3Links.push(songVO);
						
						
						songParser.PagePlayer.position++;
						var a = jQuery('<div>Click to play</div>');
						jQuery(a).addClass('exfm'+songVO.domainkey);
						jQuery(a).addClass('exfmSinglePlayer');
						jQuery(a).attr('exfmDomainKey', songVO.domainkey);
		  				jQuery(a).attr('exfmPosition', songParser.PagePlayer.position);
		  				jQuery(a).click(songParser.PagePlayer.click);
		  				jQuery(a).insertBefore(embed);
		  				jQuery(embed).remove();
		  				songParser.PagePlayer.players.push(a);
							
					}
				} catch(e){}
			}
			return mp3Links;
		}
	},
	tumblrAPI : {
		timeout : null,
		request : function(){
			var iframes = jQuery('iframe');
			var len = iframes.length;
			for (var i = 0; i < len; i++){
				var iframe = iframes[i];
				if (iframe.id == 'tumblr_controls'){
					jQuery.ajax({ url: "/api/read/json?type=audio&start=0&num=50", cache: false, success: songParser.Parse.tumblrAPI.response});
					songParser.Parse.tumblrAPI.timeout = setTimeout(songParser.Parse.tumblrAPI.scrape, 5000);
				}
			}
		},
		response : function(json){
			clearTimeout(songParser.Parse.tumblrAPI.timeout);
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
				if (obj.tumblelog.cname) {
					songVO.domain = obj.tumblelog.cname;
				} else {
					songVO.domain = obj.tumblelog.name+".tumblr.com";
				}
				songVO.domainkey = hex_md5(songVO.domain+url);
				songVO.publishdate = item['unix-timestamp'] * 1000;
				mp3Links.push(songVO);
			}
			if (mp3Links.length > 0){
				var o = {"msg" : "pageSongsMore", "sessionKey" : songParser.SessionKey, "data" : mp3Links};
				songParser.Comm.send(o);
			}
			songParser.Parse.tumblrAPI.scrape();
		},
		scrape : function(){
			var mp3Links = [];
			var divs = jQuery('div.audio_player');
			var len = divs.length;
			for (var i = 0; i < len; i++){
				try {
					songParser.PagePlayer.position++;
					var div = divs[i];
					var songVO = new SongVO();
					var embeds = jQuery(div).find('embed');
					var embed = embeds[0];
					var srcAttr = jQuery(embed).attr('src');
					var url = jQuery.parseQuery(srcAttr.split("?")[1])['audio_file']+'?plead=please-dont-download-this-or-our-lawyers-wont-let-us-host-audio';
					var a = jQuery('<div>Click to play</div>');
					jQuery(a).css({"-webkit-border-radius" : "5px", "background" : "url(http://static.extension.fm/mini_player_controls.png) no-repeat 10px 6px, -webkit-gradient(linear, 0% 0%, 0% 100%, from(#5a5a5a), to(#3f3f3f), color-stop(.5,#373737),color-stop(.5,#2d2d2d))", "border" : "1px solid #3b3b3b", "-webkit-box-shadow" : "inset 0 1px 0 rgba(255,255,255, .3 ), 0 1px 0 rgba(0,0,0, .9)", "height" : "24px", "width" : "202px", "text-indent" : "30px", "line-height" : "25px", "text-shadow" : "0 -1px 0 rgba(0,0,0, .9)", "color" : "#dcdcdc", "font-size" : "11px", "font-weight" : "bold", "cursor" : "pointer", "overflow" : "hidden", "white-space" : "nowrap", "text-overflow" : "ellipsis", "display" : "block", "text-decoration" : "none"});
					var domainkey = hex_md5(location.hostname+url);
					jQuery(a).addClass('exfm'+domainkey);
					jQuery(a).addClass('exfmSinglePlayer');
					jQuery(a).attr('exfmDomainKey', domainkey);
	  				jQuery(a).attr('exfmPosition', songParser.PagePlayer.position);
	  				jQuery(a).click(songParser.PagePlayer.click);
	  				jQuery(a).insertBefore(embed);
	  				jQuery(embed).remove();
	  				songParser.PagePlayer.players.push(a);
	  				var songVO = new SongVO();
	  				songVO.url = url;
	  				songVO.key = hex_md5(url);
	  				songVO.domain = location.hostname;
	  				songVO.domainkey = domainkey;
	  				songVO.href = location.href;
	  				mp3Links.push(songVO);
					
				} catch(e){}
			}
			if (mp3Links.length > 0){
	  			var obj = {"msg" : "pageSongsMore", "sessionKey" : songParser.SessionKey, "data" : mp3Links};
				songParser.Comm.send(obj);
	  		}
		}
	},
	archiveOrg : {
		scrape : function(){
			var mp3Links = [];
			if (location.href.indexOf('archive.org/') != -1){
				songParser.ParseAnchors = false;
				var xmlUrl = null;
				var anchors = jQuery('a');
		  		var len = anchors.length;
		  		for (var i = 0; i < len; i++){
		  			var a = anchors[i];
		  			var lastIndex = a.href.lastIndexOf('.');
		  			var sub = a.href.substr(lastIndex - 3, 7);
		  			if (sub == 'vbr.mp3'){
			  			var songVO = new SongVO();
			  			songVO.url = a.href;
			  			songVO.href = location.href;
			  			songVO.songtitle = jQuery(a).text();
			  			songVO.description = jQuery(a).text();
			  			songVO.key = hex_md5(a.href);
			  			songVO.domain = location.hostname;
			  			songVO.domainkey = hex_md5(location.hostname+a.href);
			  			mp3Links.push(songVO);
			  			songParser.PagePlayer.position++;
			  			jQuery(a).addClass('exfm'+songVO.domainkey);
			  			jQuery(a).addClass('exfmSinglePlayer');
			  			jQuery(a).attr('exfmDomainKey', songVO.domainkey);
			  			jQuery(a).attr('exfmPosition', songParser.PagePlayer.position);
			  			jQuery(a).click(songParser.PagePlayer.click);
			  			songParser.PagePlayer.players.push(a);
		  			}
		  			var xmlSub = a.href.substr(lastIndex - 5, 9);
		  			if (xmlSub == 'files.xml'){
		  				xmlUrl = a.href;
		  			}
		  		}
		  		if (xmlUrl != null){
		  			var obj = {"msg" : "archiveOrgRequest", "url" : xmlUrl};
					songParser.Comm.send(obj);
				}
			}
			if (mp3Links.length == 0){
	  			songParser.ParseAnchors = true;
	  		}
			return mp3Links;
		}
	},
	apiScripts : {
		scrape : function(){
			var mp3Links = [];
			var scripts = jQuery('script.exfm_songs');
			var len = scripts.length;
			var endDebugOn = false;
			for (var i = 0; i < len; i++){
				var script = scripts[i];
				var debugOn = false;
				var debug = jQuery(script).attr("debug");
				if (debug == "true"){
					debugOn = true;
					endDebugOn = true;
					console.log("exfm api: script at "+location.href+" turned debug on");
				}
				if (debugOn){
					console.log("exfm api found script:", script);
				}
				var text = jQuery(script).text();
				if (debugOn){
					console.log("exfm api found text in script:", text);
				}
				mp3Links = songParser.Parse.apiScripts.parse(text, debugOn);
			}
			if (endDebugOn){
				console.log("exfm api songs found array:", mp3Links);
			}
			return mp3Links;
		}, 
		parse : function(text, debugOn){
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
								} else {
									if (debugOn){
										console.log("exfm api wrong field type for", field, "Expected:", type, "Got:", typeof(obj[field]));
									}
								}
							}
						}
						if (songVO.href == ""){
							songVO.href = location.href;
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
	  					songVO.domain = location.hostname;
	  					songVO.domainkey = hex_md5(location.hostname+songVO.url);
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
			} catch(e){
				if (debugOn){
					console.log('exfm api JSON.parse error:', e);
				}
			}
			return mp3Links;
		},
		remote : {
			scrape : function(){
				var links = jQuery('link');
				var linkLen = links.length;
				for (var i = 0; i < linkLen; i++){
					var link = links[i];
					var rel = jQuery(link).attr('rel');
					if (rel == "exfm_songs"){
						var debugOn = false;
						var href = jQuery(link).attr('href');
						var debug = jQuery(link).attr('debug');
						if (debug == "true"){
							debugOn = true;
						}
						if (href != ""){
							songParser.Parse.apiScripts.remote.request(href, debugOn);
						}
					}
				}
			},
			request : function(href, debugOn){
				if (href != "" & href != null){
					if (href.indexOf('http://') == -1){
						jQuery.ajax({ "url": href, cache: false, success: songParser.Parse.apiScripts.remote.response, "context" : {'debugOn' : debugOn}, "dataType" : "text"});
					} else {
						var obj = {"msg" : "remoteApiScriptRequest", "url" : href, "sessionKey" : songParser.SessionKey, "debugOn" : debugOn, "locationHref" : location.href, "domain" : location.hostname};
						songParser.Comm.send(obj);
					}
				}
			},
			response : function(json){
				var mp3Links = [];
				if (json != ""){
					mp3Links = songParser.Parse.apiScripts.parse(json, this.context.debugOn);
				}
				if (mp3Links.length > 0){
					var o = {"msg" : "pageSongsMore", "sessionKey" : songParser.SessionKey, "data" : mp3Links};
					songParser.Comm.send(o);
				}
			}
		}
	},
	soundCloud : {
		onSite : function(){
			if (location.href.indexOf('soundcloud.com') != -1){
				var currentUser = jQuery('.current-user').text();
				var o = {"msg" : "soundCloudSite", "sessionKey" : songParser.SessionKey, "currentUser" : currentUser, "url" : location.href, "domain" : location.hostname};
				songParser.Comm.send(o);
			}
		},
		scrape : function(){
			var objects = jQuery('object');
			var len = objects.length;
			for (var i = 0; i < len; i++){
				var object = objects[i];
				var innerHTML = jQuery(object).html();
				if (innerHTML.indexOf('http://player.soundcloud.com/player.swf') != -1){
					if (innerHTML.indexOf('http://player.soundcloud.com/player.swf?playlist=') == -1){
						var parser = new DOMParser();
	 					var xmlDoc = parser.parseFromString(innerHTML, "text/xml");
	 					var params = xmlDoc.getElementsByTagName("param");
	 					var paramsLen = params.length;
	 					for (var j = 0; j < paramsLen; j++){
	 						var n = params[j].attributes.getNamedItem("name").nodeValue;
	 						if (n == 'src' || n == 'movie'){
	 							var v = params[j].attributes.getNamedItem("value").nodeValue;
	 							var queryObject = jQuery.parseQuery(v.split("?")[1]);
	 							var url = queryObject.url;
	 							var o = {"msg" : "soundCloudSite", "sessionKey" : songParser.SessionKey, "currentUser" : '', "url" : url, "domain" : location.hostname};
								songParser.Comm.send(o);
								break;
	 						}
	 					}
					} else {
						//value="http://player.soundcloud.com/player.swf?playlist=get-religion&amp;show_comments=false&amp;auto_play=false&amp;show_playcount=false&amp;show_artwork=false&amp;color=6e079b"
						//http://soundcloud.com/widget.json?playlist=get-religion
					}
 				}
			}
		}
	},
	audioElements : function(){
		var audioElements = jQuery('audio');
	  	var len = audioElements.length;
	  	var mp3Links = [];
	  	for (var i = 0; i < len; i++){
	  		var a = audioElements[i];
	  		if (a.src != "" && a.src != undefined){
		  		var src = a.src;
		  		var songVO = new SongVO();
	  			var debugOn = false;
				var debug = jQuery(a).attr('debug');
				if (debug == "true"){
						debugOn = true;
				}
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
					if (debugOn){
						console.log("exfm api: no songtitle found. Using 'Unknown Title'");
					}
				}
				songVO.url = src;
		  		songVO.href = location.href;
		  		songVO.key = hex_md5(src);
		  		songVO.domain = location.hostname;
		  		songVO.domainkey = hex_md5(location.hostname+src);
		  		if (debugOn){
					console.log("exfm api song object:", songVO);
				}
		  		mp3Links.push(songVO);
		  		//songParser.PagePlayer.position++;
		  		//jQuery(a).addClass('exfm'+songVO.domainkey);
		  		//jQuery(a).addClass('exfmSinglePlayer');
		  		//jQuery(a).attr('exfmDomainKey', songVO.domainkey);
		  		//jQuery(a).attr('exfmPosition', songParser.PagePlayer.position);
		  		//jQuery(a).click(songParser.PagePlayer.click);
		  		//songParser.PagePlayer.players.push(a);
		  	} else {
		  		console.log('exfm api error: audio element src attribute must not be empty');
		  	}	
	  	}
	  	return mp3Links;
	},
	bandcamp : {
		onSite : function(){
			//if (location.href.indexOf('bandcamp.com') != -1){
				var html = document.body.innerHTML;
				var find = 'tralbum_param : { name : "album", value :';
				var startIndex = html.indexOf(find);
				if (startIndex != -1){
					var newHTML = html.slice(startIndex);
					var endIndex = newHTML.indexOf('}');
					var albumId = jQuery.trim(newHTML.slice(find.length, endIndex-1));
					var o = {"msg" : "bandcampSite", "sessionKey" : songParser.SessionKey, "url" : location.href, "domain" : location.hostname, "albumId" : albumId};
					songParser.Comm.send(o);
				}
			//}
		}
	}
}



























































/*****************************************************************
*
* Send messages to the extension (one-time requests)
*
******************************************************************/
songParser.Comm = {
	send : function(obj){
		chrome.extension.sendRequest(obj, function(response){
			try {
				if (response.closePagePlayer == true){
					songParser.MainPlayer.closedPagePlayer = true;
					songParser.MainPlayer.hide();
				}
			} catch(e){}
		});
	}
}


/*****************************************************************
*
* Listener from the extension (one-time requests)
*
******************************************************************/
songParser.Listener = function(request, sender, sendResponse){
	switch (request.msg){
		case 'songChange' :
			songParser.MainPlayer.isPlaying = request.isPlaying;
			songParser.MainPlayer.isStopped = request.isStopped;
			songParser.PagePlayer.songChange(request.songVO);
			songParser.MainPlayer.transport.displayPause(true);
			songParser.MainPlayer.currentSong(request.songVO);
			if (location.hostname == request.songVO.domain){
				if (request.closePagePlayer != true){
					songParser.MainPlayer.build();
				}
			} else {
				if (location.hostname+location.pathname == "www.tumblr.com/dashboard" && request.songVO.domain == "tumblr.com/dashboard"){
					if (request.closePagePlayer != true){
						songParser.MainPlayer.build();
					}
				} else {
					songParser.MainPlayer.hide();
				}
			}
		break;
		case 'play' :
			songParser.PagePlayer.play(request.songVO);
			songParser.MainPlayer.transport.displayPause(true);
		break;
		case 'pause' :
			songParser.PagePlayer.pause(request.songVO);
			songParser.MainPlayer.transport.displayPause(false);
		break;
		case 'stop' :
			songParser.PagePlayer.stop(request.songVO);
			songParser.MainPlayer.transport.stop();
		break;
		case 'allMeta' :
			songParser.MainPlayer.volume.saved = request.volume;
			songParser.MainPlayer.volume.event(request.volume);
			songParser.MainPlayer.setDuration(request.duration);
			songParser.MainPlayer.currentSong(request.songVO);
			songParser.PagePlayer.songChange(request.songVO);
		break;
		case 'durationChange' :
			songParser.MainPlayer.setDuration(request.duration);
		break;
		case 'currentSongVO' :
			songParser.MainPlayer.volume.saved = request.volume;
			songParser.MainPlayer.isPlaying = request.isPlaying;
			songParser.MainPlayer.isStopped = request.isStopped;
			if (request.songVO != null){
				if (location.hostname == request.songVO.domain){
					if (request.isStopped == false){
						if (request.closePagePlayer != true){
							songParser.MainPlayer.build();
							songParser.MainPlayer.setDuration(request.duration);
							songParser.MainPlayer.currentSong(request.songVO);
							songParser.MainPlayer.currentTime(request.currentTime, request.percentage);
						}
					}
				} else {
					if (location.hostname+location.pathname == "www.tumblr.com/dashboard" && request.songVO.domain == "tumblr.com/dashboard"){
						if (request.isStopped == false){
							if (request.closePagePlayer != true){
								songParser.MainPlayer.build();
								songParser.MainPlayer.setDuration(request.duration);
								songParser.MainPlayer.currentSong(request.songVO);
								songParser.MainPlayer.currentTime(request.currentTime, request.percentage);
							}
						}
					} else {
						songParser.MainPlayer.hide();
					}
				}
				songParser.PagePlayer.songChange(request.songVO);
			}
		break;
		case 'playLoading' : 
			songParser.MainPlayer.showLoading();
		break;
		case 'playPlaying' : 
			songParser.MainPlayer.hideLoading();
		break;
		case 'setVolume' : 
			songParser.MainPlayer.volume.event(request);
		break;
		case 'tumblrDashboard' : 
			songParser.Parse.tumblrDasboard.api.request(request.loggedIn);
		break;
		case 'setBadgeText' :
			var obj = {"count" : request.count};
			songParser.HostPageEvent("exfmSongsAddedEvent", obj);
		break;
		default: 
		break;	
	}
	sendResponse({});
}
chrome.extension.onRequest.addListener(songParser.Listener);


/*****************************************************************
*
* Pass data to the Host Page
*
******************************************************************/

songParser.HostPageEvent = function(eventName, data){
	var div = document.createElement('div');
	div.style.display = "none";
	if (data != null){
		data.eventName = eventName;
	} else {
		data = {
			"eventName" : eventName
		}
	}
	div.innerText = JSON.stringify(data);
	document.body.appendChild(div);
	var event = document.createEvent('Event');
	event.initEvent(eventName, true, true);
	div.dispatchEvent(event);
}


/*****************************************************************
*
* Port Listener from extension (Long-lived)
*
******************************************************************/
songParser.PortListener = {
	percentage : 0,
	connect : function(port){
		port.onMessage.addListener(songParser.PortListener.message);
	},
	message : function(msg){
		songParser.PortListener.percentage = msg.percentage;
		//songParser.PagePlayer.currentTime(msg.percentage);
		songParser.MainPlayer.currentTime(msg.currentTime, msg.percentage);
	}
}
chrome.extension.onConnect.addListener(songParser.PortListener.connect);


/*****************************************************************
*
* Page Player
*
******************************************************************/
songParser.PagePlayer = {
	oldSong : null,
	oldText : "",
	position : -1,
	players : [],
	queued : {},
	progressed : null,
	oldBgColor : "#000000",
	oldTextColor : "#FFFFFF",
	oldProgressColor : "#FFFFFF",
	songChange : function(songVO){
		jQuery('.exfmSinglePlayerDisplay').remove();
		if (songParser.PagePlayer.oldSong != null){
			jQuery(songParser.PagePlayer.oldSong).removeClass('exfmCurrentSong');
			jQuery(songParser.PagePlayer.oldSong).removeClass('exfmPlaying');
			jQuery(songParser.PagePlayer.oldSong).removeClass('exfmPaused');
			jQuery(songParser.PagePlayer.oldSong).text(songParser.PagePlayer.oldText);
		} 
		songParser.PagePlayer.oldSong = null;
		var current = jQuery('.exfm'+songVO.domainkey);
		songParser.PagePlayer.oldText = jQuery(current).text();
		if (songVO.songtitle != ""){
			jQuery(current).text(songVO.songtitle);
			if (songVO.artist != ""){
				jQuery(current).text(songVO.songtitle+" by "+songVO.artist);
			}
		}
		jQuery(current).addClass('exfmCurrentSong');
		if (songParser.MainPlayer.isPlaying == true){
			jQuery(current).addClass('exfmPlaying');
		} else {
			jQuery(current).addClass('exfmPaused');
		}
		//jQuery('.exfm'+songVO.domainkey).prepend("<div class=\"exfmSinglePlayerDisplay\"><div class=\"exfmSinglePlayerProgressBack\"></div><div class=\"exfmSinglePlayerProgressFront\" id=\"exfmSinglePlayerProgressed\"></div></div>");
		//songParser.PagePlayer.progressed = jQuery('#exfmSinglePlayerProgressed')[0];
		songParser.PagePlayer.oldSong = jQuery('.exfm'+songVO.domainkey);	
		
	},
	click : function(e){
		if (jQuery(this).hasClass('exfmCurrentSong')){
			var obj = {"msg" : "playPauseSong"};
				songParser.Comm.send(obj);
		} else {
			jQuery(this).addClass('exfmCurrentSong');
			jQuery(this).addClass('exfmPlaying');
			var playDomainKey = jQuery(this).attr('exfmDomainKey');
			var domainKeys = [];
	  		for (var i = 0; i < songParser.PagePlayer.players.length; i++){
	  			var player = songParser.PagePlayer.players[i];
	  			var domainKey = jQuery(player).attr('exfmDomainKey');
	  			domainKeys.push(domainKey);
	  		}
	  		if (domainKeys.length > 0){
	  			var obj = {"msg" : "selectAndQueueByDomainKeys", "data" : domainKeys};
	  			songParser.Comm.send(obj);
	  		}
	  		var obj = {"msg" : "selectAndPlayByDomainKey", "data" : playDomainKey};
	  		songParser.Comm.send(obj);
			}
			songParser.MainPlayer.isPlaying = true;
			if (songParser.MainPlayer.closedPagePlayer == false){
				songParser.MainPlayer.build(true);
			}
			return false;
	},
	play : function(songVO){	
		jQuery(songParser.PagePlayer.oldSong).removeClass('exfmPaused');
		jQuery('.exfm'+songVO.domainkey).addClass('exfmPlaying');
	},
	pause : function(songVO){
		jQuery('.exfm'+songVO.domainkey).removeClass('exfmPlaying');
		jQuery(songParser.PagePlayer.oldSong).addClass('exfmPaused');
	},
	stop : function(songVO){
		try {
			//jQuery('.exfmSinglePlayerDisplay').remove();
			jQuery(songParser.PagePlayer.oldSong).removeClass('exfmCurrentSong');
			songParser.PagePlayer.oldSong = null;
			jQuery(songParser.PagePlayer.oldSong).removeClass('exfmPaused');
			jQuery('.exfm'+songVO.domainkey).removeClass('exfmPlaying');
		} catch(e){}
	},
	currentTime : function(percentage){
		jQuery(songParser.PagePlayer.progressed).css('width', 161 * percentage + 3);
	}
}


/*****************************************************************
*
* Main Player at bottom
*
******************************************************************/
songParser.MainPlayer = {
	closedPagePlayer : false,
	progressWidth : 0,
	progressLeft : 0,
	progressRight : 0,
	volumeWidth : 60,
	volumeLeft : 0,
	volumeRight : 0,
	duration : 0,
	built : false,
	isPlaying : false,
	isStopped : true,
	build : function(force){
		if (songParser.MainPlayer.isStopped == false || force == true){
			if (songParser.MainPlayer.built == false){
				var mainPlayButtonClass = "exfmPlaybutton";
				if (songParser.MainPlayer.isPlaying == true){
					mainPlayButtonClass = "exfmPausebutton";
				}
				var bottom = jQuery("<div id=\"exfmBottom\"><div id=\"bottomControls\"><div id=\"exfmPrevButton\" class=\"exfmControlsButton\"></div><div id=\"exfmMainPlayButton\" class=\""+mainPlayButtonClass+" exfmControlsButton\"></div><div id=\"exfmNextButton\" class=\"exfmControlsButton\"></div></div><div id=\"exfmBottomVolume\"><div id=\"exfmBottomVolumeSpeaker\"></div><input type=\"range\" min=\"0\" max=\"100\" step=\"1\" value=\"100\" id=\"exfmBottomVolumeRange\"></div><div id=\"exfmBottomDisplay\"><div id=\"exfmBottomDisplayLogo\"></div><div id=\"exfmBottomDisplayCoverArt\"></div><div id=\"exfmBottomDisplayText\"><a id=\"exfmBottomDisplayDomain\" target=\"_blank\"></a><div id=\"exfmBottomDisplaySong\"></div><div id=\"exfmBottomDisplayArtist\"></div><div id=\"exfmBottomDisplayAlbum\"></div></div><div id=\"exfmBottomDisplayTime\"><div id=\"exfmBottomDisplayTimeCount\"></div><div id=\"exfmBottomDisplayTimeProgress\"></div><div id=\"exfmBottomDisplayTimeProgressed\"></div><div id=\"exfmBottomDisplaySeekThumb\"></div><div id=\"exfmBottomDisplayTimeTotal\"></div></div></div><div id=\"exfmMaximizePlayer\" title=\"View Library\"></div> <div id=\"exfmCloseMiniPlayer\" title=\"Remove Player\"></div></div>");
				jQuery(bottom).appendTo(document.body);
			  	var obj = {"msg" : "hasPlayer"};
				songParser.Comm.send(obj);
				setTimeout(songParser.MainPlayer.resize, 10);
				window.addEventListener('resize', songParser.MainPlayer.resize);
				songParser.MainPlayer.seek.seekThumb = jQuery('#exfmBottomDisplaySeekThumb')[0];
				songParser.MainPlayer.seek.progressed = jQuery('#exfmBottomDisplayTimeProgressed')[0];
				
				jQuery(songParser.MainPlayer.seek.seekThumb).bind('mousedown', songParser.MainPlayer.seek.mouseDown);
				jQuery(songParser.MainPlayer.seek.seekThumb).bind('mouseup', songParser.MainPlayer.seek.mouseUp);
				
				
				
				songParser.MainPlayer.volume.volumeThumb = jQuery('#exfmBottomVolumeRange')[0];
				jQuery(songParser.MainPlayer.volume.volumeThumb).bind('mousedown', songParser.MainPlayer.volume.mouseDown);
				jQuery(songParser.MainPlayer.volume.volumeThumb).bind('mouseup', songParser.MainPlayer.volume.mouseUp);
				jQuery(songParser.MainPlayer.volume.volumeThumb).bind('change', songParser.MainPlayer.volume.change);
				songParser.MainPlayer.volume.volumeSpeaker = jQuery('#exfmBottomVolumeSpeaker')[0];
				jQuery(songParser.MainPlayer.volume.volumeSpeaker).bind('click', songParser.MainPlayer.volume.speakerClick);
				
				
				
				/*songParser.MainPlayer.volume.volumeThumb = jQuery('#exfmBottomVolumeThumb')[0];
				jQuery(songParser.MainPlayer.volume.volumeThumb).bind('mousedown', songParser.MainPlayer.volume.mouseDown);
				jQuery(songParser.MainPlayer.volume.volumeThumb).bind('mouseup', songParser.MainPlayer.volume.mouseUp);
				songParser.MainPlayer.volume.volumeSpeaker = jQuery('#exfmBottomVolumeSpeaker')[0];
				jQuery('#exfmBottomVolumeBack').bind('click', songParser.MainPlayer.volume.backClick);
				jQuery('#exfmBottomVolumeSpeaker').bind('click', songParser.MainPlayer.volume.speakerClick);*/
				
				
				
				
				jQuery('#exfmBottomDisplayTimeProgress').bind('click', songParser.MainPlayer.seek.click);
				jQuery('#exfmBottomDisplayTimeProgressed').bind('click', songParser.MainPlayer.seek.click);
				
				jQuery('#exfmMainPlayButton').bind('click', songParser.MainPlayer.controls.playPause.click);
				jQuery('#exfmPrevButton').bind('click', songParser.MainPlayer.controls.prevButton.click);
				jQuery('#exfmNextButton').bind('click', songParser.MainPlayer.controls.nextButton.click);
				jQuery('#exfmBottomDisplayDomain').bind('click', songParser.Utils.openOrSwitchTab);
				
				jQuery('#exfmMaximizePlayer').bind('click', songParser.MainPlayer.maximize.click);
				jQuery('#exfmCloseMiniPlayer').bind('click', songParser.MainPlayer.close.click);
				
				songParser.MainPlayer.built = true;	
				return true;
			}
		}
	},
	hide : function(){
		try {
			//jQuery('#exfmBottom').animate({'height' : '0px'}, 200, function(){jQuery(this).remove()});
			jQuery('#exfmBottom').css('height', '0px');
			jQuery(songParser.MainPlayer.seek.seekThumb).unbind('mousedown', songParser.MainPlayer.seek.mouseDown);
			jQuery(songParser.MainPlayer.seek.seekThumb).unbind('mouseup', songParser.MainPlayer.seek.mouseUp);
			jQuery(songParser.MainPlayer.volume.volumeThumb).unbind('mousedown', songParser.MainPlayer.volume.mouseDown);
			jQuery(songParser.MainPlayer.volume.volumeThumb).unbind('mouseup', songParser.MainPlayer.volume.mouseUp);
			jQuery('#exfmBottomVolumeBack').unbind('click', songParser.MainPlayer.volume.backClick);
			jQuery('#exfmBottomVolumeSpeaker').unbind('click', songParser.MainPlayer.volume.speakerClick);
			jQuery('#exfmBottomDisplayTimeProgress').unbind('click', songParser.MainPlayer.seek.click);
			jQuery('#exfmBottomDisplayTimeProgressed').unbind('click', songParser.MainPlayer.seek.click);
			jQuery('#exfmMainPlayButton').unbind('click', songParser.MainPlayer.controls.playPause.click);
			jQuery('#exfmPrevButton').unbind('click', songParser.MainPlayer.controls.prevButton.click);
			jQuery('#exfmNextButton').unbind('click', songParser.MainPlayer.controls.nextButton.click);
			jQuery('#exfmBottomDisplayDomain').unbind('click', songParser.Utils.openOrSwitchTab);
			jQuery('#exfmMaximizePlayer').unbind('click', songParser.MainPlayer.maximize.click);
			jQuery('#exfmCloseMiniPlayer').unbind('click', songParser.MainPlayer.close.click);
			setTimeout(songParser.MainPlayer.remove, 1000);
		} catch(e){}
	},
	remove : function(){
		jQuery('#exfmBottom').remove();
		songParser.MainPlayer.built = false;
	},
	currentTime : function(time, percentage){
		try {
			if (songParser.MainPlayer.seek.isSeeking == false) {
				jQuery('#exfmBottomDisplayTimeCount').text(songParser.Utils.mmss(Math.floor(time)));
				if ((songParser.MainPlayer.progressWidth * percentage) > 0){
					jQuery(songParser.MainPlayer.seek.seekThumb).css('left', songParser.MainPlayer.progressWidth * percentage + 45);
				}
				jQuery(songParser.MainPlayer.seek.progressed).css('width', songParser.MainPlayer.progressWidth * percentage + 3);
			}
		} catch(e){}
	},
	setDuration : function(duration){
		try {
			if (!isNaN(duration) && duration != null){
				songParser.MainPlayer.duration = duration;
				jQuery('#exfmBottomDisplayTimeTotal').text(songParser.Utils.mmss(Math.floor(duration)));
			}
		} catch(e){}
	},
	currentSong : function(songVO){
		if (songParser.MainPlayer.isStopped == false){
			jQuery('#exfmBottomDisplayCoverArt').css('visibility', 'visible');
			jQuery('#exfmBottomDisplayText').css('visibility', 'visible');
			jQuery('#exfmBottomDisplayTime').css('visibility', 'visible');
			jQuery('#exfmBottomDisplaySeekThumb').css('visibility', 'visible');
			jQuery('#exfmBottomDisplayLogo').css('display', 'none');
		}
		try {
			jQuery('#exfmBottomDisplayTimeCount').text('0:00');
			jQuery('#exfmBottomDisplayTimeTotal').text('0:00');
			jQuery(songParser.MainPlayer.seek.seekThumb).css('left', 45);
			jQuery(songParser.MainPlayer.seek.progressed).css('width', 2);
		} catch(e) {}
		jQuery('#exfmBottomDisplaySong').text('');
		jQuery('#exfmBottomDisplayArtist').text('');
		jQuery('#exfmBottomDisplayAlbum').text('');
		jQuery('#exfmBottomDisplayDomain').text('');
		try {
			if (songVO.songtitle != null){
				jQuery('#exfmBottomDisplaySong').html(songVO.songtitle);
				jQuery('#exfmBottomDisplaySong').attr("title", "Name: "+songVO.songtitle);
			} else {
				jQuery('#exfmBottomDisplaySong').text('');
			}
			if (songVO.artist != null && songVO.artist != undefined){
				jQuery('#exfmBottomDisplayArtist').html(songVO.artist);
				jQuery('#exfmBottomDisplayArtist').attr("title", "Artist: "+songVO.artist);
			} else {
				jQuery('#exfmBottomDisplayArtist').text('');
			}
			if (songVO.album != null && songVO.album != undefined){
				jQuery('#exfmBottomDisplayAlbum').html(songVO.album);
				jQuery('#exfmBottomDisplayAlbum').attr("title", "Album: "+songVO.album);
			} else {
				jQuery('#exfmBottomDisplayAlbum').text('');
			}
			if (songVO.domain != null && songVO.domain != undefined){
				jQuery('#exfmBottomDisplayDomain').text(songVO.domain);
				jQuery('#exfmBottomDisplayDomain').attr("title", "Site: "+songVO.domain);
				jQuery('#exfmBottomDisplayDomain').attr("href", songVO.href);
			} else {
				jQuery('#exfmBottomDisplayDomain').text('');
			}
			jQuery('#exfmBottomDisplayCoverArt').css('background', songParser.Utils.getCoverArt(songVO.smallimage, '45x45'));
		} catch (e){}
	},
	resize : function(){
		songParser.MainPlayer.progressWidth = jQuery('#exfmBottomDisplayTimeProgress').width();
		songParser.MainPlayer.progressLeft = jQuery('#exfmBottomDisplayTimeProgress').offset().left;
		songParser.MainPlayer.progressRight = songParser.MainPlayer.progressLeft + songParser.MainPlayer.progressWidth;
		//songParser.MainPlayer.volumeWidth = jQuery('#exfmBottomVolumeBack').width();
		//songParser.MainPlayer.volumeLeft = jQuery('#exfmBottomVolumeBack').offset().left;
		//songParser.MainPlayer.volumeRight = songParser.MainPlayer.volumeLeft + songParser.MainPlayer.volumeWidth;
		songParser.MainPlayer.volume.init();
	},
	seek : {
		seconds : 0,
		isSeeking : false,
		offset : 43,
		seekThumb : null,
		progressed : null,
		mouseDown : function(e){
			jQuery(document).bind('mousemove', songParser.MainPlayer.seek.mouseMove);
			jQuery(document).bind('mouseup', songParser.MainPlayer.seek.mouseUp);
			songParser.MainPlayer.seek.isSeeking = true;
			e.preventDefault();
		},
		mouseUp : function(e){
			jQuery(document).unbind('mousemove', songParser.MainPlayer.seek.mouseMove);
			jQuery(document).unbind('mouseup', songParser.MainPlayer.seek.mouseUp);
			var obj = {"msg" : "seek", "seconds" : songParser.MainPlayer.seek.seconds};
	  		songParser.Comm.send(obj);
			songParser.MainPlayer.seek.isSeeking = false;
			//PopupPlayer.Time.currentTime(PopupPlayer.Seek.seconds);
		},
		mouseMove : function(e){
			var x = e.clientX;
			try {
				if (x < songParser.MainPlayer.progressLeft ){
					x = songParser.MainPlayer.progressLeft ;
				}
				if (x > songParser.MainPlayer.progressRight){
					x = songParser.MainPlayer.progressRight;
				}
				var seekLeft = x - songParser.MainPlayer.progressLeft;
				jQuery(songParser.MainPlayer.seek.seekThumb).css('left', seekLeft + songParser.MainPlayer.seek.offset);
				jQuery(songParser.MainPlayer.seek.progressed).css('width', x - songParser.MainPlayer.progressLeft);
				songParser.MainPlayer.seek.seconds = Math.floor((seekLeft / songParser.MainPlayer.progressWidth) * songParser.MainPlayer.duration);
			} catch (e){}
		},
		click : function(e){
			songParser.MainPlayer.seek.mouseMove(e);
			var obj = {"msg" : "seek", "seconds" : songParser.MainPlayer.seek.seconds};
	  		songParser.Comm.send(obj);
		}
	},
	controls : {
		playPause : {
			click : function(e){
				var obj = {"msg" : "playPauseSong"};
	  			songParser.Comm.send(obj);
			}
		},
		prevButton : {
			click : function(e){
				var obj = {"msg" : "prevSong"};
	  			songParser.Comm.send(obj);
			}
		},
		nextButton : {
			click : function(e){
				var obj = {"msg" : "nextSong"};
	  			songParser.Comm.send(obj);
			}
		}
	},
	transport : {
		displayPause : function(b){
			if (b){
				jQuery('#exfmMainPlayButton').removeClass('exfmPlaybutton');
				jQuery('#exfmMainPlayButton').addClass('exfmPausebutton');
			} else {
				jQuery('#exfmMainPlayButton').removeClass('exfmPausebutton');
				jQuery('#exfmMainPlayButton').addClass('exfmPlaybutton');
			}
		},
		stop : function(){
			/*try {
				jQuery('#exfmBottomDisplayTimeCount').text('0:00');
				jQuery('#exfmBottomDisplayTimeTotal').text('0:00');
				jQuery(songParser.MainPlayer.seek.seekThumb).css('left', 30);
				jQuery(songParser.MainPlayer.seek.progressed).css('width', 3);
			} catch(e) {}
			jQuery('#exfmBottomDisplaySong').text('');
			jQuery('#exfmBottomDisplayArtist').text('');
			jQuery('#exfmBottomDisplayAlbum').text('');
			jQuery('#exfmBottomDisplayDomain').text('');
			songParser.MainPlayer.transport.displayPause(false);
			songParser.MainPlayer.hideLoading();*/
			songParser.MainPlayer.isStopped = true;
			songParser.MainPlayer.hide();
		}
	},
	showLoading : function(e){
		jQuery('#exfmBottomDisplayTimeProgress').addClass('exfmBottomDisplayTimeProgressLoading');
		jQuery('#exfmBottomDisplaySeekThumb').css('visibility', 'hidden');
		jQuery('#exfmBottomDisplayTimeProgressed').css('visibility', 'hidden');
	},
	hideLoading : function(e){
		jQuery('#exfmBottomDisplayTimeProgress').removeClass('exfmBottomDisplayTimeProgressLoading');
		jQuery('#exfmBottomDisplaySeekThumb').css('visibility', 'visible');
		jQuery('#exfmBottomDisplayTimeProgressed').css('visibility', 'visible');
	},
	volume : {
		volume : 1,
		saved : {},
		offset : 0,
		init : function(){
			if (songParser.MainPlayer.volume.saved == null){
				songParser.MainPlayer.volume.saved = {"volume" : 1, "position" : 100};
			}
			songParser.MainPlayer.volume.set(songParser.MainPlayer.volume.saved.position);
		},
		mouseDown : function(e){
			jQuery(songParser.MainPlayer.volume.volumeThumb).addClass('exfmBottomVolumeThumbActive');
		},
		mouseUp : function(e){
			jQuery(songParser.MainPlayer.volume.volumeThumb).removeClass('exfmBottomVolumeThumbActive');
			var obj = {"msg" : "saveVolume", "saved" : songParser.MainPlayer.volume.saved};
	  		songParser.Comm.send(obj);
		},
		change : function(e){
			var value = jQuery(this).attr('value');
			var volume = value/100;
			//songParser.MainPlayer.volume.set(value);
			songParser.MainPlayer.volume.saved = {"volume" : volume, "position" : value};
			var obj = {"msg" : "setVolume", "volume" : volume};
	  		songParser.Comm.send(obj);
		},
		set : function(value){
			jQuery(songParser.MainPlayer.volume.volumeThumb).attr('value', value);
			if (value == 0){
				jQuery(songParser.MainPlayer.volume.volumeSpeaker).removeClass('exfmBottomVolumeOn');
				jQuery(songParser.MainPlayer.volume.volumeSpeaker).addClass('exfmBottomVolumeOff');
			} else {
				jQuery(songParser.MainPlayer.volume.volumeSpeaker).removeClass('exfmBottomVolumeOff');
				jQuery(songParser.MainPlayer.volume.volumeSpeaker).addClass('exfmBottomVolumeOn');
			}
		},
		event : function(obj){
			var value = obj.volume * 100;
			songParser.MainPlayer.volume.set(value);
		},	
		speakerClick : function(e){
			var volume = 1;
			var value = 100;
			if (jQuery(this).hasClass('exfmBottomVolumeOn')){
				volume = 0;
				value = 0;
			}
			songParser.MainPlayer.volume.saved = {"volume" : volume, "position" : value};
			songParser.MainPlayer.volume.set(value);
			var obj = {"msg" : "setVolume", "volume" : volume};
	  		songParser.Comm.send(obj);
			var obj = {"msg" : "saveVolume", "saved" : songParser.MainPlayer.volume.saved};
	  		songParser.Comm.send(obj);
		}
	},
	maximize : {
		click : function(){
			var obj = {"msg" : "openLargePlayer"};
	  		songParser.Comm.send(obj);
		}
	},
	close : {
		click : function(){
			//songParser.MainPlayer.hide();
			songParser.MainPlayer.closedPagePlayer = true;
			var obj = {"msg" : "closePagePlayer"};
	  		songParser.Comm.send(obj);
		}
	}
}


/*****************************************************************
*
* Utils
*
******************************************************************/
songParser.Utils = {
	removeYMP : {
		request : function(){
			setTimeout(songParser.Utils.removeYMP.response, 4000);	
		},
		response : function(){
			jQuery('.ymp-skin').css('display', 'none');
			//document.getElementById('ymp-player').style.diaply = 'none';
			//document.getElementById('ymp-tray').style.diaply = 'none';
			//document.getElementById('ymp-error-bubble').style.diaply = 'none';
			//document.getElementById('ymp-secret-bubble').style.diaply = 'none';
			jQuery('.ymp-btn-page-play').removeClass('ymp-btn-page-play');
		}
	},
	mmss: function (secs) {
        var s = secs % 60;
        if (s < 10) {
            s = "0" + s;
        }
        return Math.floor(secs/60) + ":" + s;
    },
    openOrSwitchTab : function(e){
    	var href = jQuery(this).attr('href');
    	var obj = {"msg" : "openOrSwitchTab", "url" : href};
	  	songParser.Comm.send(obj);
		return false;
	},
	getCoverArt : function(img, size){
		if (img == null || img == ''){
			return 'url(http://static.extension.fm/glare_'+size+'.png) top right no-repeat, url(http://static.extension.fm/album_'+size+'.png) no-repeat';
		} else {
			return 'url(http://static.extension.fm/glare_'+size+'.png) top right no-repeat, url('+img+') no-repeat, url(http://static.extension.fm/album_'+size+'.png) no-repeat';
		}
	}
}

//(c) 2008 Michael Manning 
jQuery.parseQuery=function(A,B){var C=(typeof A==="string"?A:window.location.search),E={f:function(F){return unescape(F).replace(/\+/g," ")}},B=(typeof A==="object"&&typeof B==="undefined")?A:B,E=jQuery.extend({},E,B),D={};jQuery.each(C.match(/^\??(.*)$/)[1].split("&"),function(F,G){G=G.split("=");G[1]=E.f(G[1]);D[G[0]]=D[G[0]]?((D[G[0]] instanceof Array)?(D[G[0]].push(G[1]),D[G[0]]):[D[G[0]],G[1]]):G[1]});return D};


songParser.HostPageEvent("exfmEnabledEvent");

songParser.Init();

document.addEventListener('exfmSongsAsyncEvent', function(debug) {
	songParser.FindSongs();
});
