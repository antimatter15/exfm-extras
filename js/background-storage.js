/*
name: background-storage
author: Dan Kantor
*/
if (typeof(BackgroundStorage) == 'undefined'){

BackgroundStorage = {
	set : function(key, obj){
		var value = JSON.stringify(obj);
		try {
			localStorage.setItem(key, value);
		} catch (e){}
	},
	get : function(key){
		var obj = null;
		try {
			var str = localStorage.getItem(key);
			if (str != null){
				obj = JSON.parse(str);
			}
		} catch (e){}
		return obj;
	},
	remove : function(key){
		try {
			localStorage.removeItem(key);
		} catch (e){}
	},
	clear : function(){
		try {
			localStorage.clear();
		} catch (e){}
	}
}

}