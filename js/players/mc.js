var MC = (function() { //Poor man's namespace (module pattern)
	var MAX_ITERATIONS = 10000;
	var INFINITY = 1000000;
	var MC_WIN = 2;
	var MC_LOSE = -2;	
	var MOVE_LIMIT = 60;
	function getMove(board) {		
			
		var bb = board.bb;
		//See if win available	
		var turn = board.turn;
		var oppTurn = +(!turn);
		var player = bb[turn];
		var opp = bb[oppTurn];
		var bestScore = -INFINITY;
		var bestKid = INVALID;  
		var kids = BB_getMoveBoards(player, opp, turn);
		//Win check on top level
		for (var k = 1; k < kids.length; k+=2) { 
			var kid = kids[k];
			var destPos = kids[k+1];
			
			//Win
			if (BB_isWin(kid, turn, destPos)) {
				return BB_deriveMove(player, kid);
			}
			
		}
		
		//Loop through each of the children to run the simulations
		for (var k = 1; k < kids.length; k+=2) {
			var kid = kids[k];
			var score = 0;
			var newBB = [0,0];
			newBB[turn] = kid;
			newBB[oppTurn] = opp;
			var uniqueId = BB_toUniqueId(newBB, oppTurn);
			
			for (var i = 0; i < MAX_ITERATIONS; i++) {
				
				score += simulate(opp, kid, oppTurn, turn, uniqueId);
			}
			if (score > bestScore) {
				bestScore = score;
				bestKid = kid;
			}
			
		}
		console.log(bestScore);
		return BB_deriveMove(player, bestKid);
	}
	
	
	function simulate(player, opp, turn, oppTurn, initialId) {
		var curTurn = oppTurn; //'Cause this starts at depth = 0
		var uniqueIds = {initialId};
		for (var i = 0; i < MOVE_LIMIT; i++) {			
			//Loop through player kids
			var playerKids = BB_getMoveBoards(player, opp, turn);
			var allDests = playerKids[0];
			for (var k = 1; k < playerKids.length; k+=2) { 
				var kid = playerKids[k];
				var destPos = playerKids[k+1];
				
				//Win
				if (BB_isWin(kid, turn, destPos)) {
					if (curTurn == turn) return MC_WIN;
					else return MC_LOSE;
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
					else { //Loss	
						if (curTurn == turn) return MC_LOSE;
						else return MC_WIN;						
					}
				}
			}
			
			//Loop through available moves again to actually expand					
			//if (needToBlock.length > 1) playerKids = needToBlock; //If we are forced to block, then those are the only possible moves		
			var randKid = playerKids[Math.floor(Math.random() * Math.floor((playerKids.length-1)/2))];						
			
			//Make move and change turn
			player = opp; //Switch player boards at the same time
			opp = randKid;
			turn = oppTurn;
			oppTurn = +(!turn);
			
			var newBB = [0,0];
			newBB[turn] = player;
			newBB[oppTurn] = opp;
			var uniqueId = BB_toUniqueId(newBB, oppTurn);
			//console.log(BB_url(uniqueId));
			if (uniqueIds[uniqueId]) return 0;
			else uniqueIds[uniqueId] = true;
		} //End of game simulation loop
		
		//Give half value for the signal flag being set
		var signals = Array(2);
		signals[turn] = (player & SIGNAL_MASK) >>> 20;
		signals[oppTurn] = (opp & SIGNAL_MASK) >>> 20;
		var s = signals[curTurn] - signals[+(!curTurn)];
		return s;
		//return (Math.random() * 0.5) + s;
	}
	
	//Exports
	return {
		getMove:getMove
	}
})(); //End namespace MC