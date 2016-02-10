//Enums
var BOARD_EMPTY = 0;
var BOARD_PLAYER1 = 1;
var BOARD_PLAYER2 = 2;

//Class Board - A convenient wrapper around the Bitboard 'struct'
function Board() {	
	this.bb = BB_new();		
	this.VALID_SQUARES = [ //[row, col]
		[true,false,true,true,false,true],	//Row 0
		[false,true,false,false,true,false],//Row 1
		[true,false,true,true,false,true],  //Row 2
		[true,false,true,true,false,true],  //Row 3
		[false,true,false,false,true,false],//Row 4
		[true,false,true,true,false,true],  //Row 5
	];
}

Board.prototype.clone = function() {
	var board = new Board();
	board.bb = new Uint32Array(this.bb);
	return board;	
}

Board.prototype.get = function(r, c) {	
	var bb = this.bb;	
	var mpos = RC_TO_MASK[r][c];
	
	if (bb[P1] & mpos) return BOARD_PLAYER1;
	else if (bb[P2] & mpos) return BOARD_PLAYER2;	
	else return BOARD_EMPTY;
}

Board.prototype.qmnToPos = function(qmn) {
	//Quadtria Move Notation: [Source Quad Letter][Source Quad Id] - [Dest Quad Letter][Dest Quad Id]
	// - Case insensitive
	// - May contain a dash
	//Example: A5-B4 = pos 4 -> 8
	qmn = qmn.toLowerCase().replace('-', '');
	var QUAD_LETTER_TO_NUM = {a:0,b:1,c:2,d:3};
	var srcQuadLetter = qmn.charAt(0);
	var destQuadLetter = qmn.charAt(2);
		
	if (srcQuadLetter in QUAD_LETTER_TO_NUM && destQuadLetter in QUAD_LETTER_TO_NUM) {
		var srcQuad = QUAD_LETTER_TO_NUM[srcQuadLetter];
		var destQuad = QUAD_LETTER_TO_NUM[destQuadLetter];
		
		var srcPos = parseInt(qmn.charAt(1)) - 1;
		var destPos = parseInt(qmn.charAt(3)) - 1;
		if (srcPos >= 0 && srcPos < QUAD_SPACES && destPos >= 0 && destPos < QUAD_SPACES) {
			return {
				s: (srcQuad * QUAD_SPACES) + srcPos,
				d: (destQuad * QUAD_SPACES) + destPos,
			};
		}
		
	}
	return false;
}

Board.prototype.getMoves = function() {
	var movesOut = [];
	var moves = BB_getMoves(this.bb);
	var pins = Object.keys(moves);
	for (var i = 0; i < pins.length; i++) {
		var p = pins[i];
		var pinMoves = bitScan(moves[p]);
		for (var n = 0; n < pinMoves.length; n++) {
			movesOut.push({
				sr:POS_TO_R[p],
				sc:POS_TO_C[p],
				dr:POS_TO_R[pinMoves[n]],
				dc:POS_TO_C[pinMoves[n]]
			});							
		}
	}
	return movesOut;
}

Board.prototype.getMovesAssoc = function() {
	var movesOut = {};
	var moves = BB_getMoves(this.bb);
	var pins = Object.keys(moves);
	for (var i = 0; i < pins.length; i++) {
		var p = pins[i];
		movesOut[p] = bitScan(moves[p]);
	}
	return movesOut;
}

Board.prototype.getWin = function(prevTurn, prevMove) {
	var turn = prevTurn == (BOARD_PLAYER1)? P1 : P2;
	var dest = RC_TO_POS[prevMove.dr][prevMove.dc];	
	var bb = this.bb;
	if (BB_isWin(bb, turn, dest)) {
		var player = (bb[turn] & NOT_SIGNAL);
		for (var w = 0; w < WINS.length; w++) {
			var win = WINS[w];
			if ((player & win) == win) {				
				var points = bitScan(win);				
				return [ //Convert points to RC for easier drawing
					{r:POS_TO_R[points[0]], c:POS_TO_C[points[0]]}, //A 
					{r:POS_TO_R[points[1]], c:POS_TO_C[points[1]]}, //B 
					{r:POS_TO_R[points[2]], c:POS_TO_C[points[2]]}, //C 
				];
			}
		}
	}
	return null;
}

Board.prototype.isValid = function(move) {
	var moves = this.getMovesAssoc();
	var src = RC_TO_POS[move.sr][move.sc];
	var dest = RC_TO_POS[move.dr][move.dc];
	if (src in moves) {
		var dests = moves[src];
		if (dests.indexOf(dest) >= 0) return true;
	}
	return false;
}


Board.prototype.hasSignal = function(player) {
	if (player == BOARD_PLAYER1) return (this.bb[P1] & SIGNAL_MASK);
	else return (this.bb[P2] & SIGNAL_MASK);
}

Board.prototype.getTurn = function() {
	if (this.bb[TURN] == P1) return BOARD_PLAYER1;
	else return BOARD_PLAYER2;
}

Board.prototype.makeMove = function(move) {
	var src = RC_TO_POS[move.sr][move.sc];
	var dest = RC_TO_POS[move.dr][move.dc];
	BB_makeMove(this.bb, src, dest);
}

Board.prototype.toString = function() {
	return BB_toString(this.bb);
}

Board.prototype.print = function() {

}

//End class Board
