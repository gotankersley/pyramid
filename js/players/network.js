var Network = (function() { //Network namespace (Module pattern)
	var URL = '/pyramid/js/tools/network-test.js'; //For other domains add "Access-Control-Allow-Origin: *" to the header
	
	function getMove(board, onComplete) {		
		if (!networkUrl) networkUrl = prompt('Enter a service URL', URL);
		//var queryString = '?turn=' + board.bb[TURN];
		var queryString = board.getQBN();
		var url = networkUrl + queryString;
		ajax(url, function(data, status) {
			//Expect a QMN String - Example: A5-B4  (dash is optional)
			var qmnStr = data.qmn;
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

})(); //End Network namespace
var networkUrl = null;