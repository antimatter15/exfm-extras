/*
name: options-notificatuions
author: Dan Kantor
requires: options, jquery-1.3.2, background-storage
*/

Options.Notifications = {
	init : function(e){
		var showSongNotification = BackgroundStorage.get("showSongNotification");
		if (showSongNotification == "enabled") {
			Options.Notifications.song.setOn();
		}
		jQuery('#showSongNotification').bind('click', Options.Notifications.song.click);
	},
	song : {
		click : function(e){
			var off = jQuery('#showSongNotification').hasClass('checkboxOff');
			if (off == false){
				Options.Notifications.song.setOff();
			} else {
				Options.Notifications.song.setOn();
			}
		},
		setOn : function(){
			jQuery('#showSongNotification').removeClass('checkboxOff');
			jQuery('#showSongNotification').addClass('checkboxOn');
			BackgroundStorage.set("showSongNotification", 'enabled');
		},
		setOff : function(){
			jQuery('#showSongNotification').removeClass('checkboxOn');
			jQuery('#showSongNotification').addClass('checkboxOff');
			BackgroundStorage.set("showSongNotification", 'disabled');
		}
	}
}

window.addEventListener('load', Options.Notifications.init);
