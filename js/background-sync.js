/*
name: background-sync
author: Dan Kantor
requires: jquery-1.3.2
*/
if (typeof(BackgroundSync) == 'undefined'){
	BackgroundSync = {}
}

BackgroundSync.LastSync = null;
BackgroundSync.Account = null;
BackgroundSync.LocalLibrary = {};
BackgroundSync.RemoteLibrary = {};
BackgroundSync.IsSynching = false;
BackgroundSync.Timeout = null;
BackgroundSync.InitialTimeout = null;
BackgroundSync.Interval = null;

BackgroundSync.Start = function(){
	BackgroundLog.Log("Sync Start");
	BackgroundMain.Track.analytics.determine();
	if (BackgroundSync.IsSynching == false){
		try {
			BackgroundSync.Account = BackgroundStorage.get("account");
			if (BackgroundSync.Account != null){
				BackgroundSync.Timeout = setTimeout(BackgroundSync.Done, 600000, "Timeout Reached");
				BackgroundSync.IsSynching = true;
				BackgroundEvents.Trigger({"type" : "Sync.start", "lastSync" : BackgroundSync.LastSync});
				BackgroundSync.DownLibrary.request(BackgroundSync.Account);
			} else {
				BackgroundLog.Log("Sync Done: No Account");
			}
		} catch (e){
			BackgroundLog.Log("BackgroundSync.Start Catch: "+e);
		}
	} else {
		BackgroundLog.Log("Sync Done: Sync Was True");
	}
}

BackgroundSync.Done = function(message){
	clearTimeout(BackgroundSync.Timeout);
	try {
		BackgroundSync.IsSynching = false;
		BackgroundEvents.Trigger({"type" : "Sync.done", "lastSync" : BackgroundSync.LastSync});
		BackgroundLog.Log("Sync Done: "+message);
	} catch(e){
		BackgroundLog.Log("BackgroundSync.Done Catch: "+e+" Message: "+message);
	}
}

