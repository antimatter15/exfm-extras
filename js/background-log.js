/*
name: background-log
author: Dan Kantor
requires: jquery-1.3.2
*/
if (typeof(BackgroundLog) == 'undefined'){
	BackgroundLog = {}
}

BackgroundLog.Log = function(str){
	try {
		var logStore = BackgroundStorage.get("logStore");
		if (logStore == null){
			logStore = [];
		}
		if (logStore.length > 50){
			logStore.shift();
		}
		logStore.push({"date" : new Date().getTime(), "msg" : str});
		BackgroundStorage.set("logStore", logStore);
	} catch (e){
		console.log("BackgroundLog.Log error: ", e, "str: ", str);
	}
}