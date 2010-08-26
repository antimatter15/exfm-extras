/*
name: background-lastfm
author: Dan Kantor
requires: jquery-1.3.2, md5
*/
if (typeof(BackgroundLastFM) == 'undefined'){
	BackgroundLastFM = {}
}

BackgroundLastFM.Key = "474b32b1b1920cccf57c308141054f2f";


BackgroundLastFM.Init = function(){
	var scrobbleOn = BackgroundLastFM.ScrobbleOn();
	if (scrobbleOn == true){
		var lastfm = BackgroundStorage.get("lastfm");
		if (lastfm != null){
			BackgroundLastFM.Handshake.request();
		}
	}
}

/*****************************************************************
*
* Determine if scrobbling is enabled
*
******************************************************************/
BackgroundLastFM.ScrobbleOn = function(){
	var returnBool = false;
	var scrobbling = BackgroundStorage.get("scrobbling");
	if (scrobbling != null){
		if (scrobbling.enabled == true){
			returnBool = true;
		}
	}
	return returnBool;
}

/*****************************************************************
*
* Handshake to get sessionID, nowplayingURL and submissionURL
*
******************************************************************/
BackgroundLastFM.Handshake = {
	fail : 0,
	url : "http://post.audioscrobbler.com/",
	request : function(){
		var lastfm = BackgroundStorage.get("lastfm");
		if (lastfm.name != undefined){
			var timestamp = Math.round(new Date().getTime()/1000);
			var auth = hex_md5("8ef2e8aed5ea1192f262fb539cc88298"+timestamp);
			jQuery.get(BackgroundLastFM.Handshake.url, {"hs" : "true", "p" : "1.2", "c" : "efm", "v" : "1.0", "u" : lastfm.name, "t" : timestamp, "a" : auth, "api_key" : BackgroundLastFM.Key, "sk" : lastfm.key}, BackgroundLastFM.Handshake.response, "text");
		}
	},
	response : function(str){
		var splits = str.split('\n');
		if (splits[0] == "OK"){
			BackgroundLastFM.Handshake.fail = 0;
			var scrobbling = BackgroundStorage.get("scrobbling");
			scrobbling.sessionID = splits[1];
			scrobbling.nowPlayingURL = splits[2];
			scrobbling.submissionURL = splits[3];
			BackgroundStorage.set("scrobbling", scrobbling);
			BackgroundLastFM.Submit.request();
		} else {
			BackgroundLastFM.Handshake.fail++;
			if (BackgroundLastFM.Handshake.fail < 3){
				setTimeout(BackgroundLastFM.Handshake.request, 60000);
			} else {
				setTimeout(BackgroundLastFM.Handshake.request, 1800000);
			}
		}
	}
}

/*****************************************************************
*
* Submit to nowplaying when song starts
*
******************************************************************/
BackgroundLastFM.NowPlaying = {
	determine : function(){
		try {
			var songVO = BackgroundPlayer.CurrentSongVO;
			var scrobbling = BackgroundStorage.get("scrobbling");
			if (scrobbling != null){
				if (scrobbling.enabled == true){
					if (scrobbling.sessionID != undefined && scrobbling.sessionID != "" && scrobbling.sessionID != null){
						if (songVO != null){
							BackgroundLastFM.NowPlaying.request(songVO);
						}
					} else {
						setTimeout(BackgroundLastFM.Handshake.request, 60000);
					}	
				}
			}
		} catch(e){}
	},
	request : function(songVO){
		try {
			var scrobbling = BackgroundStorage.get("scrobbling");
			if (songVO.songtitle != "" && songVO.artist != ""){
				var submitData = {};
				submitData.s = scrobbling.sessionID;
				submitData["a"] = songVO.artist;
				submitData["t"] = songVO.songtitle;
				var timeSeconds = 120;
				if (songVO.timeseconds != "" && songVO.timeseconds != null){
					timeSeconds = songVO.timeseconds;
				}
				if (timeSeconds > 30){
					submitData["l"] = Math.floor(timeSeconds);
				}
				submitData["b"] = songVO.album;
				var trackSequence = "";
				if (songVO.tracksequence != "" && songVO.tracksequence != null){
					trackSequence = songVO.tracksequence;
				}
				submitData["n"] = trackSequence;
				submitData["m"] = "";
				jQuery.post(scrobbling.nowPlayingURL, submitData, BackgroundLastFM.NowPlaying.response, "text");
			}
		} catch(e){}
	},
	response : function(str){
		var responseText = str.split('\n');
		if (responseText[0] == "BADSESSION"){
			var scrobbling = BackgroundStorage.get("scrobbling");
			delete scrobbling.sessionID;
			delete scrobbling.nowPlayingURL;
			delete scrobbling.submissionURL;
			BackgroundLastFM.Handshake.request();
		}
	}
}

