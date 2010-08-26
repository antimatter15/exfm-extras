/*
name: popup-pagesongs
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(PopupPageSongs) == 'undefined'){
	PopupPageSongs = {}
}

PopupPageSongs.Selected = null;
PopupPageSongs.SelectedArray = [];

PopupPageSongs.Click = {
	go : function(e){
		var unSelect = true;
		if (e.metaKey == true){
			unSelect = false;
		}
		PopupPageSongs.Click.select(this, unSelect);
	},
	select : function(target, unSelect){
		if (unSelect == true){
			try {
				for (var i = 0; i < PopupPageSongs.SelectedArray.length; i++){
					var div = PopupPageSongs.SelectedArray[i];
					jQuery(div).removeClass('listSelected');
				}
			} catch(e){}
			PopupPageSongs.SelectedArray = [];
		}
		PopupPageSongs.Selected = target;
		jQuery(PopupPageSongs.Selected).addClass('listSelected');
		if (jQuery.inArray(PopupPageSongs.Selected, PopupPageSongs.SelectedArray) == -1){
			PopupPageSongs.SelectedArray.push(PopupPageSongs.Selected);
		}
	}
}

PopupPageSongs.Dblclick = function(e){
	var position = parseInt(jQuery(this).attr('position'));
	Back.BackgroundMain.Log(position)
	var songVO = PopupMain.Songs.array[position];
	var queueNumber = Back.BackgroundPlayer.Queue.add(songVO);
	Back.BackgroundPlayer.Queue.play(queueNumber);
	var len = PopupMain.Songs.array.length;
	for (var i = position+1; i < len; i++){
		Back.BackgroundPlayer.Queue.add(PopupMain.Songs.array[i]);
	}
	e.preventDefault();
	return false;
}

PopupPageSongs.ContextMenu = {
	selected : null,
	create : function(e){
		jQuery('.songVOList').die('click', PopupPageSongs.Click.go);
		var unSelect = true;
		if (jQuery(this).hasClass('listSelected') || e.metaKey == true){
			unSelect = false;
		}
		PopupPageSongs.Click.select(this, unSelect);
		jQuery(window).bind("PlayerContextMenu.Destroy", PopupPageSongs.ContextMenu.onDestroyed);
		var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
		var position = jQuery(this).attr('position');
		jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemPlayPageSongs\" position=\""+position+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemQueuePageSongs\" position=\""+position+"\">Queue</div><div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemPlayAll\" position=\""+position+"\">Play All</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemQueueAll\" position=\""+position+"\">QueueAll</div>");
		return false;
	},
	onDestroyed : function(e){
		jQuery(window).unbind("PlayerContextMenu.Destroy", PopupPageSongs.ContextMenu.onDestroyed);
		jQuery('.songVOList').live('click', PopupPageSongs.Click.go);
	},
	play : {
		click : function(e){
			var position = parseInt(jQuery(this).attr('position'));
			jQuery(window).bind("PlayerContextMenu.Flash.complete", position, PopupPageSongs.ContextMenu.play.select);
			
		},
		select : function(e){
			jQuery(window).unbind("PlayerContextMenu.Flash.complete", PopupPageSongs.ContextMenu.play.select);
			var queueArray = []; 
			for (var i = 0; i < PopupPageSongs.SelectedArray.length; i++){
				var item = PopupPageSongs.SelectedArray[i];
				var position = parseInt(jQuery(item).attr('position'));
				queueArray.push(position);
			}
			queueArray.sort(PopupPageSongs.Utils.arraySortNumber);
			var songVO = PopupMain.Songs.array[queueArray[0]];
			var queueNumber = Back.BackgroundPlayer.Queue.add(songVO); 
			Back.BackgroundPlayer.Queue.play(queueNumber)
			for (var i = 1; i < queueArray.length; i++){
				var songVO = PopupMain.Songs.array[queueArray[i]];
				var queueNumber = Back.BackgroundPlayer.Queue.add(songVO); 
			}
			PlayerContextMenu.Destroy();
		}
	},
	queue : {
		click : function(e){
			var position = parseInt(jQuery(this).attr('position'));
			jQuery(window).bind("PlayerContextMenu.Flash.complete", position, PopupPageSongs.ContextMenu.queue.select);
			
		},
		select : function(e){
			jQuery(window).unbind("PlayerContextMenu.Flash.complete", PopupPageSongs.ContextMenu.queue.select);
			var queueArray = []; 
			for (var i = 0; i < PopupPageSongs.SelectedArray.length; i++){
				var item = PopupPageSongs.SelectedArray[i];
				var position = parseInt(jQuery(item).attr('position'));
				queueArray.push(position);
			}
			queueArray.sort(PopupPageSongs.Utils.arraySortNumber);
			var songVO = PopupMain.Songs.array[queueArray[0]];
			var queueNumber = Back.BackgroundPlayer.Queue.add(songVO); 
			for (var i = 1; i < queueArray.length; i++){
				var songVO = PopupMain.Songs.array[queueArray[i]];
				var queueNumber = Back.BackgroundPlayer.Queue.add(songVO); 
			}
			PlayerContextMenu.Destroy();
		}
	}
}

PopupPageSongs.Utils = {
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


//jQuery('.songVOList').live('dblclick', PopupPageSongs.Dblclick);
//jQuery('.songVOList').live('contextmenu', PopupPageSongs.ContextMenu.create);
//jQuery('.songVOList').live('click', PopupPageSongs.Click.go);
//jQuery('.contextMenuItemPlayPageSongs').live('click', PopupPageSongs.ContextMenu.play.click);
//jQuery('.contextMenuItemQueuePageSongs').live('click', PopupPageSongs.ContextMenu.queue.click);
