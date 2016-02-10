var MC = (function() { //Poor man's namespace (module pattern)
	var MAX_ITERATIONS = 10;
	var INFINITY = 1000000;
	function getMove(board, onPlayed) {

		var bb = board.bb;
		//See if win available	
		
		var moves = board.getMoves();  //All non-loss
		var bestScore = -INFINITY;
		var bestKid = INVALID;  
		
		//Loop through each of the children to run the simulations
		for (var i = 0; i < moves.length; i++) {
        
			var scores = 0;
			for (var k = 0; k < MAX_ITERATIONS; k++) {
				scores += this.simulate(moves[i].clone());
			}
	}
	
	
	function simulate = function(bb) {
	
	}
	
	//Exports
	return {
		getMove:getMove
	}
}; //End namespace MC