/*
name: player-allsongs
author: Dan Kantor
requires: jquery-1.3.2
*/


if (typeof(PlayerAllSongs) == 'undefined'){
	PlayerAllSongs = {}
}

PlayerAllSongs.PaneResized = false;

PlayerAllSongs.init = function(){
	PlayerAllSongs.ListPane.format = PlayerMain.Background.BackgroundStorage.get("PlayerAllSongs.ListPane.format");
	if (PlayerAllSongs.ListPane.format == null){
		PlayerAllSongs.ListPane.format = "pane";
	}
	PlayerAllSongs.pane.song.field.query = PlayerMain.Background.BackgroundStorage.get("PlayerAllSongs.pane.song.field.query");
	if (PlayerAllSongs.pane.song.field.query == null || PlayerAllSongs.pane.song.field.query == "title"){
		PlayerAllSongs.pane.song.field.query = "timestamp";
	}
	PlayerAllSongs.pane.song.field.sort = PlayerMain.Background.BackgroundStorage.get("PlayerAllSongs.pane.song.field.sort");
	if (PlayerAllSongs.pane.song.field.sort == null){
		PlayerAllSongs.pane.song.field.sort = "DESC";
	}
	var target = PlayerMain.Background.BackgroundStorage.get("PlayerAllSongs.pane.song.field.target");
	if (target == null || target == "songPaneFieldtitle"){
		target = "songPaneFieldtimestamp";
	}
	PlayerAllSongs.pane.song.field.target = target;
}

PlayerAllSongs.PaneResize = function(e){
	var percentage = PlayerMain.Background.BackgroundStorage.get("PlayerAllSongs.SongPaneTop.percentage");
	if (percentage == null){
		percentage = .5;
	}
	var y = Math.floor(jQuery('#allSongsPaneMiddle').height() * percentage);
	PlayerAllSongs.SongPaneTop.move(y, percentage);
	PlayerAllSongs.PaneResized = true;
}


/*****************************************************************
*
* All Songs List View
*
******************************************************************/
PlayerAllSongs.selectList = {
	html : "",
	songsArray : [],
	selectedArray : [],
	selected : null,
	lastClickedPosition : null,
	clearHTML : function(){
		if (PlayerSearch.AllSongs.value == null){
			PlayerAllSongs.selectList.html = "";	
		}
	},
	request : function(){
		jQuery('#allSongsPaneMiddle').addClass('hidden');
		jQuery('#allSongsListMiddle').removeClass('hidden');
		if (PlayerAllSongs.selectList.html == ""){
			PlayerAllSongs.selectList.getSongs(0);
		}
	},
	getSongs : function(page){
		jQuery(window).bind("Song.songsByTimestamp", PlayerAllSongs.selectList.response);
		PlayerMain.Background.BackgroundSQL.Songs.select.songsByTimestamp(page);
	},
 	response : function(obj){
 		jQuery(window).unbind("Song.songsByTimestamp", PlayerAllSongs.selectList.response);
 		var page = obj.page;
		var len = obj.results.length;
		PlayerAllSongs.selectList.html = "";
		var tf = false;
		var date;
		var dateString;
		var timeString;
		var oldDateString;
		var oldTimeString;
		var displayTimeString;
		for (var i = 0; i < len; i++){
			if (tf == true){
				tf = false;
			} else {
				tf = true;
			}
			var songVO = obj.results[i];
			date = new Date(songVO.timestamp);
			var iso = date.getFullYear()+'-'+Utils.FixMonth(date.getMonth())+'-'+date.getDate()+'T'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
			var attributes = "";
			for (var j in songVO){
				if (songVO[j] != null){
					attributes += " "+j+"=\""+escape(songVO[j])+"\"";
				}
			}
			PlayerAllSongs.selectList.html += "<div class=\"songVOList songVOListAllSongs "+tf+" largeVolumeButton"+songVO.domainkey+"\" "+attributes+" position=\""+i+"\"><time class=\"timeago\" datetime=\""+iso+"\">"+iso+"</time><div class=\"coverArt\" style=\"background: "+Utils.GetCoverArt(songVO.smallimage, '75x75')+"\"></div><div class=\"title\" title=\""+songVO.songtitle+"\">"+songVO.songtitle+"</div><div class=\"artist\">"+songVO.artist+"</div><div class=\"album\">"+songVO.album+"</div><span class=\"timeagoVia\"> via </span><a class=\"domain\" href=\""+songVO.href+"\" target=\"_blank\">"+songVO.domain+"</a><div class=\"clear\"></div></div>";
			oldDateString = dateString;
			oldTimeString = timeString;
		}
		PlayerAllSongs.selectList.html += "<div id=\"allSongsListPagination\" class=\"paginationDiv visibleNone\"><div id=\"allSongsListTotalSongs\"></div><div id=\"allSongsPaginationContainer\"></div></div>";
		jQuery('#allSongsListMiddle').html(PlayerAllSongs.selectList.html);
		jQuery('#allSongsListMiddle').scrollTop(0);
		jQuery("time.timeago").timeago();
		PlayerAllSongs.selectList.songsArray = obj.results;
		jQuery(window).bind("Song.countGroupBySongTitleArtist", {"page" : page}, PlayerAllSongs.selectList.totalSongs);
		PlayerMain.Background.BackgroundSQL.Songs.select.countGroupBySongTitleArtist(PlayerMain.Background.BackgroundSQL.Songs.currentTable);
		var obj = {songVO : PlayerMain.Background.BackgroundPlayer.CurrentSongVO}
		PlayerUI.SongChange.set(obj);
	},
	totalSongs : function(obj){
		jQuery(window).unbind("Song.countGroupBySongTitleArtist", PlayerAllSongs.selectList.totalSongs);
		var count = obj.results;
		var page = obj.data.page;
		jQuery('#allSongsListTotalSongs').text(count+" Songs");
		if (count > 50){
			jQuery("#allSongsPaginationContainer").pagination(count, {items_per_page : 50, callback : PlayerAllSongs.selectList.paginationClick, num_edge_entries : 1, num_display_entries : 5, current_page : page/50});
		} else {
			jQuery("#allSongsPaginationContainer").addClass('hidden');
		}
		var paginationTop = jQuery('#allSongsListPagination').offset().top;
		var bottomTop = jQuery('#bottom').offset().top;
		if (paginationTop+40 < bottomTop){
			jQuery('#allSongsListPagination').css('margin-top', bottomTop - paginationTop-52)
		}
		jQuery('#allSongsListPagination').removeClass('visibleNone');
	},
	paginationClick : function(page, el) {
        PlayerAllSongs.selectList.getSongs(page*50);
        return false;
    },
	click : function(e){
		var position = parseInt(jQuery(this).attr('position'))
		var songVO = PlayerAllSongs.selectList.songsArray[position];
		if (e.shiftKey == true){
			if (PlayerAllSongs.selectList.lastClickedPosition == null || jQuery(this).hasClass('listSelected')){
				PlayerAllSongs.selectList.select(this, true);
			} else {
				var divs = jQuery(this.parent).find('.songVOListAllSongs');
				var len = divs.length;
				if (position > PlayerAllSongs.selectList.lastClickedPosition){
					for (var i = PlayerAllSongs.selectList.lastClickedPosition; i <= position; i++){
						PlayerAllSongs.selectList.select(divs[i], false);
					}
				} else {
					for (var i = position; i <= PlayerAllSongs.selectList.lastClickedPosition; i++){
						PlayerAllSongs.selectList.select(divs[i], false);
					}
				}
			}
		} else {
			var unSelect = true;
			if (e.shiftKey == true){
			} else {
				if (e.metaKey == true){
					unSelect = false;
				}
				if (jQuery(this).hasClass('listSelected')){
					if (unSelect == false){
						PlayerAllSongs.selectList.removeSelect(this);
					} else {
						PlayerAllSongs.selectList.select(this, unSelect);
					}
				} else {
					PlayerAllSongs.selectList.select(this, unSelect);
				}
			}
		}
		window.getSelection().removeAllRanges();
		PlayerAllSongs.selectList.lastClickedPosition = position;
	},	
	dblclick : function(e){
		var position = parseInt(jQuery(this).attr('position'))
		var songVO = PlayerAllSongs.selectList.songsArray[position];
		var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO);
		PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber);
		var len = PlayerAllSongs.selectList.songsArray.length;
		for (var i = position+1; i < len; i++){
			PlayerMain.Background.BackgroundPlayer.Queue.add(PlayerAllSongs.selectList.songsArray[i]);
		}
		e.preventDefault();
		return false;
	},
	select : function(target, unSelect){
		if (unSelect == true){
			try {
				for (var i = 0; i < PlayerAllSongs.selectList.selectedArray.length; i++){
					var div = PlayerAllSongs.selectList.selectedArray[i];
					jQuery(div).removeClass('listSelected');
				}
			} catch(e){}
			PlayerAllSongs.selectList.selectedArray = [];
		}
		PlayerAllSongs.selectList.selected = target;
		jQuery(PlayerAllSongs.selectList.selected).addClass('listSelected');
		if (jQuery.inArray(PlayerAllSongs.selectList.selected, PlayerAllSongs.selectList.selectedArray) == -1){
			PlayerAllSongs.selectList.selectedArray.push(PlayerAllSongs.selectList.selected);
		}
	},
	removeSelect : function(target){
		jQuery(target).removeClass('listSelected');
		var len = PlayerAllSongs.selectList.selectedArray.length;
		for (var i = 0; i < len; i++){
			var div = PlayerAllSongs.selectList.selectedArray[i];
			if (div == target){
				Utils.ArrayRemove(PlayerAllSongs.selectList.selectedArray, i, i);
				break;
			}
		}
	},
	contextMenu : {
		selected : null,
		create : function(e){
			jQuery('.songVOListAllSongs').die('click', PlayerAllSongs.selectList.click);
			var unSelect = true;
			if (jQuery(this).hasClass('listSelected') || e.metaKey == true){
				unSelect = false;
			}
			PlayerAllSongs.selectList.select(this, unSelect);
			jQuery(window).bind("PlayerContextMenu.Destroy", PlayerAllSongs.selectList.contextMenu.onDestroyed);
			var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
			var position = jQuery(this).attr('position');
			var buyClass = "contexMenuItemInactive";
			if (PlayerAllSongs.selectList.songsArray[position].amazonmp3link != ""){
				buyClass = "contextMenuItem contextMenuItemFlash contextMenuItemAllSongsListBuy";
			}
			jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAllSongsListPlay\" position=\""+position+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAllSongsListQueue\" position=\""+position+"\">Queue</div><div class=\"contextMenuBreak\"></div><div class=\""+buyClass+"\" position=\""+position+"\">Buy</div><div class=\"contexMenuItemInactive\">Share</div>");
			return false;
		},
		onDestroyed : function(e){
			jQuery(window).unbind("PlayerContextMenu.Destroy", PlayerAllSongs.selectList.contextMenu.onDestroyed);
			jQuery('.songVOListAllSongs').live('click', PlayerAllSongs.selectList.click);
		},
		play : {
			click : function(e){
				var position = parseInt(jQuery(this).attr('position'));
				jQuery(window).bind("PlayerContextMenu.Flash.complete", position, PlayerAllSongs.selectList.contextMenu.play.select);
			},
			select : function(e){
				jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.selectList.contextMenu.play.select);
				var queueArray = []; 
				for (var i = 0; i < PlayerAllSongs.selectList.selectedArray.length; i++){
					var item = PlayerAllSongs.selectList.selectedArray[i];
					var position = parseInt(jQuery(item).attr('position'));
					queueArray.push(position);
				}
				queueArray.sort(PlayerQueue.Utils.arraySortNumber);
				var songVO = PlayerAllSongs.selectList.songsArray[queueArray[0]];
				var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
				PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber)
				for (var i = 1; i < queueArray.length; i++){
					var songVO = PlayerAllSongs.selectList.songsArray[queueArray[i]];
					var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
				}
				PlayerContextMenu.Destroy();
			}
		},
		queue : {
			click : function(e){
				var position = parseInt(jQuery(this).attr('position'));
				jQuery(window).bind("PlayerContextMenu.Flash.complete", position, PlayerAllSongs.selectList.contextMenu.queue.select);
			},
			select : function(e){
				jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.selectList.contextMenu.queue.select);
				var queueArray = []; 
				for (var i = 0; i < PlayerAllSongs.selectList.selectedArray.length; i++){
					var item = PlayerAllSongs.selectList.selectedArray[i];
					var position = parseInt(jQuery(item).attr('position'));
					queueArray.push(position);
				}
				queueArray.sort(PlayerQueue.Utils.arraySortNumber);
				for (var i = 0; i < queueArray.length; i++){
					var songVO = PlayerAllSongs.selectList.songsArray[queueArray[i]];
					var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
				}
				PlayerContextMenu.Destroy();
			}
		},
		buy : {
			click : function(e){
				var position = parseInt(jQuery(this).attr('position'));
				jQuery(window).bind("PlayerContextMenu.Flash.complete", position, PlayerAllSongs.selectList.contextMenu.buy.select);
			},
			select : function(e){
				jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.selectList.contextMenu.buy.select);
				var songVO = PlayerAllSongs.selectList.songsArray[e.data];
				var buyLink = songVO.amazonmp3link.replace('%26tag%3Dws', '%26tag%3Dext0a-20');
				chrome.tabs.create({url: buyLink});
				PlayerContextMenu.Destroy();
			}
		}
	},
	pagination : {
		click : function(e){
				var page = parseInt(jQuery(this).attr('page'));
				PlayerAllSongs.selectList.getSongs(page);
		}
	}
}
	

