/* 
#About: This is a Quadtria bitboard implemented using javascript. 
#Mapping:
 - Bits 0 - 19 correspond to the board position of that number 
 - Bit 20 - Is the signal indicator for if the home quad has been cleared
 - Bits 21 - 31 are unassigned
 - The positions are arranged like this to make each quad's bits adjacent
 
  Physical Board:     ->  Bits positions:
	0 -- 1 - 5 -- 6     [ 31 - 21 ][  20  ][19-15][14-10][ 9-5 ][ 4-0 ] 		
	|  2 |   |  7 |     Unassigned][Signal][Quad3][Quad2][Quad1][Quad0]	
	3 -- 4 - 8 -- 9		
	|    | X |    |
	10 -11 - 15 -16
	| 12 |   | 17 |
	13 -14 - 18 -19
    
*/
//Constants

//Index maps
var MASK_TO_POS = {0x1:0,0x2:1,0x4:2,0x8:3,0x10:4,0x20:5,0x40:6,0x80:7,0x100:8,0x200:9,0x400:10,0x800:11,0x1000:12,0x2000:13,0x4000:14,0x8000:15,0x10000:16,0x20000:17,0x40000:18,0x80000:19,0x100000:20,0x200000:21};
var POS_TO_MASK = [0x1,0x2,0x4,0x8,0x10,0x20,0x40,0x80,0x100,0x200,0x400,0x800,0x1000,0x2000,0x4000,0x8000,0x10000,0x20000,0x40000,0x80000,0x100000];

var POS_TO_R = [0,0,1,2,2,0,0,1,2,2,3,3,4,5,5,3,3,4,5,5];
var POS_TO_C = [0,2,1,0,2,3,5,4,3,5,0,2,1,0,2,3,5,4,3,5];
var RC_TO_POS = [
	[0,null,1,5,null,6],        //Row 0
	[null,2,null,null,7,null],  //Row 1
	[3,null,4,8,null,9],        //Row 2
	[10,null,11,15,null,16],    //Row 3
	[null,12,null,null,17,null],//Row 4
	[13,null,14,18,null,19],    //Row 5
];

var RC_TO_MASK = [
	[0x1,null,0x2,0x20,null,0x40],				//Row 0
	[null,0x4,null,null,0x80,null],				//Row 1
	[0x8,null,0x10,0x100,null,0x200],			//Row 2
	[0x400,null,0x800,0x8000,null,0x10000],		//Row 3
	[null,0x1000,null,null,0x20000,null],		//Row 4
	[0x2000,null,0x4000,0x40000,null,0x80000],  //Row 5
];
var QUAD_SPACES = 5;
//Enums

var P1 = 0;
var P2 = 1;
var TURN = 2; //Turn index

//Masks
var SIGNAL_MASK = 0x100000;
var NOT_SIGNAL = 0xfffff; 
var THREE_NO_WIN1 = 0x15;
var THREE_NO_WIN2 = 0xe;

var INITIAL_P1 = 0x1f;
var INITIAL_P2 = 0xf8000;

var HOME_QUAD_MASKS = [0x1f, 0xf8000]; //By player
var QUAD_MASKS = [0x1f, 0x3e0, 0x7c00, 0xf8000]; //By quad pos

//Moves
var AVAIL_MOVES = [0xe,0x35,0x1b,0x415,0x890e,0x1c2,0x2a0,0x360,0x8ab0,0x101c0,0x3808,0xd510,0x6c00,0x5400,0x43800,0x70910,0xa8200,0xd8000,0xac000,0x70000]; //By position

//Wins
var QUAD_PIN_COUNT = [0,1,1,2,1,2,2,3,1,2,2,3,2,3,3,4,1,2,2,3,2,3,3,4,2,3,3,4,3,4,4,5];
var WINS = [ //No signal
	0x13,0x1a,0x19,0xb,0x7,0x16,0x1c,0xd, //Q0
	0x260,0x340,0x320,0x160,0xe0,0x2c0,0x380,0x1a0, //Q1
	0x4c00,0x6800,0x6400,0x2c00,0x1c00,0x5800,0x7000,0x3400, //Q2
	0x98000,0xd0000,0xc8000,0x58000,0x38000,0xb0000,0xe0000,0x68000 //Q3
]
var NON_HOME_QUAD_WIN = [ //By [player, pos]
	[false,false,false,false,false,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true], //Player 1
	[true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,false,false,false,false,false] //Player 2
];

//Struct BB - Obviously JS doesn't have actual structs. But we are using a similar concept here, avoiding the use of
//classes in order to reduce the additional overhead of prototypes.  (NOTE: I have no idea how big a difference this makes)
function BB_new() {	
	var bb = new Uint32Array([
		INITIAL_P1,	//p1
		INITIAL_P2,	//p2				
		P1,	//turn 
	]);
	return bb;
}


function BB_getScore(bb) { //Static evaluation function
	return 0;
}

function BB_isWin(bb, turn, destPos) {		
	var quadPos = Math.floor(destPos / QUAD_SPACES);
	var player = bb[turn];	
	var quad = (player & QUAD_MASKS[quadPos]) >>> (quadPos * QUAD_SPACES); //Shift quad to first spot	
	var count = QUAD_PIN_COUNT[quad];
	if (count >= 3) { 		
		if (count == 3) { //Verify that the three forms a valid winning triangle
			if ((player & THREE_NO_WIN1) != THREE_NO_WIN1 &&
				(player & THREE_NO_WIN2) != THREE_NO_WIN2) {
				if (player & SIGNAL_MASK) return true; //Home quad cleared, can win anywhere
				else return NON_HOME_QUAD_WIN[turn][destPos]; //Check to make sure the win isn't in the home quad
			}
		}
		else if (player & SIGNAL_MASK) return true; //More than three has to be a winning triangle, and home quad has been cleared
		else return NON_HOME_QUAD_WIN[turn][destPos]; //Has a win, but home quad isn't clear - so make sure win isn't in the home quad
	}
	
	return false;
}


function BB_getMoves(bb) {
	var turn = bb[TURN];
	var player = bb[turn];
	var opp = bb[+(!turn)]; //+ unary operator to convert bool true value to number
	var pins = bitScan(player);
	var moves = {};
	for (var i = 0; i < pins.length; i++) {
		var p = pins[i];
		var avail = AVAIL_MOVES[p];
		avail &= avail ^ (opp | player); //Can't move to a spot if there is a piece already there	
		moves[p] = avail;
	}
	return moves;
}

//TODO: Get all non-loss moves?

function BB_makeMove(bb, srcPos, destPos) {
	//This does not verify that the move is legal
	var turn = bb[TURN];
	var player = bb[turn];
	player ^= POS_TO_MASK[srcPos]; //Remove source
	player |= POS_TO_MASK[destPos]; //Add to dest
	if ((player & HOME_QUAD_MASKS[turn]) === 0) player |= SIGNAL_MASK; //Home quad clear - flip signal
	bb[turn] = player;
	bb[TURN] = !bb[TURN]; //Change turns	
}


function BB_toString(bb) {
	return '0x' + bb[P1].toString(16) + ', 0x' + bb[P2].toString(16) + ', Turn:' + bb[TURN];
}

//End struct BB