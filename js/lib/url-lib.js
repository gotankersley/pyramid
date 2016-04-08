//http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
function QueryString(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}


//http://www.sitepoint.com/dynamically-load-jquery-library-javascript/
function loadScriptFile(url, callback) {
	var script = document.createElement('script')
	script.type = 'text/javascript';

	if (script.readyState) { //IE
		script.onreadystatechange = function () {
			if (script.readyState == "loaded" || script.readyState == "complete") {
				script.onreadystatechange = null;
				callback();
			}
		};
	} 
	else { //Others
		script.onload = function () {
			callback();
		};
	}

	script.src = url;
	document.getElementsByTagName('head')[0].appendChild(script);
}

function loadStyleFile(url, callback) {
	var style = document.createElement('link')
	style.rel = 'stylesheet';	
	style.onload = function () {
		callback();
	};
	style.href = url;
	document.getElementsByTagName('head')[0].appendChild(style);
}


//http://youmightnotneedjquery.com/
function getIpAddress(callback) {
	var request = new XMLHttpRequest();
	request.open('GET', 'http://freegeoip.net/json/', true);

	request.onload = function() {
		if (request.status >= 200 && request.status < 400) { // Success!		
			var data = JSON.parse(request.responseText);	
			callback(data.ip);
		} 
		else callback('error getting ip'); //404, 500, etc
	};

	//request.onerror = callback('error getting ip');
	request.send();
}

function ajaxRequest(url, args, callback) { 
	var xhr = new XMLHttpRequest();
	xhr.open('POST', encodeURI(url));			
	xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xhr.onload = function() {
		var data = JSON.parse(xhr.responseText);
		callback(data, xhr.status);			
	};
	var argStr = 'data=' + JSON.stringify(args);
	xhr.send(argStr);
}