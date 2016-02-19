'use strict'
//Constants
var GAME_REPEAT_WINDOW = 8; //Check for repeats this far back

//Class Game
function Game(uniqueId) {
	this.board = new Board(uniqueId); //The main (current) board instance		
	uniqueId = this.board.getUniqueId(); //Update
	
	//Add initial state
	this.history = [uniqueId]; //History is for game log
	this.memory = {}; //Memory is for detecting repeats
	this.memory[uniqueId] = true;
	this.undoHistory = [];
	
	this.players = new Players(PLAYER_HUMAN, PLAYER_HUMAN);
	
	//Used for drawing
	this.stage = new Stage(this.board); 
	this.stage.addGameEvent('onMove', this.onMove.bind(this));		
	this.stage.addGameEvent('onUndoMove', this.onUndoMove.bind(this));		
	this.stage.addGameEvent('onRedoMove', this.onRedoMove.bind(this));		
}


//Event methods
Game.prototype.onMoveStart = function() {	
	
	if (this.players.getCurrent(this.board) != PLAYER_HUMAN) {			
		this.players.getMove(this.board.clone(), function(move) {			
			if (move.sr == NO_MOVES_AVAILABLE) this.onNoMovesAvailable();
			else game.onMove(move);				
		});
	}	
}

Game.prototype.onMove = function(move) {
	var board = this.board;
	if (board.isValid(move)) {
		var prevTurn = this.board.turn;
		this.board.makeMove(move); 				
		
		this.onMoveMade(move);
	}
	else if (this.players.getCurrent(board) != PLAYER_HUMAN) this.onInvalidMove(move);
}

Game.prototype.onMoveMade = function(move) {
	var board = this.board;	
	
	//Game over
	if (board.isGameOver(move)) {
		var boardCopy = board.clone();
		boardCopy.changeTurn();
		this.logCurrentState(boardCopy);
		this.onGameOver(board.turn)
	}
		
	//In play
	else {
		board.changeTurn(); //Change the turn
		
		//History and Memory
		this.logCurrentState(board);
	
		//Get the next move if the player is not human
		if (this.players.getCurrent(board) != PLAYER_HUMAN) { 
			//Give draw enough time to display board before AI users try to play again				
			setTimeout(this.onMoveStart.bind(this), menu.moveDelay); 
		}
	}
	
}

Game.prototype.onGameOver = function(winner) {

	//Option to send game analytics if it is a Human winner is playing an AI
	var players = [this.players.player1, this.players.player2];
	var winningPlayer = players[winner];
	var losingPlayer = players[+(!winner)];
	var winningHumanVsAI = false; //Don't send for AI players
	if (winningPlayer == PLAYER_HUMAN && losingPlayer != PLAYER_HUMAN) {	
		winningHumanVsAI = true;
	}	

	//Draw the win and other hoopla...
	this.stage.onWin(winner, winningHumanVsAI);
		
}

Game.prototype.onInvalidMove = function(move) {	
	console.log('INVALID move attempted:', move);
	alert('The player has attempted to make an invalid move - see console for more info');
}

Game.prototype.onNoMovesAvailable = function(move) {
	alert('Player has no moves available');
}

Game.prototype.onRepeat = function(board) {	
	if (this.stage.repeat === null) this.stage.repeat = 0;
	else this.stage.repeat++;
}

Game.prototype.onUndoMove = function() {
	if (this.history.length > 1) {	
		this.stage.repeat = null;
		var oldId = this.history.pop();
		this.undoHistory.push(oldId);
		delete this.memory[oldId];
		var newId = this.history.slice(-1);
		this.board = new Board(newId);
		this.stage.mode = MODE_SELECT_PIN;
		this.stage.board = this.board;		
	}
}

Game.prototype.onRedoMove = function() {	
	if (this.undoHistory.length > 0) {	
		var currentBoard = this.board.bb[this.board.turn];
		var savedId = this.undoHistory.pop();
		this.history.push(savedId);
		this.memory[savedId] = true;
		this.board = new Board(savedId);		
		this.board.changeTurn();		
		var move = BB_deriveMove(currentBoard, this.board.bb[this.board.turn]);
		this.stage.board = this.board;		
		
		//Check for Game over		
		if (this.board.isGameOver(move)) this.onGameOver(this.board.turn);		
		else this.board.changeTurn();
	}
}

//Helper function keep track of game history
Game.prototype.logCurrentState = function(board) {
	var uniqueId = board.getUniqueId();
	this.history.push(uniqueId);
	if (this.memory[uniqueId]) {
		if (this.history.slice(-GAME_REPEAT_WINDOW).indexOf(uniqueId) >= 0) this.onRepeat(board);
	}
	else {
		this.stage.repeat = null;
		this.memory[uniqueId] = true;
	}
}
//end class Game

	

