/*
name: background-player
author: Dan Kantor
*/
if (typeof(BackgroundPlayer) == 'undefined'){
	BackgroundPlayer = {}
}

BackgroundPlayer.CurrentSongVO = null;
BackgroundPlayer.CurrentAudio = null;
BackgroundPlayer.IsPlaying = false;
BackgroundPlayer.IsStopped = true;
BackgroundPlayer.QueueNumber = 0;
BackgroundPlayer.SentTimeUpdateHalf = false;


BackgroundPlayer.Queue = {
	array : [],
	timer : null,
	add : function(songVO){
		clearTimeout(BackgroundPlayer.Queue.timer);
		var len = BackgroundPlayer.Queue.array.length;
		var returnNumber = -1;
		var len = BackgroundPlayer.Queue.array.length;
		for (var i = 0; i < len; i++){
			var item = BackgroundPlayer.Queue.array[i];
			if (songVO.domainkey == item.domainkey){
				returnNumber = i;
				break;
			}
		}
		if (returnNumber == -1){
			returnNumber = BackgroundPlayer.Queue.array.length;
			BackgroundPlayer.Queue.array.push(songVO);
			BackgroundPlayer.Queue.timer = setTimeout(BackgroundPlayer.Queue.onChange, 200);
		}
		return returnNumber;
	},
	onChange : function(){
		clearTimeout(BackgroundPlayer.Queue.timer);
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onQueueChange", "queueNumber" : BackgroundPlayer.QueueNumber, "total" : BackgroundPlayer.Queue.array.length});
	},
	play : function(queueNumber){
		BackgroundPlayer.QueueNumber = queueNumber;
		try {
			var songVO = BackgroundPlayer.Queue.array[queueNumber];
			BackgroundPlayer.Play(songVO.url);
			BackgroundPlayer.CurrentSongVO = songVO;
			BackgroundPlayer.SentTimeUpdateHalf = false;
			var title = songVO.songtitle;
			if (songVO.artist != "" && songVO.artist != null){
				title += " by "+songVO.artist;
			}
			chrome.browserAction.setTitle({'title' : Utils.ReplaceHTMLEncoding(title)});
			BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onSongChange", "queueNumber" : BackgroundPlayer.QueueNumber, "songVO" : BackgroundPlayer.CurrentSongVO});
			BackgroundMain.Page.sendCurrentSongVO(BackgroundMain.ContentScript.selected);
			var showSongNotification = BackgroundStorage.get("showSongNotification");
			if (showSongNotification == 'enabled'){
				BackgroundMain.Notifications.song.cancel();
				BackgroundMain.Notifications.song.notification = webkitNotifications.createHTMLNotification("notification.html");
				BackgroundMain.Notifications.song.show();
				BackgroundMain.Notifications.song.setTimeout();
			}
		} catch(e){}
	},
	clearAll : function(){
		BackgroundPlayer.Queue.array = [];
		BackgroundPlayer.QueueNumber = 0;
		BackgroundPlayer.CurrentSongVO = null;
		BackgroundPlayer.Transport.stop();
		//BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onSongChange", "queueNumber" : BackgroundPlayer.QueueNumber, "songVO" : BackgroundPlayer.CurrentSongVO});
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onQueueChange", "queueNumber" : BackgroundPlayer.QueueNumber, "total" : BackgroundPlayer.Queue.array.length});
	},
	remove : function(queueNumber){
		BackgroundPlayer.Utils.arrayRemove(BackgroundPlayer.Queue.array, queueNumber);
		if (BackgroundPlayer.QueueNumber == queueNumber){
			BackgroundPlayer.QueueNumber -= 1;
			BackgroundPlayer.Transport.next();
		}
		if (BackgroundPlayer.QueueNumber > queueNumber){
			BackgroundPlayer.QueueNumber -= 1;
		}
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onQueueChange", "queueNumber" : BackgroundPlayer.QueueNumber, "total" : BackgroundPlayer.Queue.array.length});
	}
}

