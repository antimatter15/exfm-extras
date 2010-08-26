/*
name: options-account
author: Dan Kantor
requires: options, jquery-1.3.2, md5, background-storage
*/

Options.Account = {
	username : null,
	password : null,
	email : null,
	hasCloudLibrary : false,
	init : function(e){
		var account = BackgroundStorage.get("account");
		if (account != null){
			Options.Account.build.loggedIn(account);
		} else {
			Options.Account.build.loggedOut();
		}
	},
	build : {
		loggedIn : function(account){
			var iso = "Never";
			var lastSync = BackgroundStorage.get("BackgroundSync.LastSync");
			if (lastSync != null){
				var date = new Date(lastSync);
				var iso = date.getFullYear()+'-'+Utils.FixMonth(date.getMonth())+'-'+date.getDate()+'T'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
			}
			jQuery('#accountSectionBody').html("<div id=\"accountLoggedInAs\" class=\"connectionLoggedInAs\" title=\""+account.username+"\">Logged in as: <em>"+account.username+"</em></div><button id=\"accountLogout\">Logout</button><div id=\"accountSync\">Last Sync: <time id=\"accountLastSync\" datetime=\""+iso+"\">"+iso+"</time></div><div id=\"accountSyncNow\">Syncing</div>");
			jQuery("time#accountLastSync").timeago();
			jQuery('#accountLogout').click(Options.Account.logout.click);
			jQuery('#createAccount').addClass('hidden');
		},
		loggedOut : function(){
			jQuery('#accountSectionBody').html("<div class=\"accountLogInCreate\"><div id=\"accountLogInCreateRight\">Sign Up</div><div id=\"accountLogInCreateLeft\">Log In</div></div><form onsubmit=\"return Options.Account.login.request()\" action=\"\" id=\"accountForm\"><input type=\"text\" id=\"accountUsername\" class=\"largeInputText\" placeholder=\"Username\" /><input type=\"password\" id=\"accountPassword\" class=\"largeInputText\" placeholder=\"Password\" /><button class=\"accountButton\" id=\"accountSubmit\">Login</button><div class=\"accountLoader\" id=\"loginLoader\"></div></form><div class=\"clear\"></div>");
			jQuery('#accountLogInCreateRight').unbind('click', Options.Account.build.loggedOut);
			jQuery('#accountLogInCreateRight').bind('click', Options.Account.createAccount.click);
		},
		createAccount : function(){
			jQuery('#accountSectionBody').html("<div class=\"accountLogInCreate\"><div id=\"accountLogInCreateRight\">Log In</div><div id=\"accountLogInCreateLeft\">Sign Up</div></div><form onsubmit=\"return Options.Account.createAccount.request()\" action=\"\"><input type=\"text\" id=\"createAccountUsername\" class=\"largeInputText\" placeholder=\"Username\" /><input type=\"text\" id=\"createAccountEmail\" class=\"largeInputText\" placeholder=\"Email Address\" /><input type=\"password\" id=\"createAccountPassword\" class=\"largeInputText\" placeholder=\"Password\" /><button id=\"accountSubmit\" class=\"accountButton\">Submit</button><div class=\"accountLoader\" id=\"theAccountLoader\"></div></form><div class=\"clear\"></div>");
			jQuery('#accountLogInCreateRight').unbind('click', Options.Account.createAccount.click);
			jQuery('#accountLogInCreateRight').bind('click', Options.Account.build.loggedOut);
			//jQuery('#accountSubmit').click(Options.Account.createAccount.request);
		}
	},
	login : {
		method : "user/account.login",
		request : function(){
			BackgroundLog.Log('Options.Account.login.request');
			jQuery('#loginLoader').css('visibility', 'visible');
			Options.Account.username = jQuery('#accountUsername').attr('value');
			var password = jQuery('#accountPassword').attr('value');
			if (Options.Account.username != "" && password != ""){
				Options.Account.password = hex_md5(password);
				jQuery.ajax({"url" : Utils.APIEndpoint()+Utils.APIVersionNumber('1')+"/"+Options.Account.login.method, "type" : "POST", "data" : {"username" : Options.Account.username, "password" : Options.Account.password}, "complete" : Options.Account.login.response});
			} else {
				jQuery('#loginLoader').css('visibility', 'hidden');
				UtilsDialog.Alert("Please include a username and a password");
			}
			return false;	
		},
		response : function(req){
			BackgroundLog.Log('Options.Account.login.response');
			jQuery('#loginLoader').css('visibility', 'hidden');
			try {
				var obj = JSON.parse(req.responseText);
				if (obj.status_code == 200){
					var account = {"username" : Options.Account.username, "password" : Options.Account.password};
					Options.Account.build.loggedIn(account);
					BackgroundStorage.set("account", account);
					jQuery('#accountCheck').css('display', 'inline-block');
					setTimeout(Options.Account.fadeOutCheck, 3000);
					if (obj.data != null){
						Options.Account.hasCloudLibrary = true;
					}
					Back.BackgroundEvents.Trigger({"type" : "Account.LoggedIn"});
					Options.Account.migrateTables.loggedIn.createSongTable();
					Options.Account.sync.start();
				} else {
					UtilsDialog.Alert(obj.status_text);
				}
			} catch (e){
				UtilsDialog.Alert('There was a problem. Please try again.');
				BackgroundLog.Log('Options.Account.login.response Catch: '+e);
			}
		}
	},
	logout : {
		click : function(){
			BackgroundLog.Log('Options.Account.logout');
			BackgroundStorage.remove("account");
			BackgroundStorage.remove("BackgroundSync.LastSync");
			Options.Account.build.loggedOut();
			Back.BackgroundSQL.Songs.currentTable = "Songs";
			Back.BackgroundSQL.Sites.currentTable = "Sites";
			Options.Account.migrateTables.loggedOut.dropLoggedInSongsTable();
		}	
	},
	createAccount : {
		method : "user/account.create",
		click : function(){
			Options.Account.build.createAccount();
		},
		request : function(){
			BackgroundLog.Log('Options.Account.createAccount.request');
			var username = jQuery('#createAccountUsername').attr('value');
			var email = jQuery('#createAccountEmail').attr('value');
			var password = jQuery('#createAccountPassword').attr('value');
			if (username != "" && email != "" && password != ""){
				jQuery('#theAccountLoader').css('visibility', 'visible');
				Options.Account.username = username;
				Options.Account.email = email;
				Options.Account.password = hex_md5(password);
				jQuery.ajax({"url" : Utils.APIEndpoint()+Utils.APIVersionNumber('1')+"/"+Options.Account.createAccount.method, "type" : "POST", "data" : {"username" : Options.Account.username, "password" : Options.Account.password, "email" : Options.Account.email}, "complete" : Options.Account.createAccount.response});
			} else {
				UtilsDialog.Alert("Please include a username, password and email address.");
			}
			return false;
		},
		response : function(req){
			BackgroundLog.Log('Options.Account.createAccount.response');
			jQuery('#theAccountLoader').css('visibility', 'hidden');
			try {
				var obj = JSON.parse(req.responseText);
				if (obj.status_code == 200){
					var account = {"username" : Options.Account.username, "password" : Options.Account.password};
					Options.Account.build.loggedIn(account);
					BackgroundStorage.set("account", account);
					Back.BackgroundEvents.Trigger({"type" : "Account.LoggedIn"});
					Options.Account.createAccount.showWelcomeDialog();
				} else {
					UtilsDialog.Alert(obj.status_text);
				}
			} catch (e){
				UtilsDialog.Alert('There was a problem. Please try again.');
				BackgroundLog.Log('Options.Account.createAccount.response Catch: '+e);
			}
		},
		showWelcomeDialog : function(){
			var dialogBox = Utils.Dialog.create(false);
			jQuery(document.body).append(dialogBox);
			jQuery('#dialogBoxTop').text("Account Created!");
			jQuery('#dialogBoxMiddle').text("Welcome "+Options.Account.username+". Your account has been created. We are now going to sync your library to the cloud. This may take a few minutes.");
			jQuery('#dialogBoxBottom').html("<button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"dialogButtonCreateAccountContinue\" value=\"yes\">Continue</button>");
			Utils.Dialog.center();
			jQuery('#dialogButtonCreateAccountContinue').bind('click', Options.Account.dialog.continu);
		},
		hideWelcomeDialog : function(){
			jQuery(window).unbind("Sync.done", Options.Account.createAccount.hideWelcomeDialog);
			jQuery('#dialogBoxTop').text("All Done!");
			jQuery('#dialogBoxMiddle').html("You can now log in from multiple computers and your library will be synced across all of them.");
			jQuery('#dialogBoxBottom').html("<button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"dialogButtonClose\" value=\"close\">Close</button>");
			jQuery('#dialogButtonClose').bind('click', Utils.Dialog.close);
		}
	},
	totalSongs : function(obj){
		jQuery(window).unbind("Song.count", Options.Account.totalSongs);
		var count = obj.results[0]['COUNT(*)'];
		if (count > 0){
			var dialogBox = Utils.Dialog.create(false);
			jQuery(document.body).append(dialogBox);
			jQuery('#dialogBoxTop').text("Confirm");
			jQuery('#dialogBoxMiddle').text("Hey "+Options.Account.username+", there are "+count+" songs on this computer. Would you like to add them to your cloud library?");
			jQuery('#dialogBoxBottom').html("<button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"dialogButtonYes\" value=\"yes\">Yes</button><button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"dialogButtonNo\" value=\"no\">No</button>");
			Utils.Dialog.center();
			jQuery('#dialogButtonYes').bind('click', Options.Account.dialog.yes);
			jQuery('#dialogButtonNo').bind('click', Options.Account.dialog.no);
		} else {
			Options.Account.sync.startSync();
		}
	},
	sync : {
		start : function(){
			jQuery('#accountSyncNow').css('display', 'block');
		},
		done : function(e){
			var iso = "Never";
			if (e.lastSync != null){
				var date = new Date(e.lastSync);
				var iso = date.getFullYear()+'-'+Utils.FixMonth(date.getMonth())+'-'+date.getDate()+'T'+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
			}
			jQuery('#accountSyncNow').css('display', 'none');
			jQuery('#accountSync').html("Last Sync: <time id=\"accountLastSync\" datetime=\""+iso+"\">"+iso+"</time>");
			jQuery("time#accountLastSync").timeago();
		},
		startSync : function(){
			clearTimeout(Back.BackgroundSync.InitialTimeout);
			clearInterval(Back.BackgroundSync.Interval);
			Back.BackgroundSync.Interval = setInterval(Back.BackgroundSync.Start, 3600000);
			Back.BackgroundSync.Start();
		}
	},
	fadeOutCheck : function(){
		jQuery('#accountCheck').animate({'opacity' : 0}, 1000, function(){ jQuery('#accountCheck').css({'visibility' : 'hidden', 'opacity' : 1}) });
	},
	dialog : {
		yes : function(){
			jQuery('#dialogButtonYes').unbind('click', Options.Account.dialog.yes);
			Utils.Dialog.close();
			Options.Account.migrateTables.loggedIn.transferLoggedOutSongs();
		},
		no : function(){
			jQuery('#dialogButtonNo').unbind('click', Options.Account.dialog.no);
			Utils.Dialog.close();
			jQuery(window).bind("Sync.InsertDone", Options.Account.migrateTables.loggedIn.syncDone);
			Options.Account.sync.startSync();
		},
		continu : function(){
			jQuery('#dialogBoxTop').text("Sync");
			jQuery('#dialogBoxMiddle').html("<div class=\"dialogFirstSync\">Syncing your library to the cloud</div>");
			jQuery('#dialogBoxBottom').empty();
			jQuery(window).bind("Sync.done", Options.Account.createAccount.hideWelcomeDialog);
			Options.Account.sync.start();
			Options.Account.migrateTables.loggedIn.createSongTable();
		}
	},
	migrateTables : {
		loggedIn : {
			createSongTable : function(){
				jQuery(window).bind("Migration.LoggedInSongsCreated", Options.Account.migrateTables.loggedIn.createSitesTable);
				Back.BackgroundSQL.Migration.createLoggedInSongs();
			},
			createSitesTable : function(e){
				jQuery(window).unbind("Migration.LoggedInSongsCreated", Options.Account.migrateTables.loggedIn.createSitesTable);
				if (e.success == true){
					Back.BackgroundSQL.Songs.currentTable = "LoggedInSongs";
					jQuery(window).bind("Migration.LoggedInSitesCreated", Options.Account.migrateTables.loggedIn.tablesCreated);
					Back.BackgroundSQL.Migration.createLoggedInSites();
				} else {
					BackgroundLog.Log("Error Creating Logged In Songs Table: "+e.message);
					BackgroundStorage.remove("account");
					Options.Account.build.loggedOut();
					UtilsDialog.Alert("There was a database problem. Please try again.");
				}
			},
			tablesCreated : function(e){
				jQuery(window).unbind("Migration.LoggedInSitesCreated", Options.Account.migrateTables.loggedIn.tablesCreated);
				if (e.success == true){
					Back.BackgroundSQL.Sites.currentTable = "LoggedInSites";
					if (Options.Account.hasCloudLibrary == false){
						Options.Account.migrateTables.loggedIn.transferLoggedOutSongs();
					} else {
						jQuery(window).bind("Song.count", Options.Account.totalSongs);
						Back.BackgroundSQL.Songs.select.count("Songs");
					}
				} else {
					BackgroundLog.Log("Error Creating Logged Out Sites Table: "+e.message);
					BackgroundStorage.remove("account");
					Options.Account.build.loggedOut();
					UtilsDialog.Alert("There was a database problem. Please try again.");
				}
			},
			transferLoggedOutSongs : function(){
				jQuery(window).bind("Migration.LoggedInSongsInserted", Options.Account.migrateTables.loggedIn.transferLoggedOutSites);
				jQuery(window).bind("Song.allSongs", Back.BackgroundSQL.Migration.insertLoggedInSongs);
				Back.BackgroundSQL.Songs.select.allSongs("Songs");
			},
			transferLoggedOutSites : function(){
				jQuery(window).unbind("Migration.LoggedInSongsInserted", Options.Account.migrateTables.loggedIn.transferLoggedOutSites);
				jQuery(window).unbind("Song.allSongs", Back.BackgroundSQL.Migration.insertLoggedInSongs);
				jQuery(window).bind("Migration.LoggedInSitesInserted", Options.Account.migrateTables.loggedIn.transferLoggedOutDone);
				jQuery(window).bind("Site.allSites", Back.BackgroundSQL.Migration.insertLoggedInSites);
				Back.BackgroundSQL.Sites.selectAllSites("Sites");
			},
			transferLoggedOutDone : function(e){
				jQuery(window).bind("Sync.InsertDone", Options.Account.migrateTables.loggedIn.syncDone);
				Options.Account.sync.startSync();
			},
			syncDone : function(){
				jQuery(window).unbind("Sync.InsertDone", Options.Account.migrateTables.loggedIn.syncDone);
			}
		},
		loggedOut : {
			dropLoggedInSongsTable : function(){
				BackgroundLog.Log("Options.Account.migrateTables.loggedOut.dropLoggedInSongsTable");
				jQuery(window).bind("Migration.dropLoggedInSongsTable", Options.Account.migrateTables.loggedOut.dropLoggedInSitesTable);
				Back.BackgroundSQL.Migration.dropLoggedInSongsTable();
			},
			dropLoggedInSitesTable : function(e){
				BackgroundLog.Log("Options.Account.migrateTables.loggedOut.dropLoggedInSitesTable");
				jQuery(window).unbind("Migration.dropLoggedInSongsTable", Options.Account.migrateTables.loggedOut.dropLoggedInSitesTable);
				jQuery(window).bind("Migration.dropLoggedInSitesTable", Options.Account.migrateTables.loggedOut.done);
				Back.BackgroundSQL.Migration.dropLoggedInSitesTable();
			},
			done : function(e){
				BackgroundLog.Log("Options.Account.migrateTables.loggedOut.done");
				jQuery(window).unbind("Migration.dropLoggedInSitesTable", Options.Account.migrateTables.loggedOut.done);
				Back.BackgroundEvents.Trigger({"type" : "Account.LoggedOut"});
			}
		}
	}
}	
window.addEventListener('load', Options.Account.init);

jQuery(window).bind("Sync.done", Options.Account.sync.done);
jQuery(window).bind("Sync.start", Options.Account.sync.start);