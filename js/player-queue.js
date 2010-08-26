/*
name: player-queue
author: Dan Kantor
requires: jquery-1.3.2
*/


if (typeof(PlayerQueue) == 'undefined'){
	PlayerQueue = {}
}

PlayerQueue.html = "";

PlayerQueue.oldQueueNumber = null;

PlayerQueue.Selected = null;
PlayerQueue.SelectedArray = [];

PlayerQueue.Click = {
	lastClickedPosition : null,
	go : function(e){
		var position = parseInt(jQuery(this).attr('queue'))
		if (e.shiftKey == true){
			if (PlayerQueue.Click.lastClickedPosition == null || jQuery(this).hasClass('listSelected')){
				PlayerQueue.Click.select(this, true);
			} else {
				var divs = jQuery(this.parent).find('.queueList');
				var len = divs.length;
				if (position > PlayerQueue.Click.lastClickedPosition){
					for (var i = PlayerQueue.Click.lastClickedPosition; i <= position; i++){
						PlayerQueue.Click.select(jQuery('#queue'+i), false);
					}
				} else {
					for (var i = position; i <= PlayerQueue.Click.lastClickedPosition; i++){
						PlayerQueue.Click.select(jQuery('#queue'+i), false);
					}
				}
			}
		} else {
			var unSelect = true;
			if (e.metaKey == true){
				unSelect = false;
			}
			if (jQuery(this).hasClass('listSelected')){
				if (unSelect == false){
					PlayerQueue.Click.removeSelect(this);
				} else {
					PlayerQueue.Click.select(this, unSelect);
				}
			} else {
				PlayerQueue.Click.select(this, unSelect);
			}
		}
		window.getSelection().removeAllRanges();
		PlayerQueue.Click.lastClickedPosition = position;
	},
	select : function(target, unSelect){
		if (unSelect == true){
			try {
				for (var i = 0; i < PlayerQueue.SelectedArray.length; i++){
					var div = PlayerQueue.SelectedArray[i];
					jQuery(div).removeClass('listSelected');
				}
			} catch(e){}
			PlayerQueue.SelectedArray = [];
		}
		PlayerQueue.Selected = target;
		jQuery(PlayerQueue.Selected).addClass('listSelected');
		if (jQuery.inArray(PlayerQueue.Selected, PlayerQueue.SelectedArray) == -1){
			PlayerQueue.SelectedArray.push(PlayerQueue.Selected);
		}
	},
	removeSelect : function(target){
		jQuery(target).removeClass('listSelected');
		var len = PlayerQueue.SelectedArray.length;
		for (var i = 0; i < len; i++){
			var div = PlayerQueue.SelectedArray[i];
			if (div == target){
				Utils.ArrayRemove(PlayerQueue.SelectedArray, i, i);
				break;
			}
		}
	},
}

PlayerQueue.dblclick = function(e){
	var queue = parseInt(jQuery(this).attr('queue'));
	PlayerMain.Background.BackgroundPlayer.Queue.play(queue);
	jQuery('#queueMiddle').scrollTop(0);
	e.preventDefault();
	return false;
}

