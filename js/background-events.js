/*
name: background-events
author: Dan Kantor
requires: jquery-1.3.2
*/
if (typeof(BackgroundEvents) == 'undefined'){
	BackgroundEvents = {}
}

BackgroundEvents.Windows = {};

BackgroundEvents.Listener = function(request, sender){
	if (request.msg == "register"){
		BackgroundEvents.Windows.push(sender);
	}
}

BackgroundEvents.Register = function(name, func){
	BackgroundEvents.Windows[name] = func; 
}

BackgroundEvents.Trigger = function(data){
	jQuery(window).trigger(data);
	for (var i in BackgroundEvents.Windows){
		BackgroundEvents.Windows[i](data);
	}
}

chrome.extension.onRequest.addListener(BackgroundEvents.Listener);

