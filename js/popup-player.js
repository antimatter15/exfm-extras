/*
name: popup-player
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(PopupPlayer) == 'undefined'){
	PopupPlayer = {}
}

PopupPlayer.ProgressWidth = 0;
PopupPlayer.ProgressLeft = 0;
PopupPlayer.ProgressRight = 0;

PopupPlayer.Init = function(){
	if (Back.BackgroundPlayer.IsPlaying){
		PopupPlayer.Transport.displayPause(true);
	} else {
		PopupPlayer.Transport.displayPause(false);
	}
	jQuery('#mainPlayButton').click(PopupPlayer.Controls.playPause.click);
	jQuery('#prevButton').click(PopupPlayer.Controls.prevButton.click);
	jQuery('#nextButton').click(PopupPlayer.Controls.nextButton.click);
	
	PopupPlayer.Seek.seekThumb = jQuery('#bottomDisplaySeekThumb')[0];
	PopupPlayer.Seek.progressed = jQuery('#bottomDisplayTimeProgressed')[0];
	jQuery('#bottomDisplayTimeProgress').bind('click', PopupPlayer.Seek.click);
	jQuery(PopupPlayer.Seek.progressed).bind('click', PopupPlayer.Seek.click);
	jQuery(PopupPlayer.Seek.seekThumb).bind('mousedown', PopupPlayer.Seek.mouseDown);
	jQuery(PopupPlayer.Seek.seekThumb).bind('mouseup', PopupPlayer.Seek.mouseUp);
	
	
	PopupPlayer.Volume.volumeThumb = jQuery('#bottomVolumeRange')[0];
	jQuery(PopupPlayer.Volume.volumeThumb).bind('mousedown', PopupPlayer.Volume.mouseDown);
	jQuery(PopupPlayer.Volume.volumeThumb).bind('mouseup', PopupPlayer.Volume.mouseUp);
	jQuery(PopupPlayer.Volume.volumeThumb).bind('change', PopupPlayer.Volume.change);
	PopupPlayer.Volume.volumeSpeaker = jQuery('#bottomVolumeSpeaker')[0];
	jQuery('#bottomVolumeSpeaker').bind('click', PopupPlayer.Volume.speakerClick);
	PopupPlayer.Volume.init();
	PopupPlayer.Resize();
	PopupMain.Background.BackgroundMain.Tabs.getPopupTab();
}

PopupPlayer.Resize = function(){
	PopupPlayer.ProgressWidth = jQuery('#bottomDisplayTimeProgress').width();
	PopupPlayer.ProgressLeft = jQuery('#bottomDisplayTimeProgress').offset().left;
	PopupPlayer.ProgressRight = PopupPlayer.ProgressLeft + PopupPlayer.ProgressWidth;
}

PopupPlayer.Controls = {
	playPause : {
		click : function(e){
			if (Back.BackgroundPlayer.IsStopped){
				if (PopupMain.Songs.array.length > 0){
					PopupMain.PlayAll.click();
				}
			} else {
				if (Back.BackgroundPlayer.IsPlaying){
					Back.BackgroundPlayer.Transport.pause();
				} else {
					Back.BackgroundPlayer.Transport.play();
				}
			}
		}
	},
	prevButton : {
		click : function(e){
			Back.BackgroundPlayer.Transport.previous();
		}
	},
	nextButton : {
		click : function(e){
			Back.BackgroundPlayer.Transport.next();
		}
	}
}

PopupPlayer.Transport = {
	play : function(e){
		PopupPlayer.Transport.displayPause(true);
	},
	pause : function(e){
		PopupPlayer.Transport.displayPause(false);
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
	stop : function(){
		try {
			jQuery('#bottomDisplayTimeCount').text('0:00');
			jQuery('#bottomDisplayTimeTotal').text('0:00');
			jQuery(PopupPlayer.Seek.seekThumb).css('left', 35);
			jQuery(PopupPlayer.Seek.progressed).css('width', 2);
		} catch(e) {}
		jQuery('#bottomDisplaySong').text('');
		jQuery('#bottomDisplayArtist').text('');
		jQuery('#bottomDisplayLogo').css('display', 'block');
		PopupPlayer.Transport.displayPause(Back.BackgroundPlayer.IsPlaying);
	}
}

PopupPlayer.Display = function(obj){
	var songVO = obj.songVO;
	if (Back.BackgroundPlayer.IsStopped == false){
		jQuery('#bottomDisplayCoverArt').css('visibility', 'visible');
		jQuery('#bottomDisplayText').css('visibility', 'visible');
		jQuery('#bottomDisplayTime').css('visibility', 'visible');
		jQuery('#bottomDisplayLogo').css('display', 'none');
	}
	try {
		jQuery('#bottomDisplayTimeCount').text('0:00');
		jQuery('#bottomDisplayTimeTotal').text('0:00');
		jQuery(PopupPlayer.Bottom.seekThumb).css('left', 45);
		jQuery(PopupPlayer.Bottom.progressed).css('width', 2);
	} catch(e) {}
	jQuery('#bottomDisplaySong').text('');
	jQuery('#bottomDisplayArtist').text('');
	try {
		if (songVO.songtitle != null){
			jQuery('#bottomDisplaySong').html(songVO.songtitle);
			jQuery('#bottomDisplaySong').attr("title", "Name: "+songVO.songtitle);
		} else {
			jQuery('#bottomDisplaySong').text('');
		}
		if (songVO.artist != null && songVO.artist != undefined){
			jQuery('#bottomDisplayArtist').html(songVO.artist);
			jQuery('#bottomDisplayArtist').attr("title", "Artist: "+songVO.artist);
		} else {
			jQuery('#bottomDisplayArtist').text('');
		}
	} catch (e){}
}

PopupPlayer.Time = {
	currentTime : function(time, percentage){
		if (PopupPlayer.Seek.isSeeking == false) {
			jQuery('#bottomDisplayTimeCount').text(PopupPlayer.Utils.mmss(Math.floor(time)));
			if ((PopupPlayer.ProgressWidth * percentage) > 0){
				jQuery(PopupPlayer.Seek.seekThumb).css('left', PopupPlayer.ProgressWidth * percentage + 45);
			}
			jQuery(PopupPlayer.Seek.progressed).css('width', PopupPlayer.ProgressWidth * percentage + 3);
		}
	},
	setDuration : function(duration){
		if (!isNaN(duration)){
			jQuery('#bottomDisplayTimeTotal').text(PopupPlayer.Utils.mmss(Math.floor(duration)));
		}
	}
}
PopupPlayer.Volume = {
	volume : 1,
	saved : {},
	offset : 0,
	init : function(){
		PopupPlayer.Volume.saved = Back.BackgroundStorage.get("PlayerMain.Volume.saved");
		if (PopupPlayer.Volume.saved == null){
			PopupPlayer.Volume.saved = {"volume" : 1, "position" : 100};
		}
		PopupPlayer.Volume.set(PopupPlayer.Volume.saved.position);
	},
	mouseDown : function(e){
		jQuery(PopupPlayer.Volume.volumeThumb).addClass('bottomVolumeThumbActive');
	},
	mouseUp : function(e){
		jQuery(PopupPlayer.Volume.volumeThumb).removeClass('bottomVolumeThumbActive');
		Back.BackgroundStorage.set("PlayerMain.Volume.saved", PopupPlayer.Volume.saved);
	},
	change : function(e){
		var value = jQuery(this).attr('value');
		var volume = value/100;
		PopupPlayer.Volume.saved = {"volume" : volume, "position" : value};
		Back.BackgroundPlayer.Volume.set(volume);
		PopupPlayer.Volume.set(value);
	},
	set : function(value){
		jQuery(PopupPlayer.Volume.volumeThumb).attr('value', value);
		if (value == 0){
			jQuery(PopupPlayer.Volume.volumeSpeaker).removeClass('bottomVolumeOn');
			jQuery(PopupPlayer.Volume.volumeSpeaker).addClass('bottomVolumeOff');
		} else {
			jQuery(PopupPlayer.Volume.volumeSpeaker).removeClass('bottomVolumeOff');
			jQuery(PopupPlayer.Volume.volumeSpeaker).addClass('bottomVolumeOn');
		}
	},
	event : function(obj){
		var value = obj.volume * 100;
		PopupPlayer.Volume.set(value);
	},	
	speakerClick : function(e){
		var volume = 1;
		var value = 100;
		if (jQuery(this).hasClass('bottomVolumeOn')){
			volume = 0;
			value = 0;
		}
		PopupPlayer.Volume.saved = {"volume" : volume, "position" : value};
		Back.BackgroundPlayer.Volume.set(volume);
		PopupPlayer.Volume.set(value);
		Back.BackgroundStorage.set("PlayerMain.Volume.saved", PopupPlayer.Volume.saved);
	}
}
PopupPlayer.Seek = {
	seconds : 0,
	isSeeking : false,
	offset : 43,
	seekThumb : null,
	progressed : null,
	mouseDown : function(e){
		jQuery(document).bind('mousemove', PopupPlayer.Seek.mouseMove);
		jQuery(document).bind('mouseup', PopupPlayer.Seek.mouseUp);
		PopupPlayer.Seek.isSeeking = true;
		e.preventDefault();
	},
	mouseUp : function(e){
		jQuery(document).unbind('mousemove', PopupPlayer.Seek.mouseMove);
		jQuery(document).unbind('mouseup', PopupPlayer.Seek.mouseUp);
		Back.BackgroundPlayer.Transport.seekTo(PopupPlayer.Seek.seconds);
		PopupPlayer.Seek.isSeeking = false;
		PopupPlayer.Time.currentTime(PopupPlayer.Seek.seconds);
	},
	mouseMove : function(e){
		var x = e.clientX;
		try {
			if (x < PopupPlayer.ProgressLeft ){
				x = PopupPlayer.ProgressLeft ;
			}
			if (x > PopupPlayer.ProgressRight){
				x = PopupPlayer.ProgressRight;
			}
			var seekLeft = x - PopupPlayer.ProgressLeft;
			jQuery(PopupPlayer.Seek.seekThumb).css('left', seekLeft + PopupPlayer.Seek.offset);
			jQuery(PopupPlayer.Seek.progressed).css('width', x - PopupPlayer.ProgressLeft);
			PopupPlayer.Seek.seconds = Math.floor((seekLeft / PopupPlayer.ProgressWidth) * Back.BackgroundPlayer.CurrentAudio.duration);
		} catch (e){}
	},
	click : function(e){
		PopupPlayer.Seek.mouseMove(e);
		Back.BackgroundPlayer.Transport.seekTo(PopupPlayer.Seek.seconds);
	}
}

PopupPlayer.Utils = {
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

PopupPlayer.Loading = {
	show : function(e){
		jQuery('#bottomDisplayTimeProgress').addClass('bottomDisplayTimeProgressLoading');
		jQuery(PopupPlayer.Seek.seekThumb).css('visibility', 'hidden');
		jQuery(PopupPlayer.Seek.progressed).css('visibility', 'hidden');
		
	},
	hide : function(e){
		jQuery('#bottomDisplayTimeProgress').removeClass('bottomDisplayTimeProgressLoading');
		jQuery(PopupPlayer.Seek.seekThumb).css('visibility', 'visible');
		jQuery(PopupPlayer.Seek.progressed).css('visibility', 'visible');
	}
}


var Back = chrome.extension.getBackgroundPage();

jQuery(window).bind("BackgroundPlayer.onPlay", PopupPlayer.Transport.play);
jQuery(window).bind("BackgroundPlayer.onPause", PopupPlayer.Transport.pause);
jQuery(window).bind("BackgroundPlayer.onSongChange", PopupPlayer.Display);
jQuery(window).bind("BackgroundPlayer.Volume.set", PopupPlayer.Volume.event);
jQuery(window).bind("BackgroundPlayer.Transport.stop", PopupPlayer.Transport.stop);

jQuery(window).bind("BackgroundPlayer.PlayLoading", PopupPlayer.Loading.show);
jQuery(window).bind("BackgroundPlayer.PlayPlaying", PopupPlayer.Loading.hide);


window.addEventListener("load", PopupPlayer.Init);
window.addEventListener("unload", Back.BackgroundMain.Tabs.removePopupTab);
window.addEventListener('resize', PopupPlayer.Resize);