/*****************************************************************
*
* All Songs Pane View (selecting)
*
******************************************************************/
PlayerAllSongs.selectPane = {
	html : "",
	clearHTML : function(){
		PlayerAllSongs.selectPane.html = "";
	},
	refreshDomain : function(e){
		if (PlayerSearch.AllSongs.value == null){
			jQuery(window).bind("BrowseHistory.domainsFromSongs", PlayerAllSongs.selectPane.response.domain);
			PlayerMain.Background.BackgroundMain.BrowseHistory.selectDomains.request();	
		}
	},
	request : function(){
		jQuery('#allSongsListMiddle').addClass('hidden');
		jQuery('#allSongsPaneMiddle').removeClass('hidden');
		if (PlayerAllSongs.selectPane.html == ""){
			jQuery('#allSongsPaneMiddle').html(PlayerAllSongs.selectPane.grid);
			
			
			jQuery(window).bind("BrowseHistory.domainsFromSongs", PlayerAllSongs.selectPane.response.domain);
			PlayerMain.Background.BackgroundMain.BrowseHistory.selectDomains.request();	
			
			
			jQuery(window).bind("BrowseHistory.artistsFromSongs", PlayerAllSongs.selectPane.response.artist);
			PlayerMain.Background.BackgroundMain.BrowseHistory.selectArtists.request();	
			jQuery(window).bind("BrowseHistory.albumsFromSongs", PlayerAllSongs.selectPane.response.album);
			PlayerMain.Background.BackgroundMain.BrowseHistory.selectAlbums.request();	
			jQuery(window).bind("BrowseHistory.songsFromSongs", PlayerAllSongs.selectPane.response.song);
			PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongs(PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
			jQuery('#allSongsSongPaneTop').bind('mousedown', PlayerAllSongs.SongPaneTop.mouseDown);
			jQuery('#allSongsSongPaneTop').bind('mouseup', PlayerAllSongs.SongPaneTop.mouseUp);
		} 
		try {
			var s = jQuery('#songPaneMiddleScrollAllSongs').scrollTop();
			jQuery('#songPaneMiddleAllSongs').css('top', s);
		} catch (e) {}
	},
	response : {
		domain : function(obj){
			jQuery(window).unbind("BrowseHistory.domainsFromSongs", PlayerAllSongs.selectPane.response.domain);
			PlayerAllSongs.pane.domain.requested = null;
			var len = obj.results.length;
			if (len > 0){
				var html = "<div class=\"libraryPaneTop\">Sites</div><div class=\"libraryPaneBottom\" id=\"browseHistoryDomains\">";
				var tf = false;
				html += "<div class=\"songVOPane allSongsDomainAll paneHalfSelected "+tf+"\">All ("+len+" "+PlayerUI.Utils.pluralize(len, 'Site')+")</div>";
				for (var i = 0; i < len; i++){
					var item = obj.results[i];
					if (item.domain != ''){
						html += "<div class=\"songVOPane allSongsDomain "+tf+"\" domain=\""+escape(item.domain)+"\" id=\"allSongsDomain"+escape(item.domain.replace(/\./g, ''))+"\">"+item.domain+"</div>";
					}
				}
				jQuery('#browseHistoryDomainPane').html(html);
				obj = null;
			}
		},
		artist : function(obj){
			jQuery(window).unbind("BrowseHistory.artistsFromSongs", PlayerAllSongs.selectPane.response.artist);
			jQuery(window).unbind("BrowseHistory.artistsFromSongsByDomain", PlayerAllSongs.selectPane.response.artist);
			PlayerAllSongs.pane.artist.requested = null;
			var len = obj.results.length;
			var html = "<div class=\"libraryPaneTop\">Artists</div><div class=\"libraryPaneBottom\" id=\"browseHistoryArtists\">";
			if (len > 0){
				var tf = false;
				var domain = "";
				if (obj.results[0].domain != undefined){
					domain = "domain=\""+escape(obj.results[0].domain)+"\"";
				}
				html += "<div class=\"songVOPane allSongsArtistAll paneHalfSelected "+tf+"\" "+domain+">All ("+len+" "+PlayerUI.Utils.pluralize(len, 'Artist')+")</div>";
				for (var i = 0; i < len; i++){
					var item = obj.results[i];
					var domain = "";
					if (item.domain){
						domain = "domain=\""+escape(item.domain)+"\"";
					}
					if (item.artist != ''){
						html += "<div class=\"songVOPane allSongsArtist "+tf+"\" artist=\""+escape(item.artist)+"\" "+domain+">"+item.artist+"</div>";
					}
				}
				
			}
			html += "</div>";
			jQuery('#browseHistoryArtistPane').html(html);
			obj = null;
		},
		album : function(obj){
			jQuery(window).unbind("BrowseHistory.albumsFromSongs", PlayerAllSongs.selectPane.response.album);
			jQuery(window).unbind("BrowseHistory.albumsFromSongsByDomain", PlayerAllSongs.selectPane.response.album);
			jQuery(window).unbind("BrowseHistory.albumsFromSongsByArtistAndDomain", PlayerAllSongs.selectPane.response.album);
			jQuery(window).unbind("BrowseHistory.albumsFromSongsByArtist", PlayerAllSongs.selectPane.response.album);
			PlayerAllSongs.pane.album.requested = null;
			var len = obj.results.length;
			var html = "<div class=\"libraryPaneTop\">Albums</div><div class=\"libraryPaneBottom\" id=\"browseHistoryAlbums\">";
			if (len > 0){
				var tf = false;
				var domain = "";
				if (obj.results[0].domain != undefined){
					domain = "domain=\""+escape(obj.results[0].domain)+"\"";
				}
				var artist = "";
				if (obj.results[0].artist != undefined){
					artist = "artist=\""+escape(obj.results[0].artist)+"\"";
				}
				html += "<div class=\"songVOPane allSongsAlbumAll paneHalfSelected "+tf+"\" "+domain+" "+artist+">All ("+len+" "+PlayerUI.Utils.pluralize(len, 'Album')+")</div>";
				for (var i = 0; i < len; i++){
					var item = obj.results[i];
					var domain = "";
					if (item.domain){
						domain = "domain=\""+escape(item.domain)+"\"";
					}
					var artist = "";
					if (item.artist){
						artist = "artist=\""+escape(item.artist)+"\"";
					}
					if (item.album != ''){
						html += "<div class=\"songVOPane allSongsAlbum "+tf+"\" album=\""+escape(item.album)+"\" "+domain+" "+artist+">"+item.album+"</div>";
					}
				}
			}
			html += "</div>";
			jQuery('#browseHistoryAlbumPane').html(html);
			obj = null;
		},
		song : function(obj){
			jQuery(window).unbind("BrowseHistory.songsFromSongs", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.songsFromSongsByDomain", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.albumsFromSongsByArtist", PlayerAllSongs.selectPane.response.album);
			jQuery(window).unbind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndDomain", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbum", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndArtist", PlayerAllSongs.selectPane.response.song);
			jQuery(window).unbind("BrowseHistory.songsFromSongsLast", PlayerAllSongs.selectPane.response.song);
			var len = obj.results.length;
			var html = "<div id=\"songPaneMiddleAllSongs\" class=\"songPaneMiddle\"><div class=\"songPanePlayButton\"></div><div class=\"songPaneName\" id=\"songPaneFieldsongtitle\">Name</div><div class=\"songPaneArtist\" id=\"songPaneFieldartist\">Artist</div><div class=\"songPaneAlbum\" id=\"songPaneFieldalbum\">Album</div><div class=\"songPaneSite\" id=\"songPaneFielddomain\">Site</div><div class=\"songPanePlayCount\" id=\"songPaneFieldplays\">Play Count</div><div class=\"songPaneErrorLoad\" id=\"songPaneFielderrorload\">Load Fail</div><div class=\"songPaneAdded\" id=\"songPaneFieldtimestamp\">Added</div></div><div class=\"songPaneBottom\" id=\"browseHistorySongs\">";
			var tf = false;
			for (var i = 0; i < len; i++){
				tf = !tf;
				var item = obj.results[i];
				var attributes = "";
				for (var j in item){
					if (item[j] != null && j != 'id'){
						attributes += " "+j+"=\""+escape(item[j])+"\"";
					}
				}
				var date = new Date(item.timestamp);
				var dateString = date.getMonth()+1+'/'+date.getDate()+'/'+date.getFullYear().toString().substr(2)+' '+PlayerUI.Utils.to12Hour(date.getHours())+':'+PlayerUI.Utils.fixZeroes(date.getMinutes())+' '+PlayerUI.Utils.ampm(date.getHours());
				html += "<div class=\"songVOPane allSongsSong "+tf+"\" "+attributes+" position=\""+i+"\" id=\"allSongsSong"+item.domainkey+"\"><div class=\"songPanePlayButton smallVolumeButton"+item.domainkey+" "+tf+"\"></div><div class=\"songPaneName "+tf+"\">"+item.songtitle+"</div><div class=\"songPaneArtist "+tf+"\">"+item.artist+"</div><div class=\"songPaneAlbum "+tf+"\">"+item.album+"</div><div class=\"songPaneSite "+tf+"\"><a class=\"songPaneLink "+tf+"\" href=\""+item.href+"\" target=\"_blank\">"+item.domain+"</a></div><div class=\"songPanePlayCount "+tf+"\">"+item.plays+"</div><div class=\"songPaneErrorLoad "+tf+"\">"+item.errorload+"</div><div class=\"songPaneAdded "+tf+"\">"+dateString+"</div></div>";
				//<div class=\"songPaneStarred "+tf+"\"></div>
			}
			html += "</div>";
			//jQuery('#browseHistorySongs').remove();
			jQuery('#songPaneMiddleScrollAllSongs').html(html);
			if (PlayerAllSongs.pane.song.field.sort == 'ASC'){
				jQuery('#'+PlayerAllSongs.pane.song.field.target).addClass('songPaneSelectedUp');
			} else {
				jQuery('#'+PlayerAllSongs.pane.song.field.target).addClass('songPaneSelectedDown');
			}
			
			PlayerAllSongs.selectPane.html = jQuery('#allSongsPaneMiddle').html();
			PlayerAllSongs.pane.song.array = obj.results;
			//PlayerUI.SongChange.select();
			if (PlayerAllSongs.PaneResized == false){
				PlayerAllSongs.PaneResize();
			}
			jQuery('#songPaneMiddleScrollAllSongs').bind('scroll', function(e){
				var s = jQuery('#songPaneMiddleScrollAllSongs').scrollTop();
				jQuery('#songPaneMiddleAllSongs').css('top', s);
			})
			PlayerAllSongs.pane.song.lastClickedPosition = null;
			var obj = {songVO : PlayerMain.Background.BackgroundPlayer.CurrentSongVO}
			PlayerUI.SongChange.set(obj);
			obj = null;
		}
	},
	grid : "<div class=\"topPane\" id=\"allSongsTopPane\"><div class=\"domainPane\" id=\"browseHistoryDomainPane\"><div class=\"libraryPaneTop\">Sites</div><div class=\"libraryPaneBottom\" id=\"browseHistoryDomains\"></div></div><div class=\"artistPane\" id=\"browseHistoryArtistPane\"><div class=\"libraryPaneTop\">Artists</div><div class=\"libraryPaneBottom\" id=\"browseHistoryArtists\"></div></div><div class=\"albumPane\" id=\"browseHistoryAlbumPane\"><div class=\"libraryPaneTop\">Albums</div><div class=\"libraryPaneBottom\" id=\"browseHistoryAlbums\"></div></div></div><div class=\"songPane\" id=\"allSongsSongPane\"><div class=\"songPaneTop\" id=\"allSongsSongPaneTop\"></div><div id=\"songPaneMiddleScrollAllSongs\" class=\"songPaneMiddleScroll\"><div id=\"songPaneMiddleAllSongs\" class=\"songPaneMiddle\"><div class=\"songPanePlayButton\"></div><div class=\"songPaneName\" id=\"songPaneFieldsongtitle\">Name</div><div class=\"songPaneArtist\" id=\"songPaneFieldartist\">Artist</div><div class=\"songPaneAlbum\" id=\"songPaneFieldalbum\">Album</div><div class=\"songPaneSite\" id=\"songPaneFielddomain\">Site</div><div class=\"songPanePlayCount\" id=\"songPaneFieldplays\">Play Count</div><div class=\"songPaneErrorLoad\" id=\"songPaneFielderrorload\">Load Fail</div><div class=\"songPaneAdded\" id=\"songPaneFieldtimestamp\">Added</div></div><div class=\"songPaneBottom\" id=\"browseHistorySongs\"></div></div></div>"
	//<div class=\"songPaneStarred\" id=\"songPaneFieldstarred\">Starred</div>
}
	


/*****************************************************************
*
* All Songs Pane View
*
******************************************************************/
PlayerAllSongs.pane = {
	domain : {
		selected : null,
		requested : null,
		click : function(e){
			PlayerAllSongs.pane.domain.unSelect();
			jQuery('.allSongsDomainAll').removeClass('paneHalfSelected');
			PlayerAllSongs.pane.domain.selected = jQuery(this);
			PlayerAllSongs.pane.domain.select();
			PlayerAllSongs.pane.domain.request(jQuery(this).attr('domain'))
		},
		unSelect : function(){
			try {
				jQuery(PlayerAllSongs.pane.domain.selected).removeClass('paneSelected');
				jQuery(PlayerAllSongs.pane.domain.selected).removeClass('paneHalfSelected');
			} catch (e){}
		},
		select : function(){
			jQuery(PlayerAllSongs.pane.domain.selected).addClass('paneSelected');
		},
		halfSelect : function(){
			try {
				jQuery(PlayerAllSongs.pane.domain.selected).addClass('paneHalfSelected');
			} catch (e){}
		},
		request : function(domain){
			PlayerAllSongs.pane.domain.requested = domain;
			domain = unescape(domain);
			if (PlayerSearch.AllSongs.value != null){
				PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomain(domain, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
			} else {
				jQuery(window).bind("BrowseHistory.artistsFromSongsByDomain", PlayerAllSongs.selectPane.response.artist);
				PlayerMain.Background.BackgroundSQL.BrowseHistory.select.artistsFromSongsByDomain(domain);
				jQuery(window).bind("BrowseHistory.albumsFromSongsByDomain", PlayerAllSongs.selectPane.response.album);
				PlayerMain.Background.BackgroundMain.BrowseHistory.selectAlbumsByDomain.request(domain);
				jQuery(window).bind("BrowseHistory.songsFromSongsByDomain", PlayerAllSongs.selectPane.response.song);
				PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByDomain(domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
			}
		},
		all : function(e){
			PlayerAllSongs.pane.domain.requested = null;
			PlayerAllSongs.pane.domain.unSelect();
			PlayerAllSongs.pane.domain.selected = jQuery(this);
			PlayerAllSongs.pane.domain.select();
			jQuery('.allSongsDomainAll').removeClass('paneSelected');
			jQuery('.allSongsDomainAll').addClass('paneHalfSelected');
			if (PlayerSearch.AllSongs.value != null){
				PlayerMain.Background.BackgroundSQL.Songs.select.searchLike(PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
			} else {
				jQuery(window).bind("BrowseHistory.artistsFromSongs", PlayerAllSongs.selectPane.response.artist);
				PlayerMain.Background.BackgroundMain.BrowseHistory.selectArtists.request();	
				jQuery(window).bind("BrowseHistory.albumsFromSongs", PlayerAllSongs.selectPane.response.album);
				PlayerMain.Background.BackgroundMain.BrowseHistory.selectAlbums.request();	
				jQuery(window).bind("BrowseHistory.songsFromSongs", PlayerAllSongs.selectPane.response.song);
				PlayerMain.Background.BackgroundMain.BrowseHistory.selectSongs.request(PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
			}
		},
		contextMenu : {
			selected : null,
			create : function(e){
				jQuery('.allSongsDomain').die('click', PlayerAllSongs.pane.domain.click);
				jQuery(PlayerAllSongs.pane.domain.contextMenu.selected).removeClass('paneClickSelected');
				jQuery(this).addClass('paneClickSelected');
				jQuery(window).bind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.domain.contextMenu.onDestroyed);
				var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
				var domain = jQuery(this).attr('domain');
				jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemDomainPlay\" domain=\""+domain+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemDomainQueue\" domain=\""+domain+"\">Queue</div><div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemDomainAutoUpdate paneContextMenuCheckbox\" id=\"contextMenuItemDomainAutoUpdateCheckBox\" domain=\""+domain+"\" checked=\"true\">Auto-Update</div><div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemDomainDelete\" domain=\""+domain+"\">Delete</div>");
				PlayerAllSongs.pane.domain.contextMenu.selected = this;
				jQuery(window).bind("Site.selectAutoUpdate", PlayerAllSongs.pane.domain.contextMenu.autoUpdate.set);
				PlayerMain.Background.BackgroundSQL.Sites.selectAutoUpdate(domain);
				return false;
			},
			onDestroyed : function(){
				jQuery(window).unbind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.domain.contextMenu.onDestroyed);
				jQuery('.allSongsDomain').live('click', PlayerAllSongs.pane.domain.click);
				jQuery(PlayerAllSongs.pane.domain.contextMenu.selected).removeClass('paneClickSelected');
			},
			autoUpdate : {
				click : function(e){
					var domain = unescape(jQuery(this).attr('domain'));
					var checked = jQuery('#contextMenuItemDomainAutoUpdateCheckBox').attr('checked');
					if (checked == 'true'){
						jQuery(window).bind("PlayerContextMenu.Flash.complete", domain, PlayerAllSongs.pane.domain.contextMenu.autoUpdate.disable);
					} else {
						jQuery(window).bind("PlayerContextMenu.Flash.complete", domain, PlayerAllSongs.pane.domain.contextMenu.autoUpdate.enable, domain);
					}
				},
				enable : function(obj){	
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.domain.contextMenu.autoUpdate.enable);
					jQuery('#contextMenuItemDomainAutoUpdateCheckBox').removeClass('paneContextMenuCheckboxUnChecked');
					jQuery('#contextMenuItemDomainAutoUpdateCheckBox').attr('checked', 'true');
					PlayerMain.Background.BackgroundSQL.Sites.updateAutoUpdate(1, obj.data);
				},
				disable : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.domain.contextMenu.autoUpdate.disable);
					jQuery('#contextMenuItemDomainAutoUpdateCheckBox').addClass('paneContextMenuCheckboxUnChecked');
					jQuery('#contextMenuItemDomainAutoUpdateCheckBox').attr('checked', 'false');
					PlayerMain.Background.BackgroundSQL.Sites.updateAutoUpdate(0, obj.data);
				},
				set : function(obj){
					jQuery(window).unbind("Site.selectAutoUpdate", PlayerAllSongs.pane.domain.contextMenu.autoUpdate.set);
					var autoUpdate = obj.results[0].autoupdate;
					if (autoUpdate == 0){
						jQuery('#contextMenuItemDomainAutoUpdateCheckBox').addClass('paneContextMenuCheckboxUnChecked');
						jQuery('#contextMenuItemDomainAutoUpdateCheckBox').attr('checked', 'false');
					}
				}
			},
			deleter : {
				click : function(e){
					var domain = unescape(jQuery(this).attr('domain'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", domain, PlayerAllSongs.pane.domain.contextMenu.deleter.confirm);
				},
				confirm : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.domain.contextMenu.deleter.confirm);
					PlayerContextMenu.Destroy();
					if (window.confirm("Are you sure you want to delete this site and all of its songs from your library?")){
						jQuery(window).bind("Site.deleteSite", PlayerAllSongs.pane.domain.contextMenu.deleter.done);
						PlayerMain.Background.BackgroundSQL.Sites.deleteSite(obj.data);
						jQuery(window).bind("Song.deleteSongsByDomain", PlayerAllSongs.pane.domain.contextMenu.deleter.doneSongs);
						PlayerMain.Background.BackgroundSQL.Songs.deleteSongsByDomain(obj.data);
					}
				},
				done : function(obj){
					jQuery(window).unbind("Site.deleteSite", PlayerAllSongs.pane.domain.contextMenu.deleter.done);
					jQuery('#allSongsDomain'+escape(obj.domain.replace(/\./g, ''))).animate({'opacity' : 0}, 500, function(){ jQuery(this).remove();});
				},
				doneSongs : function(obj){
					jQuery(window).unbind("Song.deleteSongsByDomain", PlayerAllSongs.pane.domain.contextMenu.deleter.doneSongs);
					if (obj.success == true){
						PlayerAllSongs.selectPane.clearHTML();
						setTimeout(PlayerAllSongs.selectPane.request, 1000);
					}
				}
			},
			play : {
				click : function(e){
					var domain = unescape(jQuery(this).attr('domain'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", domain, PlayerAllSongs.pane.domain.contextMenu.play.request);
				},
				request : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.domain.contextMenu.play.request);
					PlayerContextMenu.Destroy();
					jQuery(window).bind("Song.songsByDomain", PlayerAllSongs.pane.domain.contextMenu.play.response);
					PlayerMain.Background.BackgroundSQL.Songs.select.songsByDomain(obj.data, 'timestamp', 'DESC');
				},
				response : function(obj){
					jQuery(window).unbind("Song.songsByDomain", PlayerAllSongs.pane.domain.contextMenu.play.response);
					var len = obj.results.length;
					if (len > 0){
						var songVO = obj.results[0];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
						PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber)
						for (var i = 1; i < len; i++){
							var songVO = obj.results[i];
							var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
						}
					}
				}
			},
			queue : {
				click : function(e){
					var domain = unescape(jQuery(this).attr('domain'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", domain, PlayerAllSongs.pane.domain.contextMenu.queue.request);
				},
				request : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.domain.contextMenu.queue.request);
					PlayerContextMenu.Destroy();
					jQuery(window).bind("Song.songsByDomain", PlayerAllSongs.pane.domain.contextMenu.queue.response);
					PlayerMain.Background.BackgroundSQL.Songs.select.songsByDomain(obj.data, 'timestamp', 'DESC');
				},
				response : function(obj){
					jQuery(window).unbind("Song.songsByDomain", PlayerAllSongs.pane.domain.contextMenu.queue.response);
					var len = obj.results.length;
					for (var i = 0; i < len; i++){
						var songVO = obj.results[i];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
					}
				}
			}
		}
	},
	artist : {
		selected : null,
		requested : null,
		click : function(e){
			PlayerAllSongs.pane.artist.unSelect();
			jQuery('.allSongsArtistAll').removeClass('paneHalfSelected');
			PlayerAllSongs.pane.artist.selected = jQuery(this);
			PlayerAllSongs.pane.artist.select();
			var domain = jQuery(this).attr('domain');
			if (PlayerAllSongs.pane.domain.requested){
				PlayerAllSongs.pane.domain.halfSelect();
			}
			PlayerAllSongs.pane.artist.request(jQuery(this).attr('artist'), domain);
		},
		unSelect : function(){
			try {
				jQuery(PlayerAllSongs.pane.artist.selected).removeClass('paneSelected');
				jQuery(PlayerAllSongs.pane.artist.selected).removeClass('paneHalfSelected');
			} catch (e){}
		},
		select : function(){
			jQuery(PlayerAllSongs.pane.artist.selected).addClass('paneSelected');
		},
		halfSelect : function(){
			try {
				jQuery(PlayerAllSongs.pane.artist.selected).addClass('paneHalfSelected');
			} catch (e){}
		},
		request : function(artist, domain){
			PlayerAllSongs.pane.artist.requested = artist;
			artist = unescape(artist);
			if (PlayerAllSongs.pane.domain.requested){
				domain = unescape(PlayerAllSongs.pane.domain.requested);
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomainAndArtist(domain, artist, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.albumsFromSongsByArtistAndDomain", PlayerAllSongs.selectPane.response.album);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.albumsFromSongsByArtistAndDomain(artist, domain);
					jQuery(window).bind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtistAndDomain(artist, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			} else {
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithArtist(artist, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.albumsFromSongsByArtist", PlayerAllSongs.selectPane.response.album);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.albumsFromSongsByArtist(artist);
					jQuery(window).bind("BrowseHistory.songsFromSongsByArtist", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtist(artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
		},
		all : function(e){
			PlayerAllSongs.pane.artist.requested = null;
			PlayerAllSongs.pane.artist.unSelect();
			PlayerAllSongs.pane.artist.selected = jQuery(this);
			PlayerAllSongs.pane.artist.select();
			jQuery('.allSongsArtistAll').removeClass('paneSelected');
			jQuery('.allSongsArtistAll').addClass('paneHalfSelected');
			var domain = PlayerAllSongs.pane.domain.requested;
			if (domain != undefined){
				domain = unescape(domain);
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomain(domain, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					domain = unescape(domain);
					jQuery(window).bind("BrowseHistory.albumsFromSongsByDomain", PlayerAllSongs.selectPane.response.album);
					PlayerMain.Background.BackgroundMain.BrowseHistory.selectAlbumsByDomain.request(domain);
					jQuery(window).bind("BrowseHistory.songsFromSongsByDomain", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByDomain(domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			} else {
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLike(PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.albumsFromSongs", PlayerAllSongs.selectPane.response.album);
					PlayerMain.Background.BackgroundMain.BrowseHistory.selectAlbums.request();	
					jQuery(window).bind("BrowseHistory.songsFromSongs", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundMain.BrowseHistory.selectSongs.request(PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
		},
		contextMenu : {
			selected : null,
			create : function(e){
				jQuery('.allSongsArtist').die('click', PlayerAllSongs.pane.artist.click);
				jQuery(PlayerAllSongs.pane.artist.contextMenu.selected).removeClass('paneClickSelected');
				jQuery(this).addClass('paneClickSelected');
				jQuery(window).bind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.artist.contextMenu.onDestroyed);
				var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
				var artist = jQuery(this).attr('artist');
				var domain = jQuery(this).attr('domain');
				jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemArtistPlay\" artist=\""+artist+"\" domain=\""+domain+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemArtistQueue\" artist=\""+artist+"\" domain=\""+domain+"\">Queue</div>");
				PlayerAllSongs.pane.artist.contextMenu.selected = this;
				return false;
			},
			onDestroyed : function(){
				jQuery(window).unbind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.artist.contextMenu.onDestroyed);
				jQuery('.allSongsArtist').live('click', PlayerAllSongs.pane.artist.click);
				jQuery(PlayerAllSongs.pane.artist.contextMenu.selected).removeClass('paneClickSelected');
			},
			play : {
				click : function(e){
					var domain = jQuery(this).attr('domain');
					var artist = jQuery(this).attr('artist');
					jQuery(window).bind("PlayerContextMenu.Flash.complete", {"domain" : domain, "artist" : artist}, PlayerAllSongs.pane.artist.contextMenu.play.request);
				},
				request : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.artist.contextMenu.play.request);
					PlayerContextMenu.Destroy();
					var artist = unescape(obj.data.artist);
					if (obj.data.domain != "undefined"){
						var domain = unescape(obj.data.domain);
						jQuery(window).bind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.pane.artist.contextMenu.play.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtistAndDomain(artist, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					} else {
						jQuery(window).bind("BrowseHistory.songsFromSongsByArtist", PlayerAllSongs.pane.artist.contextMenu.play.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtist(artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
				},
				response : function(obj){
					jQuery(window).unbind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.pane.artist.contextMenu.play.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByArtist", PlayerAllSongs.pane.artist.contextMenu.play.response);
					var len = obj.results.length;
					if (len > 0){
						var songVO = obj.results[0];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
						PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber)
						for (var i = 1; i < len; i++){
							var songVO = obj.results[i];
							var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
						}
					}
				}
			},
			queue : {
				click : function(e){
					var domain = jQuery(this).attr('domain');
					var artist = jQuery(this).attr('artist');
					jQuery(window).bind("PlayerContextMenu.Flash.complete", {"domain" : domain, "artist" : artist}, PlayerAllSongs.pane.artist.contextMenu.queue.request);
				},
				request : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.artist.contextMenu.queue.request);
					PlayerContextMenu.Destroy();
					var artist = unescape(obj.data.artist);
					if (obj.data.domain != "undefined"){
						var domain = unescape(obj.data.domain);
						jQuery(window).bind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.pane.artist.contextMenu.queue.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtistAndDomain(artist, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					} else {
						jQuery(window).bind("BrowseHistory.songsFromSongsByArtist", PlayerAllSongs.pane.artist.contextMenu.queue.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtist(artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
				},
				response : function(obj){
					jQuery(window).unbind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.pane.artist.contextMenu.queue.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByArtist", PlayerAllSongs.pane.artist.contextMenu.queue.response);
					var len = obj.results.length;
					for (var i = 0; i < len; i++){
						var songVO = obj.results[i];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
					}
				}
			}
		}
	},
	album : {
		selected : null,
		requested : null,
		click : function(e){
			PlayerAllSongs.pane.album.unSelect();
			jQuery('.allSongsAlbumAll').removeClass('paneHalfSelected');
			PlayerAllSongs.pane.album.selected = jQuery(this);
			PlayerAllSongs.pane.album.select();
			var domain = jQuery(this).attr('domain');
			if (PlayerAllSongs.pane.domain.requested){
				PlayerAllSongs.pane.domain.halfSelect();
			}
			var artist = jQuery(this).attr('artist');
			if (PlayerAllSongs.pane.artist.requested){
				PlayerAllSongs.pane.artist.halfSelect();
			}
			PlayerAllSongs.pane.album.request(jQuery(this).attr('album'), domain, artist);
		},
		unSelect : function(){
			try {
				jQuery(PlayerAllSongs.pane.album.selected).removeClass('paneSelected');
				jQuery(PlayerAllSongs.pane.album.selected).removeClass('paneHalfSelected');
			} catch (e){}
		},
		select : function(){
			jQuery(PlayerAllSongs.pane.album.selected).addClass('paneSelected');
		},
		halfSelect : function(){
			try {
				jQuery(PlayerAllSongs.pane.album.selected).addClass('paneHalfSelected');
			} catch (e){}
		},
		request : function(album, domain, artist){
			PlayerAllSongs.pane.album.requested = album;
			album = unescape(album);
			if (PlayerAllSongs.pane.domain.requested){
				domain = unescape(PlayerAllSongs.pane.domain.requested);
			}
			if (PlayerAllSongs.pane.artist.requested){
				artist = unescape(PlayerAllSongs.pane.artist.requested);
			}
			if (domain && artist == undefined){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomainAndAlbum(domain, album, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndDomain", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndDomain(album, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
			if (domain && artist){
				if (PlayerSearch.AllSongs.value != null){ 
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomainAndArtistAndAlbum(domain, artist, album, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndDomainAndArtist(album, domain, artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
			if (domain == undefined && artist == undefined){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithAlbum(album, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByAlbum", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbum(album, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
			if (domain == undefined && artist){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithArtistAndAlbum(artist, album, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndArtist", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndArtist(album, artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
		},
		all : function(e){
			PlayerAllSongs.pane.album.requested = null;
			PlayerAllSongs.pane.album.unSelect();
			PlayerAllSongs.pane.album.selected = jQuery(this);
			PlayerAllSongs.pane.album.select();
			jQuery('.allSongsAlbumAll').removeClass('paneSelected');
			jQuery('.allSongsAlbumAll').addClass('paneHalfSelected');
			var domain = PlayerAllSongs.pane.domain.requested;
			var artist = PlayerAllSongs.pane.artist.requested;
			if (domain != undefined){
				domain = unescape(domain);
			}
			if (artist != undefined){
				artist = unescape(artist);
			}
			if (domain && artist == undefined){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomain(domain, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByDomain", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByDomain(domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
			if (domain && artist){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithDomainAndArtist(domain, artist, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByArtistAndDomain", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtistAndDomain(artist, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
			if (domain == undefined && artist == undefined){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLike(PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongs", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundMain.BrowseHistory.selectSongs.request(PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
			if (domain == undefined && artist){
				if (PlayerSearch.AllSongs.value != null){
					PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeWithArtist(artist, PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				} else {
					jQuery(window).bind("BrowseHistory.songsFromSongsByArtist", PlayerAllSongs.selectPane.response.song);
					PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByArtist(artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				}
			}
		},
		contextMenu : {
			selected : null,
			create : function(e){
				jQuery('.allSongsAlbum').die('click', PlayerAllSongs.pane.album.click);
				jQuery(PlayerAllSongs.pane.album.contextMenu.selected).removeClass('paneClickSelected');
				jQuery(this).addClass('paneClickSelected');
				jQuery(window).bind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.album.contextMenu.onDestroyed);
				var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
				var album = jQuery(this).attr('album');
				var artist = jQuery(this).attr('artist');
				var domain = jQuery(this).attr('domain');
				jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAlbumPlay\" album=\""+album+"\" artist=\""+artist+"\" domain=\""+domain+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAlbumQueue\" album=\""+album+"\" artist=\""+artist+"\" domain=\""+domain+"\">Queue</div>");
				PlayerAllSongs.pane.album.contextMenu.selected = this;
				return false;
			},
			onDestroyed : function(){
				jQuery(window).unbind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.album.contextMenu.onDestroyed);
				jQuery('.allSongsAlbum').live('click', PlayerAllSongs.pane.album.click);
				jQuery(PlayerAllSongs.pane.album.contextMenu.selected).removeClass('paneClickSelected');
			},
			play : {
				click : function(e){
					var domain = jQuery(this).attr('domain');
					var artist = jQuery(this).attr('artist');
					var album = jQuery(this).attr('album');
					jQuery(window).bind("PlayerContextMenu.Flash.complete", {"domain" : domain, "artist" : artist, "album" : album}, PlayerAllSongs.pane.album.contextMenu.play.request);
				},
				request : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.album.contextMenu.play.request);
					PlayerContextMenu.Destroy();
					var album = unescape(obj.data.album);
					var domain = obj.data.domain;
					var artist = obj.data.artist;
					if (domain != "undefined"){
						domain = unescape(domain);
					}
					if (artist != "undefined"){
						artist = unescape(artist);
					}
					if (domain != "undefined" && artist == "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndDomain", PlayerAllSongs.pane.album.contextMenu.play.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndDomain(album, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
					if (domain != "undefined" && artist != "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist", PlayerAllSongs.pane.album.contextMenu.play.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndDomainAndArtist(album, domain, artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
					if (domain == "undefined" && artist == "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbum", PlayerAllSongs.pane.album.contextMenu.play.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbum(album, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
					if (domain == "undefined" && artist != "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndArtist", PlayerAllSongs.pane.album.contextMenu.play.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndArtist(album, artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
				},
				response : function(obj){
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndDomain", PlayerAllSongs.pane.album.contextMenu.play.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist", PlayerAllSongs.pane.album.contextMenu.play.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbum", PlayerAllSongs.pane.album.contextMenu.play.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndArtist", PlayerAllSongs.pane.album.contextMenu.play.response);
					var len = obj.results.length;
					if (len > 0){
						var songVO = obj.results[0];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
						PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber)
						for (var i = 1; i < len; i++){
							var songVO = obj.results[i];
							var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
						}
					}
				}
			},
			queue : {
				click : function(e){
					var domain = jQuery(this).attr('domain');
					var artist = jQuery(this).attr('artist');
					var album = jQuery(this).attr('album');
					jQuery(window).bind("PlayerContextMenu.Flash.complete", {"domain" : domain, "artist" : artist, "album" : album}, PlayerAllSongs.pane.album.contextMenu.queue.request);
				},
				request : function(obj){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.album.contextMenu.queue.request);
					PlayerContextMenu.Destroy();
					var album = unescape(obj.data.album);
					var domain = obj.data.domain;
					var artist = obj.data.artist;
					if (domain != "undefined"){
						domain = unescape(domain);
					}
					if (artist != "undefined"){
						artist = unescape(artist);
					}
					if (domain != "undefined" && artist == "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndDomain", PlayerAllSongs.pane.album.contextMenu.queue.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndDomain(album, domain, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
					if (domain != "undefined" && artist != "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist", PlayerAllSongs.pane.album.contextMenu.queue.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndDomainAndArtist(album, domain, artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
					if (domain == "undefined" && artist == "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbum", PlayerAllSongs.pane.album.contextMenu.queue.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbum(album, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
					if (domain == "undefined" && artist != "undefined"){
						jQuery(window).bind("BrowseHistory.songsFromSongsByAlbumAndArtist", PlayerAllSongs.pane.album.contextMenu.queue.response);
						PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsByAlbumAndArtist(album, artist, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
					}
				},
				response : function(obj){
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndDomain", PlayerAllSongs.pane.album.contextMenu.queue.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist", PlayerAllSongs.pane.album.contextMenu.queue.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbum", PlayerAllSongs.pane.album.contextMenu.queue.response);
					jQuery(window).unbind("BrowseHistory.songsFromSongsByAlbumAndArtist", PlayerAllSongs.pane.album.contextMenu.queue.response);
					var len = obj.results.length;
					for (var i = 0; i < len; i++){
						var songVO = obj.results[i];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
					}
				}
			}
		}
	},
	song : {
		array : [],
		selected : null,
		selectedArray : [],
		lastClickedPosition : null,
		click : function(e){
			var position = parseInt(jQuery(this).attr('position'));
			var songVO = PlayerAllSongs.pane.song.array[position];
			if (e.shiftKey == true){
				if (PlayerAllSongs.pane.song.lastClickedPosition == null || jQuery(this).hasClass('paneClickSelected')){
					PlayerAllSongs.pane.song.select(this, true);
				} else {
					var divs = jQuery(this.parent).find('.allSongsSong');
					var len = divs.length;
					if (position > PlayerAllSongs.pane.song.lastClickedPosition){
						for (var i = PlayerAllSongs.pane.song.lastClickedPosition; i <= position; i++){
							PlayerAllSongs.pane.song.select(divs[i], false);
							jQuery(divs[i]).blur();
						}
					} else {
						for (var i = position; i <= PlayerAllSongs.pane.song.lastClickedPosition; i++){
							PlayerAllSongs.pane.song.select(divs[i], false);
						}
					}
				}
			} else {
				var unSelect = true;
				if (e.metaKey == true){
					unSelect = false;
				}
				//e.shiftKey;
				if (jQuery(this).hasClass('paneClickSelected')){
					if (unSelect == false){
						PlayerAllSongs.pane.song.removeSelect(this);
					} else {
						PlayerAllSongs.pane.song.select(this, unSelect);
					}
				} else {
					PlayerAllSongs.pane.song.select(this, unSelect);
				}
			}
			window.getSelection().removeAllRanges();
			PlayerAllSongs.pane.song.lastClickedPosition = position;
		},
		dblclick : function(e){
			var position = parseInt(jQuery(this).attr('position'))
			var songVO = PlayerAllSongs.pane.song.array[position];
			var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO);
			PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber);
			var len = PlayerAllSongs.pane.song.array.length;
			for (var i = position+1; i < len; i++){
				PlayerMain.Background.BackgroundPlayer.Queue.add(PlayerAllSongs.pane.song.array[i]);
			}
			e.preventDefault();
			return false;
		},
		select : function(target, unSelect){
			if (unSelect == true){
				try {
					for (var i = 0; i < PlayerAllSongs.pane.song.selectedArray.length; i++){
						var div = PlayerAllSongs.pane.song.selectedArray[i];
						jQuery(div).removeClass('paneClickSelected');
					}
				} catch(e){}
				PlayerAllSongs.pane.song.selectedArray = [];
			}
			PlayerAllSongs.pane.song.selected = target;
			jQuery(PlayerAllSongs.pane.song.selected).addClass('paneClickSelected');
			if (jQuery.inArray(PlayerAllSongs.pane.song.selected, PlayerAllSongs.pane.song.selectedArray) == -1){
				PlayerAllSongs.pane.song.selectedArray.push(PlayerAllSongs.pane.song.selected);
			}
		},
		removeSelect : function(target){
			jQuery(target).removeClass('paneClickSelected');
			var len = PlayerAllSongs.pane.song.selectedArray.length;
			for (var i = 0; i < len; i++){
				var div = PlayerAllSongs.pane.song.selectedArray[i];
				if (div == target){
					Utils.ArrayRemove(PlayerAllSongs.pane.song.selectedArray, i, i);
					break;
				}
			}
		},
		field : {
			target : null,
			query : 'domain',
			sort : 'ASC',
			click : function(e){
				PlayerAllSongs.pane.song.field.select(this, jQuery(this).attr('id'));
			},
			select : function(target, field){
				if (target == null){
					target = jQuery('#songPaneFieldtimestamp')[0];
				}
				if (field == null){
					field = 'songPaneFieldtimestamp';
				}
				try {
					jQuery('#'+PlayerAllSongs.pane.song.field.target).removeClass('songPaneSelectedUp');
					jQuery('#'+PlayerAllSongs.pane.song.field.target).removeClass('songPaneSelectedDown');
				} catch(e){}
				var sort = "ASC";
				if (field == PlayerAllSongs.pane.song.field.target){
					if (PlayerAllSongs.pane.song.field.sort == "ASC"){
						sort = "DESC";
						PlayerAllSongs.pane.song.field.sort = "DESC";
						jQuery('#'+PlayerAllSongs.pane.song.field.target).addClass('songPaneSelectedDown');
					} else {
						sort = "ASC";
						PlayerAllSongs.pane.song.field.sort = "ASC";
						jQuery('#'+PlayerAllSongs.pane.song.field.target).addClass('songPaneSelectedUp');	
					}
				} else {
					PlayerAllSongs.pane.song.field.sort = "ASC";
					jQuery(target).addClass('songPaneSelectedUp');
				}
				var split = field.split('songPaneField');
				PlayerAllSongs.pane.song.field.query = split[1];
				PlayerMain.Background.BackgroundStorage.set("PlayerAllSongs.pane.song.field.query", PlayerAllSongs.pane.song.field.query);
				PlayerAllSongs.pane.song.field.target = field;
				jQuery(window).bind("BrowseHistory.songsFromSongsLast", PlayerAllSongs.selectPane.response.song);
				PlayerMain.Background.BackgroundSQL.BrowseHistory.select.songsFromSongsLast(PlayerAllSongs.pane.song.field.query, sort);
				PlayerMain.Background.BackgroundStorage.set("PlayerAllSongs.pane.song.field.target", field);
				PlayerMain.Background.BackgroundStorage.set("PlayerAllSongs.pane.song.field.sort", sort);
			}
		},
		contextMenu : {
			selected : null,
			create : function(e){
				jQuery('.allSongsSong').die('click', PlayerAllSongs.pane.song.click);
				var unSelect = true;
				if (jQuery(this).hasClass('paneClickSelected') || e.metaKey == true){
					unSelect = false;
				}
				PlayerAllSongs.pane.song.select(this, unSelect);
				jQuery(window).bind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.song.contextMenu.onDestroyed);
				var contextMenu = PlayerContextMenu.Create(e.clientX, e.clientY, this.parentNode); 
				var queue = jQuery(this).attr('position');
				var buyClass = "contexMenuItemInactive";
				if (PlayerAllSongs.pane.song.array[queue].amazonmp3link != ""){
					buyClass = "contextMenuItem contextMenuItemFlash contextMenuItemAllSongsBuy";
				}
				jQuery(contextMenu).prepend("<div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAllSongsPlay\" queue=\""+queue+"\">Play</div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAllSongsQueue\" queue=\""+queue+"\">Queue</div><div class=\"contextMenuBreak\"></div><div class=\""+buyClass+"\" queue=\""+queue+"\">Buy</div><div class=\"contexMenuItemInactive\">Share</div><div class=\"contextMenuBreak\"></div><div class=\"contextMenuItem contextMenuItemFlash contextMenuItemAllSongsDelete\" queue=\""+queue+"\">Delete</div>");
				return false;
			},
			onDestroyed : function(e){
				jQuery(window).unbind("PlayerContextMenu.Destroy", PlayerAllSongs.pane.song.contextMenu.onDestroyed);
				jQuery('.allSongsSong').live('click', PlayerAllSongs.pane.song.click);
			},
			play : {
				click : function(e){
					var queue = parseInt(jQuery(this).attr('queue'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerAllSongs.pane.song.contextMenu.play.select);
				},
				select : function(e){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.song.contextMenu.play.select);
					var queueArray = []; 
					for (var i = 0; i < PlayerAllSongs.pane.song.selectedArray.length; i++){
						var item = PlayerAllSongs.pane.song.selectedArray[i];
						var position = parseInt(jQuery(item).attr('position'));
						queueArray.push(position);
					}
					queueArray.sort(PlayerQueue.Utils.arraySortNumber);
					var songVO = PlayerAllSongs.pane.song.array[queueArray[0]];
					var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
					PlayerMain.Background.BackgroundPlayer.Queue.play(queueNumber)
					for (var i = 1; i < queueArray.length; i++){
						var songVO = PlayerAllSongs.pane.song.array[queueArray[i]];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
					}
					PlayerContextMenu.Destroy();
				}
			},
			queue : {
				click : function(e){
					var queue = parseInt(jQuery(this).attr('queue'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerAllSongs.pane.song.contextMenu.queue.select);
				},
				select : function(e){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.song.contextMenu.queue.select);
					var queueArray = []; 
					for (var i = 0; i < PlayerAllSongs.pane.song.selectedArray.length; i++){
						var item = PlayerAllSongs.pane.song.selectedArray[i];
						var position = parseInt(jQuery(item).attr('position'));
						queueArray.push(position);
					}
					queueArray.sort(PlayerQueue.Utils.arraySortNumber);
					for (var i = 0; i < queueArray.length; i++){
						var songVO = PlayerAllSongs.pane.song.array[queueArray[i]];
						var queueNumber = PlayerMain.Background.BackgroundPlayer.Queue.add(songVO); 
					}
					PlayerContextMenu.Destroy();
				}
			},
			buy : {
				click : function(e){
					var queue = parseInt(jQuery(this).attr('queue'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerAllSongs.pane.song.contextMenu.buy.select);
				},
				select : function(e){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.song.contextMenu.buy.select);
					var songVO = PlayerAllSongs.pane.song.array[e.data];
					var buyLink = songVO.amazonmp3link.replace('%26tag%3Dws', '%26tag%3Dext0a-20');
					chrome.tabs.create({url: buyLink});
					PlayerContextMenu.Destroy();
				}
			},
			deleter : {
				click : function(e){
					var queue = parseInt(jQuery(this).attr('queue'));
					jQuery(window).bind("PlayerContextMenu.Flash.complete", queue, PlayerAllSongs.pane.song.contextMenu.deleter.select);
				},
				select : function(e){
					jQuery(window).unbind("PlayerContextMenu.Flash.complete", PlayerAllSongs.pane.song.contextMenu.deleter.select);
					var queueArray = []; 
					for (var i = 0; i < PlayerAllSongs.pane.song.selectedArray.length; i++){
						var item = PlayerAllSongs.pane.song.selectedArray[i];
						var position = parseInt(jQuery(item).attr('position'));
						queueArray.push(position);
					}
					queueArray.sort(PlayerQueue.Utils.arraySortNumber);
					var domainKeyArray = [];
					for (var i = 0; i < queueArray.length; i++){
						var songVO = PlayerAllSongs.pane.song.array[queueArray[i]];
						domainKeyArray.push(songVO.domainkey);
					}
					PlayerContextMenu.Destroy();
					var plural = "song";
					if (domainKeyArray.length > 1){
						plural = "songs";
					}
					if (window.confirm("Are you sure you want to delete the selected "+plural+" from your library?")){
						jQuery(window).bind("Song.deleteSongMulti", PlayerAllSongs.pane.song.contextMenu.deleter.event);
						PlayerMain.Background.BackgroundSQL.Songs.deleteSongMulti(domainKeyArray);
					}
				},
				event : function(e){
					jQuery(window).unbind("Song.deleteSongMulti", PlayerAllSongs.pane.song.contextMenu.deleter.event);
					if (e.success == true){
						for (var i = 0; i < e.domainkeyArray.length; i++){
							var row = jQuery('#allSongsSong'+e.domainkeyArray[i]);
							jQuery(row).animate({'opacity' : 0}, 500, function(){ jQuery(this).remove(); });
						}
					}
				}
			}
		}
	}
}

/* ListPane handles list pane button toggle */
PlayerAllSongs.ListPane = {
	format : "list",
	select : function(obj){
		if (obj.key == 'allSongs'){
			PlayerUI.UserSection.hide();
			PlayerUI.ListPane.show();
			jQuery('#listButton').bind("click", PlayerAllSongs.ListPane.list);
			jQuery('#paneButton').bind("click", PlayerAllSongs.ListPane.pane);
			if (PlayerAllSongs.ListPane.format == "list"){
				PlayerAllSongs.ListPane.list();
			}
			if (PlayerAllSongs.ListPane.format == "pane"){
				PlayerAllSongs.ListPane.pane();
			}
		}
	},
	unSelect : function(){
		jQuery('#listButton').unbind("click", PlayerAllSongs.ListPane.list);
		jQuery('#paneButton').unbind("click", PlayerAllSongs.ListPane.pane);
	},
	list : function(){
		PlayerUI.ListPane.list.select();
		PlayerAllSongs.selectList.request();
		PlayerAllSongs.ListPane.format = "list";
		PlayerMain.Background.BackgroundStorage.set("PlayerAllSongs.ListPane.format", PlayerAllSongs.ListPane.format);
		PlayerMain.Background.BackgroundEvents.Trigger({"type" : "PlayerAllSongs.ListPane", "view" : "list", "key" : "allSongs"});
	},
	pane : function(){
		PlayerUI.ListPane.pane.select();
		PlayerAllSongs.selectPane.request();
		PlayerAllSongs.ListPane.format = "pane";
		PlayerMain.Background.BackgroundStorage.set("PlayerAllSongs.ListPane.format", PlayerAllSongs.ListPane.format);
		PlayerMain.Background.BackgroundEvents.Trigger({"type" : "PlayerAllSongs.ListPane", "view" : "pane", "key" : "allSongs"});
	}
}

PlayerAllSongs.ExternalArtistUrl = {
	hypem : function(artist){
		var a = artist.toLowerCase();
		var array = a.split(' ');
		var newArist = array.join('+');
		return "http://hypem.com/artist/"+newArist;
	}
}

PlayerAllSongs.SongPaneTop = {
	percentage : 50,
	mouseDown : function(e){
		jQuery(document).bind('mousemove', PlayerAllSongs.SongPaneTop.mouseMove);
		jQuery(document).bind('mouseup', PlayerAllSongs.SongPaneTop.mouseUp);
		e.preventDefault();
	},
	mouseUp : function(e){
		jQuery(document).unbind('mousemove', PlayerAllSongs.SongPaneTop.mouseMove);
		jQuery(document).unbind('mouseup', PlayerAllSongs.SongPaneTop.mouseUp);
		PlayerMain.Background.BackgroundStorage.set("PlayerAllSongs.SongPaneTop.percentage", PlayerAllSongs.SongPaneTop.percentage);
	},
	mouseMove : function(e){
		var y = e.clientY - 30;
		var percentage = y / jQuery('#allSongsPaneMiddle').height();
		PlayerAllSongs.SongPaneTop.move(y, percentage);
	},
	move : function(y, percentage){
		if (percentage > .1 && percentage < .9){
			try {
				jQuery('#allSongsSongPane').css('top', y);
				jQuery('#allSongsTopPane').css('height', y);
				PlayerAllSongs.SongPaneTop.percentage = percentage;
			} catch (e){}
		}
	}
}

PlayerAllSongs.init();

//jQuery(window).bind("Song.insert", PlayerAllSongs.selectList.clearHTML);
//jQuery(window).bind("Song.insertSync", PlayerAllSongs.selectList.clearHTML);

jQuery(window).bind("Sites.refresh", PlayerAllSongs.selectList.clearHTML);
jQuery(window).bind("Sites.refresh", PlayerAllSongs.selectPane.refreshDomain);

jQuery(window).bind("Site.unDeleteSite", function(){ PlayerAllSongs.selectPane.clearHTML();
setTimeout(PlayerAllSongs.selectPane.request, 500); });



jQuery(window).bind("PlayerUI.Top.tab.select", PlayerAllSongs.ListPane.select);
jQuery(window).bind("PlayerUI.Top.tab.unSelect", PlayerAllSongs.ListPane.unSelect);
jQuery('.songPaneMiddle div').live('click', PlayerAllSongs.pane.song.field.click);
jQuery('.allSongsDomain').live('click', PlayerAllSongs.pane.domain.click);
jQuery('.allSongsDomain').live('contextmenu', PlayerAllSongs.pane.domain.contextMenu.create);
jQuery('.allSongsArtist').live('click', PlayerAllSongs.pane.artist.click);
jQuery('.allSongsAlbum').live('click', PlayerAllSongs.pane.album.click);
jQuery('.allSongsSong').live('click', PlayerAllSongs.pane.song.click);
jQuery('.allSongsSong').live('dblclick', PlayerAllSongs.pane.song.dblclick);
jQuery('.allSongsSong').live('contextmenu', PlayerAllSongs.pane.song.contextMenu.create);
jQuery('.contextMenuItemAllSongsPlay').live('click', PlayerAllSongs.pane.song.contextMenu.play.click);
jQuery('.contextMenuItemAllSongsQueue').live('click', PlayerAllSongs.pane.song.contextMenu.queue.click);
jQuery('.contextMenuItemAllSongsBuy').live('click', PlayerAllSongs.pane.song.contextMenu.buy.click);
jQuery('.contextMenuItemAllSongsDelete').live('click', PlayerAllSongs.pane.song.contextMenu.deleter.click);
jQuery('.allSongsDomainAll').live('click', PlayerAllSongs.pane.domain.all);
jQuery('.allSongsArtistAll').live('click', PlayerAllSongs.pane.artist.all);
jQuery('.allSongsAlbumAll').live('click', PlayerAllSongs.pane.album.all);
jQuery('.songVOListAllSongs').live('dblclick', PlayerAllSongs.selectList.dblclick);
jQuery('.songVOListAllSongs').live('contextmenu', PlayerAllSongs.selectList.contextMenu.create);
jQuery('.songVOListAllSongs').live('click', PlayerAllSongs.selectList.click);
jQuery('.contextMenuItemAllSongsListPlay').live('click', PlayerAllSongs.selectList.contextMenu.play.click);
jQuery('.contextMenuItemAllSongsListQueue').live('click', PlayerAllSongs.selectList.contextMenu.queue.click);
jQuery('.contextMenuItemAllSongsListBuy').live('click', PlayerAllSongs.selectList.contextMenu.buy.click);
//jQuery('.playerAllSongsListPagination').live('click', PlayerAllSongs.selectList.pagination.click);
jQuery('.contextMenuItemDomainAutoUpdate').live('click', PlayerAllSongs.pane.domain.contextMenu.autoUpdate.click);
jQuery('.contextMenuItemDomainDelete').live('click', PlayerAllSongs.pane.domain.contextMenu.deleter.click);
jQuery('.contextMenuItemDomainPlay').live('click', PlayerAllSongs.pane.domain.contextMenu.play.click);
jQuery('.contextMenuItemDomainQueue').live('click', PlayerAllSongs.pane.domain.contextMenu.queue.click);
jQuery('.allSongsArtist').live('contextmenu', PlayerAllSongs.pane.artist.contextMenu.create);
jQuery('.contextMenuItemArtistPlay').live('click', PlayerAllSongs.pane.artist.contextMenu.play.click);
jQuery('.contextMenuItemArtistQueue').live('click', PlayerAllSongs.pane.artist.contextMenu.queue.click);
jQuery('.allSongsAlbum').live('contextmenu', PlayerAllSongs.pane.album.contextMenu.create);
jQuery('.contextMenuItemAlbumPlay').live('click', PlayerAllSongs.pane.album.contextMenu.play.click);
jQuery('.contextMenuItemAlbumQueue').live('click', PlayerAllSongs.pane.album.contextMenu.queue.click);