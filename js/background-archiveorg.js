/*
name: background-archiveorg
author: Dan Kantor
requires: jquery-1.3.2, md5
uses: song-vo
*/
if (typeof(BackgroundArchiveOrg) == 'undefined'){
	BackgroundArchiveOrg = {}
}

BackgroundArchiveOrg.Request = function(url){
	jQuery.get(url, null, BackgroundArchiveOrg.Response, 'text');
}


BackgroundArchiveOrg.Response = function(text){
	var parser = new DOMParser();
 	var xmlDoc = parser.parseFromString(text, "text/xml");
 	var files = xmlDoc.getElementsByTagName("file");
 	var len = files.length;
 	var array = [];
 	for (var i = 0; i < len; i++){
 		try {
	 		var file = files[i];
	 		var format = file.getElementsByTagName("format");
	 		if (format[0].textContent == "VBR MP3"){
	 			var obj = {};
	 			obj.url = file.getAttributeNode('name').nodeValue;
	 			obj.songVO = {};
	 			obj.songVO.fileformat = "mp3";
	 			try {
	 				obj.songVO.songtitle = file.getElementsByTagName("title")[0].textContent;
	 			} catch(e) {}
	 			try {
	 				obj.songVO.artist = file.getElementsByTagName("creator")[0].textContent;
	 			} catch(e) {}
	 			try {
	 				obj.songVO.album = file.getElementsByTagName("album")[0].textContent;
	 			} catch(e) {}
	 			try {
	 				obj.songVO.tracksequence = parseInt(file.getElementsByTagName("track")[0].textContent);
	 			} catch(e) {}
	 			try {
	 				obj.songVO.bitrate = parseInt(file.getElementsByTagName("bitrate")[0].textContent);
	 			} catch(e) {}
	 			try {
	 				obj.songVO.timestring = file.getElementsByTagName("length")[0].textContent;
	 			} catch(e) {}
	 			array.push(obj);
	 		}
	 	} catch(e) {}
 	}
 	if (array.length > 0){
 		BackgroundSQL.Songs.updateByUrlLike(array);
 	}
}