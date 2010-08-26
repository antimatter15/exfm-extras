/*
name: player-search
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(PlayerSearch) == 'undefined'){
	PlayerSearch = {}
}




PlayerSearch.Init = function(e){
}

PlayerSearch.Display = function(obj){
	PlayerSearch.Unbind();
	if (obj.key == 'allSongs'){
		jQuery('#searchDiv').removeClass('hidden');
		if (PlayerAllSongs.ListPane.format == "list"){
			jQuery('#searchInput').bind('keyup', PlayerSearch.AllSongs.list.keyup);
			jQuery('#searchCancel').bind('click', PlayerSearch.AllSongs.list.cancel);
			if (PlayerSearch.AllSongs.value != null){
				PlayerSearch.AllSongs.list.request(0, false);
			} else {
				PlayerSearch.AllSongs.list.cancel();
			}
		}
		if (PlayerAllSongs.ListPane.format == "pane"){
			jQuery('#searchInput').bind('keyup', PlayerSearch.AllSongs.pane.keyup);
			jQuery('#searchCancel').bind('click', PlayerSearch.AllSongs.pane.cancel);
			if (PlayerSearch.AllSongs.value != null){
				PlayerSearch.AllSongs.pane.request();
			} else {
				PlayerSearch.AllSongs.pane.cancel();
			}
		}
	}
}

PlayerSearch.Unbind = function(){
	jQuery('#searchInput').unbind('keyup', PlayerSearch.AllSongs.pane.keyup);
	jQuery('#searchCancel').unbind('click', PlayerSearch.AllSongs.pane.cancel);
	jQuery('#searchInput').unbind('keyup', PlayerSearch.AllSongs.list.keyup);
	jQuery('#searchCancel').unbind('click', PlayerSearch.AllSongs.list.cancel);
	jQuery('#searchDiv').addClass('hidden');
}

PlayerSearch.AllSongs = {
	value : null,
	list : {
		lastSearched : null,
		keyup : function(e){
			var value = jQuery('#searchInput').attr('value');
			if (value == ""){
				PlayerSearch.AllSongs.list.cancel(e);
			} else {
				jQuery('#searchCancel').css('visibility', 'visible');
				PlayerSearch.AllSongs.value = value;
				PlayerSearch.AllSongs.list.request(0, false);
			}
		},
		request : function(page, force){
			if (PlayerSearch.AllSongs.value != PlayerSearch.AllSongs.list.lastSearched || force == true){
				PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeLimit(PlayerSearch.AllSongs.value, page);
				PlayerSearch.AllSongs.list.lastSearched = PlayerSearch.AllSongs.value;
			}
		},
		cancel : function(e){
			if (PlayerSearch.AllSongs.list.lastSearched != null){
				jQuery('#searchCancel').css('visibility', 'hidden');
				jQuery('#searchInput').attr('value', '');
				PlayerSearch.AllSongs.value = null;
				PlayerAllSongs.selectList.clearHTML();
				PlayerAllSongs.selectList.request();
				if (e != null){
					jQuery('#searchInput').focus();
				}
				PlayerSearch.AllSongs.list.lastSearched = null;
			}
		},
		response : function(obj){
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
				tf = !tf;
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
			jQuery(window).bind("Song.searchLikeCount", {"page" : page}, PlayerSearch.AllSongs.list.totalSongs);
			PlayerMain.Background.BackgroundSQL.Songs.select.searchLikeCount(PlayerSearch.AllSongs.value);
			var obj = {songVO : PlayerMain.Background.BackgroundPlayer.CurrentSongVO}
			PlayerUI.SongChange.set(obj);
		},
		totalSongs : function(obj){
			jQuery(window).unbind("Song.searchLikeCount", {"page" : page}, PlayerSearch.AllSongs.list.totalSongs);
			var count = obj.count;
			var page = obj.data.page;
			jQuery('#allSongsListTotalSongs').text(count+" Songs");
			if (count > 50){
				jQuery("#allSongsPaginationContainer").pagination(count, {items_per_page : 50, callback : PlayerSearch.AllSongs.list.paginationClick, num_edge_entries : 1, num_display_entries : 5, current_page : page/50});
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
        	PlayerSearch.AllSongs.list.request(page*50, true);
       	 	return false;
   	 	},
	},
	pane : {
		lastSearched : null,
		keyup : function(e){
			var value = jQuery('#searchInput').attr('value');
			if (value == ""){
				PlayerSearch.AllSongs.pane.cancel(e);
			} else {
				jQuery('#searchCancel').css('visibility', 'visible');
				PlayerSearch.AllSongs.value = value;
				PlayerSearch.AllSongs.pane.request();
			}
		},
		request : function(){
			if (PlayerSearch.AllSongs.value != PlayerSearch.AllSongs.pane.lastSearched){
				PlayerMain.Background.BackgroundSQL.Songs.select.searchLike(PlayerSearch.AllSongs.value, PlayerAllSongs.pane.song.field.query+' '+PlayerAllSongs.pane.song.field.sort);
				PlayerSearch.AllSongs.pane.lastSearched = PlayerSearch.AllSongs.value;
			}
		},
		cancel : function(e){
			if (PlayerSearch.AllSongs.pane.lastSearched != null){
				jQuery('#searchCancel').css('visibility', 'hidden');
				jQuery('#searchInput').attr('value', '');
				PlayerSearch.AllSongs.value = null;
				PlayerAllSongs.selectPane.clearHTML();
				PlayerAllSongs.selectPane.request();
				if (e != null){
					jQuery('#searchInput').focus();
				}
				PlayerSearch.AllSongs.pane.lastSearched = null;
			}
		},
		response : function(obj){
			var value = jQuery('#searchInput').attr('value');
			if (obj.value == value){
				var domains = {};
				var artists = {};
				var albums = {}
				var len = obj.results.length;
				for (var i = 0; i < len; i++){
					var item = obj.results[i];
					domains[item.domain] = item.domain;
					artists[item.artist] = item.artist;
					albums[item.album] = item.album;
				}
				PlayerSearch.AllSongs.pane.domain(domains);
				PlayerSearch.AllSongs.pane.artist(artists);
				PlayerSearch.AllSongs.pane.album(albums);
				PlayerSearch.AllSongs.pane.song(obj);
			}
		},
		domainResponse : function(obj){
			var value = jQuery('#searchInput').attr('value');
			if (obj.value == value){
				var artists = {};
				var albums = {}
				var len = obj.results.length;
				for (var i = 0; i < len; i++){
					var item = obj.results[i];
					artists[item.artist] = item.artist;
					albums[item.album] = item.album;
				}
				PlayerSearch.AllSongs.pane.artist(artists);
				PlayerSearch.AllSongs.pane.album(albums);
				PlayerSearch.AllSongs.pane.song(obj);
			}
		},	
		domain : function(obj){
			PlayerAllSongs.pane.domain.requested = null;
			var html = "<div class=\"libraryPaneTop\">Sites</div><div class=\"libraryPaneBottom\" id=\"browseHistoryDomains\">";
			var domains = [];
			for (var i in obj){
				var item = obj[i];
				if (item != ""){
					domains.push(item);	
				}
			}
			domains.sort(Utils.SortCaseInsensitive);
			var len = domains.length;
			html += "<div class=\"songVOPane allSongsDomainAll paneHalfSelected\">All ("+len+" "+PlayerUI.Utils.pluralize(len, 'Site')+")</div>";
			for (var i = 0; i < len; i++){
				var item = domains[i];
				html += "<div class=\"songVOPane allSongsDomain\" domain=\""+escape(item)+"\" id=\"allSongsDomain"+escape(item.replace(/\./g, ''))+"\">"+item+"</div>";
			}
			jQuery('#browseHistoryDomainPane').html(html);
			obj = null;
		},
		artistResponse : function(obj){
			var value = jQuery('#searchInput').attr('value');
			if (obj.value == value){
				var albums = {}
				var len = obj.results.length;
				for (var i = 0; i < len; i++){
					var item = obj.results[i];
					albums[item.album] = item.album;
				}
				PlayerSearch.AllSongs.pane.album(albums);
				PlayerSearch.AllSongs.pane.song(obj);
			}
		},
		artist : function(obj){
			PlayerAllSongs.pane.artist.requested = null;
			var html = "<div class=\"libraryPaneTop\">Artists</div><div class=\"libraryPaneBottom\" id=\"browseHistoryArtists\">";
			var artists = [];
			for (var i in obj){
				var item = obj[i];
				if (item != ""){
					artists.push(item);	
				}
			}
			artists.sort(Utils.SortCaseInsensitive);
			var len = artists.length;
			html += "<div class=\"songVOPane allSongsArtistAll paneHalfSelected\">All ("+len+" "+PlayerUI.Utils.pluralize(len, 'Artist')+")</div>";
			for (var i = 0; i < len; i++){
				var item = artists[i];
				html += "<div class=\"songVOPane allSongsArtist\" artist=\""+escape(item)+"\" id=\"allSongsArtist"+escape(item.replace(/\./g, ''))+"\">"+item+"</div>";
			}
			html += "</div>";
			jQuery('#browseHistoryArtists').remove();
			jQuery('#browseHistoryArtistPane').html(html);
			obj = null;
		},
		albumResponse : function(obj){
			var value = jQuery('#searchInput').attr('value');
			if (obj.value == value){
				PlayerSearch.AllSongs.pane.song(obj);
			}
		},
		album : function(obj){
			PlayerAllSongs.pane.album.requested = null;
			var html = "<div class=\"libraryPaneTop\">Albums</div><div class=\"libraryPaneBottom\" id=\"browseHistoryAlbums\">";
			var albums = [];
			for (var i in obj){
				var item = obj[i];
				if (item != ""){
					albums.push(item);	
				}
			}
			albums.sort(Utils.SortCaseInsensitive);
			var len = albums.length;
			html += "<div class=\"songVOPane allSongsAlbumAll paneHalfSelected\">All ("+len+" "+PlayerUI.Utils.pluralize(len, 'Album')+")</div>";
			for (var i = 0; i < len; i++){
				var item = albums[i];
				html += "<div class=\"songVOPane allSongsAlbum\" album=\""+escape(item)+"\" id=\"allSongsAlbum"+escape(item.replace(/\./g, ''))+"\">"+item+"</div>";
			}
			html += "</div>";
			jQuery('#browseHistoryAlbums').remove();
			jQuery('#browseHistoryAlbumPane').html(html);
			obj = null;
		},
		song : function(obj){
			jQuery(window).unbind("Song.asongLike", PlayerSearch.AllSongs.pane.song);
			var len = obj.results.length;
			if (len > 200){
				len = 200;
			}
			html = "<div id=\"songPaneMiddleAllSongs\" class=\"songPaneMiddle\"><div class=\"songPanePlayButton\"></div><div class=\"songPaneName\" id=\"songPaneFieldsongtitle\">Name</div><div class=\"songPaneArtist\" id=\"songPaneFieldartist\">Artist</div><div class=\"songPaneAlbum\" id=\"songPaneFieldalbum\">Album</div><div class=\"songPaneSite\" id=\"songPaneFielddomain\">Site</div><div class=\"songPanePlayCount\" id=\"songPaneFieldplays\">Play Count</div><div class=\"songPaneErrorLoad\" id=\"songPaneFielderrorload\">Load Fail</div><div class=\"songPaneAdded\" id=\"songPaneFieldtimestamp\">Added</div></div><div class=\"songPaneBottom\" id=\"browseHistorySongs\">";
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
			}
			html += "</div>";
			jQuery('#browseHistorySongs').remove();
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
	}
}


window.addEventListener('load', PlayerSearch.Init);
jQuery(window).bind("Song.searchLike",  PlayerSearch.AllSongs.pane.response);
jQuery(window).bind("Song.searchLikeWithDomain", PlayerSearch.AllSongs.pane.domainResponse);
jQuery(window).bind("Song.searchLikeWithArtist", PlayerSearch.AllSongs.pane.artistResponse);
jQuery(window).bind("Song.searchLikeWithDomainAndArtist", function(obj){ PlayerSearch.AllSongs.pane.artistResponse(obj)} );
jQuery(window).bind("Song.searchLikeWithAlbum", PlayerSearch.AllSongs.pane.albumResponse);
jQuery(window).bind("Song.searchLikeWithDomainAndAlbum", function(obj){ PlayerSearch.AllSongs.pane.albumResponse(obj)} );
jQuery(window).bind("Song.searchLikeWithDomainAndArtistAndAlbum", function(obj){ PlayerSearch.AllSongs.pane.albumResponse(obj)} );
jQuery(window).bind("Song.searchLikeWithArtistAndAlbum", function(obj){ PlayerSearch.AllSongs.pane.albumResponse(obj)} );
jQuery(window).bind("PlayerUI.Top.tab.select", PlayerSearch.Display);
jQuery(window).bind("PlayerAllSongs.ListPane", function(obj) { PlayerSearch.Display(obj)} );
jQuery(window).bind("Song.searchLikeLimit",  PlayerSearch.AllSongs.list.response);