BackgroundPlayer.SendAllMetaToPlayerTab = function(){
	try {
		BackgroundMain.Tabs.playerTab.PlayerMain.Bottom.setCurrentSong({"queueNumber" : BackgroundPlayer.QueueNumber, "songVO" : BackgroundPlayer.CurrentSongVO});
		BackgroundMain.Tabs.playerTab.PlayerMain.Bottom.setDuration(BackgroundPlayer.CurrentAudio.duration);
		var percentage = BackgroundPlayer.CurrentAudio.currentTime / BackgroundPlayer.CurrentAudio.duration;
		BackgroundMain.Tabs.playerTab.PlayerMain.Bottom.setCurrentTime(BackgroundPlayer.CurrentAudio.currentTime, percentage);
	} catch (e) {}
}

BackgroundPlayer.SendAllMetaToPopupTab = function(){
	try {
		BackgroundMain.Tabs.popupTab.PopupPlayer.Display({"queueNumber" : BackgroundPlayer.QueueNumber, "songVO" : BackgroundPlayer.CurrentSongVO});
		BackgroundMain.Tabs.popupTab.PopupPlayer.Time.setDuration(BackgroundPlayer.CurrentAudio.duration);
		var percentage = BackgroundPlayer.CurrentAudio.currentTime / BackgroundPlayer.CurrentAudio.duration;
		BackgroundMain.Tabs.popupTab.PopupPlayer.Time.currentTime(BackgroundPlayer.CurrentAudio.currentTime, percentage);
	} catch (e) {}
}

BackgroundPlayer.SendAllMetaToPageTab = function(){
	var volume = BackgroundStorage.get("PlayerMain.Volume.saved");
	//BackgroundPlayer.CurrentTab.send({"msg" : "allMeta", "songVO" : BackgroundPlayer.CurrentSongVO, "queueNumber" : BackgroundPlayer.QueueNumber, "duration" : BackgroundPlayer.CurrentAudio.duration, "volume" : volume});
	/*var duration = 0;
	try {
		var duration = BackgroundPlayer.CurrentAudio.duration;
	} catch(e){}*/
	
	
	BackgroundPlayer.CurrentTab.send({"msg" : "currentSongVO", "songVO" : BackgroundPlayer.CurrentSongVO, "queueNumber" : BackgroundPlayer.QueueNumber, "duration" : BackgroundPlayer.CurrentAudio.duration, "currentTime" : BackgroundPlayer.CurrentAudio.currentTime, "percentage" : percentage, "volume" : volume, "isPlaying" : BackgroundPlayer.IsPlaying, "isStopped" : BackgroundPlayer.IsStopped });
	
	
	/*try {	
		var volume = BackgroundStorage.get("PlayerMain.Volume.saved");
		var percentage = BackgroundPlayer.CurrentAudio.currentTime / BackgroundPlayer.CurrentAudio.duration;
		chrome.tabs.sendRequest(tabId, {"msg" : "currentSongVO", "songVO" : BackgroundPlayer.CurrentSongVO, "queueNumber" : BackgroundPlayer.QueueNumber, "duration" : BackgroundPlayer.CurrentAudio.duration, "currentTime" : BackgroundPlayer.CurrentAudio.currentTime, "percentage" : percentage, "volume" : volume, "isPlaying" : BackgroundPlayer.IsPlaying, "isStopped" : BackgroundPlayer.IsStopped }, function(response){});
	} catch(e){}*/
	
}

