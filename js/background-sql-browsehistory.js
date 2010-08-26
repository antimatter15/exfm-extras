/*
name: background-sql-browsehistory
author: Dan Kantor
requires: background-sql
*/

BackgroundSQL.BrowseHistory = {
	/*statements : {
		//create : "CREATE TABLE BrowseHistory (id INTEGER PRIMARY KEY, domainkey TEXT, sessionkey TEXT, domainsessionkey TEXT UNIQUE, daystamp REAL, timestamp REAL)",
		//selectCount : "SELECT COUNT(*) FROM BrowseHistory",
		//insertRow : "INSERT INTO BrowseHistory (domainkey, sessionkey, domainsessionkey, daystamp, timestamp) VALUES (?,?,?,?,?)",
		//selectByDate : "SELECT s.*, b.timestamp from Songs s, BrowseHistory b WHERE b.domainkey = s.domainkey GROUP BY b.domainkey, b.daystamp ORDER BY b.timestamp DESC",
		//selectBySessionKey : "SELECT s.*, b.timestamp from Songs s, BrowseHistory b WHERE b.domainkey = s.domainkey AND b.sessionkey = ?",
		
		
		
		//selectDomainsFromSongs : "SELECT domain FROM Sites ORDER BY domain",
		
		//selectArtistsFromSongs : "SELECT artist FROM Songs GROUP BY artist",
		//selectArtistsFromSongsByDomain : "SELECT artist, domain FROM Songs WHERE domain = ? GROUP BY artist",
		//selectAlbumsFromSongs : "SELECT album FROM Songs GROUP BY album",
		//selectAlbumsFromSongsByDomain : "SELECT album, domain FROM Songs WHERE domain = ? GROUP BY album",
		//selectAlbumsFromSongsByArtist : "SELECT album, artist FROM Songs WHERE artist = ? GROUP BY album",
		//selectAlbumsFromSongsByArtistAndDomain : "SELECT album, artist, domain FROM Songs WHERE artist = ? AND domain = ? GROUP BY album",
		//selectSongsFromSongs : "SELECT * FROM Songs ORDER BY ",
		//selectSongsFromSongsByDomain : "SELECT * FROM Songs WHERE domain = ? ORDER BY ",
		//selectSongsFromSongsByArtist : "SELECT * FROM Songs WHERE artist = ? ORDER BY ",
		//selectSongsFromSongsByArtistAndDomain : "SELECT * FROM Songs WHERE artist = ? AND domain = ? ORDER BY ",
		//selectSongsFromSongsByAlbum : "SELECT * FROM Songs WHERE album = ? ORDER BY ",
		//selectSongsFromSongsByAlbumAndDomain : "SELECT * FROM Songs WHERE album = ? AND domain = ? ORDER BY ",
		//selectSongsFromSongsByAlbumAndDomainAndArtist : "SELECT * FROM Songs WHERE album = ? AND domain = ? AND artist = ? ORDER BY ",
		//selectSongsFromSongsByAlbumAndArtist : "SELECT * FROM Songs WHERE album = ? AND artist = ? ORDER BY ",
		//deleteBySessionKey : "DELETE FROM BrowseHistory WHERE sessionkey = ?",
		//deleteAll : "DELETE FROM BrowseHistory"
	},*/
	/*timer : {
		insert : null,
		insertEvent : function(sessionKey, count){
			clearTimeout(BackgroundSQL.BrowseHistory.timer.insert);
			BackgroundEvents.Trigger({"type" : "BrowseHistory.insert", "sessionKey" : sessionKey, "count" : count});
			BackgroundLog.Log("BrowseHistory Insert");
		}
	},*/
	create : function(){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql("CREATE TABLE BrowseHistory (id INTEGER PRIMARY KEY, domainkey TEXT, sessionkey TEXT, domainsessionkey TEXT UNIQUE, daystamp REAL, timestamp REAL)", [], 
        		function(result) { 
                	BackgroundLog.Log("BrowseHistory Table Created");
                	chrome.tabs.create({url: "player.html"});
            	},
            	function(t, e) {
            		BackgroundLog.Log("BrowseHistory Table Created Error: "+e.message);
            		BackgroundSQL.BrowseHistory.deleteAll();
        			//console.log('Error creating BrowseHistory table', t, e);
        		}
            );
    	});
	},
	insertCount : {},
	insert : function(sessionKey, songVOArray){
		BackgroundSQL.DB.transaction(function(tx) {
			if (BackgroundSQL.BrowseHistory.insertCount[sessionKey] == undefined){
				BackgroundSQL.BrowseHistory.insertCount[sessionKey] = 0;
			}
			var len = songVOArray.length;
			var d = new Date();
			var daystamp = (d.getMonth()+1)+''+d.getDate()+''+d.getFullYear();
			var timestamp = d.getTime();
			//for (var i = 0; i < len; i++){
			for (var i = len -1; i >= 0; i--){
				timestamp += 1;
				var values = [songVOArray[i].domainkey, sessionKey, songVOArray[i].domainkey+sessionKey, daystamp, timestamp];
				tx.executeSql("INSERT INTO BrowseHistory (domainkey, sessionkey, domainsessionkey, daystamp, timestamp) VALUES (?,?,?,?,?)", values, 
					function(result) {
						//clearTimeout(BackgroundSQL.BrowseHistory.timer.insert);
						BackgroundSQL.BrowseHistory.insertCount[sessionKey]++;
						//BackgroundSQL.BrowseHistory.timer.insert = setTimeout(BackgroundSQL.BrowseHistory.timer.insertEvent, 500, sessionKey, BackgroundSQL.BrowseHistory.insertCount[sessionKey]);
        			}, 
        			function(t, e) {
        				return false;
        				//clearTimeout(BackgroundSQL.BrowseHistory.timer.insert);
        				//BackgroundSQL.BrowseHistory.timer.insert = setTimeout(BackgroundSQL.BrowseHistory.timer.insertEvent, 500, sessionKey, BackgroundSQL.BrowseHistory.insertCount[sessionKey]);
        				//console.log('Error inserting into BrowseHistory table', t, e);
        			}
        		);
        	}
		},
		function(e){
			BackgroundLog.Log("BrowseHistory Insert Transaction Error "+e.message);
			return false;
		},
		function(){
			//BackgroundLog.Log("BrowseHistory Insert");
			BackgroundEvents.Trigger({"type" : "BrowseHistory.insert", "sessionKey" : sessionKey, "count" : BackgroundSQL.BrowseHistory.insertCount[sessionKey]});
		});
	},
	deleteBySessionKey : function(sessionKey){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql("DELETE FROM BrowseHistory WHERE sessionkey = ?", [sessionKey], 
        		function(result) {
        			//console.log('deleted browsehistory sessionkey', sessionKey);
        			//BackgroundLog.Log("BrowseHistory Delete By SessionKey");
        		},
        		function(tx, error) {
           			//console.log('error deleting browsehistory sessionkey', sessionKey, tx, error);
  				}
        	)
    	});
	},
	deleteAll : function(){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql("DELETE FROM BrowseHistory", [], 
        		function(result) {
        			BackgroundLog.Log("BrowseHistory Delete All");
        		},
        		function(tx, error) {
           			BackgroundLog.Log("BrowseHistory Delete All Error");
  				}
        	)
    	});
	},
	select : {
		lastPaneSongs : {
			statement : null,
			params : []
		},
		songsBySessionKey : function(sessionKey){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT s.*, b.timestamp from "+BackgroundSQL.Songs.currentTable+" s, BrowseHistory b WHERE b.domainkey = s.domainkey AND b.sessionkey = ?", [sessionKey], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.songsBySessionKey", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.selectBySessionKey error', t, e);
	        		}
	        	);
	        });
		},
		songsByDate : function(page){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT s.*, b.timestamp from "+BackgroundSQL.Songs.currentTable+" s, BrowseHistory b WHERE b.domainkey = s.domainkey AND s.deleted = 0 GROUP BY b.domainkey, b.daystamp ORDER BY b.timestamp DESC LIMIT "+page+", 50", [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.songsByDate", "results" : results, "page" : page});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.songsByDate error', t, e);
	        		}
	        	);
	        });
		},
		domainsFromSongs : function(){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT domain FROM "+BackgroundSQL.Sites.currentTable+" WHERE deleted = 0 ORDER BY domain COLLATE NOCASE", [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.domainsFromSongs", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.domainsFromSongs error', t, e);
	        		}
	        	);
	        });
		},
		artistsFromSongs : function(){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT artist FROM "+BackgroundSQL.Songs.currentTable+" WHERE deleted = 0 GROUP BY artist COLLATE NOCASE", [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.artistsFromSongs", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.artistsFromSongs error', t, e);
	        		}
	        	);
	        });
		},
		artistsFromSongsByDomain : function(domain){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT artist, domain FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain = ? AND deleted = 0 GROUP BY artist COLLATE NOCASE", [domain], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.artistsFromSongsByDomain", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.artistsFromSongsByDomain error', t, e);
	        		}
	        	);
	        });
		},
		albumsFromSongs : function(){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT album FROM "+BackgroundSQL.Songs.currentTable+" WHERE deleted = 0 GROUP BY album COLLATE NOCASE", [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.albumsFromSongs", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.albumsFromSongs error', t, e);
	        		}
	        	);
	        });
		},
		albumsFromSongsByDomain : function(domain){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT album, domain FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain = ? AND deleted = 0 GROUP BY album COLLATE NOCASE", [domain], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.albumsFromSongsByDomain", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.albumsFromSongsByDomain error', t, e);
	        		}
	        	);
	        });
		},
		albumsFromSongsByArtist : function(artist){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT album, artist FROM "+BackgroundSQL.Songs.currentTable+" WHERE artist = ? AND deleted = 0 GROUP BY album COLLATE NOCASE", [artist], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.albumsFromSongsByArtist", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.albumsFromSongsByArtist error', t, e);
	        		}
	        	);
	        });
		},
		albumsFromSongsByArtistAndDomain : function(artist, domain){
			var results = []
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT album, artist, domain FROM "+BackgroundSQL.Songs.currentTable+" WHERE artist = ? AND domain = ? AND deleted = 0 GROUP BY album COLLATE NOCASE", [artist, domain], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "BrowseHistory.albumsFromSongsByArtistAndDomain", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('BrowseHistory.albumsFromSongsByArtistAndDomain error', t, e);
	        		}
	        	);
	        });
		},
		songsExecuteSql : function(statement, orderBy, params, type){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql(statement+orderBy, params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
	            			results.push(result.rows.item(i));
	            		}
	            		BackgroundEvents.Trigger({"type" : type, "results" : results});
	            		BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = statement;
	            		BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = params;
	        		}, 
	        		function(t, e) {
	        			//console.log(type+' error', t, e);
	        			BackgroundLog.Log("Songs DB Error "+e.message);
	        		}
	        	);
        	});
		},
		songsFromSongs : function(orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [], "BrowseHistory.songsFromSongs");
		},
		songsFromSongsByDomain : function(domain, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [domain], "BrowseHistory.songsFromSongsByDomain");
		},
		songsFromSongsByArtist : function(artist, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE artist = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [artist], "BrowseHistory.songsFromSongsByArtist");
		},
		songsFromSongsByArtistAndDomain : function(artist, domain, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE artist = ? AND domain = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [artist, domain], "BrowseHistory.songsFromSongsByArtistAndDomain");
		},
		songsFromSongsByAlbumAndDomain : function(album, domain, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE album = ? AND domain = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [album, domain], "BrowseHistory.songsFromSongsByAlbumAndDomain");
		},
		songsFromSongsByAlbumAndDomainAndArtist : function(album, domain, artist, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE album = ? AND domain = ? AND artist = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [album, domain, artist], "BrowseHistory.songsFromSongsByAlbumAndDomainAndArtist");
		},
		songsFromSongsByAlbum : function(album, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE album = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [album], "BrowseHistory.songsFromSongsByAlbum");
		},
		songsFromSongsByAlbumAndArtist : function(album, artist, orderBy){
			BackgroundSQL.BrowseHistory.select.songsExecuteSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE album = ? AND artist = ? AND deleted = 0 ORDER BY ", orderBy+' LIMIT 200', [album, artist], "BrowseHistory.songsFromSongsByAlbumAndArtist");
		},
		songsFromSongsLast : function(orderBy, sort){
			if (BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement != null){
				BackgroundSQL.BrowseHistory.select.songsExecuteSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement, orderBy+ ' '+sort+' LIMIT 200', BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, "BrowseHistory.songsFromSongsLast");
	        } else {
	        	BackgroundEvents.Trigger({"type" : "BrowseHistory.songsFromSongsLast", "results" : null});
	        }
		}
	}
}

