/*
name: background-sql-queue
author: Dan Kantor
requires: background-sql
*/

BackgroundSQL.Queue = {
	create : function(){
		BackgroundSQL.DB.transaction(function(tx) {
        	tx.executeSql("CREATE TABLE Queue (id INTEGER PRIMARY KEY, domainkey TEXT, timestamp REAL)", [], 
        		function(result) { 
                	BackgroundLog.Log("Queue Table Created");
            	},
            	function(t, e) {
            		BackgroundLog.Log("Queue Table Created Error: "+e.message);
        		}
            );
    	});
	},
	insert : function(array, playNow){
		var results = [];
		BackgroundSQL.DB.transaction(function(tx) {
			var len = array.length;
			var timestamp = new Date().getTime();
			for (var i = 0; i < len; i++){
				timestamp += 1;
				var songVO = array[i];
				var values = [songVO.domainkey, songVO.timestamp];
				tx.executeSql("INSERT INTO QUEUE ('domainkey', 'timestamp') VALUES (?,?)", values, 
					function(result) {
						console.log("BackgroundSQL Queue Insert", result)
						results.push(songVO);
        			}, 
        			function(t, e) {
        				console.log("BackgroundSQL Queue Insert", e)
        				return false;
        			}
        		);
        	}
		},
		function(e){
			BackgroundLog.Log("BackgroundSQL Queue Insert Transaction Error "+e.message);
			return false;
		},
		function(){
			BackgroundEvents.Trigger({"type" : "Queue.change.insert", "playNow" : playNow, "results" : results});
		});	
	},
	selectLastInsert : function(id){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT last_insert_rowid() FROM Queue", [], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
            			results.push(result.rows.item(i));
            		}
            		console.log(results);
            		BackgroundEvents.Trigger({"type" : "Queue.selectLastInsert", "results" : results, "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundLog.Log('Queue.read error: '+e.message);
        			BackgroundEvents.Trigger({"type" : "Queue.selectLastInsert", "results" : results, "success" : false});
        		}
        	);
    	});
	},
	selectOne : function(id){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT q.id, s.* FROM "+BackgroundSQL.Songs.currentTable+" s, Queue q WHERE s.domainkey = q.domainkey AND q.id > ? LIMIT 1", [id], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
            			results.push(result.rows.item(i));
            		}
            		BackgroundEvents.Trigger({"type" : "Queue.selectOne", "results" : results, "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundLog.Log('Queue.read error: '+e.message);
        			BackgroundEvents.Trigger({"type" : "Queue.selectOne", "results" : results, "success" : false});
        		}
        	);
    	});
	},
	selectAll : function(){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT q.id, s.* FROM "+BackgroundSQL.Songs.currentTable+" s, Queue q WHERE s.domainkey = q.domainkey", [], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
            			results.push(result.rows.item(i));
            		}
            		BackgroundEvents.Trigger({"type" : "Queue.selectAll", "results" : results, "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundLog.Log('Queue.read error: '+e.message);
        			BackgroundEvents.Trigger({"type" : "Queue.selectAll", "results" : results, "success" : false});
        		}
        	);
    	});
	},
	selectAll : function(){
		var results = [];
		BackgroundSQL.DB.readTransaction(function(tx) {
			tx.executeSql("SELECT q.id, s.* FROM "+BackgroundSQL.Songs.currentTable+" s, Queue q WHERE s.domainkey = q.domainkey", [], 
				function(tx, result) {
					for (var i = 0; i < result.rows.length; ++i) {
            			results.push(result.rows.item(i));
            		}
            		BackgroundEvents.Trigger({"type" : "Queue.selectAll", "results" : results, "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundLog.Log('Queue.read error: '+e.message);
        			BackgroundEvents.Trigger({"type" : "Queue.selectAll", "results" : results, "success" : false});
        		}
        	);
    	});
	},
	clearAll : function(){
		BackgroundSQL.DB.transaction(function(tx) {
			tx.executeSql("DELETE FROM Queue", [], 
				function(tx, result) {
            		BackgroundEvents.Trigger({"type" : "Queue.change.clearAll", "success" : true});
        		}, 
        		function(t, e) {
        			BackgroundLog.Log('Queue.clearAll error: '+e.message);
        			BackgroundEvents.Trigger({"type" : "Queue.change.clearAll", "success" : false});
        		}
        	);
    	});
	}	
}