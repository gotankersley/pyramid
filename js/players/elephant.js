var Elephant = (function() { //Elephant namespace (Module pattern)
	var INFINITY = 1000000;	
	var MAX_DEPTH = 8;
	var DEBUG = true;
	
	var bestMoveAtDepth = []; //The moved board state
	var bestScoreAtDepth = [];
	
	var losingUids = {};
	
	Analytics.getLosses(function(losses) {
		losingUids = losses;
		console.log('done', losingUids);
	});
		
	//This assumes that there is at least one valid move to play
	function getMove(board) { 
		
		//Init
		var bb = board.bb;
		var turn = board.turn;
		var player = bb[turn];
		var oppTurn = +(!turn);
		var opp = bb[oppTurn];
		bestMoveAtDepth = new Array(MAX_DEPTH);
		bestScoreAtDepth = new Array(MAX_DEPTH);
		
		
		//Alpha beta driver		
		var bestScore = negamax(player, opp, turn, -INFINITY, INFINITY, 0);				
		if (bestScore == -INFINITY) { //Probably gonna lose		
			if (DEBUG) console.log('Elephant: Inevitable loss');
			var moves = board.getMoves();			
			return moves[Math.floor(Math.random() * moves.length)]; //TODO: Make a random move - hope springeth eternal...			
		}
		else {
			//DEBUG
			if (DEBUG) {				
				var newBB = [0,0];
				newBB[turn] = player;
				newBB[oppTurn] = opp;
				console.log('Elephant:', bestScore);
				//for (var m = 0; m < MAX_DEPTH; m++) {
				//	var moved = bestMoveAtDepth[m];
				//	if (moved === undefined || moved == INVALID || !moved) break;
				//	newBB[turn] = moved;	
				//	turn = +(!turn);
				//	var uniqueId = BB_toUniqueId(newBB, turn);
				//	console.log(BB_url(uniqueId), bestScoreAtDepth[m]);
				//}
			}
			//END-DEBUG
			var moved = bestMoveAtDepth[0];						
			return BB_deriveMove(player, moved);
		}
	}

	//Recursive Alpha-Beta tree search	
	function negamax (player, opp, turn, alpha, beta, depth) { 				
		var oppTurn = +(!turn);		
						
		//Anchor
		if (depth >= MAX_DEPTH) { //Max depth - Score
			//There shouldn't be any terminal nodes, (since they'd be found in the expansion)									
			return BB_heuristicScoreSide(player, turn) - BB_heuristicScoreSide(opp, oppTurn);									
		}
		
		//TODO: sort moves for greater glory?
		
		//EXPANSION
		bestMoveAtDepth[depth] = INVALID;		
		
		//Loop through player kids
		var playerKids = BB_getMoveBoards(player, opp, turn);
		var allDests = playerKids[0];
		for (var k = 1; k < playerKids.length; k+=2) { 
			var kid = playerKids[k];
			var destPos = playerKids[k+1];
			
			//Win
			if (BB_isWin(kid, turn, destPos)) {
				bestMoveAtDepth[depth] = kid;
				bestScoreAtDepth[depth] = INFINITY;
				return INFINITY;
			}
			
		}
	
		//Loop through opponent kids - See if we need to block a win
		var needToBlock = [0];
		var oppKids = BB_getMoveBoards(opp, player, oppTurn);			
		for (var k = 1; k < oppKids.length; k+=2) { 
			var kid = oppKids[k];
			var destPos = oppKids[k+1];
			
			//Opponent Win
			if (BB_isWin(kid, oppTurn, destPos)) {
				//See if we can block it				
				if (allDests & kid) { 
					//We can block it - but there might be multiple ways to block
					var pinsInRange = (player & AVAIL_MOVES[destPos]);
					while (pinsInRange) { //Bitscan loop
						var minBit = pinsInRange & -pinsInRange; //Isolate least significant bit
						var src = MASK_TO_POS[minBit>>>0];
						needToBlock.push(BB_move(player, turn, src, destPos));
						needToBlock.push(destPos);
						pinsInRange &= pinsInRange-1;
					}//end bitscan loop					
					break; //There might be other losses, (and this is actually a terminal node), but this assumes that it'll be more efficient to ignore it
				}
				else return -INFINITY; //Loss					
			}
		}

		//Loop through available moves again to actually expand		
		var bestScore = -INFINITY;		
		if (needToBlock.length > 1) playerKids = needToBlock; //If we are forced to block, then those are the only possible moves		

		for (var k = 1; k < playerKids.length; k+=2) { 
			var kid = playerKids[k];
			var destPos = playerKids[k+1];
			var newBB = [0,0];
			newBB[turn] = kid;
			newBB[oppTurn] = opp;
			var uniqueId = BB_toUniqueId(newBB, oppTurn);
			
			var recursedScore = recursedScore = negamax(opp, kid, oppTurn, -beta, -Math.max(alpha, bestScore), depth+1);						
			
			var currentScore = -recursedScore;

			if (currentScore > bestScore) { //Eeny, meeny, miny, moe...
				bestScore = currentScore;
				bestMoveAtDepth[depth] = kid;	
				bestScoreAtDepth[depth] = currentScore;				
				if (bestScore >= beta) return bestScore;//AB cut-off
			}			
			
		}		
		
		return bestScore;
	}	
	
	//Exports
	return {getMove:getMove};
})(); //End Elephant namespace