/*
name: notification
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(Notification) == 'undefined'){
	Notification = {}
}

Notification.Init = function(){
	var songVO = Back.BackgroundPlayer.CurrentSongVO;
	jQuery('#coverart').css('background', Utils.GetCoverArt(songVO.smallimage, '60x60'));
	jQuery('#songtitle').text(songVO.songtitle);
	jQuery('#artist').text(songVO.artist);
	jQuery('#album').text(songVO.album);
	jQuery('#domain').html("via <a class=\"domainLink\" href=\""+songVO.href+"\" target=\"_blank\">"+songVO.domain+"</a>");
}

Notification.Mouseover = function(e){
	Back.BackgroundMain.Notifications.song.clearTimeout();
}

Notification.Mouseout = function(e){
	Back.BackgroundMain.Notifications.song.setTimeout();
}

var Back = chrome.extension.getBackgroundPage();

window.addEventListener('load', Notification.Init);
jQuery(document).bind('mouseover', Notification.Mouseover);
jQuery(document).bind('mouseout', Notification.Mouseout);

