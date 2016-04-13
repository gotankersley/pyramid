var Elephant = (function() { //Elephant namespace (Module pattern)
	var INFINITY = 1000000;	
	var MAX_DEPTH = 8;
	var DEBUG = true;
	var LOSING_SCORE = 100;
	
	var bestMoveAtDepth = []; //The moved board state
	var bestScoreAtDepth = [];
	
	var losingUids = {};
	var actualTurn;
	Analytics.getLosses(function(losses) {
		losingUids = (!losses)? {} : losses; //This will be updated each time a report is sent		
	});
		
	//This assumes that there is at least one valid move to play
	function getMove(board) { 
		//Init
		var bb = board.bb;
		var turn = board.turn;
		actualTurn = turn;
		var player = bb[turn];
		var oppTurn = +(!turn);
		var opp = bb[oppTurn];
		bestMoveAtDepth = new Array(MAX_DEPTH);
		bestScoreAtDepth = new Array(MAX_DEPTH);
		
		
		//Alpha beta driver		
		var bestScore = negamax(player, opp, turn, -INFINITY, INFINITY, 0);				
		if (bestScore <= -INFINITY+MAX_DEPTH) { //Kobayashi maru (Probably gonna lose)
			if (DEBUG) console.log('Timid: Inevitable loss');						
			var playerKids = BB_getMoveBoards(player, opp, turn);			
			var bestHeurScore = -INFINITY;
			var bestHeurKid;
			for (var k = 1; k < playerKids.length; k+=2) {
				var kid = playerKids[k];
				var score = BB_heuristicScoreSide(kid, oppTurn) - BB_heuristicScoreSide(opp, turn);				
				if (score > bestHeurScore) {
					bestHeurScore = score;
					bestHeurKid = kid;
				}
			}
			var move = BB_deriveMove(player, bestHeurKid);			
			return move;//Make the best of a bad situation	
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
				var infin = INFINITY + (MAX_DEPTH - depth);
				bestScoreAtDepth[depth] = infin;
				return infin;
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
				else return -INFINITY + depth; //Loss				
			}
		}

		var curBB = [0,0];
		curBB[turn] = player;
		curBB[oppTurn] = opp;
		var curUid = BB_toUniqueId(curBB, turn);		
		var losingMids = losingUids[curUid];
		//Loop through available moves again to actually expand		
		var bestScore = -INFINITY;		
		if (needToBlock.length > 1) playerKids = needToBlock; //If we are forced to block, then those are the only possible moves		
		for (var k = 1; k < playerKids.length; k+=2) { 
			var kid = playerKids[k];
			var srcPos = BB_deriveSrc(player, kid);
			var destPos = playerKids[k+1];
			var newBB = [0,0];
			newBB[turn] = kid;
			newBB[oppTurn] = opp;
			var uniqueId = BB_toUniqueId(newBB, oppTurn);			
			var recursedScore;
			if (turn == actualTurn && losingMids) { //Board state has been saved - (But not necessarily this move has been saved) 
				var mid = srcPos + (destPos << 8);								
				var losingMidScore = losingMids[mid];
				if (losingMids[mid]) recursedScore = losingMidScore * LOSING_SCORE; //Check to see if move has been saved				
				else recursedScore = negamax(opp, kid, oppTurn, -beta, -Math.max(alpha, bestScore), depth+1); 
			}
			else recursedScore = negamax(opp, kid, oppTurn, -beta, -Math.max(alpha, bestScore), depth+1);						
			
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