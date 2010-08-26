/*
name: options-search
author: Dan Kantor
requires: options, jquery-1.3.2, md5, background-storage
*/


Options.Search = {
	init : function(){
		jQuery('.searchRadioButton').bind('click', Options.Search.click);
		var value = BackgroundStorage.get("searchEnabled");
		if (value == "enabled"){
			jQuery('#searchRadioEnabled').attr('checked', 'checked');
		}
	},
	click : function(e){
		var value = jQuery(this).attr('value');
		Options.Search.set(value);
	},
	set : function(value){
		BackgroundStorage.set("searchEnabled", value);
	}
}
window.addEventListener('load', Options.Search.init);