PlayerQueue.ContextMenu = {
	selected : null,
	create : function(e){
		jQuery('.queueList').die('click', PlayerQueue.Click.go);
		var unSelect = true;
		if (jQuery(this).hasClass('listSelected') || e.metaKey == true){
			unSelect = false;
		}
		PlayerQueue.Click.select(this, unSelect);
		jQuery(window).bind("PlayerContextMenu.Destroy", PlayerQueue.ContextMenu.onDestroyed);
		var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
		var queue = jQuery(this).attr('queue');
		var buyClass = "contexMenuItemInactive";
		try {
			if (PlayerMain.Background.BackgroundPlayer.Queue.array[queue].amazonmp3link != ""){
				buyClass = "contextMenuItem contextMenuItemFlash contextMenuItemBuy";
			}
		} catch(e){}
		jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemPlay\" queue=\""+queue+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemDelete\" queue=\""+queue+"\">Delete</div><div class=\"contextMenuBreak\"></div><div class=\""+buyClass+"\" queue=\""+queue+"\">Buy</div><div class=\"contexMenuItemInactive\">Share</div><div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemClearQueue\">Clear Queue</div>");
		return false;
	},
	onDestroyed : function(e){
		jQuery(window).unbind("PlayerContextMenu.Destroy", PlayerQueue.ContextMenu.onDestroyed);
		jQuery('.queueList').live('click', PlayerQueue.Click.go);
	},
	play : {
		click : function(e){
			var queue = parseInt(jQuery(this).attr('queue'));
			jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerQueue.ContextMenu.play.select);
			
		},
		select : function(e){
			jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerQueue.ContextMenu.play.select);
			PlayerMain.Background.BackgroundPlayer.Queue.play(e.data); 
			PlayerContextMenu.Destroy();
		}
	},
	deleter : {
		click : function(e){
			var queue = parseInt(jQuery(this).attr('queue'));
			jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerQueue.ContextMenu.deleter.select);
			
		},
		select : function(e){
			jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerQueue.ContextMenu.deleter.select);
			var deleteArray = []; 
			for (var i = 0; i < PlayerQueue.SelectedArray.length; i++){
				var item = PlayerQueue.SelectedArray[i];
				jQuery(item).animate({'opacity' : 0}, 500, function(){
					jQuery(this).remove();
				})
				var queue = parseInt(jQuery(item).attr('queue'));
				deleteArray.push(queue);
			}
			deleteArray.sort(PlayerQueue.Utils.arraySortNumber);
			jQuery(window).unbind("BackgroundPlayer.onQueueChange", PlayerQueue.queueChange);
			for (var i = 0; i < deleteArray.length; i++){
				PlayerMain.Background.BackgroundPlayer.Queue.remove(deleteArray[i] - i); 
			}
			PlayerContextMenu.Destroy();
			jQuery(window).bind("BackgroundPlayer.onQueueChange", PlayerQueue.queueChange);
			setTimeout(PlayerQueue.queueChange, 800);
		}
	},
	buy : {
		click : function(e){
			var queue = parseInt(jQuery(this).attr('queue'));
			jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerQueue.ContextMenu.buy.select);
			
		},
		select : function(e){
			jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerQueue.ContextMenu.buy.select);
			var songVO = PlayerMain.Background.BackgroundPlayer.Queue.array[e.data];
			var buyLink = songVO.amazonmp3link.replace('%26tag%3Dws', '%26tag%3Dext0a-20');
			chrome.tabs.create({url: buyLink});
			PlayerContextMenu.Destroy();
		}
	},
}

PlayerQueue.select = function(){
	var len = PlayerMain.Background.BackgroundPlayer.Queue.array.length;
	if (len == 0){
		PlayerQueue.Empty();
	} else {
		if ((len -1) == PlayerMain.Background.BackgroundPlayer.QueueNumber && PlayerMain.Background.BackgroundPlayer.IsStopped == true){
			PlayerQueue.Empty();
		} else {
			PlayerQueue.html = "";
			var tf = true;
			var queueNumber = PlayerMain.Background.BackgroundPlayer.QueueNumber;
			for (var i = queueNumber; i < len; i++){
				if (tf == true){
					tf = false;
				} else {
					tf = true;
				}
				var songVO = PlayerMain.Background.BackgroundPlayer.Queue.array[i];
				if (songVO != undefined){
					PlayerQueue.html += "<div class=\"queueList songVOList "+tf+"\" id=\"queue"+i+"\" queue=\""+i+"\"><div class=\"coverArt\" style=\"background: "+Utils.GetCoverArt(songVO.smallimage, '75x75')+"\"></div><div class=\"title\">"+songVO.songtitle+"</div><div class=\"artist\">"+songVO.artist+"</div><div class=\"album\">"+songVO.album+"</div><span class=\"timeagoVia\"> via </span><a class=\"domain\" href=\""+songVO.href+"\" target=\"_blank\">"+songVO.domain+"</a><div class=\"clear\"></div></div>";
				}
			}
			jQuery('#queueMiddle').html(PlayerQueue.html);
			//var queueNumber = PlayerMain.Background.BackgroundPlayer.QueueNumber;
			if (PlayerMain.Background.BackgroundPlayer.IsStopped == false){
				jQuery('#queue'+queueNumber).addClass('songVOListSelected');
			}
			PlayerQueue.oldQueueNumber = jQuery('#queue'+queueNumber)[0];
		}
	}
}

