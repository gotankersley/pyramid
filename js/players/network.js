var networkUrl = null;
var Network = (function() { //Network namespace (Module pattern)
	var URL = 'http://localhost:5000/think/'; //For other domains add "Access-Control-Allow-Origin: *" to the header	
	
	function getMove(board, onComplete) {		
		if (!networkUrl) networkUrl = prompt('Enter a service URL', URL);		
		var queryString = board.getQBN();
		var url = networkUrl;// + queryString;
		var qbns = [];
		var history = game.history;
		for (var i = 0; i < history.length; i++) {
			var qbn = new Board(history[i]).getQBN();
			qbns.push(qbn);
		}		
		ajax(url, qbns, function(data, status) {
			//Expect a QMN String - Example: A5-B4  (dash is optional)
			var qmnStr = data.qmn;
			if (data.hasOwnProperty('log')) console.log(data.log); //Optional argument to log info 
			var move = board.qmnToRC(qmnStr);			
			onComplete(move);			
		});
		
	}
	
	//Vanilla J/S equivalent of jQuery's $.ajax
	function ajax(url, args, callback) { 
		var xhr = new XMLHttpRequest();
		xhr.open('POST', encodeURI(url));			
		xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			var data = JSON.parse(xhr.responseText);
			callback(data, xhr.status);			
		};
		xhr.send('qbns=' + JSON.stringify(args));
	}
	
	//Exports
	return {getMove:getMove};

})(); //End Network namespace