var PLAYER_HUMAN = 0;
var PLAYER_RANDOM = 1;
var PLAYER_TIMID = 2;
var PLAYER_HEURISTIC = 3;
var PLAYER_NETWORK = 4;
var PLAYER_MC = 5;
var PLAYER_ALPHA_CARLO = 6;
var PLAYER_INDY = 7;
var PLAYER_PHAROAH = 8;
var PLAYER_ELEPHANT = 9;


var INVALID = -1;
var NO_MOVES_AVAILABLE = -2;

//Class Players - Manager class
function Players(playerType1, playerType2) {	
	this.player1 = (typeof(playerType1) != 'undefined')? playerType1 : PLAYER_HUMAN;
	this.player2 = (typeof(playerType2) != 'undefined')? playerType2 : PLAYER_HUMAN;	
}

Players.prototype.getCurrent = function(board) {
	if (board.turn == BOARD_PLAYER1) return this.player1;
	else return this.player2;	
}

Players.prototype.getMove = function(board, onPlayed) {
	

	//Handle no-move, and one move
	var moves = board.getMoves();
	if (moves.length == 0) return onPlayed({sr:NO_MOVES_AVAILABLE});
	else if (moves.length == 1) return onPlayed(moves[0]);
	
	var player = this.getCurrent(board);
	
	//Network (Async)
	if (player == PLAYER_NETWORK) Network.getMove(board, onPlayed);
	else if (player == PLAYER_INDY) Indy.getMove(board, onPlayed);
	else if (player == PLAYER_PHAROAH) Pharoah.getMove(board, onPlayed);
	
	//Sync
	else { 
		var move;
		//Random
		if (player == PLAYER_RANDOM) move = this.getRandom(board);		
		
		//Heuristic
		//else if (player == PLAYER_HEURISTIC) move = Heuristic.getMove(board);
		
		//Timid 		
		else if (player == PLAYER_TIMID) move = Timid.getMove(board);		
		
		//Elephant 
		else if (player == PLAYER_ELEPHANT) move = Elephant.getMove(board);		
		
		//MC
		//else if (player == PLAYER_MC) move = MC.getMove(board);	
		
		//Alpha-Carlo
		//else if (player == PLAYER_ALPHA_CARLO) move = AlphaCarlo.getMove(board);		
		
		//Invalid
		else move = {sr:INVALID, sc:INVALID};
		return onPlayed(move); //Callback
	}
}

Players.prototype.getRandom = function(board) {
	var moves = board.getMoves();		
	if (moves.length == 0) return {sr: INVALID, sc:INVALID};	
	else return moves[Math.floor(Math.random() * moves.length)];
}

Players.getName = function(playerType) {
	
	if (playerType == PLAYER_HUMAN) return 'human';
	else if (playerType == PLAYER_RANDOM) return 'random'; 
	else if (playerType == PLAYER_TIMID) return 'timid';
	else if (playerType == PLAYER_HEURISTIC) return 'heuristic';
	else if (playerType == PLAYER_NETWORK) return 'network';
	else if (playerType == PLAYER_MC) return 'monte-carlo';
	else if (playerType == PLAYER_ALPHA_CARLO) return 'alpha-carlo';
	else if (playerType == PLAYER_INDY) return 'indy';
	else if (playerType == PLAYER_PHAROAH) return 'king-tut';
	else if (playerType == PLAYER_ELEPHANT) return 'elephant';
	else return 'unknown';
}
//End class Players