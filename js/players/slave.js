importScripts('../lib/bit-lib.js');
importScripts('../core/bitboard.js');

var INFINITY = 1000000;	
var VERY_MANY = INFINITY/2;
var MAX_DEPTH = 8;
var HORZ_DEPTH = 2;

//Start - Don't need no stinkn' post events
var rootUniqueId = location.hash.substr(1); 
var tid = parseInt(location.search.substr(1)); //Thread id
init(rootUniqueId, false);

var bestIdAtDepth;
var savedBestScore;
var savedBestDepth;

function init(rootId, horizonSearch) {
	
	//Extract values from uniqueId
	var bbTripple = BB_fromUniqueId(rootId);
	var bb = bbTripple.slice(0, 2);
	var turn = bbTripple[2];
	var oppTurn = +(!turn);
	var player = bb[turn];
	var opp = bb[oppTurn];	
	
	bestIdAtDepth = new Array(MAX_DEPTH);	
	
	//Driver for recursive search functions
	if (!horizonSearch) {				
		var bestScore = negamax(player, opp, turn, -INFINITY, INFINITY, 0);				
		
		//Get the best id found
		var bestId;
		var bestDepth = 0;
		for (var i = MAX_DEPTH - 1; i >= 0; i--) {
			bestDepth = i;
			var id = bestIdAtDepth[i];
			if (id === undefined || !id) continue;			
			
			bestId = id;
			break;			
		}		
		
		if (Math.abs(bestScore) == INFINITY) { //End found
			postMessage({tid:tid, score:bestScore, depth:bestDepth});
			setTimeout(function() {close(); }, 50);
			return;
		}		
		
		//Save the best id found		
		savedBestScore = bestScore;
		savedBestDepth = bestDepth;
		init(bestId, true); //Horizon search
	
	}
	else {	//Horizon search - (Quiescence search - sort of...)
		var bestScore = negascout(player, opp, turn, -VERY_MANY, VERY_MANY, 0);						
		
		
		//Send results to master
		var args = {tid:tid, depth:savedBestDepth};
		if (Math.abs(bestScore) == VERY_MANY) {
			args.score = bestScore + savedBestScore;
			var bestDepth = 0;
			for (var i = HORZ_DEPTH - 1; i >= 0; i--) {
				bestDepth = i;
				var id = bestIdAtDepth[i];
				if (id === undefined || !id) continue;			
				else break;			
			}	
			args.depth = savedBestDepth + bestDepth;
		}
		else args.score = savedBestScore;
		postMessage(args);
		
		//Exit
		setTimeout(function() {close(); }, 50);
		return;
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
	
	//EXPANSION
	bestIdAtDepth[depth] = null;		
	
	//Loop through player kids
	var playerKids = BB_getMoveBoards(player, opp, turn);
	var allDests = playerKids[0];
	for (var k = 1; k < playerKids.length; k+=2) { 
		var kid = playerKids[k];
		var destPos = playerKids[k+1];
		
		//Win
		if (BB_isWin(kid, turn, destPos)) {
			bestIdAtDepth[depth] = -1;			
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
			bestIdAtDepth[depth] = uniqueId;				
			if (bestScore >= beta) return bestScore;//AB cut-off
		}			
		
	}				
	return bestScore;		
}

function negascout (player, opp, turn, alpha, beta, depth) { 				
	var oppTurn = +(!turn);		
					
	//Anchor
	if (depth >= MAX_DEPTH) { //Max depth - Score
		return 0; //No terminal found yet
	}
	
	//EXPANSION
	bestIdAtDepth[depth] = null;
	
	//Loop through player kids
	var playerKids = BB_getMoveBoards(player, opp, turn);
	var allDests = playerKids[0];
	for (var k = 1; k < playerKids.length; k+=2) { 
		var kid = playerKids[k];
		var destPos = playerKids[k+1];
		
		//Win
		if (BB_isWin(kid, turn, destPos)) {
			bestIdAtDepth[depth] = -1;
			return VERY_MANY;		
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
			else {
				bestIdAtDepth[depth] = -1;
				return -VERY_MANY; //Loss					
			}
		}
	}

	//Loop through available moves again to actually expand		
	var bestScore = -VERY_MANY;		
	if (needToBlock.length > 1) playerKids = needToBlock; //If we are forced to block, then those are the only possible moves		

	for (var k = 1; k < playerKids.length; k+=2) { 
		var kid = playerKids[k];
		var destPos = playerKids[k+1];
	
		var recursedScore = recursedScore = negascout(opp, kid, oppTurn, -beta, -Math.max(alpha, bestScore), depth+1);								
		var currentScore = -recursedScore;

		if (currentScore > bestScore) { //Eeny, meeny, miny, moe...
			bestScore = currentScore;	
			bestIdAtDepth[depth] = -1;			
			if (bestScore >= beta) return bestScore;//AB cut-off
		}			
		
	}				
	return bestScore;		
}
