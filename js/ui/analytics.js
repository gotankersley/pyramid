var Analytics = (function() { //Analytics namespace (module pattern)
	
	//URLS
	var URL_MODAL_CSS = 'css/modal.css';
	var URL_MODAL_LIB = 'js/lib/pico-modal-2.3.0.min.js';
	var URL_FIREBASE_CDN = 'https://cdn.firebase.com/js/client/2.2.1/firebase.js';
	var URL_FIREBASE_DATA = 'https://pyramidquadtria.firebaseio.com/data';
	
	//Delays
	var DELAY_ASK = 1500; //MS
	var DELAY_THANKS = 650; //MS
	
	function show(winner) {
		if (typeof(picoModal) == 'undefined') { //Load the modal library
			var delayTime = Date.now() + DELAY_ASK;				
			loadStyleFile(URL_MODAL_CSS, function() {
				loadScriptFile(URL_MODAL_LIB, function() {										
					setTimeout(showConfirm.bind(this, winner), delayTime - Date.now());
				});
			});
		}
		else setTimeout(showConfirm.bind(this, winner), DELAY_ASK);
		
	}
	
	function showConfirm(winner) {
		
		var content = 		
			'<h2>Send game data for analysis?</h2><br/>' +
			'<div>' +
			'<input class="name" type="text" placeholder="Optional name"/><br/>' +
			'<textarea class="comment" placeholder="Optional comment"></textarea><br/>' +
			'</div>' +
			'<div class="no-repeat-container"><label>Don\'t ask again <input type="checkbox" class="no-repeat" name="no-repeat" /></label></div>' +
			'<div>' +
			'<div class="button ok" style="">Ok</div>' +
			'<div class="button cancel">Cancel</div>' +
			'</div>';
		picoModal({
			content: content,
			overlayStyles: {},		
			modalClass: 'modal',
			modalStyles: {top:'200px'}
		})
		.afterCreate(function(modal){
			var dlg = modal.modalElem();
			var name = dlg.getElementsByClassName('name')[0];
			var comment = dlg.getElementsByClassName('comment')[0];
			var noRepeat = dlg.getElementsByClassName('no-repeat')[0];
			
			dlg.getElementsByClassName('cancel')[0].addEventListener('click', modal.close);
			dlg.getElementsByClassName('ok')[0].addEventListener('click', function() { 			
				if (noRepeat.checked) localStorage.setItem('NO_ANALYTICS', '1');
				var data = {
					winner:winner,
					name:name.value,
					comment:comment.value,
					p1:game.players.player1,
					p2:game.players.player2,
					time:Date.now(),
					log:game.history,
				}	
				sendAnalytics(data, dlg, modal);						
			});			
		})
		.afterClose(function (modal) { modal.destroy(); })
		.show();
	}			

	function sendAnalytics(data, dlg, modal) {
		dlg.innerHTML = 'Sending results...';
		var delayTime = Date.now() + DELAY_THANKS;	
		loadScriptFile(URL_FIREBASE_CDN, function() {
			//getIpAddress(function(ip) {
				//Add IP address to data
				//data.ip = ip;			
				//Send to database
				var db = new Firebase(URL_FIREBASE_DATA);
				db.push(data, function(err) {			
					
					setTimeout(function() {
						modal.close();	
					}, delayTime - Date.now());
				});
			//});
		});		
	}
	
	//Exports
	return {show:show};
	
})();
//End Analytics namespace