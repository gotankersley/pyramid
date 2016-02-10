'use strict'
//Constants
var MOVE_DELAY = 3000;


//Class Game
function Game() {
	this.board = new Board(); //The main (current) board instance	
	this.stage = new Stage(this.board); //Used for drawing
	this.stage.addGameEvent('onMove', this.onMove.bind(this));
	
	this.players = new Players(PLAYER_HUMAN, PLAYER_HUMAN);
	
}


//Event methods
Game.prototype.onMoveStart = function() {	
	//if (this.board.isGameOver()) return;	
	if (this.players.getCurrent(this.board) != PLAYER_HUMAN) {		
		this.players.getMove(this.board, function(move) {			
			game.onMove(move);				
		});
	}	
}

Game.prototype.onMove = function(move) {
	var board = this.board;
	if (board.isValid(move)) {
		var prevTurn = this.board.getTurn();
		this.board.makeMove(move); //Changes turn	
		this.onMoveMade(move, prevTurn);
	}
}

Game.prototype.onMoveMade = function(move, prevTurn) {
	//Note that turn has already been changed
	var winInfo = this.board.getWin(prevTurn, move);		
	if (winInfo) this.onGameOver(winInfo);
	else {
		if (this.players.getCurrent(this.board) != PLAYER_HUMAN) { //Continue playing if not human
			//Give draw enough time to display board				
			setTimeout(this.onMoveStart.bind(this), MOVE_DELAY); 
		}
	}
}
Game.prototype.onGameOver = function(winInfo) {
	this.stage.onWin(winInfo);
	
}

//end class Game

	

