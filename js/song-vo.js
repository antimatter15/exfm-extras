/*
name: song-vo
author: Dan Kantor
*/


var SongVOFields = ['key', 'songtitle', 'artist', 'album', 'url', 'href', 'domain', 'domainkey', 'description', 'plays', 'meta', 'errorload', 'starred', 'timestring', 'genre', 'filesize', 'fileformat', 'timeseconds', 'bitrate', 'year', 'tracksequence', 'trackcount', 'datemodified', 'lastplayed', 'albumartist', 'amazonmp3link', 'label', 'releasedate', 'largeimage', 'mediumimage', 'smallimage', 'shared', 'deleted', 'shorturl', 'expiredate', 'publishdate', 'timestamp'];

//var APISettableSongVOFields = ['songtitle', 'artist', 'album', 'url', 'href', 'description', 'genre', 'fileformat', 'timeseconds', 'bitrate', 'year', 'tracksequence', 'trackcount', 'amazonmp3link', 'label', 'releasedate', 'largeimage', 'mediumimage', 'smallimage', 'expiredate', 'publishdate'];

var APISettableSongVOFields = [{"field" : "songtitle", "type" : "string"}, {"field" : "artist", "type" : "string"}, {"field" : "album", "type" : "string"}, {"field" : "url", "type" : "string"}, {"field" : "href", "type" : "string"}, {"field" : "description", "type" : "string"}, {"field" : "genre", "type" : "string"}, {"field" : "tracksequence", "type" : "number"}, {"field" : "trackcount", "type" : "number"}, {"field" : "label", "type" : "string"}, {"field" : "releasedate", "type" : "string"}, {"field" : "largeimage", "type" : "string"}, {"field" : "mediumimage", "type" : "string"}, {"field" : "smallimage", "type" : "string"}, {"field" : "publishdate", "type" : "number"}];

// this needs to match fields in Songs DB table - BackgroundSQL.Songs.statements.insertRow

/*

title - The title of the song. If it is unknown, use the anchor text or equivalent
artist - artist of the song
album - album the song is on
url - link to the audio file
href - the page the link was embedded (anchor, etc)
coverart - link to an image (album cover, etc)
key - md5 of the url

*/

if (typeof(SongVO) == 'undefined'){
	SongVO = function(){
		var len = SongVOFields.length;
		for (var i = 0; i < len; i++){
			this[SongVOFields[i]] = "";
		}
	}
};

