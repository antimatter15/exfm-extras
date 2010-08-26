/*
name: options-errorlog
author: Dan Kantor
requires: options, jquery-1.3.2, md5, background-storage
*/


Options.ErrorLog = {
	open : false,
	init : function(){
		jQuery('#logToggle').bind('click', Options.ErrorLog.toggleClick);
		jQuery('#logToggleText').bind('click', Options.ErrorLog.toggleClick);
		jQuery('#logCopy').bind('click', Options.ErrorLog.copyClick);
		jQuery('#logSend').bind('click', Options.ErrorLog.sendClick);
	},
	toggleClick : function(e){
		if (Options.ErrorLog.open == false){
			Options.ErrorLog.show();
		} else {
			Options.ErrorLog.hide();
		}
	},
	show : function(){
		jQuery('#logToggle').removeClass('logTogglePlus');
		jQuery('#logToggle').addClass('logToggleMinus');
		var logStore = BackgroundStorage.get("logStore");
		if (logStore != null){
			var html = "";
			for (var i = 0; i < logStore.length; i++){
				var item = logStore[i];
				var date = new Date(item.date);
				//var dateString = Utils.DayStrings[date.getDay()]+', '+Utils.MonthStrings[date.getMonth()]+' '+date.getDate()+', '+date.getFullYear();
				var dateString = Utils.FixMonth(date.getMonth())+'/'+date.getDate()+'/'+date.getFullYear();
				var timeString = Utils.To12Hour(date.getHours())+':'+Utils.FixZeroes(date.getMinutes())+':'+Utils.FixZeroes(date.getSeconds())+''+Utils.AMPM(date.getHours());
				html += "<div class=\"logItem\"><span>"+dateString+" "+timeString+":</span> "+item.msg+"</div>";
			}
			jQuery('#logText').html(html);
		}
		//jQuery('#logShow').css('height', '340px');
		jQuery('#logShow').css('display', 'block');
		Options.ErrorLog.open = true;
	},
	hide : function(){
		jQuery('#logToggle').removeClass('logToggleMinus');
		jQuery('#logToggle').addClass('logTogglePlus');
		jQuery('#logShow').css('display', 'none');
		Options.ErrorLog.open = false;
	},
	copyClick : function(){
		var logStore = BackgroundStorage.get("logStore");
		if (logStore != null){
			var html = "";
			try {
					html += "Version: "+Back.BackgroundMain.Version+'\n\n';
				} catch (e){}
			try {
				html += navigator.appVersion+'\n\n';
			} catch (e){}
			for (var i = 0; i < logStore.length; i++){
				var item = logStore[i];
				var date = new Date(item.date);
				//var dateString = Utils.DayStrings[date.getDay()]+', '+Utils.MonthStrings[date.getMonth()]+' '+date.getDate()+', '+date.getFullYear();
				var dateString = Utils.FixMonth(date.getMonth())+'/'+date.getDate()+'/'+date.getFullYear();
				var timeString = Utils.To12Hour(date.getHours())+':'+Utils.FixZeroes(date.getMinutes())+':'+Utils.FixZeroes(date.getSeconds())+''+Utils.AMPM(date.getHours());
				html += dateString+" "+timeString+": "+item.msg+"\n";
			}
			jQuery('#copyTextArea').attr('value', html);
			document.getElementById('copyTextArea').select();
			document.execCommand("Copy");
			jQuery('#logText').addClass('logCopyFlash');
			setTimeout(function(){jQuery('#logText').removeClass('logCopyFlash')}, 300);
			//jQuery('#logText').animate({'background-color' : '#FFFFFF'}, 1000, function(){console.log('done')});
		}
	},
	sendClick : function(e){
		Options.ErrorLog.send.showDialog();
	},
	send : {
		showDialog : function(){
				var dialogBox = Utils.Dialog.create(true);
				jQuery(document.body).append(dialogBox);
				jQuery('#dialogBoxTop').text("Send Report");
				jQuery('#dialogBoxMiddle').html("<input type=\"text\" id=\"errorLogEmail\" placeholder=\"Email address (optional)\" /><textarea id=\"errorLogComments\" placeholder=\"Add Comments (optional)\"></textarea>");
				jQuery('#dialogBoxBottom').html("<div class=\"errorLogLoader\" id=\"logLoader\"></div><button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"errorReportSend\">Send</button>");
				Utils.Dialog.center();
				//Utils.Dialog.centerVertical();
				jQuery('#errorReportSend').bind('click', Options.ErrorLog.send.request);
		},
		request : function(){
			jQuery('#errorReportSend').unbind('click', Options.ErrorLog.send.request);
			jQuery('#logLoader').css('visibility', 'visible');
			var logStore = BackgroundStorage.get("logStore");
			if (logStore != null){
				var html = "";
				try {
					html += "Version: "+Back.BackgroundMain.Version+'<br>';
				} catch (e){}
				try {
					var lastSync = BackgroundStorage.get("BackgroundSync.LastSync");
					var iso = 'Never';
					if (lastSync != null){
						var date = new Date(lastSync);
						iso = Utils.FixMonth(date.getMonth())+'/'+date.getDate()+'/'+date.getFullYear()+' '+date.getHours()+':'+date.getMinutes()+''+Utils.AMPM(date.getHours());
					}
					html += 'Last Sync: '+iso+'<br>';
				} catch(e){}
				try {
					html += navigator.appVersion+'<br><br>';
				} catch (e){}
				try {
					html += jQuery('#errorLogEmail').attr('value')+'<br><br>';
				} catch(e){}
				try {
					html += jQuery('#errorLogComments').attr('value')+'<br><br>';
				} catch(e){}
				for (var i = 0; i < logStore.length; i++){
					var item = logStore[i];
					var date = new Date(item.date);
					var dateString = Utils.FixMonth(date.getMonth())+'/'+date.getDate()+'/'+date.getFullYear();
					var timeString = Utils.To12Hour(date.getHours())+':'+Utils.FixZeroes(date.getMinutes())+':'+Utils.FixZeroes(date.getSeconds())+''+Utils.AMPM(date.getHours());
					html += dateString+" "+timeString+": "+item.msg+"<br>";
				}
			jQuery.post(Utils.remoteServiceEndpoint()+'/logReport.php', {"log" : html}, Options.ErrorLog.send.response, "text");
		}
		},
		response : function(str){
			jQuery('#logLoader').css('visibility', 'hidden');
			jQuery('#dialogBoxTop').text("Report Sent!");
			jQuery('#dialogBoxMiddle').html("");
			jQuery('#dialogBoxBottom').html("<button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"closeErrorReportSend\">Close</button>");
			jQuery('#closeErrorReportSend').bind('click', Utils.Dialog.close);
		}
	},
	fadeOutCheck : function(){
		jQuery('#logCheck').animate({'opacity' : 0}, 1000, function(){ jQuery('#logCheck').css({'visibility' : 'hidden', 'opacity' : 1}) });
	}
}

window.addEventListener('load', Options.ErrorLog.init);