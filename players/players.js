var PLAYER_HUMAN = 0;
var PLAYER_RANDOM = 1;

var INVALID = -1;

//Class Players - Manager class
function Players(playerType1, playerType2) {	
	this.player1 = (typeof(playerType1) != 'undefined')? playerType1 : PLAYER_HUMAN;
	this.player2 = (typeof(playerType2) != 'undefined')? playerType2 : PLAYER_HUMAN;	
}

Players.prototype.getCurrent = function(board) {
	if (board.getTurn() == BOARD_PLAYER1) return this.player1;
	else return this.player2;	
}

Players.prototype.getMove = function(board, onPlayed) {
	//Handle no-move, and one move
	var moves = board.getMoves();
	if (moves.length == 0) onPlayed({r:INVALID, c:INVALID});
	else if (moves.length == 1) onPlayed(moves[0]);
	
	var player = this.getCurrent(board);
	var move;
	//Random
	if (player == PLAYER_RANDOM) move = this.getRandom(board);
	
	//Invalid
	else move = {sr:INVALID, sc:INVALID};
	onPlayed(move); //Callback
}

Players.prototype.getRandom = function(board) {
	var moves = board.getMoves();	
	if (moves.length == 0) return {sr: INVALID, sc:INVALID};	
	else return moves[Math.floor(Math.random() * moves.length)];
}

//End class Players