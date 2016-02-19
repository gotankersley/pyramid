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

//http://stackoverflow.com/questions/391979/get-client-ip-using-just-javascript
function getIpAddress(callback) {	
	function findIP(onNewIP){     //  onNewIp - your listener function for new IP, if not passed, it just gets printed to console
	  onNewIP = onNewIP || function(ip){ console.log('new IP found: ', ip);};      
	  var myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;   //compatibility for firefox and chrome
	  var pc = new myPeerConnection({iceServers:[]}), noop = function(){}, localIPs= {}, ipRegex=/([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g, key;      
	  function ipIterate(ip){
		if(!localIPs[ip]) onNewIP(ip);
		localIPs[ip]=true; 
	  }
	  pc.createDataChannel("");    //create a bogus data channel
	  pc.createOffer(function(sdp){	
		sdp.sdp.split('\n').forEach(function(line){
		  if(line.indexOf('candidate')<0)   return;
		  line.match(ipRegex).forEach(ipIterate);	  
		});
		pc.setLocalDescription(sdp, noop, noop);
	  }, noop);    // create offer and set local description
	  pc.onicecandidate = function(ice){  //listen for candidate events
		if(!ice || !ice.candidate || !ice.candidate.candidate || !ice.candidate.candidate.match(ipRegex))  return;
		ice.candidate.candidate.match(ipRegex).forEach(ipIterate);
		doneFindingIps = true;
	  }; 
	}
	var ips = [];
	var doneFindingIps = false;
	findIP(function(ip) {
		ips.push(ip);
		if (doneFindingIps) callback(ips);
	});
}

