/*
name: background-sql-songs
author: Dan Kantor
requires: background-sql
*/

BackgroundSQL.Songs = {
	currentTable : "Songs",
	/*statements : {
		//create : "CREATE TABLE "+BackgroundSQL.Songs.currentTable+" (id INTEGER PRIMARY KEY, key TEXT KEY, songtitle TEXT, artist TEXT, album TEXT, url TEXT, href TEXT, domain TEXT, domainkey TEXT UNIQUE, description TEXT, plays INTEGER, meta INTEGER, errorload INTEGER, starred INTEGER, timestring TEXT, genre TEXT, filesize INTEGER, fileformat TEXT, timeseconds INTEGER, bitrate INTEGER, year INTEGER, tracksequence INTEGER, trackcount INTEGER, datemodified REAL, lastplayed REAL, albumartist TEXT, amazonmp3link TEXT, label TEXT, releasedate TEXT, largeimage TEXT, mediumimage TEXT, smallimage TEXT, shared INTEGER, deleted INTEGER, shorturl TEXT, expiredate REAL, publishdate REAL, timestamp REAL)",
		//selectCount : "SELECT COUNT(*) FROM Songs",
		//deleteSong : "DELETE FROM Songs WHERE domainkey = ?",
		//insertRow : "INSERT INTO Songs ('key', 'songtitle', 'artist', 'album', 'url', 'href', 'domain', 'domainkey', 'description', 'plays', 'meta', 'errorload', 'starred', 'timestring', 'genre', 'filesize', 'fileformat', 'timeseconds', 'bitrate', 'year', 'tracksequence', 'trackcount', 'datemodified', 'lastplayed', 'albumartist', 'amazonmp3link', 'label', 'releasedate', 'largeimage', 'mediumimage', 'smallimage', 'shared', 'deleted', 'shorturl', 'expiredate', 'publishdate', 'timestamp') VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
		//songByKey : "SELECT * FROM Songs WHERE key = ?",
		//updatePlayCount : "UPDATE Songs SET plays = plays+1, datemodified = ? WHERE domainkey = ?",
		//updateErrorCount : "UPDATE Songs SET errorload = errorload+1, datemodified = ? WHERE domainkey = ?",
		//updateDateModified : "UPDATE Songs SET datemodified = ? WHERE datemodified = ?",
		//songsWithEmptyMeta : "SELECT url, href FROM Songs WHERE meta = 0 ORDER BY timestamp DESC LIMIT 40",
		//songByDomainKey : "SELECT * FROM Songs WHERE domainkey = ?",
		//songsByTimestamp : "SELECT * FROM Songs GROUP BY songtitle, artist ORDER BY timestamp DESC",
		//deleteSongsByDomain : "DELETE FROM Songs WHERE domain = ?",
		//songsByDomain : "SELECT * FROM Songs WHERE domain = ?",
		//selectAllSongs : "SELECT * FROM Songs",
		//addSocialColumns : "ALTER TABLE Songs ADD COLUMN tumblr TEXT",
		//deleteAllSongs : "DELETE FROM Songs"
	},*/
	create : function(){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql("CREATE TABLE Songs (id INTEGER PRIMARY KEY, key TEXT KEY, songtitle TEXT, artist TEXT, album TEXT, url TEXT, href TEXT, domain TEXT, domainkey TEXT UNIQUE, description TEXT, plays INTEGER, meta INTEGER, errorload INTEGER, starred INTEGER, timestring TEXT, genre TEXT, filesize INTEGER, fileformat TEXT, timeseconds INTEGER, bitrate INTEGER, year INTEGER, tracksequence INTEGER, trackcount INTEGER, datemodified REAL, lastplayed REAL, albumartist TEXT, amazonmp3link TEXT, label TEXT, releasedate TEXT, largeimage TEXT, mediumimage TEXT, smallimage TEXT, shared INTEGER, deleted INTEGER, shorturl TEXT, expiredate REAL, publishdate REAL, timestamp REAL)", [], 
        		function(result) { 
                	BackgroundLog.Log("Songs Table Created");
            	},
            	function(t, e) {
            		BackgroundLog.Log("Songs Table Created Error: "+e.message);
            		BackgroundSQL.Songs.updateDateModified();
            		//BackgroundSQL.Songs.addSocialColumns();
        		}
            );
    	});
	},
	/*timer : {
		insert : null,
		insertEvent : function(){
			clearTimeout(BackgroundSQL.Songs.timer.insert);
			BackgroundEvents.Trigger({"type" : "Song.insert"});
			BackgroundLog.Log("New Songs Added");
		},
		insertSync : null,
		insertSyncEvent : function(deleted){
			clearTimeout(BackgroundSQL.Songs.timer.insertSync);
			BackgroundEvents.Trigger({"type" : "Song.insertSync", "deleted" : deleted});
			BackgroundLog.Log("New Songs Added Sync");
		},
		update : null,
		updateEvent : function(){
			clearTimeout(BackgroundSQL.Songs.timer.update);
			BackgroundEvents.Trigger({"type" : "Song.onMetadataUpdate"});
			BackgroundLog.Log("Songs Updated");
		},
		updateSync : null,
		updateSyncEvent : function(){
			clearTimeout(BackgroundSQL.Songs.timer.updateSync);
			BackgroundEvents.Trigger({"type" : "Song.updateSync"});
			BackgroundLog.Log("Songs Sync Updated");
		}
	},*/
	insert : function(array){
		var insertSuccess = 0;
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			var timestamp = new Date().getTime();
			for (var i = len -1; i >= 0; i--){
				timestamp += 1;
				var songVO = array[i];
				var values = [songVO.key, songVO.songtitle, songVO.artist, songVO.album, songVO.url, songVO.href, songVO.domain, songVO.domainkey, songVO.description, 0, 0, 0, 0, songVO.timestring, songVO.genre, songVO.filesize, songVO.fileformat, songVO.timeseconds, songVO.bitrate, songVO.year, songVO.tracksequence, songVO.trackcount, timestamp, songVO.lastplayed, songVO.albumartist, songVO.amazonmp3link, songVO.label, songVO.releasedate, songVO.largeimage, songVO.mediumimage, songVO.smallimage, 0, 0, songVO.shorturl, 0, songVO.publishdate, timestamp];
				tx.executeSql("INSERT INTO "+BackgroundSQL.Songs.currentTable+" ('key', 'songtitle', 'artist', 'album', 'url', 'href', 'domain', 'domainkey', 'description', 'plays', 'meta', 'errorload', 'starred', 'timestring', 'genre', 'filesize', 'fileformat', 'timeseconds', 'bitrate', 'year', 'tracksequence', 'trackcount', 'datemodified', 'lastplayed', 'albumartist', 'amazonmp3link', 'label', 'releasedate', 'largeimage', 'mediumimage', 'smallimage', 'shared', 'deleted', 'shorturl', 'expiredate', 'publishdate', 'timestamp') VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", values, 
					function(result) {
            			//clearTimeout(BackgroundSQL.Songs.timer.insert);
						//BackgroundSQL.Songs.timer.insert = setTimeout(BackgroundSQL.Songs.timer.insertEvent, 500);
						insertSuccess++;
        			}, 
        			function(t, e) {
        				return false;
        			}
        		);
        	}
		},
		function(e){
			//console.log('done error');
			BackgroundLog.Log("New Songs Added To "+BackgroundSQL.Songs.currentTable+" Transaction Error "+e.message);
			return false;
		},
		function(){
			if (insertSuccess > 0){
				//BackgroundLog.Log("New Songs Added To "+BackgroundSQL.Songs.currentTable);
				BackgroundEvents.Trigger({"type" : "Song.insert"});
			}
		});
	},
	insertSync : function(array){
		var deleted = [];
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			for (var i = 0; i < len; i++){
				var songVO = array[i];
				if (songVO.deleted == 1){
					deleted.push(songVO);
				}
				//var values = [songVO.key, songVO.songtitle, songVO.artist, songVO.album, songVO.url, songVO.href, songVO.domain, songVO.domainkey, songVO.description, songVO.plays, songVO.meta, songVO.errorload, songVO.starred, songVO.timestring, songVO.genre, songVO.filesize, songVO.fileformat, songVO.timeseconds, songVO.bitrate, songVO.year, songVO.tracksequence, songVO.trackcount, songVO.datemodified, songVO.lastplayed, songVO.albumartist, songVO.amazonmp3link, songVO.label, songVO.releasedate, songVO.largeimage, songVO.mediumimage, songVO.smallimage, songVO.shared, songVO.deleted, songVO.shorturl, songVO.expiredate, songVO.publishdate, songVO.timestamp];
				var values = [songVO.key, songVO.songtitle, songVO.artist, songVO.album, songVO.url, songVO.href, songVO.domain, songVO.domainkey, songVO.meta, songVO.datemodified, songVO.amazonmp3link, songVO.smallimage, songVO.deleted, songVO.timestamp, 0, 0];
				tx.executeSql("INSERT INTO "+BackgroundSQL.Songs.currentTable+" ('key', 'songtitle', 'artist', 'album', 'url', 'href', 'domain', 'domainkey', 'meta', 'datemodified', 'amazonmp3link', 'smallimage', 'deleted', 'timestamp', 'plays', 'errorload') VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", values, 
					function(result) {
            			//clearTimeout(BackgroundSQL.Songs.timer.insertSync);
						//BackgroundSQL.Songs.timer.insertSync = setTimeout(BackgroundSQL.Songs.timer.insertSyncEvent, 500, deleted);
						//console.log('inserting into Songs table success sync');
        			}, 
        			function(t, e) {
        				//clearTimeout(BackgroundSQL.Songs.timer.insertSync);
						//BackgroundSQL.Songs.timer.insertSync = setTimeout(BackgroundSQL.Songs.timer.insertSyncEvent, 500, deleted);
        				return false;
        			}
        		);
        	}
		},
		function(e){	
			console.log("SYNC TRANSACTION ERROR", e);
			BackgroundLog.Log("New "+BackgroundSQL.Songs.currentTable+" Added Sync Transaction Error "+e.message);
			return false;
		},
		function(){
			BackgroundLog.Log("New "+BackgroundSQL.Songs.currentTable+" Added Sync");
			BackgroundEvents.Trigger({"type" : "Song.insertSync", "deleted" : deleted, "success" : true});
		});
	},
	update : function(array){
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			var timestamp = new Date().getTime();
			for (var i = 0; i < len; i++){
				timestamp += 1;
				var item = array[i];
				
				if (item.Attributes.meta != 0){
					var key = item.Name;
					//var songVO = {};
					var updates = [];
					var values = [];
					
					for (var j in item.Attributes){
						if (item.Attributes[j] != '' && item.Attributes[j] != undefined){
							if (j != 'href'){
								updates.push(j+" = ?");
								values.push(item.Attributes[j]);
							}
						}
					}
					updates.push("datemodified = ?");
					values.push(timestamp);
					updates = updates.join();
					var statement = "UPDATE "+BackgroundSQL.Songs.currentTable+" SET ";
					values.push(key);
					var theStatement = statement+updates+" WHERE key = ?";
					tx.executeSql(theStatement, values, 
						function(result) {
		            		//BackgroundEvents.Trigger({"type" : "Song.onMetadataUpdate", "key" : key, "meta" : item.Attributes});
		            		//BackgroundLog.Log("Songs Updated");
		            		//clearTimeout(BackgroundSQL.Songs.timer.update);
							//BackgroundSQL.Songs.timer.update = setTimeout(BackgroundSQL.Songs.timer.updateEvent, 500);
		        		}, 
		        		function(t, e) {
		        			return false;
		        		}
		        	);
		        }
			}
		},
		function(e){
			BackgroundLog.Log(BackgroundSQL.Songs.currentTable+" Updated Transaction Error "+e.message);
			return false;
		},
		function(){
			//BackgroundLog.Log(BackgroundSQL.Songs.currentTable+" Updated");
			BackgroundEvents.Trigger({"type" : "Song.onMetadataUpdate"});
		});								
	},
	updateSync : function(array){
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			for (var i = 0; i < len; i++){
				var songVO = array[i];
				tx.executeSql("UPDATE "+BackgroundSQL.Songs.currentTable+" SET deleted = ? WHERE domainkey = ?", [songVO.deleted, songVO.domainkey], 
					function(tx, result) {
						//clearTimeout(BackgroundSQL.Songs.timer.updateSync);
						//BackgroundSQL.Songs.timer.updateSync = setTimeout(BackgroundSQL.Songs.timer.updateSyncEvent, 500);
	        		}, 
	        		function(t, e) {
	        			//clearTimeout(BackgroundSQL.Songs.timer.updateSync);
						//BackgroundSQL.Songs.timer.updateSync = setTimeout(BackgroundSQL.Songs.timer.updateSyncEvent, 500);
	        			return false;
	        		}
	        	);
	        }
		},
		function(e){
			BackgroundLog.Log(BackgroundSQL.Songs.currentTable+" Sync Updated Transaction Error "+e.message);
			return false;
		},
		function(){
			//BackgroundLog.Log(BackgroundSQL.Songs.currentTable+" Sync Updated");
			BackgroundEvents.Trigger({"type" : "Song.updateSync"});
		});								
	},
	updateByUrlLike : function(array){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			for (var i = 0; i < len; i++){
				var obj = array[i];
				var statement = "UPDATE "+BackgroundSQL.Songs.currentTable+" SET ";
				var updates = [];
				var values = [];
				for (var j in obj.songVO){
					updates.push(j+" = ?");
					values.push(obj.songVO[j]);
				}
				updates.push("datemodified = ?");
				values.push(timestamp);
				updates = updates.join();
				values.push('%'+obj.url);
				var theStatement = statement+updates+" WHERE url LIKE ?";
				tx.executeSql(theStatement, values, 
					function(result) {
	            		//BackgroundEvents.Trigger({"type" : "Song.onMetadataUpdate", "url" : obj.url, "meta" : obj.songVO});
	            		//clearTimeout(BackgroundSQL.Songs.timer.update);
						//BackgroundSQL.Songs.timer.update = setTimeout(BackgroundSQL.Songs.timer.updateEvent, 500);
	        		}, 
	        		function(t, e) {
	        			return false;
	        			//console.log('Songs table updateByUrlLike error', t, e);
	        		}
	        	);
			}
		},
		function(e){
			BackgroundLog.Log(BackgroundSQL.Songs.currentTable+" Updated By URL Like Transaction Error "+e.message);
			return false;
		},
		function(){
			BackgroundLog.Log(BackgroundSQL.Songs.currentTable+" Updated URL Like");
			BackgroundEvents.Trigger({"type" : "Song.onMetadataUpdate"});
		});
	},
	updatePlayCount : function(domainkey){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("UPDATE "+BackgroundSQL.Songs.currentTable+" SET plays = plays+1, datemodified = ? WHERE domainkey = ?", [timestamp, domainkey], 
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.updatePlayCount", "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.updatePlayCount", "success" : false});
        		}
        	);
		});
	},
	updateErrorCount : function(domainkey){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("UPDATE "+BackgroundSQL.Songs.currentTable+" SET errorload = errorload+1, datemodified = ? WHERE domainkey = ?", [timestamp, domainkey], 
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.updateErrorCount", "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.updateErrorCount", "success" : false});
        		}
        	);
		});
	},
	updateDateModified : function(){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("UPDATE "+BackgroundSQL.Songs.currentTable+" SET datemodified = ? WHERE datemodified = ?", [timestamp, ''], 
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.updateDateModified", "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.updateDateModified", "success" : false});
        		}
        	);
		});
	},
	deleteSong : function(domainkey){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("DELETE FROM "+BackgroundSQL.Songs.currentTable+" WHERE domainkey = ?", [domainkey], 
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.deleteSong", "success" : true, "domainkey" : domainkey});
  					BackgroundLog.Log("Song Deleted");
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.deleteSong", "success" : false, "domainkey" : domainkey});
        		}
        	);
		});
	},
	deleteSongMulti : function(domainkeyArray){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			//var statement = "DELETE FROM "+BackgroundSQL.Songs.currentTable+" WHERE domainkey = ?";
			var statement = "UPDATE "+BackgroundSQL.Songs.currentTable+" SET deleted = 1, datemodified = ? WHERE domainkey = ?";
			for (var i = 1; i < domainkeyArray.length; i++){
				statement += " OR domainkey = ?";
			}
			var values = [];
			values.push(timestamp);
			var newValues = values.concat(domainkeyArray);
			tx.executeSql(statement, newValues, 
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.deleteSongMulti", "success" : true, "domainkeyArray" : domainkeyArray});
  					BackgroundLog.Log("Songs Deleted");
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.deleteSongMulti", "success" : false, "domainkeyArray" : domainkeyArray});
        		}
        	);
		});
	},
	deleteSongsByDomain : function(domain){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			//tx.executeSql("DELETE FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain = ?", [domain], 
			tx.executeSql("UPDATE "+BackgroundSQL.Songs.currentTable+" SET deleted = 1, datemodified = ? WHERE domain = ?", [timestamp, domain],
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.deleteSongsByDomain", "success" : true, "domain" : domain});
  					BackgroundLog.Log("Songs Deleted By Domain");
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.deleteSongsByDomain", "success" : false, "domain" : domain});
        		}
        	);
		});
	},
	unDeleteSongsByDomain : function(domain){
		var timestamp = new Date().getTime();
		BackgroundSQL.DB.transaction(function(tx) {
			//tx.executeSql("DELETE FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain = ?", [domain], 
			tx.executeSql("UPDATE "+BackgroundSQL.Songs.currentTable+" SET deleted = 0, datemodified = ? WHERE domain = ?", [timestamp, domain],
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.unDeleteSongsByDomain", "success" : true, "domain" : domain});
  					BackgroundLog.Log("Songs unDeleted By Domain");
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.unDeleteSongsByDomain", "success" : false, "domain" : domain});
        		}
        	);
		});
	},
	/*addSocialColumns : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("ALTER TABLE Songs ADD COLUMN tumblr TEXT", [], 
				function(result) {
  					BackgroundEvents.Trigger({"type" : "Song.addSocialColumns", "success" : true});
  					BackgroundLog.Log("Songs Added Social Columns");
  					console.log(result)
        		}, 
        		function(t, e) {
        			BackgroundEvents.Trigger({"type" : "Song.addSocialColumns", "success" : false});
        			BackgroundLog.Log("Songs Added Social Columns Error: "+e);
        			console.log(e)
        		}
        	);
		});
	},*/
	select : {
		songByKey : function(key){
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE key = ? AND deleted = 0", [key], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			var row = result.rows.item(i);
                		}
	        		}, 
	        		function(t, e) {
	        			console.log('songByKey error', t, e);
	        		}
	        	);
	        });
		},
		songsByKeys : function(keyArray, extra){
			var statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE key = ? AND deleted = 0";
			for (var i = 1; i < keyArray.length; i++){
				statement += " OR key = ? AND deleted = 0";
			}
			statement += " AND meta = ?"
			keyArray.push(0);
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql(statement, keyArray, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; i++) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.onSongsByKeys", "results" : results, "extra" : extra});
                		BackgroundLog.Log("Songs Selected By Keys");
	        		}, 
	        		function(t, e) {
	        			console.log('songsByKeys error', t, e);
	        		}
	        	);
	        });
		},
		songsWithEmptyMeta : function(){
			try {
				var results = [];
				BackgroundSQL.DB.readTransaction(function(tx) {
					tx.executeSql("SELECT url, href FROM "+BackgroundSQL.Songs.currentTable+" WHERE meta = 0 AND deleted = 0 ORDER BY timestamp DESC LIMIT 40", [], 
						function(tx, result) {
							for (var i = 0; i < result.rows.length; i++) {
	                			results.push(result.rows.item(i));
	                		}
	                		BackgroundEvents.Trigger({"type" : "Song.songsWithEmptyMeta", "results" : results});
	                		//BackgroundLog.Log("Songs Selected By Empty Meta");
		        		}, 
		        		function(t, e) {
		        			BackgroundLog.Log("Songs Selected By Empty Meta Error");
		        		}
		        	);
		        });
			} catch(e){
				BackgroundEvents.Trigger({"type" : "Song.songsWithEmptyMeta", "results" : null});
				BackgroundLog.Log("Songs Selected By Empty Meta Catch Error");
			}
		},
		songByDomainKey : function(domainKey){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE domainkey = ? AND deleted = 0", [domainKey], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.songByDomainKey", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.songByDomainKey error', t, e);
	        		}
	        	);
	        });
		},
		songsByDomainKeys : function(domainKeyArray){
			var statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE domainkey = ? AND deleted = 0";
			for (var i = 1; i < domainKeyArray.length; i++){
				statement += " OR domainkey = ? AND deleted = 0";
			}
			statement += " ORDER BY timestamp DESC";
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql(statement, domainKeyArray, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; i++) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.songsByDomainKeys", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('songsByDomainKeys error', t, e);
	        		}
	        	);
	        });
		},
		songsByDomainKeysWithNoMeta : function(keyArray){
			try {
				var statement = "SELECT url, href FROM "+BackgroundSQL.Songs.currentTable+" WHERE domainkey = ? AND meta = 0 AND deleted = 0";
				for (var i = 1; i < keyArray.length; i++){
					statement += " OR domainkey = ? AND meta = 0 AND deleted = 0";
				}
				var results = [];
				BackgroundSQL.DB.readTransaction(function(tx) {
					tx.executeSql(statement, keyArray, 
						function(tx, result) {
							for (var i = 0; i < result.rows.length; i++) {
	                			results.push(result.rows.item(i));
	                		}
	                		BackgroundEvents.Trigger({"type" : "Song.onSongsByDomainKeysWithNoMeta", "results" : results});
	                		//BackgroundLog.Log("Songs Selected By Domain Keys With No Meta");
		        		}, 
		        		function(t, e) {
		        			BackgroundEvents.Trigger({"type" : "Song.onSongsByDomainKeysWithNoMeta", "results" : results});
		        			//BackgroundLog.Log("Songs Selected By Domain Keys With No Meta Error");
		        		}
		        	);
		        });
			} catch(e){
				BackgroundEvents.Trigger({"type" : "Song.onSongsByDomainKeysWithNoMeta", "results" : null});
				BackgroundLog.Log("Songs Selected By Domain Keys With No Meta Catch Error "+e);
			}
		},
		songsByDomain : function(domain, orderBy, sort){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain = ? AND deleted = 0 ORDER BY "+orderBy+" "+sort, [domain], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.songsByDomain", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.songsByDomain error', t, e);
	        		}
	        	);
	        });
		},
		songsByTimestamp : function(page){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE deleted = 0 GROUP BY songtitle, artist ORDER BY timestamp DESC LIMIT "+page+", 50", [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.songsByTimestamp", "results" : results, "page" : page});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.songsByTimestamp error', t, e);
	        		}
	        	);
	    	});
		},
		count : function(table){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT COUNT(*) FROM "+table+" WHERE deleted = 0", [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.count", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.count error', t, e);
	        		}
	        	);
	        });
		},
		countGroupBySongTitleArtist : function(table){
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT COUNT(*) FROM "+table+" WHERE deleted = 0 GROUP BY songtitle, artist", [], 
					function(tx, result) {
						BackgroundEvents.Trigger({"type" : "Song.countGroupBySongTitleArtist", "results" : result.rows.length});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.count error', t, e);
	        		}
	        	);
	        });
		},
		allSongs : function(table){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT * FROM "+table, [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.allSongs", "results" : results});
	        		}, 
	        		function(t, e) {
	        			BackgroundLog.Log('Song.allSongs error: '+e.message);
	        			console.log('Song.allSongs error', t, e);
	        			BackgroundEvents.Trigger({"type" : "Song.allSongs", "results" : results});
	        		}
	        	);
	    	});
		},
		allSongsSync : function(table){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				tx.executeSql("SELECT key, songtitle, artist, album, url, href, domain, domainkey, meta, datemodified, amazonmp3link, smallimage, deleted, timestamp FROM "+table, [], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.allSongsSync", "results" : results});
	        		}, 
	        		function(t, e) {
	        			BackgroundLog.Log('Song.allSongsSync error: '+e.message);
	        			BackgroundEvents.Trigger({"type" : "Song.allSongsSync", "results" : results});
	        		}
	        	);
	    	});
		},
		domainLike : function(value){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				tx.executeSql("SELECT domain FROM "+BackgroundSQL.Songs.currentTable+" WHERE domain like ? AND deleted = 0 GROUP BY domain", [like], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.domainLike", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.domainLike error', t, e);
	        		}
	        	);
	    	});
		},
		artistLike : function(value){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				tx.executeSql("SELECT artist FROM "+BackgroundSQL.Songs.currentTable+" WHERE artist like ? AND deleted = 0 GROUP BY artist", [like], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.artistLike", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.artistLike error', t, e);
	        		}
	        	);
	    	});
		},
		albumLike : function(value){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				tx.executeSql("SELECT album FROM "+BackgroundSQL.Songs.currentTable+" WHERE album like ? AND deleted = 0 GROUP BY album", [like], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.albumLike", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.albumLike error', t, e);
	        		}
	        	);
	    	});
		},
		songLike : function(value){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				tx.executeSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE songtitle like ? AND deleted = 0 LIMIT 200", [like], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.songLike", "results" : results});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.songLike error', t, e);
	        		}
	        	);
	    	});
		},
		searchLike : function(value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, 0];
	            tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLike", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLike error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeLimit : function(value, page){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				tx.executeSql("SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (deleted = ?) ORDER BY timestamp DESC LIMIT "+page+", 50", [like, like, like, like, 0], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeLimit", "results" : results, "value" : value, "page" : page});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeLimit error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeCount : function(value){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				tx.executeSql("SELECT COUNT(*) FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (deleted = ?) ORDER BY timestamp", [like, like, like, like, 0], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		var count = results[0]['COUNT(*)'];
						BackgroundEvents.Trigger({"type" : "Song.searchLikeCount", "count" : count, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeCount error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithDomain : function(domain, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (domain = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, domain, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithDomain", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithDomain error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithDomainAndArtist : function(domain, artist, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (domain = ? AND artist = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, domain, artist, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithDomainAndArtist", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithDomainAndArtist error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithArtist : function(artist, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (artist = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, artist, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithArtist", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithArtist error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithDomainAndArtistAndAlbum : function(domain, artist, album, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (domain = ? AND artist = ? AND album = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, domain, artist, album, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithDomainAndArtistAndAlbum", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithDomainAndArtistAndAlbum error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithDomainAndAlbum : function(domain, album, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (domain = ? AND album = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, domain, album, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithDomainAndAlbum", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithDomainAndAlbum error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithArtistAndAlbum : function(artist, album, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (artist = ? AND album = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, artist, album, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithArtistAndAlbum", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithArtistAndAlbum error', t, e);
	        		}
	        	);
	    	});
		},
		searchLikeWithAlbum : function(album, value, orderBy){
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var like = '%'+value+'%';
				BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement = "SELECT * FROM "+BackgroundSQL.Songs.currentTable+" WHERE (domain like ? OR artist like ? OR album like ? or songtitle like ?) AND (album = ? AND deleted = ?) ORDER BY ";
	            BackgroundSQL.BrowseHistory.select.lastPaneSongs.params = [like, like, like, like, album, 0];
				tx.executeSql(BackgroundSQL.BrowseHistory.select.lastPaneSongs.statement+orderBy, BackgroundSQL.BrowseHistory.select.lastPaneSongs.params, 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; ++i) {
                			results.push(result.rows.item(i));
                		}
                		BackgroundEvents.Trigger({"type" : "Song.searchLikeWithAlbum", "results" : results, "value" : value});
	        		}, 
	        		function(t, e) {
	        			console.log('Song.searchLikeWithAlbum error', t, e);
	        		}
	        	);
	    	});
		}
	}
}