BackgroundPlayer.Play = function(url) {
	try {
		BackgroundPlayer.CurrentAudio.pause();
		//BackgroundPlayer.CurrentAudio = null;
		delete BackgroundPlayer.CurrentAudio;
	} catch (e) {}
	BackgroundPlayer.CurrentAudio = null;
	BackgroundEvents.Trigger({"type" : "BackgroundPlayer.PlayLoading"});
	BackgroundPlayer.CurrentTab.send({"msg" : "playLoading"});
	if (url.indexOf("http://media.soundcloud.com") != -1){
		url = url+"?consumer_key=leL50hzZ1H8tAdKCLSCnw";
	}
	var audio = new Audio(url);
	BackgroundPlayer.CurrentAudio = audio;
	BackgroundPlayer.AudioEvents.addAll();
	audio.play();
	BackgroundPlayer.IsPlaying = true;
	BackgroundPlayer.IsStopped = false;
	BackgroundPlayer.Timer.start();
}

BackgroundPlayer.PlayPlaying = function(e){
	try {
		BackgroundPlayer.CurrentAudio.removeEventListener("canplay", BackgroundPlayer.PlayPlaying);
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.PlayPlaying"});
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onPlay"});
		BackgroundPlayer.CurrentTab.send({"msg" : "playPlaying"});
		BackgroundPlayer.Volume.set(BackgroundPlayer.Volume.vol);
	} catch(e){}
}

BackgroundPlayer.AudioEvents = {
	addAll : function(){
		try {
			BackgroundPlayer.AudioEvents.removeAll();
			//BackgroundPlayer.CurrentAudio.addEventListener('timeupdate', BackgroundPlayer.TimeUpdate);  // doesn't work
			BackgroundPlayer.CurrentAudio.addEventListener('durationchange', BackgroundPlayer.DurationChange);
			BackgroundPlayer.CurrentAudio.addEventListener('ended', BackgroundPlayer.Ended);
			BackgroundPlayer.CurrentAudio.addEventListener("seeked", BackgroundPlayer.Seeked);
			BackgroundPlayer.CurrentAudio.addEventListener("error", BackgroundPlayer.LoadError);
			//BackgroundPlayer.CurrentAudio.addEventListener("progress", function(e){console.log('progress', e)});
			//BackgroundPlayer.CurrentAudio.addEventListener("loadstart", function(e){console.log('loadstart', e); });
			BackgroundPlayer.CurrentAudio.addEventListener("canplay", BackgroundPlayer.PlayPlaying);
			//jQuery(BackgroundPlayer.CurrentAudio).bind("canplay", function(e){console.log('canplay', e)});
			//BackgroundPlayer.CurrentAudio.addEventListener("loadedmetadata", function(e){console.log('loadedmetadata', e)});
			//BackgroundPlayer.CurrentAudio.addEventListener("loadedfirstframe", function(e){console.log('loadedfirstframe', e)});
		} catch(e){
			BackgroundLog.Log("BackgroundPlayer.AudioEvents.addAll Catch: "+e);
		}
	},
	removeAll : function(){
		try {
			//BackgroundPlayer.CurrentAudio.removeEventListener('timeupdate', BackgroundPlayer.TimeUpdate);  // doesn't work
			BackgroundPlayer.CurrentAudio.removeEventListener('durationchange', BackgroundPlayer.DurationChange);
			BackgroundPlayer.CurrentAudio.removeEventListener('ended', BackgroundPlayer.Ended);
			BackgroundPlayer.CurrentAudio.removeEventListener("seeked", BackgroundPlayer.Seeked);
			BackgroundPlayer.CurrentAudio.removeEventListener("error", BackgroundPlayer.LoadError);
			BackgroundPlayer.CurrentAudio.removeEventListener("canplay", BackgroundPlayer.PlayPlaying);
		} catch(e){
			BackgroundLog.Log("BackgroundPlayer.AudioEvents.removeAll Catch: "+e);
		}
	}
}

