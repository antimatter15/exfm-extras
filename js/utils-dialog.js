/*
name: utils-dialog
author: Dan Kantor
requires: jquery-1.3.2
*/


if (typeof(UtilsDialog) == 'undefined'){
	UtilsDialog = {}
}

UtilsDialog = {
	create : function(hasCloseButton){
		var closeButton = "";
		if (hasCloseButton == true){
			closeButton = "<div id=\"dialogBoxClose\"></div>";
		}
		var html = jQuery("<div id=\"dialogBox\">"+closeButton+"<div id=\"dialogBoxTop\"></div><div id=\"dialogBoxMiddle\"></div><div id=\"dialogBoxBottom\"></div></div>");
		jQuery('#dialogBoxClose').live('click', UtilsDialog.close);
		jQuery('.lightbox').css('visibility', 'visible');
		return jQuery(html);
	},
	close : function(){
		jQuery('#dialogBox').remove();
		jQuery('.lightbox').css('visibility', 'hidden');
		jQuery(window).trigger({"type" : "UtilsDialog.close"});
	},
	center : function(){
		var w = jQuery(document).width();
		var left = w/2-200;
		jQuery('#dialogBox').css('left', left);
	}
}

UtilsDialog.Alert = function(text){
	var dialogBox = UtilsDialog.create(false);
	jQuery(document.body).append(dialogBox);
	jQuery('#dialogBoxTop').html("<div class=\"dialogBoxTopCenter\">"+text+"</div>");
	jQuery('#dialogBoxMiddle').html("<div class=\"dialogBoxTopCenterFiller\"></div>");
	jQuery('#dialogBoxBottom').html("<button class=\"dialogBoxBottomButton connectionLoginButton\" id=\"dialogAlertOK\" value=\"yes\">OK</button>");
	UtilsDialog.center();
	jQuery('#dialogAlertOK').bind('click', UtilsDialog.close);
}