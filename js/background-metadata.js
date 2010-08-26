/*
name: background-metadata
author: Dan Kantor
requires: jquery-1.3.2, md5
*/


/*

0 = never checked
1 = checked
-1 = error checking

*/


if (typeof(BackgroundMetadata) == 'undefined'){
	BackgroundMetadata = {}
}	

BackgroundMetadata.Run = function(songVOArray){
	var len = songVOArray.length;
	var keys = []
	for (var i = 0; i < len; i++){
		var songVO = songVOArray[i];
			keys.push(songVO.key);
	}
}

BackgroundMetadata.Request = function(array){
	//BackgroundLog.Log("Meta Request");
	var timeout = 0;
	var bigArray = BackgroundMetadata.Utils.chunk(array, 20);
	for (var j = 0; j < bigArray.length; j++){
		var newArray = bigArray[j];
		timeout += 500;
		setTimeout(BackgroundMetadata.Send, timeout, newArray);
		/*var len = newArray.length;
		var songs = [];
		for (var i = 0; i < len; i++){
			var songVO = newArray[i];
			if (songVO.url.indexOf("http://hypem.com/serve/play/") == -1){
				var obj = {"url" : songVO.url, "href" : songVO.href};
				songs.push(obj);
			}
		}
		if (songs.length > 0){
			timeout += 500;
			setTimeout(BackgroundMetadata.Send, timeout, songs);
		}*/
	}
}

BackgroundMetadata.Send = function(array){
	try {
		var str = JSON.stringify(array);
		var url = Utils.remoteServiceEndpoint()+'/metadata.php';
		jQuery.post(url, {"data" : str}, BackgroundMetadata.Response, "json");
	} catch(e){}
}

BackgroundMetadata.Response = function(json){
	if (json.statusCode == 200){
		if (json.data.length > 0){
			BackgroundSQL.Songs.update(json.data);
		}
	}
	//BackgroundLog.Log("Meta Response");
} 

BackgroundMetadata.Utils = {
	chunk : function(a, s){
   		var base = [], i;
    	for(var i = 0; i < a.length; i+=s ) { 
    		base.push( a.slice( i, i+s ) ); 
    	}    
    	return base;
    }
}

BackgroundMetadata.GetEmptyMeta = {
	request : function(){
		try {
			jQuery(window).bind("Song.songsWithEmptyMeta", BackgroundMetadata.GetEmptyMeta.response);
			BackgroundSQL.Songs.select.songsWithEmptyMeta();
			//BackgroundLog.Log("Getting Empty Meta Request");
		} catch(e){}
	},
	response : function(obj){
		//BackgroundLog.Log("Getting Empty Meta Response");
		try {
			if (obj.results.length > 0){
				BackgroundMetadata.Request(obj.results);
			}
		} catch(e){}
	}
}

//setInterval(BackgroundMetadata.GetEmptyMeta.request, 900000);