BackgroundPlayer.Volume = {
	vol : 1,
	init : function(){
		var vol = BackgroundStorage.get("PlayerMain.Volume.saved");
		if (vol == null){
			vol = {"volume" : 1, "position" : 100};
		}
		BackgroundStorage.set("PlayerMain.Volume.saved", vol);
		BackgroundPlayer.Volume.set(vol.volume);	
	},
	set : function(volume){
		if (volume < 0){
			volume = 0;
		}
		if (volume > 1){
			volume = 1;
		}
		try {
			BackgroundPlayer.CurrentAudio.volume = volume;
		} catch (e){}
		BackgroundPlayer.Volume.vol = volume;
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.Volume.set", "volume" : volume});
		BackgroundPlayer.CurrentTab.send({"msg" : "setVolume", "volume" : volume});
		//BackgroundFlashComm.Send({"msg" : "volume", "value" : volume});
	},
	get : function(){
		return BackgroundPlayer.CurrentAudio.volume;
	}
}


BackgroundPlayer.Transport = {
	play : function(){
		try {
			BackgroundPlayer.CurrentAudio.play();
			BackgroundPlayer.IsPlaying = true;
			BackgroundPlayer.IsStopped = false;
			BackgroundPlayer.Timer.start();
			BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onPlay"});
			BackgroundPlayer.CurrentTab.send({"msg" : "play", "songVO" : BackgroundPlayer.CurrentSongVO });
		} catch(e){}
	},
	pause : function(){
		try {
			BackgroundPlayer.CurrentAudio.pause();
			BackgroundPlayer.IsPlaying = false;
			BackgroundPlayer.IsStopped = false;
			BackgroundPlayer.Timer.stop();
			BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onPause"});
			BackgroundPlayer.CurrentTab.send({"msg" : "pause", "songVO" : BackgroundPlayer.CurrentSongVO });
		} catch(e){}
	},
	previous : function(){
		if (BackgroundPlayer.QueueNumber > 0){
			BackgroundPlayer.Queue.play(BackgroundPlayer.QueueNumber - 1);
		}
	},
	next : function(){
		if (BackgroundPlayer.QueueNumber < BackgroundPlayer.Queue.array.length - 1){
			BackgroundPlayer.Queue.play(BackgroundPlayer.QueueNumber + 1);
		} else {
			BackgroundPlayer.Transport.stop();
		}
	},
	seekTo : function(seconds){
		try {
			BackgroundPlayer.CurrentAudio.currentTime = seconds;
		} catch(e){}
	},
	stop : function(){
		//BackgroundFlashComm.Send({"msg" : "stop"});
		try {
			BackgroundPlayer.CurrentAudio.pause();
		} catch(e) {}
		BackgroundPlayer.AudioEvents.removeAll();
		BackgroundPlayer.IsPlaying = false;
		BackgroundPlayer.IsStopped = true;
		BackgroundPlayer.Timer.stop();
		BackgroundPlayer.CurrentSongVO = null;
		BackgroundPlayer.CurrentAudio = null;
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.Transport.stop"});
		BackgroundPlayer.CurrentTab.send({"msg" : "stop", "songVO" : BackgroundPlayer.CurrentSongVO });
	}
}

BackgroundPlayer.Timer = {
	interval : null,
	start : function(){
		BackgroundPlayer.Timer.stop();
		if (BackgroundPlayer.IsPlaying){
			BackgroundPlayer.Timer.interval = setInterval(BackgroundPlayer.TimeUpdate, 50);
		}
	},
	stop : function(){
		clearInterval(BackgroundPlayer.Timer.interval);
	}
}

