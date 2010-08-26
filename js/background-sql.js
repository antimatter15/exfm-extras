/*
name: background-sql
author: Dan Kantor
*/

if (typeof(BackgroundSQL) == 'undefined'){
	BackgroundSQL = {}
}

BackgroundSQL.DB = null;

BackgroundSQL.Init = function(){
	console.log('init')
	try {
    	if (window.openDatabase) {
    		//ExtensionFMTest76
        	BackgroundSQL.DB = openDatabase("ExtensionFMTest76", "1.0", "ExtensionFM Database", 5000000);
        	if (!BackgroundSQL.DB) {
            	BackgroundLog.Log("Open Database Error");
            	console.log("Open Database Error");
        	} else {
        		BackgroundLog.Log("Open Database Success");
            	console.log("Open Database Success");
				BackgroundSQL.Songs.create();
				BackgroundSQL.BrowseHistory.create();
				BackgroundSQL.Sites.create();
				var account = BackgroundStorage.get("account");
				if (account != null){
					BackgroundSQL.Songs.currentTable = "LoggedInSongs";
					BackgroundSQL.Sites.currentTable = "LoggedInSites";
				}
        	}
    	} else {
        	BackgroundLog.Log("Window Open Database Error");
        	console.log("Window Open Database Error");
        }
	} catch(e) {
		BackgroundLog.Log("Window Open Database Catch Error "+e);
		console.log("Window Open Database Catch Error "+e);
	};
}
window.addEventListener('load', BackgroundSQL.Init);