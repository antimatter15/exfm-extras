/*
name: options
author: Dan Kantor
requires: jquery-1.3.2, md5, background-storage
*/

if (typeof(Options) == 'undefined'){
	Options = {}
}

Options.EventHandler = function(data){
	jQuery(window).trigger(data);
}

var Back = chrome.extension.getBackgroundPage();
Back.BackgroundEvents.Register("Options.EventHandler", Options.EventHandler);

/*****************************************************************
*
* Utils
*
******************************************************************/
Options.Utils = {
	sectionDescription : function(e) {
		var id = jQuery(this).attr('id');
		var text = jQuery('#'+id+'Text').text();
		alert(text)
	},
	showVersionNmuber : function(e){
		jQuery('#versionNumber').text("Ver. "+Back.BackgroundMain.Version);
	}
}

window.addEventListener("load", Options.Utils.showVersionNmuber);
//jQuery('.sectionDescription').live("click", Options.Utils.sectionDescription);