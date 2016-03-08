//Multi-threaded search - NOTE: slave = thread
var Pharoah = (function() { //Pharoah namespace (Module pattern)
	var INFINITY = 1000000;
	var MAX_THREADS = navigator.hardwareConcurrency; 
		
	var threadDoneCount;	
	var bb;
	var turn;
	var player;
	var oppTurn;
	var opp;
	var moves;
	var nextMoveId;
	var scores;
	var depths;
	
	var onComplete;	
	
	//This assumes that there is at least one valid move to play
	function getMove(board, callback) { 		
		onComplete = callback;
		
		//Init
		bb = board.bb;
		turn = board.turn;
		player = bb[turn];
		oppTurn = +(!turn);
		opp = bb[oppTurn];
				
		
		var movesWithStride = BB_getMoveBoards(player, opp, turn);
		//Remove stride to make it easier to work with
		moves = [];
		for (var m = 1; m < movesWithStride.length; m+=2) {
			var move = movesWithStride[m];
			moves.push(move);
									
			//Win check on top level
			var destPos = movesWithStride[m+1];
			
			//Win
			if (BB_isWin(move, turn, destPos)) {
				callback(BB_deriveMove(player, move));
				return;
			}
					
			
		}
		
		
		//Spawn a thread for each on the root's children
		//(Until the thread max, then spawn each time a new thread is free)	
		scores = new Array(moves.length);
		depths = new Array(moves.length);
		threadDoneCount = 0;		
		nextMoveId = 0;
		var limitedMoveCount = Math.min(MAX_THREADS, moves.length);
		for (var m = 0; m < limitedMoveCount; m++) {				
			startSlave(m);
		}
				
	}
	
	
	function onAllDone() {		
		//Make sure the last thread has finished	
		if (threadDoneCount == moves.length) { 
			var bestScore = -INFINITY;
			
			var bestMove;
			//console.log('Pharoah:');
			for (var m = 0; m < moves.length; m++) {
				var score = scores[m];
				var depth = depths[m];
				//console.log('%d - Score: %d, Depth %d', m, score, depth);
				if (score > bestScore) {
					bestScore = score;
					bestMove = m;
					bestDepth = depth;
				}
				else if (score == bestScore) {
					//Choose the quickest win
					if (score == INFINITY) { 
						if (depth < bestDepth) {
							bestScore = score;
							bestMove = m;
							bestDepth = depth;
						}
					}
					//Otherwise we want the deepest (most reliable?) score
					else { 
						if (depth > bestDepth) {
							bestScore = score;
							bestMove = m;
							bestDepth = depth;
						}
					}
				}
			}
			console.log('King Tut: ', bestScore, bestDepth);
			var move = BB_deriveMove(player, moves[bestMove]);					
			onComplete(move);
		}
	}
	
	function onSlaveDone(e) {
		var data = e.data; //e.g. {tid:0, score:0, depth:0}		
		scores[data.tid] = -data.score; //NOTE: Reversed 'cause minimax
		depths[data.tid] = data.depth + 1; //
		threadDoneCount++;		
		//console.log('Finished %d', data.tid);		
		if (nextMoveId < moves.length) startSlave(nextMoveId);
		else onAllDone();						
	}
	
	function startSlave(m) { //Async recursive
		//console.log('Starting thread %d', m);		
		var slave = new Worker('js/players/slave.js?' + m + '#' + getUniqueId(m));
		nextMoveId++;
		slave.onmessage = onSlaveDone;

	}
	
	function getUniqueId(m) {
		var newBB = [0,0];
		newBB[turn] = moves[m];
		newBB[oppTurn] = opp;
		return BB_toUniqueId(newBB, oppTurn);
	}
	
	
	//Exports
	return {getMove:getMove};
})(); //End Pharoah namespace