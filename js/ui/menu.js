//Struct MenuProperties
function MenuProperties() {

	this.showGrid = false;
	this.showPositions = false;
	this.showPaths = true;
	this.moveDelay = 500;
	this.sendAnalytics = localStorage.getItem('NO_ANALYTICS')? false : true;; //It will still ask the user to confirm
	this.player1 = PLAYER_HUMAN;
	this.player2 = PLAYER_HUMAN;

}
//End struct MenuProperties

//Class MenuManager
function MenuManager() {
	this.properties = new MenuProperties();
	this.rootMenu = new dat.GUI();	
	
	//Options
	var optionsMenu = this.rootMenu.addFolder('Options');
	optionsMenu.add(this.properties, 'showGrid');	
	optionsMenu.add(this.properties, 'showPositions');	
	optionsMenu.add(this.properties, 'showPaths');	
	optionsMenu.add(this.properties, 'moveDelay', 0, 10000);		
	optionsMenu.add(this.properties, 'sendAnalytics').onChange(this.onChangeAnalytics);
	
	//Root menu	
	var playerOptions = {Human:PLAYER_HUMAN,Network:PLAYER_NETWORK, Random:PLAYER_RANDOM, Timid:PLAYER_AB};	
	this.rootMenu.add(this.properties, 'player1', playerOptions).onChange(this.onChangePlayer);
	this.rootMenu.add(this.properties, 'player2', playerOptions).onChange(this.onChangePlayer);
}

//Events
MenuManager.prototype.onChangePlayer = function(val) {	
	game.players = new Players(menu.player1, menu.player2);	
	game.onMoveStart();
}

MenuManager.prototype.onChangeAnalytics = function(val) {	
	if (!val) localStorage.setItem('NO_ANALYTICS', true);
	else localStorage.removeItem('NO_ANALYTICS');
}