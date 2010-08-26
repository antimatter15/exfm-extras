/*
name: worker-site-updater
author: Dan Kantor
requires: jquery-1.3.2
*/

if (typeof(WorkerSiteUpdater) == 'undefined'){
	WorkerSiteUpdater = {}
}

WorkerSiteUpdater.onMessage = function(e){
	WorkerSiteUpdater.Update(e.data);
}


WorkerSiteUpdater.Update = function(domain){
	switch (domain){
		case "tumblr.com/dashboard" :
			WorkerSiteUpdater.TumblrDashboard.request();
		break;
		case "www.archive.org" :
		break;
		default : 
		//	jQuery.ajax({"url" : "http://"+domain, "dataType" : "html", "complete" : WorkerSiteUpdater.Complete, "cache" : false, "context" : domain});
			//var xmlhttp= new XMLHttpRequest()
			//xhttp.open("GET", domain, false);
			//xhttp.send("");
			//xmlDoc = xhttp.responseXML;
			
			var req = new XMLHttpRequest();  
			req.open('GET', domain, false);   
			req.send(null);  
			if (req.status == 200){
				postMessage(req.responseText);	
			}
			
			
		break;
	}
}

WorkerSiteUpdater.Complete = function(XMLHttpRequest, textStatus){
	if (textStatus == "success"){
		postMessage(XMLHttpRequest.responseText);
		//BackgroundSiteUpdater.Tumblr.request(this.context, XMLHttpRequest.responseText);
		//BackgroundSiteUpdater.Anchors(this.context, XMLHttpRequest.responseText);
	}
}


onmessage = WorkerSiteUpdater.onMessage;