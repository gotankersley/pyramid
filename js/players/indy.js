var Indy = (function() { //Network namespace (Module pattern)
	var URL = 'http://schneiderbox.net:5000/think/'; //For other domains add "Access-Control-Allow-Origin: *" to the header
	
	function getMove(board, onComplete) {				
		var queryString = board.getQBN();
		var url = URL + queryString;
		ajax(url, function(data, status) {
			//Expect a QMN String - Example: A5-B4  (dash is optional)
			var qmnStr = data.qmn;
			if (data.hasOwnProperty('log')) console.log(data.log); //Optional argument to log info 
			var move = board.qmnToRC(qmnStr);			
			onComplete(move);			
		});
		
	}
	
	//Vanilla J/S equivalent of jQuery's $.ajax
	function ajax(url, callback) { 
		var xhr = new XMLHttpRequest();
		xhr.open('GET', encodeURI(url));
		xhr.onload = function() {
			var data = JSON.parse(xhr.responseText);
			callback(data, xhr.status);			
		};
		xhr.send();
	}
	
	//Exports
	return {getMove:getMove};

})(); //End Indy namespace