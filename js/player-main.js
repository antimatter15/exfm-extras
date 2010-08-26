/*
name: player-main
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(PlayerMain) == 'undefined'){
	PlayerMain = {}
}

PlayerMain.Background = null;

PlayerMain.Init = function(){
	 //PlayerMain.Utils.getView("background.html");
	jQuery('#mainPlayButton').click(PlayerMain.Bottom.playPause);
	jQuery('#prevButton').click(PlayerMain.Bottom.prevButton);
	jQuery('#nextButton').click(PlayerMain.Bottom.nextButton);
	if (PlayerMain.Background.BackgroundPlayer.IsPlaying){
		PlayerMain.Bottom.displayPause(true);
	}
	PlayerMain.Bottom.seekThumb = jQuery('#bottomDisplaySeekThumb')[0];
	PlayerMain.Bottom.progressed = jQuery('#bottomDisplayTimeProgressed')[0];
	jQuery(PlayerMain.Bottom.seekThumb).bind('mousedown', PlayerMain.Seek.mouseDown);
	jQuery(PlayerMain.Bottom.seekThumb).bind('mouseup', PlayerMain.Seek.mouseUp);
	PlayerMain.Bottom.volumeThumb = jQuery('#bottomVolumeRange')[0];
	jQuery(PlayerMain.Bottom.volumeThumb).bind('mousedown', PlayerMain.Volume.mouseDown);
	jQuery(PlayerMain.Bottom.volumeThumb).bind('mouseup', PlayerMain.Volume.mouseUp);
	jQuery(PlayerMain.Bottom.volumeThumb).bind('change', PlayerMain.Volume.change);
	PlayerMain.Bottom.volumeSpeaker = jQuery('#bottomVolumeSpeaker')[0];
	jQuery('#bottomVolumeSpeaker').bind('click', PlayerMain.Volume.speakerClick);
	jQuery('#bottomDisplayTimeProgress').bind('click', PlayerMain.Seek.click);
	jQuery('#bottomDisplayTimeProgressed').bind('click', PlayerMain.Seek.click);
	PlayerUI.Init();
	PlayerMain.Volume.init();
	PlayerMain.Background.BackgroundEvents.Register("PlayerMain.EventHandler", PlayerMain.EventHandler);
	PlayerMain.Background.BackgroundMain.Tabs.getPlayerTab();
}

PlayerMain.EventHandler = function(data){
	jQuery(window).trigger(data);
}

PlayerMain.Seek = {
	seconds : 0,
	isSeeking : false,
	offset : 43,
	mouseDown : function(e){
		jQuery(document).bind('mousemove', PlayerMain.Seek.mouseMove);
		jQuery(document).bind('mouseup', PlayerMain.Seek.mouseUp);
		PlayerMain.Seek.isSeeking = true;
		e.preventDefault();
	},
	mouseUp : function(e){
		jQuery(document).unbind('mousemove', PlayerMain.Seek.mouseMove);
		jQuery(document).unbind('mouseup', PlayerMain.Seek.mouseUp);
		PlayerMain.Background.BackgroundPlayer.Transport.seekTo(PlayerMain.Seek.seconds);
		PlayerMain.Seek.isSeeking = false;
		PlayerMain.Bottom.setCurrentTime(PlayerMain.Seek.seconds);
	},
	mouseMove : function(e){
		var x = e.clientX;
		try {
			if (x < PlayerUI.ProgressLeft ){
				x = PlayerUI.ProgressLeft ;
			}
			if (x > PlayerUI.ProgressRight){
				x = PlayerUI.ProgressRight;
			}
			var seekLeft = x - PlayerUI.ProgressLeft;
			jQuery(PlayerMain.Bottom.seekThumb).css('left', seekLeft + PlayerMain.Seek.offset);
			jQuery(PlayerMain.Bottom.progressed).css('width', x - PlayerUI.ProgressLeft);
			PlayerMain.Seek.seconds = Math.floor((seekLeft / PlayerUI.ProgressWidth) * PlayerMain.Background.BackgroundPlayer.CurrentAudio.duration);
		} catch (e){}
	},
	click : function(e){
		PlayerMain.Seek.mouseMove(e);
		PlayerMain.Background.BackgroundPlayer.Transport.seekTo(PlayerMain.Seek.seconds);
		PlayerMain.Bottom.setCurrentTime(PlayerMain.Seek.seconds);
	}
}

PlayerMain.Volume = {
	volume : 1,
	saved : {},
	offset : 0,
	init : function(){
		PlayerMain.Volume.saved = PlayerMain.Background.BackgroundStorage.get("PlayerMain.Volume.saved");
		if (PlayerMain.Volume.saved == null){
			PlayerMain.Volume.saved = {"volume" : 1, "position" : 100};
		}
		PlayerMain.Volume.set(PlayerMain.Volume.saved.position);
	},
	mouseDown : function(e){
		jQuery(PlayerMain.Bottom.volumeThumb).addClass('bottomVolumeThumbActive');
	},
	mouseUp : function(e){
		jQuery(PlayerMain.Bottom.volumeThumb).removeClass('bottomVolumeThumbActive');
		PlayerMain.Background.BackgroundStorage.set("PlayerMain.Volume.saved", PlayerMain.Volume.saved);
	},
	change : function(e){
		var value = jQuery(this).attr('value');
		var volume = value/100;
		PlayerMain.Volume.saved = {"volume" : volume, "position" : value};
		PlayerMain.Background.BackgroundPlayer.Volume.set(volume);
		PlayerMain.Volume.set(value);
	},
	set : function(value){
		jQuery(PlayerMain.Bottom.volumeThumb).attr('value', value);
		if (value == 0){
			jQuery(PlayerMain.Bottom.volumeSpeaker).removeClass('bottomVolumeOn');
			jQuery(PlayerMain.Bottom.volumeSpeaker).addClass('bottomVolumeOff');
		} else {
			jQuery(PlayerMain.Bottom.volumeSpeaker).removeClass('bottomVolumeOff');
			jQuery(PlayerMain.Bottom.volumeSpeaker).addClass('bottomVolumeOn');
		}
	},
	event : function(obj){
		var value = obj.volume * 100;
		PlayerMain.Volume.set(value);
	},	
	speakerClick : function(e){
		var volume = 1;
		var value = 100;
		if (jQuery(this).hasClass('bottomVolumeOn')){
			volume = 0;
			value = 0;
		}
		PlayerMain.Volume.saved = {"volume" : volume, "position" : value};
		PlayerMain.Background.BackgroundPlayer.Volume.set(volume);
		PlayerMain.Volume.set(value);
		PlayerMain.Background.BackgroundStorage.set("PlayerMain.Volume.saved", PlayerMain.Volume.saved);
	}
}
PlayerMain.Bottom = {
	setCurrentTime : function(currentTime, percentage){
		if (PlayerMain.Seek.isSeeking == false) {
			jQuery('#bottomDisplayTimeCount').text(PlayerMain.Utils.mmss(Math.floor(currentTime)));
			if ((PlayerUI.ProgressWidth * percentage) > 0){
				jQuery(PlayerMain.Bottom.seekThumb).css('left', PlayerUI.ProgressWidth * percentage + 45);
			}
			jQuery(PlayerMain.Bottom.progressed).css('width', PlayerUI.ProgressWidth * percentage + 3);
		}
	},
	stop : function(){
		try {
			jQuery('#bottomDisplayTimeCount').text('0:00');
			jQuery('#bottomDisplayTimeTotal').text('0:00');
			jQuery(PlayerMain.Bottom.seekThumb).css('left', 45);
			jQuery(PlayerMain.Bottom.progressed).css('width', 2);
			jQuery('#bottomDisplaySong').text('');
			jQuery('#bottomDisplayArtist').text('');
			jQuery('#bottomDisplayAlbum').text('');
			jQuery('#bottomDisplayDomain').text('');
			jQuery('#bottomDisplayCoverArt').css('visibility', 'hidden');
			jQuery('#bottomDisplayText').css('visibility', 'hidden');
			jQuery('#bottomDisplayTime').css('visibility', 'hidden');
			jQuery('#bottomDisplaySeekThumb').css('visibility', 'hidden');
			jQuery('#bottomDisplayTimeProgressed').css('visibility', 'hidden');
			jQuery('#bottomDisplayLogo').css('display', 'block');
			PlayerMain.Bottom.displayPause(PlayerMain.Background.BackgroundPlayer.IsPlaying);
			document.title = "Player - ExtensionFM";
		} catch(e) {}
		//PlayerMain.Bottom.hideLoading();
	},
	seekThumb : null,
	volumeThumb : null,
	progressed : null,
	setDuration : function(duration){
		if (!isNaN(duration)){
			jQuery('#bottomDisplayTimeTotal').text(PlayerMain.Utils.mmss(Math.floor(duration)));
		}
	},
	setCurrentSong : function(obj){
		if (PlayerMain.Background.BackgroundPlayer.IsStopped == false){
			jQuery('#bottomDisplayCoverArt').css('visibility', 'visible');
			jQuery('#bottomDisplayText').css('visibility', 'visible');
			jQuery('#bottomDisplayTime').css('visibility', 'visible');
			//jQuery('#bottomDisplaySeekThumb').css('visibility', 'visible');
			//jQuery('#bottomDisplayTimeProgressed').css('visibility', 'visible');
			jQuery('#bottomDisplayLogo').css('display', 'none');
		}
		try {
			jQuery('#bottomDisplayTimeCount').text('0:00');
			jQuery('#bottomDisplayTimeTotal').text('0:00');
			jQuery(PlayerMain.Bottom.seekThumb).css('left', 45);
			jQuery(PlayerMain.Bottom.progressed).css('width', 2);
		} catch(e) {}
		jQuery('#bottomDisplaySong').text('');
		jQuery('#bottomDisplayArtist').text('');
		jQuery('#bottomDisplayAlbum').text('');
		jQuery('#bottomDisplayDomain').text('');
		var songVO = obj.songVO;
		var title = "Player - ExtensionFM";
		try {
			if (songVO.songtitle != null){
				jQuery('#bottomDisplaySong').html(songVO.songtitle);
				jQuery('#bottomDisplaySong').attr("title", "Name: "+songVO.songtitle);
				title = songVO.songtitle+" - ExtensionFM";
			} else {
				jQuery('#bottomDisplaySong').text('');
			}
			if (songVO.artist != null && songVO.artist != undefined && songVO.artist != ''){
				jQuery('#bottomDisplayArtist').html(songVO.artist);
				jQuery('#bottomDisplayArtist').attr("title", "Artist: "+songVO.artist);
				title = songVO.songtitle+" by "+songVO.artist+" - ExtensionFM";
			} else {
				jQuery('#bottomDisplayArtist').text('');
			}
			if (songVO.album != null){
				jQuery('#bottomDisplayAlbum').html(songVO.album);
				jQuery('#bottomDisplayAlbum').attr("title", "Album: "+songVO.album);
			} else {
				jQuery('#bottomDisplayAlbum').text('');
			}
			if (songVO.domain != null && songVO.domain != undefined){
				jQuery('#bottomDisplayDomain').text(songVO.domain);
				jQuery('#bottomDisplayDomain').attr("title", "Site: "+songVO.domain);
				jQuery('#bottomDisplayDomain').attr("href", songVO.href);
			} else {
				jQuery('#bottomDisplayDomain').text('');
			}
			jQuery('#bottomDisplayCoverArt').css('background', Utils.GetCoverArt(songVO.smallimage, '45x45'));
		} catch (e){}
		document.title = Utils.ReplaceHTMLEncoding(title);
	},
	playPause : function(){
		if (PlayerMain.Background.BackgroundPlayer.IsPlaying){
			PlayerMain.Background.BackgroundPlayer.Transport.pause();
			//PlayerMain.Bottom.displayPause(false);
		} else {
			PlayerMain.Background.BackgroundPlayer.Transport.play();
			//PlayerMain.Bottom.displayPause(true);
		}
	},
	displayPause : function(b){
		if (b){
			jQuery('#mainPlayButton').removeClass('playbutton');
			jQuery('#mainPlayButton').addClass('pausebutton');
		} else {
			jQuery('#mainPlayButton').removeClass('pausebutton');
			jQuery('#mainPlayButton').addClass('playbutton');
		}
	},
	prevButton : function(){
		PlayerMain.Background.BackgroundPlayer.Transport.previous();
	},
	nextButton : function(){
		PlayerMain.Background.BackgroundPlayer.Transport.next();
	},
	showLoading : function(e){
		jQuery('#bottomDisplayTimeProgress').addClass('bottomDisplayTimeProgressLoading');
		jQuery('#bottomDisplaySeekThumb').css('visibility', 'hidden');
		jQuery('#bottomDisplayTimeProgressed').css('visibility', 'hidden');
	},
	hideLoading : function(e){
		jQuery('#bottomDisplayTimeProgress').removeClass('bottomDisplayTimeProgressLoading');
		jQuery('#bottomDisplaySeekThumb').css('visibility', 'visible');
		jQuery('#bottomDisplayTimeProgressed').css('visibility', 'visible');
	}
}

PlayerMain.Utils = {
	mmss: function (secs) {
        var s = secs % 60;
        if (s < 10) {
            s = "0" + s;
        }
        return Math.floor(secs/60) + ":" + s;
    },
    getView : function(url){
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
PlayerMain.Background = chrome.extension.getBackgroundPage();
//jQuery(window).bind("Song.onMetadataUpdate", function(data) { console.log('player main', data)})
window.addEventListener('load', PlayerMain.Init);
window.addEventListener("unload", PlayerMain.Background.BackgroundMain.Tabs.removePlayerTab);

jQuery(window).bind("BackgroundPlayer.Transport.stop", function(e){PlayerMain.Bottom.hideLoading()});
jQuery(window).bind("BackgroundPlayer.Transport.stop", PlayerMain.Bottom.stop);
jQuery(window).bind("BackgroundPlayer.PlayLoading", PlayerMain.Bottom.showLoading);
jQuery(window).bind("BackgroundPlayer.PlayPlaying", PlayerMain.Bottom.hideLoading);
jQuery(window).bind("BackgroundPlayer.onSongChange", PlayerMain.Bottom.setCurrentSong);
jQuery(window).bind("BackgroundPlayer.onLoadError", function(e){PlayerMain.Bottom.hideLoading()});
jQuery(window).bind("BackgroundPlayer.onPlay", function(){ PlayerMain.Bottom.displayPause(true); });
jQuery(window).bind("BackgroundPlayer.onPause", function(){ PlayerMain.Bottom.displayPause(false); });
jQuery(window).bind("BackgroundPlayer.Volume.set", PlayerMain.Volume.event);
jQuery(window).bind("Account.LoggedOut", function(e){ location.reload(); });
jQuery(window).bind("Account.LoggedIn", function(e){ location.reload(); });

jQuery('.switchLink').live('click', Utils.openOrSwitchTab);

//window.addEventListener('hashchange', function(e){console.log(e)})