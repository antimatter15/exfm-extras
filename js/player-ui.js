/*
name: player-ui
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(PlayerUI) == 'undefined'){
	PlayerUI = {}
}

PlayerUI.ProgressWidth = 0;
PlayerUI.ProgressLeft = 0;
PlayerUI.ProgressRight = 0;

PlayerUI.Init = function(){
	jQuery("#top").animate( { width : "100%", left : "0%" }, 300);
	jQuery("#bottom").animate( { height : "76px" }, 500, function () { PlayerUI.InitTab(); jQuery("#middle").animate( { opacity : 1 }, 700) });
	jQuery('.topTab').click(PlayerUI.Top.tab.click);
	
	PlayerUI.ProgressWidth = jQuery('#bottomDisplayTimeProgress').width();
	PlayerUI.ProgressLeft = jQuery('#bottomDisplayTimeProgress').offset().left;
	PlayerUI.ProgressRight = PlayerUI.ProgressLeft + PlayerUI.ProgressWidth;
}

PlayerUI.InitTab = function(){
	//console.log(location.hash);
	//switch (location.hash){
	//	case '#options' :
	//		alert('options');
	//	break;
	//	default :
			var tabSelected = PlayerMain.Background.BackgroundStorage.get("PlayerUI.Top.tab.selected");
			//PlayerMain.Background.BackgroundMain.Track.page("/player/topTab/"+tabSelected);
			switch (tabSelected) {
				case "queue" : 
					PlayerUI.Top.tab.select(jQuery('#queueTab'), "queue");
					PlayerUI.Middle.select(jQuery('#queueMiddle'));
				break;
				case "allSongs" : 
					PlayerUI.Top.tab.select(jQuery('#allSongsTab'), "allSongs");
					PlayerUI.Middle.select(jQuery('#allSongsMiddle'));
				break;
				case "home" : 
					PlayerUI.Top.tab.select(jQuery('#homeTab'), "home");
					PlayerUI.Middle.select(jQuery('#homeMiddle'));
				break;
				default :
					PlayerUI.Top.tab.select(jQuery('#homeTab'), "home");
					PlayerUI.Middle.select(jQuery('#homeMiddle'));
				break;
			}
			_gaq.push(['_trackPageview', "/version/"+PlayerMain.Background.BackgroundMain.Version]);
	//	break;
	//}
}

PlayerUI.Resize = function(){
	PlayerUI.ProgressWidth = jQuery('#bottomDisplayTimeProgress').width();
	PlayerUI.ProgressLeft = jQuery('#bottomDisplayTimeProgress').offset().left;
	PlayerUI.ProgressRight = PlayerUI.ProgressLeft + PlayerUI.ProgressWidth;
}

PlayerUI.Top = {
	tab : {
		selected : null,
		click : function(e){
			var type = jQuery(e.target).attr("section");
			//location.hash = type;
			PlayerUI.Top.tab.unSelect(PlayerUI.Top.tab.selected);
			PlayerUI.Top.tab.select(e.target, type);
			PlayerUI.Middle.unSelect(PlayerUI.Middle.selected);
			PlayerUI.Middle.select(jQuery('#'+type+'Middle'));
			_gaq.push(['_trackPageview', "/player/topTab/"+type]);
			//PlayerMain.Background.BackgroundMain.Track.page("/player/topTab/"+type);
		},
		select : function(el, key){
			jQuery(el).addClass('topTabSelected');
			PlayerUI.Top.tab.selected = el;
			PlayerMain.Background.BackgroundStorage.set("PlayerUI.Top.tab.selected", key);
			jQuery(window).trigger({"type" : "PlayerUI.Top.tab.select", "element" : el, "key" : key});
			//BackgroundEvents.Trigger({"type" : "PlayerUI.Top.tab.select", "element" : el, key : "key"});
		},
		unSelect : function(el){
			try {
				jQuery(el).removeClass('topTabSelected');
			} catch (e) {}
			jQuery(window).trigger({"type" : "PlayerUI.Top.tab.unSelect", "element" : el});
		}
	}
}

PlayerUI.Middle =  {
	selected : null,
	select : function(el){
		//jQuery('#middle').css('opacity', 1);
		jQuery(el).removeClass('hidden');
		PlayerUI.Middle.selected = el;
	},
	unSelect : function(el){
		try {
			//jQuery('#middle').animate({opacity : 0}, 100, function() { jQuery(el).addClass('hidden'); PlayerUI.Middle.select(newEl);});
			jQuery(el).addClass('hidden');
		} catch (e) {}
	}
}

PlayerUI.ListPane = {
	selected : null,
	list : {
		click : function(){
			//PlayerUI.ListPane.list.select();
			//PlayerAllSongs.format = "list";
			//PlayerAllSongs.select();
		},
		select : function(){
			jQuery('#listButton').removeClass('hidden');
			jQuery('#paneButton').removeClass('hidden');
			jQuery('#paneButton').removeClass('paneButtonSelected');
			jQuery('#listButton').addClass('listButtonSelected');
		}
	},
	pane : {
		click : function(){
			//PlayerUI.ListPane.pane.select();
			//PlayerAllSongs.format = "pane";
			//PlayerAllSongs.select();
		},
		select : function(){
			jQuery('#listButton').css('display', 'block');
			jQuery('#paneButton').css('display', 'block');
			jQuery('#listButton').removeClass('listButtonSelected');
			jQuery('#paneButton').addClass('paneButtonSelected');
		}
	},
	unSelect : function(){
		jQuery('#listButton').removeClass('listButtonSelected');
		jQuery('#paneButton').removeClass('paneButtonSelected');
	},
	hide : function(){
		jQuery('#paneListToggle').css('display', 'none');
		//jQuery('#paneButton').css('display', 'none');
	},
	show : function(){
		jQuery('#paneListToggle').css('display', 'block');
		//jQuery('#paneButton').css('display', 'block');
	}
}

PlayerUI.UserSection = {
	show : function(){
		jQuery('#userSection').css('display', 'block');
	},
	hide : function(){
		jQuery('#userSection').css('display', 'none');
	}
}

PlayerUI.SongChange = {
	selected : null,
	set : function(e){
		try {
			PlayerUI.SongChange.unSelect();
			PlayerUI.SongChange.selected = e.songVO.domainkey;
			PlayerUI.SongChange.select();
		} catch(e){}
	},
	select : function(){
		try {
			jQuery('.smallVolumeButton'+PlayerUI.SongChange.selected).addClass('smallVolume');
			jQuery('.largeVolumeButton'+PlayerUI.SongChange.selected).addClass('songVOListSelected');
		} catch(e){}
	},
	unSelect : function(){
		try {
			jQuery('.smallVolumeButton'+PlayerUI.SongChange.selected).removeClass('smallVolume');
			jQuery('.largeVolumeButton'+PlayerUI.SongChange.selected).removeClass('songVOListSelected');
		} catch(e){}
	}
}



PlayerUI.Utils = {
	dayStrings : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	monthStrings : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	ampm : function(hour) {
		var m = "AM";
		if (hour > 11){
			m = "PM";
		}
		return m;
	},
	to12Hour : function(hour){
		var h = hour;
		if (hour > 12){
			h = hour - 12;
		}
		if (hour == 0){
			h = 12;
		}
		return h;
	},
	fixZeroes : function(minutes){
		var m = minutes;
		if (minutes < 10){
			m = '0'+minutes;
		}
		return m;
	},
	pluralize : function(number, string){
		var s = string+'s';
		if (number == 1){
			s = string;
		}
		return s;
	}
}
//window.addEventListener('load', PlayerUI.Init);
window.addEventListener('resize', PlayerUI.Resize);
jQuery(window).bind("BackgroundPlayer.onSongChange", PlayerUI.SongChange.set);
jQuery(window).bind("BackgroundPlayer.Transport.stop", PlayerUI.SongChange.unSelect);