//Struct MenuProperties
function MenuProperties() {
	this.animateHuman = this.getDefault('animateHuman', false);
	this.arena = function() {window.location = 'arena.html'; }
	this.bitTool = function() {window.location = 'bit-tool.html'; }	
	this.centerWinVariant = false;
	this.moveDelay = 100;
	this.moveSpeed = 500;
	this.player1 = PLAYER_HUMAN;
	this.player2 = PLAYER_HUMAN;
	this.reset = this.resetPersisted;
	this.sendAnalytics = localStorage.getItem('NO_ANALYTICS')? false : true;; //It will still ask the user to confirm
	this.showGrid = this.getDefault('showGrid', false);
	this.showPositions = this.getDefault('showPositions', false);
	this.showPaths = this.getDefault('showPaths', true);	
	this.theme = this.getDefault('theme', 'default');
	this.wiki = function() {window.location = 'https://github.com/gotankersley/pyramid/wiki'; }
}

MenuProperties.prototype.getDefault = function(propertyName, defaultValue) {
	propertyName = MENU_PREFIX + propertyName;
	if (localStorage.getItem(propertyName) !== null) {
		var val = localStorage.getItem(propertyName);
		if (val == 'true') return true;
		else if (val == 'false') return false;
		else return val;
	}
	else return defaultValue;
}

MenuProperties.prototype.resetPersisted = function() {
	var toRemove = [];
	for (var i = 0; i < localStorage.length; i++){
		var key = localStorage.key(i);	
		console.log(key);
		if (key.indexOf(MENU_PREFIX) === 0) toRemove.push(key);					
	}	
	
	for (var i = 0; i < toRemove.length; i++) {
		localStorage.removeItem(toRemove[i]);
	}
	
	if (confirm('Refresh now?')) window.location.reload();
}
//End struct MenuProperties

//Class MenuManager
var MENU_PREFIX = 'PYRA.';
function MenuManager() {
	var PLAYER_OPTIONS = {Human:PLAYER_HUMAN,Indy:PLAYER_INDY, Network:PLAYER_NETWORK, Random:PLAYER_RANDOM, Timid:PLAYER_AB, 'King Tut':PLAYER_PHAROAH};	
	var THEME_OPTIONS = Object.keys(THEMES);
	
	this.properties = new MenuProperties();
	this.rootMenu = new dat.GUI();	
	
	//Options - secondary root
	var optionsMenu = this.rootMenu.addFolder('Options');	

	//Display menu
	var displayMenu = optionsMenu.addFolder('Display');
	displayMenu.add(this.properties, 'showGrid').onChange(this.persistChange);	
	displayMenu.add(this.properties, 'showPositions').onChange(this.persistChange);	
	displayMenu.add(this.properties, 'showPaths').onChange(this.persistChange);	
	displayMenu.add(this.properties, 'theme', THEME_OPTIONS).onChange(this.onChangeTheme);
	
	//Links menu
	var linksMenu = optionsMenu.addFolder('Links');
	//linksMenu.add(this.properties, 'arena');
	linksMenu.add(this.properties, 'bitTool');
	linksMenu.add(this.properties, 'wiki');
	
	//Animation menu
	var animMenu = optionsMenu.addFolder('Animation');
	animMenu.add(this.properties, 'animateHuman').onChange(this.persistChange);
	animMenu.add(this.properties, 'moveSpeed', 0, 10000);		
	animMenu.add(this.properties, 'moveDelay', 0, 10000);		
			
	optionsMenu.add(this.properties, 'sendAnalytics').onChange(this.onChangeAnalytics);
	optionsMenu.add(this.properties, 'centerWinVariant').onChange(this.onChangeVariant);
	optionsMenu.add(this.properties, 'reset');
	
	//Root menu		
	this.rootMenu.add(this.properties, 'player1', PLAYER_OPTIONS).onChange(this.onChangePlayer);
	this.rootMenu.add(this.properties, 'player2', PLAYER_OPTIONS).onChange(this.onChangePlayer);
}

//Events
MenuManager.prototype.onChangePlayer = function(val) {	
	game.players = new Players(menu.player1, menu.player2);	
	game.startMove();
}

MenuManager.prototype.onChangeTheme = function(val) {	
	localStorage.setItem(MENU_PREFIX + 'theme', menu.theme);
	Stage.changeTheme(menu.theme);		
}

MenuManager.prototype.onChangeAnalytics = function(val) {	
	if (!val) localStorage.setItem('NO_ANALYTICS', true);
	else localStorage.removeItem('NO_ANALYTICS');
}

MenuManager.prototype.onChangeVariant = function(val) {	
	//Swap
	var tmpIsWinFn = BB_isWin_Varient;
	BB_isWin_Varient = BB_isWin;
	BB_isWin = tmpIsWinFn;
	
	var tmpScoreFn = BB_heuristicScoreSide_Varient;
	BB_heuristicScoreSide_Varient = BB_heuristicScoreSide;
	BB_heuristicScoreSide = tmpScoreFn;
	
	var tmpTriFn = Board.prototype.getWinTriangle_Varient;
	Board.prototype.getWinTriangle_Varient = Board.prototype.getWinTriangle;
	Board.prototype.getWinTriangle = tmpTriFn;
}

MenuManager.prototype.persistChange = function(val) {
	var propertyName = MENU_PREFIX + this.property;	
	localStorage.setItem(propertyName, val);	
}