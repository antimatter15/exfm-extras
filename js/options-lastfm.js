/*
name: options-lastfm
author: Dan Kantor
requires: options, jquery-1.3.2, md5, background-storage
*/

Options.LastFM = {
	key: "474b32b1b1920cccf57c308141054f2f",
	url : "http://ws.audioscrobbler.com/2.0/",
	token : null,
	defaultAvatar : "../images/lastfm_user.png",
	init : function(){
		var lastfm = BackgroundStorage.get("lastfm");	
		if (lastfm == null){
			Options.LastFM.build.loggedOut();
		} else {
			Options.LastFM.build.loggedIn(lastfm);
		}
	},
	build : {
		loggedIn : function(lastfm){
			var image = "url("+Options.LastFM.defaultAvatar+")";
			try {
				image = "url("+lastfm.user.image[1]['#text']+")";
			} catch(e){
				image = "url("+Options.LastFM.defaultAvatar+")";
			}
			jQuery('#lastFMLogin').html("<div class=\"connectionLoggedInAs\">Logged in as: <em>"+lastfm.name+"</em></div><button class=\"connectionLoginButton\" id=\"lastFMLogoutButton\">Logout</button>");
			jQuery('#lastFMImage').css('background-image', image);
			jQuery('#lastFMLogoutButton').click(Options.LastFM.logout.click);
		},
		loggedOut : function(){
			jQuery('#lastFMLogin').html("<button id=\"lastFMAuthorizeButton\">Login</button>");
			jQuery('#lastFMImage').css('background-image', "url("+Options.LastFM.defaultAvatar+")");
			jQuery('#lastFMAuthorizeButton').click(Options.LastFM.authorizeButton.click);
		}
	},
	authorizeButton : {
		click : function(e){
			Options.LastFM.authorizeButton.request();
		},
		request : function(){
			jQuery.get(Options.LastFM.url, {"method" : "auth.gettoken", "api_key" : Options.LastFM.key, "format" : "JSON"}, Options.LastFM.authorizeButton.response, "json");
		},
		response : function(json){
			if (json.token){
				Options.LastFM.token = json.token;
				chrome.tabs.onUpdated.addListener(Options.LastFM.login.listener);
				chrome.tabs.create({url: "http://www.last.fm/api/auth?api_key="+Options.LastFM.key+"&token="+Options.LastFM.token});
			} else {
				UtilsDialog.Alert("There was a problem. Please try again.");
			}
		}
	},
	login : {
		listener : function(tabId, obj, tab){
			if (tab.url == "http://www.last.fm/api/grantaccess" && obj.status == "complete"){
				chrome.tabs.onUpdated.removeListener(Options.LastFM.login.listener);
				chrome.tabs.remove(tabId);
				chrome.tabs.getAllInWindow(null, function(tabArray){
					for (var i = 0; i < tabArray.length; i++){
						var tab = tabArray[i];
						if (tab.title == "Settings - ExtensionFM"){
							chrome.tabs.update(tab.id, {"selected" : true});
							break;
						}
					}
				})
				Options.LastFM.login.request();
			}
		},
		request : function(){
			var apiSig = hex_md5("api_key"+Options.LastFM.key+"methodauth.getSessiontoken"+Options.LastFM.token+"8ef2e8aed5ea1192f262fb539cc88298");
			jQuery.get(Options.LastFM.url, {"method" : "auth.getSession", "api_key" : Options.LastFM.key, "token" : Options.LastFM.token, "api_sig" : apiSig, "format" : "JSON"}, Options.LastFM.login.response, "json");
		},
		response : function(json){
			if (json.session){
				var lastfm = {"key" : json.session.key, "name" : json.session.name};
				BackgroundStorage.set("lastfm", lastfm);
				BackgroundStorage.set("scrobbling", {"enabled" : true});
				chrome.extension.getBackgroundPage().BackgroundLastFM.Init();
				Options.LastFM.build.loggedIn(lastfm);
				Options.LastFM.user.getInfo.request(json.session.name);
			}
		}
	},
	logout : {
		click : function(e){
			BackgroundStorage.remove("lastfm");
			BackgroundStorage.remove("scrobbling");
			Options.LastFM.build.loggedOut();
		}
	},
	user : {
		getInfo : {
			request : function(user){
				jQuery.get(Options.LastFM.url, {"method" : "user.getinfo", "api_key" : Options.LastFM.key, "user" : user, "format" : "JSON"}, Options.LastFM.user.getInfo.response, "json");
			},
			response : function(json){
				if (json.user){
					var lastfm = BackgroundStorage.get("lastfm");
					if (lastfm != null){
						lastfm.user = json.user;
						BackgroundStorage.set("lastfm", lastfm);
						Options.LastFM.build.loggedIn(lastfm);
					}
				}
			}
		}
	},
	scrobbling : {
		click : function(e){
			var checked = jQuery('#scrobblingCheckBox').attr("checked");
			if (checked == true){
				Options.LastFM.scrobbling.disable();
			} else {
				Options.LastFM.scrobbling.enable();
			}
		},
		enable : function(){
			jQuery('#scrobblingCheckBox').attr("checked", "checked");
			var scrobbling = BackgroundStorage.get("scrobbling");
			scrobbling.enabled = true;
			BackgroundStorage.set("scrobbling", scrobbling);
			
		},
		disable : function(){
			jQuery('#scrobblingCheckBox').removeAttr("checked");
			var scrobbling = BackgroundStorage.get("scrobbling");
			scrobbling.enabled = false;
			BackgroundStorage.set("scrobbling", scrobbling);
		}
	}
}
window.addEventListener('load', Options.LastFM.init);