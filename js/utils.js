/*
name: utils
author: Dan Kantor
requires: jquery-1.3.2
*/


if (typeof(Utils) == 'undefined'){
	Utils = {}
}

Utils.trimString = function(str, len){
	var s = str;
	if (str.length > len){
		s = str.substr(0, len)+'...';
	}
	return s;
}

Utils.remoteServiceEndpoint = function(){
	/*var urls = ['http://extension.fm', 'http://www.dankantor.com/extensionfm'];
	var r = Math.floor(Math.random()*urls.length);
	var url = urls[r];
	return url;*/
	return "http://www.extension.fm";
}

Utils.APIEndpoint = function(){
	return "http://api.extension.fm";
}

Utils.APIVersionNumber = function(version){
	return "/v"+version;
}

Utils.openOrSwitchTab = function(e, class, href){
	if (href == null){
		href = jQuery(this).attr('href');
	}
	var tabId = -1;
	chrome.tabs.getAllInWindow(null, function(tabs){
		for (var i = 0; i < tabs.length; i++){
			var tab = tabs[i];
			if (tab.url == href){
      			tabId = tab.id;
      			break;
			}
		}
		if (tabId == -1){
			chrome.tabs.create({url: href});
		} else {
			chrome.tabs.update(tabId, {"selected" : true});
		}
	});
	return false;
}

// Array Remove - By John Resig (MIT Licensed)
Utils.ArrayRemove = function(array, from, to) {
	var rest = array.slice((to || from) + 1 || array.length);
	array.length = from < 0 ? array.length + from : from;
	return array.push.apply(array, rest);
}

//(c) 2008 Michael Manning 
jQuery.parseQuery=function(A,B){var C=(typeof A==="string"?A:window.location.search),E={f:function(F){return unescape(F).replace(/\+/g," ")}},B=(typeof A==="object"&&typeof B==="undefined")?A:B,E=jQuery.extend({},E,B),D={};jQuery.each(C.match(/^\??(.*)$/)[1].split("&"),function(F,G){G=G.split("=");G[1]=E.f(G[1]);D[G[0]]=D[G[0]]?((D[G[0]] instanceof Array)?(D[G[0]].push(G[1]),D[G[0]]):[D[G[0]],G[1]]):G[1]});return D};

Utils.formatNumber = function(n) {
	if (!isFinite(n)) {
		return n;
	}
	var s = ""+n, abs = Math.abs(n), _, i;
	if (abs >= 1000) {
			_  = (""+abs).split(/\./);
		i  = _[0].length % 3 || 3;
	_[0] = s.slice(0,i + (n < 0)) +
       		_[0].slice(i).replace(/(\d{3})/g,',$1');
	s = _.join('.');
	}
	return s;
}

Utils.FixMonth = function(month){
	var m = month+1;
	if (m < 10){
		m = '0'+m;
	}
	return m;
}

Utils.DayStrings = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

Utils.DayStringsAbbreviated = ['Sun', 'Mon', 'Tue', 'Wed', 'Thurs', 'Fri', 'Sat'];

Utils.MonthStrings = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

Utils.MonthStringsAbbreviated = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
	
Utils.AMPM = function(hour) {
	var m = "AM";
	if (hour > 11){
		m = "PM";
	}
	return m;
}

Utils.To12Hour = function(hour){
	var h = hour;
	if (hour > 12){
		h = hour - 12;
	}
	if (hour == 0){
		h = 12;
	}
	return h;
}
	
Utils.FixZeroes = function(minutes){
	var m = minutes;
	if (minutes < 10){
		m = '0'+minutes;
	}
	return m;
}
	
Utils.Pluralize = function(number, string){
	var s = string+'s';
	if (number == 1){
		s = string;
	}
	return s;
}

Utils.ReplaceHTMLEncoding = function(str){
	str = str.replace(/&#8220;/g, '"');
	str = str.replace(/&#8221;/g, '"');
	str = str.replace(/&#8217;/g, "'");
	str = str.replace(/&#8230;/g, "...");
	return str;
}

Utils.Dialog = {
	create : function(hasCloseButton){
		var closeButton = "";
		if (hasCloseButton == true){
			closeButton = "<div id=\"dialogBoxClose\"></div>";
		}
		var html = jQuery("<div id=\"dialogBox\">"+closeButton+"<div id=\"dialogBoxTop\"></div><div id=\"dialogBoxMiddle\"></div><div id=\"dialogBoxBottom\"></div></div>");
		jQuery('#dialogBoxClose').live('click', Utils.Dialog.close);
		jQuery('.lightbox').css('visibility', 'visible');
		//jQuery('.wrapper').css('opacity', .3);
		//jQuery('.wrapper').click(function(e){ e.preventDefault(); e.stopPropagation(); return false; });
		return jQuery(html);
	},
	close : function(){
		jQuery('#dialogBox').remove();
		//jQuery('.wrapper').css('opacity', 1);
		jQuery('.lightbox').css('visibility', 'hidden');
		jQuery(window).trigger({"type" : "Utils.Dialog.close"});
	},
	center : function(){
		var w = jQuery(document).width();
		var left = w/2-200;
		jQuery('#dialogBox').css('left', left);
	},
	centerVertical : function(){
		//var top = jQuery(document).scrollTop()+200;
		//jQuery('#dialogBox').css('top', top);
	}
}
/*Utils.lzw_encode = function(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}
Utils.lzw_decode = function(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}*/

Utils.CompressLibrary = function(array){
	var newArray = [];
	var len = array.length;
	for (var i = 0; i < len; i++){
		var songVO = array[i];
		var newSongVO = {};
		
		var c = -1;
		for (var j in songVO){
			c++;
			newSongVO[c] = songVO[j];
		}
		
		newArray.push(newSongVO);
	}
	return newArray;
}

Utils.GetCoverArt = function(img, size){
	if (img == null || img == ''){
		return 'url(images/glare_'+size+'.png) top right no-repeat, url(images/album_'+size+'.png) no-repeat';
	} else {
		return 'url(images/glare_'+size+'.png) top right no-repeat, url('+img+') no-repeat, url(images/album_'+size+'.png) no-repeat';
	}
}
Utils.MMSS = function (secs) {
    var s = secs % 60;
    if (s < 10) {
        s = "0" + s;
    }
    return Math.floor(secs/60) + ":" + s;
}

Utils.SortCaseInsensitive = function(x,y){ 
  var a = String(x).toUpperCase(); 
  var b = String(y).toUpperCase(); 
  if (a > b) {
     return 1;
  } 
  if (a < b) {
     return -1;
  } 
  return 0; 
}