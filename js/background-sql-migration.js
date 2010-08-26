/*
name: background-sql-migration
author: Dan Kantor
requires: background-sql
*/

BackgroundSQL.Migration = {
	loggedInUsername : null,
	statements : {
		createLoggedInSongs : "CREATE TABLE LoggedInSongs (id INTEGER PRIMARY KEY, key TEXT KEY, songtitle TEXT, artist TEXT, album TEXT, url TEXT, href TEXT, domain TEXT, domainkey TEXT UNIQUE, description TEXT, plays INTEGER, meta INTEGER, errorload INTEGER, starred INTEGER, timestring TEXT, genre TEXT, filesize INTEGER, fileformat TEXT, timeseconds INTEGER, bitrate INTEGER, year INTEGER, tracksequence INTEGER, trackcount INTEGER, datemodified REAL, lastplayed REAL, albumartist TEXT, amazonmp3link TEXT, label TEXT, releasedate TEXT, largeimage TEXT, mediumimage TEXT, smallimage TEXT, shared INTEGER, deleted INTEGER, shorturl TEXT, expiredate REAL, publishdate REAL, timestamp REAL)",
		createLoggedInSites : "CREATE TABLE LoggedInSites (id INTEGER PRIMARY KEY, domain TEXT UNIQUE, lastupdated REAL, autoupdate INTEGER, starred INTEGER, deleted INTEGER, shared INTEGER, shorturl TEXT, visits INTEGER, type TEXT, image TEXT, timestamp REAL)",
		insertSongRow : "INSERT INTO LoggedInSongs ('key', 'songtitle', 'artist', 'album', 'url', 'href', 'domain', 'domainkey', 'description', 'plays', 'meta', 'errorload', 'starred', 'timestring', 'genre', 'filesize', 'fileformat', 'timeseconds', 'bitrate', 'year', 'tracksequence', 'trackcount', 'datemodified', 'lastplayed', 'albumartist', 'amazonmp3link', 'label', 'releasedate', 'largeimage', 'mediumimage', 'smallimage', 'shared', 'deleted', 'shorturl', 'expiredate', 'publishdate', 'timestamp') VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
		insertSiteRow : "INSERT INTO LoggedInSites (domain, lastupdated, autoupdate, starred, deleted, shared, shorturl, visits, type, image, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
	},
	/*timer : {
		insertLoggedInSongs : null,
		insertLoggedInSongsEvent : function(){
			clearTimeout(BackgroundSQL.Migration.timer.insertLoggedInSongs);
			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSongsInserted", "success" : true});
			BackgroundLog.Log("LoggedIn Songs Table Inserted");
		},
		insertLoggedInSites : null,
		insertLoggedInSitesEvent : function(){
			clearTimeout(BackgroundSQL.Migration.timer.insertLoggedInSites);
			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSitesInserted", "success" : true});
			BackgroundLog.Log("LoggedIn Sites Table Inserted");
		}
	},*/
	createLoggedInSongs : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("DROP TABLE LoggedInSongs", [], 
        		function(tx, result) { 
        			BackgroundLog.Log("Dropped Table LoggedInSongs");
            	},
            	function(t, e) {
            		BackgroundLog.Log("Dropped Table LoggedInSongs error: "+e.message);
        		}
            );
		}, function(){
			BackgroundSQL.Migration.createLoggedInSongsTable();
		},
		function(){
			BackgroundSQL.Migration.createLoggedInSongsTable();
		});
	},
	createLoggedInSongsTable : function(){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql(BackgroundSQL.Migration.statements.createLoggedInSongs, [], 
        		function(tx, result) { 
        			BackgroundLog.Log("LoggedInSongs Table Created");
        			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSongsCreated", "success" : true});
            	},
            	function(t, e) {
            		BackgroundLog.Log("LoggedInSongs Table Created Error: "+e.message);
            		BackgroundEvents.Trigger({"type" : "Migration.LoggedInSongsCreated", "success" : false, "message" : e.message});
        		}
            );
    	});
	},
	createLoggedInSites : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("DROP TABLE LoggedInSites", [], 
        		function(tx, result) { 
        			BackgroundLog.Log("Dropped Table LoggedInSites");
            	},
            	function(t, e) {
            		BackgroundLog.Log("Dropped Table LoggedInSites error: "+e.message);
        		}
            );
		}, function(){
			BackgroundSQL.Migration.createLoggedInSitesTable();
		},
		function(){
			BackgroundSQL.Migration.createLoggedInSitesTable();
		});
	},
	createLoggedInSitesTable : function(){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql(BackgroundSQL.Migration.statements.createLoggedInSites, [], 
        		function(tx, result) { 
        			BackgroundLog.Log("LoggedInSites Table Created");
                	BackgroundEvents.Trigger({"type" : "Migration.LoggedInSitesCreated", "success" : true});
            	},
            	function(t, e) {
            		BackgroundLog.Log("LoggedInSites Table Created Error: "+e.message);
            		BackgroundEvents.Trigger({"type" : "Migration.LoggedInSitesCreated", "success" : false, "message" : e.message});
        		}
            );
    	});
	},
	insertLoggedInSongs : function(obj){
		BackgroundSQL.DB.transaction(function(tx) {
			var len = obj.results.length;
			if (len > 0){
				for (var i = 0; i < len; i++){
					var songVO = obj.results[i];
					var values = [songVO.key, songVO.songtitle, songVO.artist, songVO.album, songVO.url, songVO.href, songVO.domain, songVO.domainkey, songVO.description, songVO.plays, songVO.meta, songVO.errorload, songVO.starred, songVO.timestring, songVO.genre, songVO.filesize, songVO.fileformat, songVO.timeseconds, songVO.bitrate, songVO.year, songVO.tracksequence, songVO.trackcount, songVO.datemodified, songVO.lastplayed, songVO.albumartist, songVO.amazonmp3link, songVO.label, songVO.releasedate, songVO.largeimage, songVO.mediumimage, songVO.smallimage, songVO.shared, songVO.deleted, songVO.shorturl, songVO.expiredate, songVO.publishdate, songVO.timestamp];
					tx.executeSql(BackgroundSQL.Migration.statements.insertSongRow, values, 
						function(tx, result) {
	            			//clearTimeout(BackgroundSQL.Migration.timer.insertLoggedInSongs);
							//BackgroundSQL.Migration.timer.insertLoggedInSongs = setTimeout(BackgroundSQL.Migration.timer.insertLoggedInSongsEvent, 500);
							//console.log('inserting into LoggedOutSongs table success');
	        			}, 
	        			function(t, e) {
	        				//clearTimeout(BackgroundSQL.Migration.timer.insertLoggedInSongs);
							//BackgroundSQL.Migration.timer.insertLoggedInSongs = setTimeout(BackgroundSQL.Migration.timer.insertLoggedInSongsEvent, 500);
	        				//console.log('Error inserting into LoggedOutSongs table');
	        				return false;
	        			}
	        		);
	        	}
	        } else {
	        	//BackgroundSQL.Migration.timer.insertLoggedInSongsEvent();
	        	BackgroundLog.Log("LoggedIn Songs Table Inserted None");
				BackgroundEvents.Trigger({"type" : "Migration.LoggedInSongsInserted", "success" : true});
	        }
		},
		function(e){
			BackgroundLog.Log("LoggedIn Songs Table Inserted Transaction Error "+e.message);
			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSongsInserted", "success" : false});
			return false;
		},
		function(){
			BackgroundLog.Log("LoggedIn Songs Table Inserted");
			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSongsInserted", "success" : true});
		});
	},
	insertLoggedInSites : function(obj){
		//jQuery(window).unbind("Site.allSites", BackgroundSQL.Migration.insertLoggedInSites);
		BackgroundSQL.DB.transaction(function(tx) {
			var len = obj.results.length;
			if (len > 0){
				for (var i = 0; i < len; i++){
					var site = obj.results[i];
					var values = [site.domain, site.lastupdated, site.autoupdate, site.starred, site.deleted, site.shared, site.shorturl, site.visits, site.type, site.image, site.timestamp];
					tx.executeSql(BackgroundSQL.Migration.statements.insertSiteRow, values, 
						function(tx, result) {
	            			//clearTimeout(BackgroundSQL.Migration.timer.insertLoggedInSites);
	            			//BackgroundSQL.Migration.timer.insertLoggedInSites = setTimeout(BackgroundSQL.Migration.timer.insertLoggedInSitesEvent, 500);
							//console.log('inserting into LoggedOutSites table success');
	        			}, 
	        			function(t, e) {
	        				//clearTimeout(BackgroundSQL.Migration.timer.insertLoggedInSites);
	            			//BackgroundSQL.Migration.timer.insertLoggedInSites = setTimeout(BackgroundSQL.Migration.timer.insertLoggedInSitesEvent, 500);
							//console.log('Error inserting into LoggedOutSites table '+e);
	        				return false;
	        			}
	        		);
	        	}
	        } else {
	        	//BackgroundSQL.Migration.timer.insertLoggedInSitesEvent();
	        	BackgroundLog.Log("LoggedIn Sites Table Inserted None");
				BackgroundEvents.Trigger({"type" : "Migration.LoggedInSitesInserted", "success" : true});
	        }
		},
		function(e){
			BackgroundLog.Log("LoggedIn Sites Table Inserted Transaction Error "+e.message);
			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSitesInserted", "success" : false});
			return false;
		},
		function(){
			BackgroundLog.Log("LoggedIn Sites Table Inserted");
			BackgroundEvents.Trigger({"type" : "Migration.LoggedInSitesInserted", "success" : true});
		});
	},
	dropLoggedInSongsTable : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("DROP TABLE LoggedInSongs", [], 
				function(tx, result) {
					BackgroundLog.Log("LoggedIn Songs Table Dropped");
					BackgroundEvents.Trigger({"type" : "Migration.dropLoggedInSongsTable", "success" : true});
				}, 
    			function(t, e) {
    				BackgroundLog.Log("LoggedIn Songs Table Dropped Error: "+e);
    				BackgroundEvents.Trigger({"type" : "Migration.dropLoggedInSongsTable", "success" : false});
    			}
	        );
	    });
	},
	dropLoggedInSitesTable : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("DROP TABLE LoggedInSites", [], 
				function(tx, result) {
					BackgroundLog.Log("LoggedIn Sites Table Dropped");
					BackgroundEvents.Trigger({"type" : "Migration.dropLoggedInSitesTable", "success" : true});
				}, 
    			function(t, e) {
    				BackgroundLog.Log("LoggedIn Sites Table Dropped Error: "+e);
    				BackgroundEvents.Trigger({"type" : "Migration.dropLoggedInSitesTable", "success" : false});
    			}
	        );
	    });
	}
}