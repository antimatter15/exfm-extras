/*
name: player-contextmenu
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(PlayerContextMenu) == 'undefined'){
	PlayerContextMenu = {}
}

PlayerContextMenu.SelectedText = null;

PlayerContextMenu.Create = function(x, y, scrollStopNode){	
	jQuery('#contextMenu').empty();
	//jQuery('#contextMenu').append("<div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemReload contextMenuItemFlash\">Reload</div>");
	PlayerContextMenu.SelectedText = window.getSelection().toString();
	if (PlayerContextMenu.SelectedText != ''){
		jQuery('#copyTextArea').attr('value', PlayerContextMenu.SelectedText);
		jQuery('#contextMenu').append("<div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemCopy\">Copy</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemSearch\">Search Google for '"+PlayerContextMenu.SelectedText+"'</div>");
	}
	if (jQuery(document).height() - 200 < y){
		y = y - 150;
	}
	if (jQuery(document).width() - 200 < x){
		x = x - 170;
	}
	jQuery('#contextMenu').css({left : x, top : y, display : 'block'});
	jQuery(document).bind('click', PlayerContextMenu.Click);
	PlayerContextMenu.StopScroll.node = scrollStopNode;
	jQuery(PlayerContextMenu.StopScroll.node).bind('scroll', PlayerContextMenu.StopScroll.stop);
	return jQuery('#contextMenu');
}

PlayerContextMenu.Click = function(e){
	if (jQuery(e.target).hasClass('contextMenuItem')){
		if (jQuery(e.target).hasClass('contextMenuItemFlash')){
		jQuery(e.target).addClass('contextMenuItemNoHover');
			setTimeout(PlayerContextMenu.Flash.one, 40, e.target);
		}
	} else {
		PlayerContextMenu.Destroy();
		jQuery(document).unbind('click', PlayerContextMenu.Click);
	}
}

PlayerContextMenu.Flash = {
	one : function(target) {
		jQuery(target).removeClass('contextMenuItemNoHover');
		setTimeout(PlayerContextMenu.Flash.two, 40, target);
	},
	two : function(target) {
		jQuery(target).addClass('contextMenuItemNoHover');
		setTimeout(PlayerContextMenu.Flash.three, 40, target);
	},
	three : function(target) {
		jQuery(target).removeClass('contextMenuItemNoHover');
		if (jQuery(target).hasClass('contextMenuItemReload')){
			location.reload();
		}
		if (jQuery(target).hasClass('contextMenuItemSearch')){
			chrome.tabs.create({url: "http://www.google.com/search?q="+PlayerContextMenu.SelectedText});
			PlayerContextMenu.Destroy();
		}
		if (jQuery(target).hasClass('contextMenuItemCopy')){
			document.getElementById('copyTextArea').select();
			document.execCommand("Copy");
			PlayerContextMenu.Destroy();
		}
		jQuery(window).trigger({"type" : "PlayerContextMenu.Flash.complete", "target" : target});
	}
}

PlayerContextMenu.Destroy = function(){
	jQuery('#contextMenu').css({display : 'none'});
	jQuery(PlayerContextMenu.StopScroll.node).unbind('scroll', PlayerContextMenu.StopScroll.stop);
	jQuery(window).trigger({"type" : "PlayerContextMenu.Destroy"});
}

PlayerContextMenu.StopScroll = {
	node : null,
	stop : function(e){
		e.preventDefault();
		return false;
	}
}

jQuery('#contextMenu').live('contextmenu', function(e){ return false; });