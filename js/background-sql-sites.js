/*
name: background-sql-sites
author: Dan Kantor
requires: background-sql
*/

BackgroundSQL.Sites = {
	currentTable : "Sites",
	updateInterval : 3600000,
	init : function(){
		var updateInterval = BackgroundStorage.get('siteUpdateInterval');
		if (updateInterval != null){
			BackgroundSQL.Sites.updateInterval = updateInterval;
		}
		setInterval(BackgroundSQL.Sites.sitesNeedUpdating, 300000);
	},
	/*statements : {
		//create : "CREATE TABLE Sites (id INTEGER PRIMARY KEY, domain TEXT UNIQUE, lastupdated REAL, autoupdate INTEGER, starred INTEGER, deleted INTEGER, shared INTEGER, shorturl TEXT, visits INTEGER, type TEXT, image TEXT, timestamp REAL)"
		//selectCount : "SELECT COUNT(*) FROM Sites",
		//insertRow : "INSERT INTO Sites (domain, lastupdated, autoupdate, starred, deleted, shared, shorturl, visits, type, image, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
		//sitesNeedUpdating : "SELECT domain, lastupdated, type FROM Sites where autoupdate = ? ORDER by lastupdated LIMIT 5",
		//updateType : "UPDATE Sites SET type = ? WHERE domain = ?",
		//updateAutoUpdate : "UPDATE Sites SET autoupdate = ? WHERE domain = ?",
		//selectAutoUpdate : "SELECT autoupdate FROM Sites WHERE domain = ?",
		//deleteSite : "DELETE FROM Sites WHERE domain = ?",
		//selectDomainsFromSongs : "SELECT domain FROM Songs GROUP BY domain",
		//selectAllSites : "SELECT * FROM Sites",
		//deleteAllSites : "DELETE FROM Sites"
	},*/
	create : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("CREATE TABLE Sites (id INTEGER PRIMARY KEY, domain TEXT UNIQUE, lastupdated REAL, autoupdate INTEGER, starred INTEGER, deleted INTEGER, shared INTEGER, shorturl TEXT, visits INTEGER, type TEXT, image TEXT, timestamp REAL)", [], 
        		function(result) { 
           			BackgroundSQL.Sites.refresh();
                	BackgroundLog.Log("Sites Table Created");
            	},
            	function(t, e) {
            		BackgroundLog.Log("Sites Table Created Error: "+e.message);
        			//console.log('Error creating Sites table', t, e);
        		}
            );
        });
	},
	/*timer : {
		insertSync : null,
		insertSyncEvent : function(modified){
			clearTimeout(BackgroundSQL.Sites.timer.insertSync);
			BackgroundEvents.Trigger({"type" : "Site.insertSync", "modified" : modified});
			BackgroundLog.Log("New Sites Added Sync");
		},
		updateSync : null,
		updateSyncEvent : function(){
			clearTimeout(BackgroundSQL.Sites.timer.updateSync);
			BackgroundEvents.Trigger({"type" : "Site.updateSync"});
			BackgroundLog.Log("New Sites Updated Sync");
		}
	},*/
	insert : function(array){
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			var timestamp = new Date().getTime();
			for (var i = 0; i < len; i++){
				timestamp += 300000;
				//timestamp += 1;
				var values = [array[i].domain, timestamp, 1, 0, 0, 0, '', 1, '', '', timestamp];
				tx.executeSql("INSERT INTO "+BackgroundSQL.Sites.currentTable+" (domain, lastupdated, autoupdate, starred, deleted, shared, shorturl, visits, type, image, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?)", values, 
					function(result) {
						//console.log('Success inserting into Sites table', result);
						//BackgroundLog.Log("Sites Table Insert Success");
        			}, 
        			function(t, e) {
        				return false;
        				//console.log('Error inserting into Sites table', t, e);
        			}
        		);
        	}
		});
	},
	insertSync : function(array){
		var modified = [];
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			for (var i = 0; i < len; i++){
				var site = array[i];
				if (site.deleted == 1 || site.autoupdate == 0){
					modified.push(site);
				}
				var values = [site.domain, site.lastupdated, site.autoupdate, site.starred, site.deleted, site.shared, site.shorturl, site.visits, site.type, site.image, site.timestamp];
				tx.executeSql("INSERT INTO "+BackgroundSQL.Sites.currentTable+" (domain, lastupdated, autoupdate, starred, deleted, shared, shorturl, visits, type, image, timestamp) VALUES (?,?,?,?,?,?,?,?,?,?,?)", values, 
					function(result) {
            			//clearTimeout(BackgroundSQL.Sites.timer.insertSync);
						//BackgroundSQL.Sites.timer.insertSync = setTimeout(BackgroundSQL.Sites.timer.insertSyncEvent, 500, modified);
        			}, 
        			function(t, e) {
        				//clearTimeout(BackgroundSQL.Sites.timer.insertSync);
						//BackgroundSQL.Sites.timer.insertSync = setTimeout(BackgroundSQL.Sites.timer.insertSyncEvent, 500, modified);
        				return false;
        			}
        		);
        	}
		},
		function(e){
			BackgroundLog.Log("New "+BackgroundSQL.Sites.currentTable+" Added Sync Transaction Error "+e.message);
			return false;
		},
		function(){
			BackgroundLog.Log("New "+BackgroundSQL.Sites.currentTable+" Added Sync");
			BackgroundEvents.Trigger({"type" : "Site.insertSync", "modified" : modified});
		});
	},
	updateSync : function(array){
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			for (var i = 0; i < len; i++){
				var site = array[i];
				tx.executeSql("UPDATE "+BackgroundSQL.Sites.currentTable+" SET deleted = ?, autoupdate = ? WHERE domain = ?", [site.deleted, site.autoupdate, site.domain], 
					function(tx, result) {
						//clearTimeout(BackgroundSQL.Sites.timer.updateSync);
						//BackgroundSQL.Sites.timer.updateSync = setTimeout(BackgroundSQL.Sites.timer.updateSyncEvent, 500);
	        		}, 
	        		function(t, e) {
	        			//clearTimeout(BackgroundSQL.Sites.timer.updateSync);
						//BackgroundSQL.Sites.timer.updateSync = setTimeout(BackgroundSQL.Sites.timer.updateSyncEvent, 500);
	        			return false;
	        		}
	        	);
	        }
		},
		function(e){
			BackgroundLog.Log("New "+BackgroundSQL.Sites.currentTable+" Updated Sync Transaction Error "+e.message);
			return false;
		},
		function(){
			BackgroundLog.Log("New "+BackgroundSQL.Sites.currentTable+" Updated Sync");
			BackgroundEvents.Trigger({"type" : "Site.updateSync"});
		});								
	},
	refresh : function(e){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT domain FROM "+BackgroundSQL.Songs.currentTable+" WHERE deleted = 0 GROUP BY domain", [], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; i++) {
						results.push(result.rows.item(i));
	        		}
	        		BackgroundSQL.Sites.insert(results);
	        		BackgroundEvents.Trigger({"type" : "Sites.refresh", "results" : results});
	    		}, 
	    		function(t, e) {
	    			//console.log('Sites.sitesNeedUpdating', t, e);
	    		}
	    	);
    	});
	},
	sitesNeedUpdating : function(){
		if (BackgroundSync.IsSynching == false){
			//BackgroundLog.Log("Updating Sites Start");
			var results = [];
			BackgroundSQL.DB.readTransaction(function(tx) {
				var timestamp = new Date().getTime() - BackgroundSQL.Sites.updateInterval;
				//[timestamp, 1]
				tx.executeSql("SELECT domain, lastupdated, type FROM "+BackgroundSQL.Sites.currentTable+" where autoupdate = ? AND deleted = ? ORDER by lastupdated LIMIT 5", [1, 0], 
					function(tx, result) {
						for (var i = 0; i < result.rows.length; i++) {
							if (result.rows.item(i).lastupdated < timestamp){
	            				results.push(result.rows.item(i));
	            			}
	            		}
	            		BackgroundSQL.Sites.updateLastUpdated(results);
	            		BackgroundEvents.Trigger({"type" : "Sites.sitesNeedUpdating", "results" : results});
	        		}, 
	        		function(t, e) {
	        			//console.log('Sites.sitesNeedUpdating', t, e);
	        		}
	        	);
	        });
	    }
	},
	updateLastUpdated : function(array){
		var len = array.length;
		if (len > 0){
			BackgroundSQL.DB.transaction(function(tx) {
				var timestamp = new Date().getTime();
				var statement = "UPDATE "+BackgroundSQL.Sites.currentTable+" SET lastupdated = ? WHERE domain = ?";
				var values = [timestamp, array[0].domain];
				for (var i = 1; i < len; i++){
					var item = array[i];
					statement += "OR domain = ?"
					values.push(item.domain);
				}
				tx.executeSql(statement, values, 
					function(result) {
	            		//console.log("Site.updateLastUpdated success");
	        		}, 
	        		function(t, e) {
	        			//console.log('Site.updateLastUpdated error', t, e);
	        		}
	        	);
			});
		}
	},
	selectAutoUpdate : function(domain){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT autoupdate FROM "+BackgroundSQL.Sites.currentTable+" WHERE domain = ?", [domain], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; i++) {
            			results.push(result.rows.item(i));
            		}
            		BackgroundEvents.Trigger({"type" : "Site.selectAutoUpdate", "results" : results});
        		}, 
        		function(t, e) {
        			//console.log('Site.selectAutoUpdate', t, e);
        		}
        	);
        });
	},
	updateType : function(array){
		var len = array.length;
		BackgroundSQL.DB.transaction(function(tx) {
			for (var i = 0; i < len; i++){
				var item = array[i];
				tx.executeSql("UPDATE "+BackgroundSQL.Sites.currentTable+" SET type = ? WHERE domain = ?", [item.type, item.domain], 
					function(result) {
	            		//console.log("Site.updateType success");
	        		}, 
	        		function(t, e) {
	        			//console.log('Site.updateType error', t, e);
	        		}
	        	);
        	}
		});
		
	},
	updateAutoUpdate : function(autoUpdate, domain){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("UPDATE "+BackgroundSQL.Sites.currentTable+" SET autoupdate = ? WHERE domain = ?", [autoUpdate, domain], 
				function(result) {
	            		//console.log("Site.updateAutoUpdate success");
	        	}, 
	        	function(t, e) {
	        			//console.log('Site.updateAutoUpdate error', t, e);
	        	}
	        );
		});
	},
	deleteSite : function(domain){
		BackgroundSQL.DB.transaction(function(tx) {
			//tx.executeSql("DELETE FROM "+BackgroundSQL.Sites.currentTable+" WHERE domain = ?", [domain], 
			tx.executeSql("UPDATE "+BackgroundSQL.Sites.currentTable+" SET deleted = 1 WHERE domain = ?", [domain],
				function(result) {
	            		BackgroundEvents.Trigger({"type" : "Site.deleteSite", "domain" : domain});
	        	}, 
	        	function(t, e) {
	        			//console.log('Site.deleteSite error', t, e);
	        	}
	        );
		});
	},
	unDeleteSite : function(domain){
		BackgroundSQL.DB.transaction(function(tx) {
			//tx.executeSql("DELETE FROM "+BackgroundSQL.Sites.currentTable+" WHERE domain = ?", [domain], 
			tx.executeSql("UPDATE "+BackgroundSQL.Sites.currentTable+" SET deleted = 0 WHERE domain = ?", [domain],
				function(result) {
	            		BackgroundEvents.Trigger({"type" : "Site.unDeleteSite", "domain" : domain});
	        	}, 
	        	function(t, e) {
	        			//console.log('Site.deleteSite error', t, e);
	        	}
	        );
		});
	},
	selectDeleted : function(domain){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT deleted FROM "+BackgroundSQL.Sites.currentTable+" WHERE domain = ?", [domain], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; i++) {
            			results.push(result.rows.item(i));
            		}
            		BackgroundEvents.Trigger({"type" : "Site.selectDeleted", "results" : results});
        		}, 
        		function(t, e) {
        			//console.log('Site.selectAutoUpdate', t, e);
        		}
        	);
        });
	},
	selectAllSites : function(table){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT * FROM "+table, [], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
            			results.push(result.rows.item(i));
            		}
            		BackgroundEvents.Trigger({"type" : "Site.allSites", "results" : results});
        		}, 
        		function(t, e) {
        			BackgroundLog.Log('Site.allSites error: '+e.message);
        			console.log('Site.allSites error', t, e);
        		}
        	);
    	});
	}
}

window.addEventListener('load', BackgroundSQL.Sites.init);
jQuery(window).bind("Song.insert", BackgroundSQL.Sites.refresh);
jQuery(window).bind("Song.insertSync", function() { BackgroundSQL.Sites.refresh() });