PlayerQueue.Empty = function(){
	jQuery('#queueMiddle').html("<div class=\"sectionEmptyBox\"><div class=\"sectionEmptyBoxHeader\">Queue</div><div class=\"sectionEmptyBoxSubHeader\">Songs that are added to your Queue will appear here. Simply right-click on a song to add it from your library or double-click to listen right away.</div><div class=\"sectionEmptyBoxTextDouble sectionEmptyBoxTextDoubleRight\">Browse through our Site of the Day Archive and discover great music blogs to get you started.<a href=\"http://blog.extension.fm/tagged/siteoftheday\" target=\"_blank\" class=\"sectionEmptyBoxLink\">Site of the Day Archive</a></div><div class=\"sectionEmptyBoxTextDouble\">Head over to your library to browse your music and create your Queue.<div class=\"sectionEmptyBoxLink\" id=\"yourLibrary\">Your Library</div></div><div class=\"clear\"></div></div>");
	jQuery('#yourLibrary').bind('click', function(){
		PlayerUI.Top.tab.unSelect(PlayerUI.Top.tab.selected);
		PlayerUI.Top.tab.select(jQuery('#allSongsTab'), 'allSongs');
		PlayerUI.Middle.unSelect(PlayerUI.Middle.selected);
		PlayerUI.Middle.select(jQuery('#allSongsMiddle'));
	});
}

PlayerQueue.setQueueNumber = function(){
	PlayerQueue.removeQueueNumber();
	var queueNumber = PlayerMain.Background.BackgroundPlayer.QueueNumber;
	jQuery('#queue'+queueNumber).addClass('songVOListSelected');
	PlayerQueue.oldQueueNumber = jQuery('#queue'+queueNumber)[0];
}

PlayerQueue.queueStopped = function(){
	PlayerQueue.removeQueueNumber();
	jQuery('#queueMiddle').empty();
	PlayerQueue.Empty();
}

PlayerQueue.removeQueueNumber = function(){
	try {
		jQuery(PlayerQueue.oldQueueNumber).removeClass('songVOListSelected');
	} catch(e) {}
}

PlayerQueue.songChange = function(obj){
	/*PlayerQueue.setQueueNumber()
	var queueNumber = obj.queueNumber;
	var time = obj.time;
	if (time == undefined){
		time = 1000;
	}
	try {
		jQuery('#queueMiddle').scrollTo('#queue'+queueNumber, time);
	} catch(e){}*/
	PlayerQueue.select();
	//var queueNumber = PlayerMain.Background.BackgroundPlayer.QueueNumber;
	//jQuery('#queue'+queueNumber).addClass('songVOListSelected');
}


PlayerQueue.queueChange = function(obj){
	PlayerQueue.select();
}


/* ListPane handles list pane button toggle */
PlayerQueue.ListPane = {
	select : function(obj){
		if (obj.key == 'queue'){
			PlayerQueue.select();
			PlayerUI.ListPane.hide();
			PlayerUI.UserSection.hide();
		}
	}
}

PlayerQueue.ClearAll = {
	click : function(){
		jQuery(window).bind("PlayerContextMenu.Flash.complete", PlayerQueue.ClearAll.select);
	},
	select : function(obj){
		jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerQueue.ClearAll.select);
		PlayerMain.Background.BackgroundPlayer.Queue.clearAll(); 
		PlayerContextMenu.Destroy();
	}
}

PlayerQueue.Utils = {
	// Array Remove - By John Resig (MIT Licensed)
	arrayRemove : function(array, from, to) {
  		var rest = array.slice((to || from) + 1 || array.length);
  		array.length = from < 0 ? array.length + from : from;
  		return array.push.apply(array, rest);
	},
	arraySortNumber : function(a, b){
		return a - b;
	}
}

jQuery(window).bind("BackgroundPlayer.onSongChange", PlayerQueue.songChange);
jQuery(window).bind("BackgroundPlayer.onQueueChange", PlayerQueue.queueChange);
jQuery(window).bind("PlayerUI.Top.tab.select", PlayerQueue.ListPane.select);
jQuery('.queueList').live('dblclick', PlayerQueue.dblclick);
jQuery('.queueList').live('contextmenu', PlayerQueue.ContextMenu.create);
jQuery('.queueList').live('click', PlayerQueue.Click.go);
jQuery('.contextMenuItemClearQueue').live('click', PlayerQueue.ClearAll.click);
jQuery('.contextMenuItemPlay').live('click', PlayerQueue.ContextMenu.play.click);
jQuery('.contextMenuItemDelete').live('click', PlayerQueue.ContextMenu.deleter.click);
jQuery('.contextMenuItemBuy').live('click', PlayerQueue.ContextMenu.buy.click);
jQuery(window).bind("BackgroundPlayer.Transport.stop", PlayerQueue.queueStopped);