BackgroundPlayer.TimeUpdate = function(){
	var percentage = BackgroundPlayer.CurrentAudio.currentTime / BackgroundPlayer.CurrentAudio.duration;
	if (percentage > .5 && BackgroundPlayer.SentTimeUpdateHalf == false){
		BackgroundPlayer.SentTimeUpdateHalf = true;
		BackgroundEvents.Trigger({"type" : "BackgroundPlayer.TimeUpdateHalf", "songVO" : BackgroundPlayer.CurrentSongVO});
	}
	if (BackgroundMain.Tabs.playerTab != null && BackgroundPlayer.IsPlaying){
		BackgroundMain.Tabs.playerTab.PlayerMain.Bottom.setCurrentTime(BackgroundPlayer.CurrentAudio.currentTime, percentage);
	}
	if (BackgroundMain.Tabs.popupTab != null && BackgroundPlayer.IsPlaying){
		BackgroundMain.Tabs.popupTab.PopupPlayer.Time.currentTime(BackgroundPlayer.CurrentAudio.currentTime, percentage);
	}
	if (BackgroundMain.ContentScript.port != null){
		BackgroundMain.ContentScript.port.postMessage({"currentTime" : BackgroundPlayer.CurrentAudio.currentTime, "percentage": percentage});
	}
}
BackgroundPlayer.DurationChange = function(e){
	if (BackgroundPlayer.CurrentAudio != null){
		if (BackgroundMain.Tabs.playerTab != null){
			BackgroundMain.Tabs.playerTab.PlayerMain.Bottom.setDuration(BackgroundPlayer.CurrentAudio.duration);
		}
		if (BackgroundMain.Tabs.popupTab != null){
			BackgroundMain.Tabs.popupTab.PopupPlayer.Time.setDuration(BackgroundPlayer.CurrentAudio.duration);
		}
		BackgroundPlayer.CurrentTab.send({"msg" : "durationChange", "duration" : BackgroundPlayer.CurrentAudio.duration});
		if (BackgroundPlayer.CurrentAudio.duration != null && !isNaN(BackgroundPlayer.CurrentAudio.duration)){
			BackgroundPlayer.CurrentSongVO.timeseconds = BackgroundPlayer.CurrentAudio.duration;
		}
	}
}

BackgroundPlayer.Seeked = function(){
	if (BackgroundPlayer.IsPlaying == true){
		BackgroundPlayer.Transport.play();
	}
}

BackgroundPlayer.Ended = function(){
	BackgroundPlayer.Transport.next();
}

BackgroundPlayer.LoadError = function(){
	BackgroundEvents.Trigger({"type" : "BackgroundPlayer.onLoadError", "queueNumber" : BackgroundPlayer.QueueNumber, "songVO" : BackgroundPlayer.CurrentSongVO});
	BackgroundSQL.Songs.updateErrorCount(BackgroundPlayer.CurrentSongVO.domainkey);
	BackgroundPlayer.Transport.next();
}

BackgroundPlayer.UpdatePlayCount = function(obj){
	var songVO = obj.songVO;
	BackgroundSQL.Songs.updatePlayCount(songVO.domainkey);
}

BackgroundPlayer.TrackPlay = function(obj){
	if (obj.songVO.artist != undefined && obj.songVO.artist != ""){
		//BackgroundMain.Track.event("Artist", "Play", obj.songVO.artist, 1);
		//_gaq.push(['_trackEvent', "Artist", "Play", obj.songVO.artist, 1]);
	} else {
		//BackgroundMain.Track.event("Artist", "Play", "Unknown", 1);
		//_gaq.push(['_trackEvent', "Artist", "Play", "Unknown", 1]);
	}
}

BackgroundPlayer.CurrentTab = {
	send : function(obj){
		try {
			obj.closePagePlayer = BackgroundMain.Page.pagePlayerRemoved[BackgroundMain.ContentScript.selected];
			chrome.tabs.sendRequest(BackgroundMain.ContentScript.selected, obj, function(response){});
		} catch (e) {}
	}
}

BackgroundPlayer.Utils = {
	// Array Remove - By John Resig (MIT Licensed)
	arrayRemove : function(array, from, to) {
  		var rest = array.slice((to || from) + 1 || array.length);
  		array.length = from < 0 ? array.length + from : from;
  		return array.push.apply(array, rest);
	}
}

jQuery(window).bind("BackgroundPlayer.TimeUpdateHalf", BackgroundPlayer.UpdatePlayCount);
jQuery(window).bind("BackgroundPlayer.TimeUpdateHalf", BackgroundPlayer.TrackPlay);

window.addEventListener("load", BackgroundPlayer.Volume.init);