/*****************************************************************
*
* Submit song when half-way through
*
******************************************************************/
BackgroundLastFM.Submit = {
	array : [],
	fail : 0,
	determine : function(obj){
		try {
			var songVO = obj.songVO;
			var scrobbling = BackgroundStorage.get("scrobbling");
			if (scrobbling != null){
				if (scrobbling.enabled == true){
					if (scrobbling.sessionID != undefined && scrobbling.sessionID != "" && scrobbling.sessionID != null){
						if (songVO != null){
							songVO.sTimestamp = Math.round(new Date().getTime()/1000);
							BackgroundLastFM.Submit.array.push(songVO);
						}
						BackgroundLastFM.Submit.request();
					} else {
						setTimeout(BackgroundLastFM.Handshake.request, 60000);
					}	
				}
			}
		} catch(e){}
	},
	request : function(){
		try {
			var scrobbling = BackgroundStorage.get("scrobbling");
			var empty = true;
			var len = BackgroundLastFM.Submit.array.length;
			if (len > 0){
				var submitData = {};
				submitData.s = scrobbling.sessionID;
				for (var i = 0; i < len; i++){
					var songVO = BackgroundLastFM.Submit.array[i];
					if (songVO.songtitle != "" && songVO.artist != ""){
						empty = false;
						submitData["a["+i+"]"] = songVO.artist;
						submitData["t["+i+"]"] = songVO.songtitle;
						submitData["i["+i+"]"] = songVO.sTimestamp;
						submitData["o["+i+"]"] = "P";
						var timeSeconds = 120;
						if (songVO.timeseconds != "" && songVO.timeseconds != null){
							timeSeconds = songVO.timeseconds;
						}
						if (timeSeconds > 30){
							submitData["l["+i+"]"] = Math.floor(timeSeconds);
						}
						submitData["r["+i+"]"] = "";
						submitData["b["+i+"]"] = songVO.album;
						var trackSequence = "";
						if (songVO.tracksequence != "" && songVO.tracksequence != null){
							trackSequence = songVO.tracksequence;
						}
						submitData["n["+i+"]"] = trackSequence;
						submitData["m["+i+"]"] = "";
					}
				}
				if (empty == false){
					jQuery.post(scrobbling.submissionURL, submitData, BackgroundLastFM.Submit.response, "text");
				}
			}
		} catch(e){}
	},
	response : function(str){	
		var responseText = str.split('\n');
		switch (responseText[0]){
			case "OK" : 
				BackgroundLastFM.Submit.array = [];
				BackgroundLastFM.Submit.fail = 0;
			break;
			case "BADSESSION" :
				var scrobbling = BackgroundStorage.get("scrobbling");
				delete scrobbling.sessionID;
				delete scrobbling.nowPlayingURL;
				delete scrobbling.submissionURL;
				setTimeout(BackgroundLastFM.Handshake.request, 60000);
			break;
			default : 
				BackgroundLastFM.Submit.fail++;
				if (BackgroundLastFM.Submit.fail < 3){
					setTimeout(BackgroundLastFM.Submit.request, 60000);
				} else {
					setTimeout(BackgroundLastFM.Handshake.request, 1800000);
				}
			break;
		}
	}
}


jQuery(window).bind("BackgroundPlayer.TimeUpdateHalf", BackgroundLastFM.Submit.determine);
jQuery(window).bind("BackgroundPlayer.PlayPlaying", BackgroundLastFM.NowPlaying.determine);
window.addEventListener("load", BackgroundLastFM.Init);