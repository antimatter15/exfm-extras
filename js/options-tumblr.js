/*
name: options-tumblr
author: Dan Kantor
requires: options, jquery-1.3.2, md5, background-storage, oauth, sha1
*/


Options.Tumblr = {
	authUrl : "http://www.tumblr.com/api/authenticate",
	username : null,
	password : null,
	defaultAvatar : "../images/tumblr_user.png",
	init : function(e){
		var tumblr = BackgroundStorage.get("tumblr");
		if (tumblr != null){
			Options.Tumblr.build.loggedIn(tumblr);
		} else {
			Options.Tumblr.build.loggedOut();
		}
	},
	build : {
		loggedIn : function(tumblr){
			var image = Options.Tumblr.defaultAvatar;
			if (tumblr.avatar != undefined){
				image = tumblr.avatar;
			}
			jQuery('#tumblrLogin').html("<div class=\"connectionLoggedInAs\">Logged in as: <em>"+tumblr.username+"</em></div><button class=\"connectionLoginButton\" id=\"tumblrLogoutButton\">Logout</button>");
			jQuery('#tumblrImage').css('background-image', "url("+image+")");
			jQuery('#tumblrLogoutButton').click(Options.Tumblr.logout.click);
		},
		loggedOut : function(){
			jQuery('#tumblrLogin').html("<button id=\"tumblrAuthorizeButton\">Login</button><div class=\"accountLoader\" id=\"tumblrLoader\"></div>");
			jQuery('#tumblrAuthorizeButton').click(Options.Tumblr.login.click);
		}
	},
	login : {
		click : function(){
			jQuery('#tumblrLoader').css('visibility', 'visible');
			Options.Tumblr.oAuth.requestToken.request();
		},
		request : function(){
			var tumblrOAuth = BackgroundStorage.get("tumblrOAuth");
			var message = {
					method: "post", 
					action: Options.Tumblr.authUrl, 
					parameters: []
    			}
				var requestBody = OAuth.formEncode(message.parameters);
				OAuth.completeRequest(message, {
					"consumerKey" : Options.Tumblr.oAuth.consumer.consumerKey, 
					"consumerSecret" : Options.Tumblr.oAuth.consumer.consumerSecret, 
					"token" : tumblrOAuth.oauth_token,
                    "tokenSecret" : tumblrOAuth.oauth_token_secret
				});
				var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
				jQuery.ajax({"url" : message.action, "type" : message.method, "beforeSend" : function(x){ x.setRequestHeader("Authorization", authorizationHeader); }, "complete" : Options.Tumblr.login.response, "cache" : false, "data" : requestBody});
		},
		response : function(XMLHttpRequest, textStatus){
			jQuery('#tumblrLoader').css('visibility', 'hidden');
			if (textStatus == "success"){
				var xml = XMLHttpRequest.responseXML;
				try {
					var tumblelogs = xml.getElementsByTagName('tumblelog');
					var primary;
					for (var i = 0; i < tumblelogs.length; i++){
						var tumblelog = tumblelogs[i];
						var isPrimary = tumblelog.getAttribute('is-primary');
						if (isPrimary != undefined && isPrimary == 'yes'){
							primary = tumblelog;
							break;
						}
					}
					if (primary != undefined){
						var obj = {};
						obj.username = primary.getAttribute('name')
						obj.avatar = primary.getAttribute('avatar-url');
						Options.Tumblr.build.loggedIn(obj);
						BackgroundStorage.set("tumblr", obj);
					} else {
						UtilsDialog.Alert("There was a problem. Please try again");
					}
				} catch(e){}
			} else {
				UtilsDialog.Alert("There was a problem. Please try again. Error: "+XMLHttpRequest.statusText);
			}
		}
	},
	logout : {
		click : function(e){
			BackgroundStorage.remove("tumblr");
			BackgroundStorage.remove("tumblrOAuth");
			jQuery('#tumblrImage').css('background-image', "url("+Options.Tumblr.defaultAvatar+")");
			Options.Tumblr.build.loggedOut();
		}
	},
	oAuth : {
		consumer : {
			consumerKey : "pcl5TN5jEGFLYaNhATTyujwTYGvz13QCEfesZPkcRvEarJsALm",
			consumerSecret : "4eurKzryInb09a6xH6Q0GqRyI0AwvOP6o9ka532zQfGn7MaRUE",
			serviceProvider : {
				signatureMethod : "HMAC-SHA1",
				requestTokenURL : "http://www.tumblr.com/oauth/request_token",
				userAuthorizationURL : "http://www.tumblr.com/oauth/authorize",
				accessTokenURL : "http://www.tumblr.com/oauth/access_token",
				echoURL : "http://oauth.extension.fm/tumblr"
			}
		},
		oauth_token : null,
		oauth_token_secret : null,
		oauth_verifier : null,
		requestToken : {
			request : function(){
				var message = {
					method: "post", 
					action: Options.Tumblr.oAuth.consumer.serviceProvider.requestTokenURL, 
					parameters: [["oauth_callback", "http://oauth.extension.fm.s3.amazonaws.com/tumblr"]]
    			}
				var requestBody = OAuth.formEncode(message.parameters);
				OAuth.completeRequest(message, Options.Tumblr.oAuth.consumer);
				var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
				jQuery.ajax({"url" : message.action, "type" : message.method, "beforeSend" : function(x){ x.setRequestHeader("Authorization", authorizationHeader); }, "complete" : Options.Tumblr.oAuth.requestToken.response, "cache" : false, "data" : requestBody});
			},
			response : function(XMLHttpRequest, textStatus){
				if (XMLHttpRequest.status == 200){
					var results = OAuth.decodeForm(XMLHttpRequest.responseText);
					Options.Tumblr.oAuth.oauth_token = OAuth.getParameter(results, "oauth_token");
					Options.Tumblr.oAuth.oauth_token_secret = OAuth.getParameter(results, "oauth_token_secret");
					Options.Tumblr.oAuth.authorize.open(Options.Tumblr.oAuth.oauth_token);
				} else {
					jQuery('#tumblrLoader').css('visibility', 'hidden');
					UtilsDialog.Alert("There was a problem. Please try again. Error: "+XMLHttpRequest.statusText);
				}
			}
		},
		authorize : {
			open : function(token){
				chrome.tabs.onUpdated.addListener(Options.Tumblr.oAuth.authorize.listener);
               	chrome.tabs.create({url: Options.Tumblr.oAuth.consumer.serviceProvider.userAuthorizationURL+"?oauth_token="+token});
			},
			listener : function(tabId, obj, tab){
				var indexOf = tab.url.indexOf('http://oauth.extension.fm.s3.amazonaws.com/tumblr');
				if (indexOf != -1 && obj.status == "complete"){
					chrome.tabs.onUpdated.removeListener(Options.Tumblr.oAuth.authorize.listener);
					var params = jQuery.parseQuery(tab.url.split("?")[1]);
					Options.Tumblr.oAuth.oauth_token = params.oauth_token;
					Options.Tumblr.oAuth.oauth_verifier = params.oauth_verifier;
					Options.Tumblr.oAuth.authorize.close(tabId);
				}
			},
			close : function(tabId){
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
				Options.Tumblr.oAuth.accessToken.request();
			}
		},
		accessToken : {
			request : function(){
				var message = {
					method: "post", 
					action: Options.Tumblr.oAuth.consumer.serviceProvider.accessTokenURL, 
					parameters: [["oauth_verifier", Options.Tumblr.oAuth.oauth_verifier]]
    			}
				var requestBody = OAuth.formEncode(message.parameters);
				OAuth.completeRequest(message, {
					"consumerKey" : Options.Tumblr.oAuth.consumer.consumerKey, 
					"consumerSecret" : Options.Tumblr.oAuth.consumer.consumerSecret, 
					"token" : Options.Tumblr.oAuth.oauth_token,
                    "tokenSecret" : Options.Tumblr.oAuth.oauth_token_secret
				});
				var authorizationHeader = OAuth.getAuthorizationHeader("", message.parameters);
				jQuery.ajax({"url" : message.action, "type" : message.method, "beforeSend" : function(x){ x.setRequestHeader("Authorization", authorizationHeader); }, "complete" : Options.Tumblr.oAuth.accessToken.response, "cache" : false, "data" : requestBody});
			},
			response : function(XMLHttpRequest, textStatus){
				if (XMLHttpRequest.status == 200){
					var results = OAuth.decodeForm(XMLHttpRequest.responseText);
					var obj = {
						"oauth_token" : OAuth.getParameter(results, "oauth_token"),
						"oauth_token_secret" : OAuth.getParameter(results, "oauth_token_secret")
					}
					BackgroundStorage.set("tumblrOAuth", obj);
					Options.Tumblr.login.request();
				} else {
					jQuery('#tumblrLoader').css('visibility', 'hidden');
					UtilsDialog.Alert("There was a problem. Please try again. Error: "+XMLHttpRequest.statusText);
				}
			}
		}
	},
}
window.addEventListener('load', Options.Tumblr.init);