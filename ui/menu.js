//Struct MenuProperties
function MenuProperties() {

	this.showGrid = false;
	this.showPositions = false;
	this.showPaths = true;
	
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
	
	//Root menu	
	var playerOptions = {Human:PLAYER_HUMAN, Random:PLAYER_RANDOM};
	this.rootMenu.add(this.properties, 'player1', playerOptions).onChange(this.onChangePlayer);
	this.rootMenu.add(this.properties, 'player2', playerOptions).onChange(this.onChangePlayer);
}

//Events
MenuManager.prototype.onChangePlayer = function(val) {	
	game.players = new Players(menu.player1, menu.player2);	
	game.onMoveStart();
}