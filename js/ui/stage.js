'use strict'
var menu;
var Stage = (function() { //Stage namespace (module pattern)

	//Constants
	var CANVAS_SIZE_X = 600;
	var CANVAS_SIZE_Y = 640;

	var BOARD_COUNT = 6;
	var GRID_SIZE = CANVAS_SIZE_X;
	var GRID_UNIT = CANVAS_SIZE_X / BOARD_COUNT;
	var HALF_GRID = GRID_UNIT / 2;
	var QUAD_SIZE = GRID_SIZE / 2;

	var HOLE_SIZE;// = GRID_UNIT / 5; //Radius
	var PIN_SIZE = GRID_UNIT / 4;
	var HIGHLIGHT_SIZE = PIN_SIZE + 2;

	var SIGNAL_SIZE = 15;

	//Enums
	var MODE_SELECT_PIN = 0;
	var MODE_SELECT_HOLE = 1;
	var MODE_MOVE_ANIM = 2;
	var MODE_WIN = 3;

	//Properties	
	var ctx;
	var canvasBounds;
	var board;
	var cursorX = 0;
	var cursorY = 0;
	var curR = 0;
	var curC = 0;
	var selR = -1;
	var selC = -1;		
	var mode = MODE_SELECT_PIN;
	var winTriangle;
	var repeat = null;		
	var moveInfo = {};
	var theme;
	
	//Constructor-ish
	function init(newGame) { 
		board = game.board;						
		
		//Menu
		var menuManager = new MenuManager();
		menu = menuManager.properties;
		
		//Theme
		theme = THEMES[menu.theme];
		HOLE_SIZE = GRID_UNIT / theme.HOLE_WIDTH;
		
		//Canvas
		var canvas = document.getElementById('main-canvas');
		canvasBounds = canvas.getBoundingClientRect(); 
		ctx = canvas.getContext('2d');  
		ctx.font = 'bold 15px Verdana';
		ctx.lineWidth = theme.PATH_WIDTH;
		
		//Event callbacks
		canvas.addEventListener('click', onMouseClick.bind(this), false);
		canvas.addEventListener('mousemove', onMouseMove.bind(this), false);		
		window.addEventListener('keydown', onKeyDown.bind(this), false);		
		
		
		//Game event callbacks
		game.addEventListener('invalidMove', onGameInvalidMove.bind(this));
		game.addEventListener('noMovesAvailable', onGameNoMovesAvailable.bind(this));
		game.addEventListener('repeat', onGameRepeat.bind(this));
		game.addEventListener('win', onGameWin.bind(this));
		game.addEventListener('move', onGameMove.bind(this));
		game.addEventListener('moveMade', onGameMoveMade.bind(this));
		
		//Start rendering
		draw();
	}

	function changeTheme(newTheme) {
		theme = THEMES[newTheme];	
	}
	//Game Events
	function onGameInvalidMove(move) {	
		console.log('INVALID move attempted:', move);
		alert('The player has attempted to make an invalid move - see console for more info');
	}

	function onGameNoMovesAvailable(move) {
		alert('Player has no moves available');
	}
	
	function onGameRepeat(board) {	
		if (repeat === null) repeat = 0;
		else repeat++;
	}
	
	function onGameWin(winner, winningHumanVsAI) {
		winTriangle = board.getWinTriangle(); //Winning triangle points in R,C 			
		mode = MODE_WIN;
		
		//Show analytics dialog unless the user has hidden it
		if (winningHumanVsAI && menu.sendAnalytics) {
			Analytics.show(winner);
		}
		
	}
	
	function onGameMove(move, initiatingPlayer) {		
		//Verify move is valid
		if (game.isValidMove(move, initiatingPlayer)) {
			//Animate move
			moveAnimation(move, initiatingPlayer, function() {				
				//Update the board state
				game.makeMove(move); //Responds with appropriate callbacks
											
			});			
		}
		else if (initiatingPlayer != PLAYER_HUMAN) onGameInvalidMove(move);
	}
	
	function onGameMoveMade() {
		var newPlayer = game.players.getCurrent(board); 
		
		if (newPlayer == PLAYER_HUMAN) mode = MODE_SELECT_PIN; 
		
		//Get the next move if the player is not human,
		//with enough time to display board before the computer tries to play again
		else setTimeout(game.startMove.bind(game), menu.moveDelay); 				
	}
	
	//Mouse and Keyboard Events	
	function onKeyDown(e) {	
		var changed = false;		
		if (e.ctrlKey || e.keyIdentifier == 'Left' || e.keyIdentifier == 'Right') {
			//Undo move with Ctrl + Z
			if (e.keyCode == 90 || e.keyIdentifier == 'Left') { //90 is the z key
				changed = game.undoMove();
			}
			//Redo move with Ctrl + Y
			else if (e.keyCode == 89 || e.keyIdentifier == 'Right') { //88 is the y key
				changed = game.redoMove();
			}
			
			//Update state
			if (changed) {
				mode = MODE_SELECT_PIN;
				repeat = null;
				board = game.board;
			}
		}	
	}

	function onMouseMove(e) {	
		var x = e.clientX - canvasBounds.left; 
		var y = e.cursorY = e.clientY - canvasBounds.top;  
		
		curR = Math.floor(y/GRID_UNIT);
		curC = Math.floor(x/GRID_UNIT);
		
		cursorX = x;
		cursorY = y;
	}

	function onMouseClick(e) {
		//Get direction based on position
		if (mode == MODE_WIN) return;
		else if (mode == MODE_MOVE_ANIM) { //Snap to position
			mode = MODE_SELECT_PIN;
			return;
		}
		var x = e.clientX - canvasBounds.left; 
		var y = e.clientY - canvasBounds.top;  

		var r = Math.floor(y/GRID_UNIT);
		var c = Math.floor(x/GRID_UNIT);
		
		if (selR == -1 || mode == MODE_SELECT_PIN) {
			selR = r;
			selC = c;
			mode = MODE_SELECT_HOLE;
		}
		else if (mode == MODE_SELECT_HOLE){
			var move = {sr:selR, sc:selC, dr:r, dc:c};
			selR = -1;
			selC = -1;
			onGameMove(move, PLAYER_HUMAN);								
		}	

	}
	

	//Animation
	function moveAnimation(move, initiatingPlayer, callback) {	
		if (initiatingPlayer == PLAYER_HUMAN) {
			if (!menu.animateHuman) return callback();//Skip animation for human
		}
		mode = MODE_MOVE_ANIM;	
		moveInfo = {
			r:move.sr,
			c:move.sc,
			x:(move.sc * GRID_UNIT), 
			y:(move.sr * GRID_UNIT)
		};	
		var tween = new TWEEN.Tween(moveInfo)
		.to({x:(move.dc * GRID_UNIT), y:(move.dr * GRID_UNIT)}, menu.moveSpeed)	
		.easing(TWEEN.Easing.Quadratic.In)		
		.onUpdate(function() {				
			if (mode != MODE_MOVE_ANIM) { //Prematurely end animation				
				tween.stop();
				callback();
			}
		})
		.onComplete(callback)
		.start();
	}

	//Drawing
	function draw(time) { //Top-level drawing function	
		
		//Draw board background - also clears the canvas		
		ctx.fillStyle = theme.BOARD;
		ctx.fillRect(0, 0, CANVAS_SIZE_X, CANVAS_SIZE_Y);

		//Draw Grid (6x6)
		if (menu.showGrid) drawGrid();
		
		//Draw paths
		if (menu.showPaths) drawPaths();
			
		//Draw holes and pins		
		var turn = board.turn;
		for (var r = 0; r < BOARD_COUNT; r++) {
			var y = (r * GRID_UNIT);
			
			for (var c = 0; c < BOARD_COUNT; c++) {
				var x = (c * GRID_UNIT);
				
				if (board.VALID_SQUARES[r][c]) { //Not all the square in the grid a valid positions				
				
					//Holes
					drawHole(r, c);
					
					//Pins
					if (mode == MODE_MOVE_ANIM) {
						if (moveInfo.r != r || moveInfo.c != c) drawPin(x, y, r, c, turn);
					}
					else drawPin(x, y, r, c, turn);
					
					//Number info
					if (menu.showPositions) drawPosNumber(r, c);
				}
			}
		}
		
		//Animation
		if (mode == MODE_MOVE_ANIM) {			
			drawPin(moveInfo.x, moveInfo.y, moveInfo.r, moveInfo.c, turn);
		}
		
		//Draw signal indicators	
		drawSignals();
			
		
		//Draw win
		if (mode == MODE_WIN) drawWin(turn);
		
		//Draw turn
		else drawTurn(turn);
		
		//Draw repeat message
		if (repeat !== null) drawRepeat();
		
		TWEEN.update(time);
		requestAnimationFrame(draw.bind(this)); //Repaint
		
	}

	function drawGrid() {		
		ctx.strokeStyle = theme.GRID;
		ctx.lineWidth = 0.5;
		ctx.strokeRect(0, 0, GRID_SIZE, GRID_SIZE); //Outline
		for (var i = 0; i < BOARD_COUNT; i++) {
			var g = i * GRID_UNIT;
			drawLine(ctx, g, 0, g, GRID_SIZE); //Vertical lines
			drawLine(ctx, 0, g, GRID_SIZE, g); //Horizontal lines	
		}
	}

	function drawPosNumber(r, c) {			
		ctx.fillStyle = '#fff';
		var pos = RC_TO_POS[r][c];	
		ctx.fillText(pos, (c * GRID_UNIT) + HALF_GRID - 10, (r * GRID_UNIT) + HALF_GRID) + 10;
	}

	function drawTurn(turn) {
		var turnText = (turn == BOARD_PLAYER1)? 'Player 1' : 'Player 2';
		ctx.fillStyle = theme.PATH;
		ctx.fillText(turnText, HALF_GRID, GRID_SIZE + 15);
	}

	function drawSignals() {		
		var offset = 10;
		
		//Player 1
		if (board.hasSignal(BOARD_PLAYER1)) drawSignal(offset, offset, theme.PLAYER1, theme.PLAYER1);
		else drawEmptySignal(offset, offset);
		
		//Player 2	
		var end = GRID_SIZE - offset - SIGNAL_SIZE;
		if (board.hasSignal(BOARD_PLAYER2)) drawSignal(end, end, theme.PLAYER2, theme.HOVER_PLAYER2);
		else drawEmptySignal(end, end);
	}

	function drawSignal(x, y, borderColor, fillColor) {		
		ctx.fillStyle = borderColor; //Border
		ctx.fillRect(x, y, SIGNAL_SIZE, SIGNAL_SIZE); 	
		
		ctx.fillStyle = fillColor;
		ctx.fillRect(x + 1, y + 1, SIGNAL_SIZE - 2, SIGNAL_SIZE - 2); 	
	}

	function drawEmptySignal(x, y) {
		ctx.fillStyle = theme.PATH;
		drawRoundedRect(ctx, x, y, SIGNAL_SIZE, SIGNAL_SIZE, 3);
	}

	function drawPaths() {		
		ctx.lineWidth = theme.PATH_WIDTH;
		ctx.strokeStyle = theme.PATH;
		
		drawCenterPaths();
		
		//Quad Drawing order: 		Q0 | Q1
		//							Q2 | Q3	
		//
		drawQuadPath(0, 0); //Q0
		drawQuadPath(QUAD_SIZE, 0);  //Q1
		drawQuadPath(0, QUAD_SIZE);  //Q2
		drawQuadPath(QUAD_SIZE, QUAD_SIZE);  //Q3
			
	}

	function drawQuadPath(x, y) {		
		ctx.save();
		ctx.translate(x, y);	
		var doubleGrid = GRID_UNIT * 2;
				
		drawLine(ctx, HALF_GRID, HALF_GRID, QUAD_SIZE - HALF_GRID, QUAD_SIZE - HALF_GRID); //Quad center diag 
		drawLine(ctx, QUAD_SIZE - HALF_GRID, HALF_GRID, HALF_GRID, QUAD_SIZE - HALF_GRID); //Quad center diag 	
		ctx.strokeRect(HALF_GRID, HALF_GRID, doubleGrid, doubleGrid); //Path around the quad
				
		ctx.restore();
	}

	function drawCenterPaths() {	
		// Draw order: 
		// ### 0 ###
		// #Q#   #Q#
		// ### - ###
		// 2 | X | 3
		// ### - ###
		// #Q#   #Q#
		// ### 1 ###					
		var centerStart = QUAD_SIZE - HALF_GRID;
		var centerEnd = centerStart + GRID_UNIT;
				
		//Horizontal lines 
		drawLine(ctx, centerStart, HALF_GRID, centerEnd, HALF_GRID); //0	
		drawLine(ctx, centerStart, GRID_SIZE - HALF_GRID, centerEnd, GRID_SIZE - HALF_GRID); //1		
		
		//Vertical lines
		drawLine(ctx, HALF_GRID, centerStart, HALF_GRID, centerEnd); //2	
		drawLine(ctx, GRID_SIZE - HALF_GRID, centerStart, GRID_SIZE - HALF_GRID, centerEnd); //3		
		
		//Center square
		ctx.strokeRect(centerStart, centerStart, GRID_UNIT, GRID_UNIT);
		
		//Diagonal lines (the 'X' in the center)
		drawLine(ctx, centerStart, centerStart, centerEnd, centerEnd); 
		drawLine(ctx, centerEnd, centerStart, centerStart, centerEnd); 
		
	}

	function drawHole(r, c) {		
		
		var holeSize = HOLE_SIZE;
		if (curR == r && curC == c && mode == MODE_SELECT_HOLE) {
			ctx.fillStyle = theme.HOVER_HOLE; 
			holeSize += 2;
		}
		else ctx.fillStyle = theme.HOLE;
		var center = HALF_GRID - holeSize;
		
		drawCircle(ctx, (c * GRID_UNIT) + center, (r * GRID_UNIT) + center, holeSize, 0); 
	}

	function drawPin(x, y, r, c, turn) {
		var pinType = board.get(r, c);
		if (pinType != BOARD_EMPTY) {			
			var center = HALF_GRID - PIN_SIZE;
			
			if (turn == pinType && curR == r && curC == c) { //Draw Hover
				ctx.fillStyle = (pinType == BOARD_PLAYER1)? theme.HOVER_PLAYER1 : theme.HOVER_PLAYER2;
			}
			else if (selR == r && selC == c) {
				ctx.fillStyle = (pinType == BOARD_PLAYER1)? theme.HOVER_PLAYER1 : theme.HOVER_PLAYER2;
			}
			else ctx.fillStyle = (pinType == BOARD_PLAYER1)? theme.PLAYER1 : theme.PLAYER2;
					
			//Draw the pin
			drawCircle(ctx, x + center, y + center, PIN_SIZE, 0); 
		}
	}

	function drawWin(turn) {		
		ctx.strokeStyle = theme.WIN;
		ctx.lineWidth = theme.WIN_WIDTH;
		var win = winTriangle;
		var ax = (win[0].c * GRID_UNIT) + HALF_GRID;
		var ay = (win[0].r * GRID_UNIT) + HALF_GRID;
		
		var bx = (win[1].c * GRID_UNIT) + HALF_GRID;
		var by = (win[1].r * GRID_UNIT) + HALF_GRID;
		
		var cx = (win[2].c * GRID_UNIT) + HALF_GRID;
		var cy = (win[2].r * GRID_UNIT) + HALF_GRID;
		
		//Win triangle
		drawLine(ctx, ax, ay, bx, by);
		drawLine(ctx, bx, by, cx, cy);
		drawLine(ctx, cx, cy, ax, ay);
		
		//Message
		var turnText = (turn == BOARD_PLAYER1)? 'Player 1 Wins!' : 'Player 2 Wins!';
		ctx.fillStyle = theme.PATH;
		ctx.fillText(turnText, HALF_GRID, GRID_SIZE + 15);
	}

	function drawRepeat() {	
		ctx.fillStyle = theme.REPEAT;
		var text = (repeat === 0)? 'Repeat' : 'Repeat (' + repeat + ')';
		ctx.fillText(text, GRID_SIZE - GRID_UNIT - 15, GRID_SIZE + 15);
	}
	
	
	//Exports
	return {init:init, changeTheme:changeTheme};
})();
//End Stage namespace