/*
* Get the library from the server
*/
BackgroundSync.DownLibrary = {
	request : function(account){
		//BackgroundLog.Log("Sync DownLibrary Request");
		try {
			jQuery.ajax({"url" : Utils.remoteServiceEndpoint()+'/getLibrary.php', "type" : "POST", "data" : {"username" : account.username, "pass" : account.password}, "complete" : BackgroundSync.DownLibrary.response, dataType : "json"});
		} catch (e){
			BackgroundLog.Log('BackgroundSync.DownLibrary.request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.DownLibrary.request');
		}
	},
	response : function(req){
		//BackgroundLog.Log("Sync DownLibrary Response");
		try {
			var obj = JSON.parse(req.responseText);
			if (obj.statusCode == 200){
				var downLibraryUrl = obj.data;
				if (downLibraryUrl != null){
					BackgroundSync.DownLibrary.authRequest(downLibraryUrl);
				} else {
					BackgroundSync.ReadLibrary.request();
				}
			} else {
				BackgroundLog.Log('BackgroundSync.DownLibrary.response Error Code: '+obj.statusCode);
				BackgroundSync.Done('BackgroundSync.DownLibrary.response');
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.DownLibrary.response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.DownLibrary.response');
		}
	},
	authRequest : function(url){
		BackgroundLog.Log('BackgroundSync.DownLibrary.authRequest: '+url);
		try {
			jQuery.ajax({"url" : url, "type" : "GET", "complete" : BackgroundSync.DownLibrary.authResponse});
		} catch (e){
			BackgroundLog.Log('BackgroundSync.DownLibrary.authRequest Catch: '+e);
			BackgroundSync.Done('BackgroundSync.DownLibrary.authRequest');
		}
	},
	authResponse : function(req){
		//BackgroundLog.Log('BackgroundSync.DownLibrary.authResponse');
		try {
			if (req.status == 200){
				var library = req.responseText;
				BackgroundSync.RemoteLibrary = JSON.parse(library);
				BackgroundSync.InsertLibrary.request();
			} else {
				BackgroundLog.Log('BackgroundSync.DownLibrary.authResponse Status Code: '+req.status);
				BackgroundSync.ReadLibrary.request();
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.DownLibrary.authResponse Catch: '+e);
			console.log(e);
			if (e == "SyntaxError: Unexpected token ILLEGAL" || e == "SyntaxError: Unexpected end of input"){
				BackgroundSync.ReadLibrary.request();
				//var html = "SyntaxError: Unexpected token ILLEGAL<br />"+BackgroundSync.Account.username;
				//jQuery.post(Utils.remoteServiceEndpoint()+'/logReport.php', {"log" : html}, null, "text");
				console.log(e);
			} else {
				BackgroundSync.Done('BackgroundSync.DownLibrary.authResponse');
			}
		}
	}
}

/*
* Insert the Songs object from the server into the local Songs db
*/
BackgroundSync.InsertLibrary = {
	request : function(){
		//BackgroundLog.Log("Sync InsertLibrary Request");
		try {
			jQuery(window).bind("Song.insertSync", BackgroundSync.InsertLibrary.response);
			BackgroundSQL.Songs.insertSync(BackgroundSync.RemoteLibrary.songs);
		} catch (e){
			BackgroundLog.Log('BackgroundSync.InsertLibrary.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.InsertLibrary.Request');
		}
	},
	response : function(obj){
		//BackgroundLog.Log("Sync InsertLibrary Response");
		try {
			jQuery(window).unbind("Song.insertSync", BackgroundSync.InsertLibrary.response);
			if (obj.deleted.length > 0){
				BackgroundSync.UpdateLibrary.request(obj.deleted);
			} else {
				BackgroundSync.InsertSites.request();
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.InsertLibrary.Response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.InsertLibrary.Response');
		}
	}
}

/*
* Update the Songs object from the server into the local Songs db
*/
BackgroundSync.UpdateLibrary = {
	request : function(deletedSongs){
		//BackgroundLog.Log("Sync UpdateLibrary Request");
		try {
			jQuery(window).bind("Song.updateSync", BackgroundSync.UpdateLibrary.response);
			BackgroundSQL.Songs.updateSync(deletedSongs);
		} catch (e){
			BackgroundLog.Log('BackgroundSync.UpdateLibrary.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.UpdateLibrary.Request');
		}
	},
	response : function(){
		//BackgroundLog.Log("Sync UpdateLibrary Response");
		try {
			jQuery(window).unbind("Song.updateSync", BackgroundSync.UpdateLibrary.response);
			BackgroundSync.InsertSites.request();
		} catch (e){
			BackgroundLog.Log('BackgroundSync.InsertLibrary.Response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.InsertLibrary.Response');
		}
	}
}

/*
* Insert the Sites object from the server into the local Sites db
*/
BackgroundSync.InsertSites = {
	request : function(){
		//BackgroundLog.Log("Sync InsertSites Request");
		try {
			jQuery(window).bind("Site.insertSync", BackgroundSync.InsertSites.response);
			BackgroundSQL.Sites.insertSync(BackgroundSync.RemoteLibrary.sites);
		} catch (e){
			BackgroundLog.Log('BackgroundSync.InsertSites.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.InsertSites.Request');
		}
	},
	response : function(obj){
		//BackgroundLog.Log("Sync InsertSites Response");
		try {
			jQuery(window).unbind("Site.insertSync", BackgroundSync.InsertSites.response);
			if (obj.modified.length > 0){
				BackgroundSync.UpdateSites.request(obj.modified);
			} else {
				BackgroundEvents.Trigger({"type" : "Sync.InsertDone"});
				BackgroundSync.ReadLibrary.request();
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.InsertSites.Response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.InsertSites.Response');
		}
	}
}

/*
* Update the Sites object from the server into the local Sites db
*/
BackgroundSync.UpdateSites = {
	request : function(modifiedSites){
		//BackgroundLog.Log("Sync UpdateSites Request");
		try {
			jQuery(window).bind("Site.updateSync", BackgroundSync.UpdateSites.response);
			BackgroundSQL.Sites.updateSync(modifiedSites);
		} catch (e){
			BackgroundLog.Log('BackgroundSync.UpdateSites.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.UpdateSites.Request');
		}
	},
	response : function(){
		//BackgroundLog.Log("Sync UpdateSites Response");
		try {
			jQuery(window).unbind("Site.updateSync", BackgroundSync.UpdateSites.response);
			BackgroundEvents.Trigger({"type" : "Sync.InsertDone"});
			BackgroundSync.ReadLibrary.request();
		} catch (e){
			BackgroundLog.Log('BackgroundSync.UpdateSites.Response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.UpdateSites.Response');
		}
	}
}

/*
* Read the Songs DB from the local db
*/
BackgroundSync.ReadLibrary = {
	request : function(){
		//BackgroundLog.Log("Sync ReadLibrary Request");
		try {
			jQuery(window).bind("Song.allSongsSync", BackgroundSync.ReadLibrary.response);
			BackgroundSQL.Songs.select.allSongsSync("LoggedInSongs");
		} catch (e){
			BackgroundLog.Log('BackgroundSync.ReadLibrary.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.ReadLibrary.Request');
		}
	},
	response : function(obj){
		//BackgroundLog.Log("Sync ReadLibrary Response");
		try {
			jQuery(window).unbind("Song.allSongsSync", BackgroundSync.ReadLibrary.response);
			if (obj.results.length > 0){
				BackgroundSync.LocalLibrary.songs = obj.results;
				BackgroundSync.ReadSites.request();
			} else {
				BackgroundSync.LastSync = new Date().getTime();
				BackgroundStorage.set("BackgroundSync.LastSync", BackgroundSync.LastSync);
				BackgroundSync.Done('BackgroundSync.ReadLibrary Response');
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.ReadLibrary.Response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.ReadLibrary.Response');
		}
	}
}

/*
* Read the Sites DB from the local db
*/
BackgroundSync.ReadSites = {
	request : function(){
		//BackgroundLog.Log("Sync ReadSites Request");
		try {
			jQuery(window).bind("Site.allSites", BackgroundSync.ReadSites.response);
			BackgroundSQL.Sites.selectAllSites("LoggedInSites");
		} catch (e){
			BackgroundLog.Log('BackgroundSync.ReadSites.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.ReadSites.Request');
		}
	},
	response : function(obj){
		//BackgroundLog.Log("Sync ReadSites Response");
		try {
			jQuery(window).unbind("Site.allSites", BackgroundSync.ReadSites.response);
			if (obj.results.length > 0){
				BackgroundSync.LocalLibrary.sites = obj.results;
				BackgroundSync.UpLibrary.request();
			} else {
				BackgroundSync.Done('BackgroundSync.ReadSites Response');
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.ReadSites.Response Catch: '+e);
			BackgroundSync.Done('BackgroundSync.ReadSites.Response');
		}
	}
}


/*
* Upload the local library to the server
*/
BackgroundSync.UpLibrary = {
	request : function(){
		//BackgroundLog.Log("Sync UpLibrary Request");
		try {
			if (BackgroundSync.Account != null){
				var library = JSON.stringify(BackgroundSync.LocalLibrary);
				//library = encodeURIComponent(library);
				//console.log(library);
				try {
					//var libraryObject = JSON.parse(library);
					//console.log(libraryObject)
					jQuery.post(Utils.remoteServiceEndpoint()+'/setLibrary.php', {"username" : BackgroundSync.Account.username, "pass" : BackgroundSync.Account.password, "library" : library}, BackgroundSync.UpLibrary.response, "json");
				} catch(e){
					BackgroundSync.Done('BackgroundSync UpLibrary Parse Catch: '+e);
				}
			} else {
				BackgroundSync.Done('BackgroundSync UpLibrary Request');
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.UpLibrary.Request Catch: '+e);
			BackgroundSync.Done('BackgroundSync.UpLibrary.Request');
		}
	}, 
	response : function(json){
		//BackgroundLog.Log("Sync UpLibrary Response");
		try {
			if (json.statusCode == 200){
				BackgroundSync.LastSync = new Date().getTime();
				BackgroundStorage.set("BackgroundSync.LastSync", BackgroundSync.LastSync);
				BackgroundSync.Done('BackgroundSync UpLibrary Response');
			} else {
				BackgroundLog.Log('BackgroundSync.UpLibrary.response Error Code: '+json.statusCode);
				BackgroundSync.Done('BackgroundSync UpLibrary Response');
			}
		} catch (e){
			BackgroundLog.Log('BackgroundSync.UpLibrary.response Catch: '+e);
			BackgroundSync.Done('BackgroundSync UpLibrary Response');
		}
	}
}

BackgroundSync.InitialTimeout = setTimeout(BackgroundSync.Start, 10000);
BackgroundSync.Interval = setInterval(BackgroundSync.Start, 3600000);
