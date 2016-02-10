//Constants
var CANVAS_SIZE_X = 600;
var CANVAS_SIZE_Y = 640;

var BOARD_COUNT = 6;
var GRID_SIZE = CANVAS_SIZE_X;
var GRID_UNIT = CANVAS_SIZE_X / BOARD_COUNT;
var HALF_GRID = GRID_UNIT / 2;
var QUAD_SIZE = GRID_SIZE / 2;

var HOLE_SIZE = GRID_UNIT / 5; //Radius
var PIN_SIZE = GRID_UNIT / 4;

var SIGNAL_SIZE = 15;
var PATH_WIDTH = 8;
var WIN_WIDTH = 3;

var MESSAGE_FADE_MS = 1000;

//Colors
var COLOR_BOARD = '#e6caa6';
var COLOR_PATH = '#786f5e';
var COLOR_PLAYER1 = '#ff4242';	
var COLOR_PLAYER2 = '#8d8d8d';	
var COLOR_HOLE = '#786f5e';	

var COLOR_HOVER_HOLE = '#deb887';	
var COLOR_HOVER_PLAYER1 = '#b52f2f';	
var COLOR_HOVER_PLAYER2 = '#c0c0c0';	
var COLOR_GRID = '#333';
var COLOR_WIN = '#99d9ea';

//Enums
var MODE_SELECT_PIN = 0;
var MODE_SELECT_HOLE = 1;
var MODE_WIN = 2;

//Globals
var menu;
//TODO messages, info (fading into obscurity)

//Class Stage - Used for drawing
function Stage(board) {

	//Properties
	this.board = board;
	this.cursorX = 0;
	this.cursorY = 0;
	this.curR = 0;
	this.curC = 0;
	this.selR = -1;
	this.selC = -1;
	this.gameEvents = {};
	this.mode = MODE_SELECT_PIN;
	this.winInfo;
	this.message;
	this.messageFade;
	
	//Canvas
	var canvas = document.getElementById('main-canvas');
	this.canvasBounds = canvas.getBoundingClientRect(); 
	this.ctx = canvas.getContext('2d');  
	this.ctx.font = 'bold 15px Verdana';
	this.ctx.lineWidth = PATH_WIDTH;
	
	//Menu
	var menuManager = new MenuManager();
	menu = menuManager.properties;
	
	//Event callbacks
	canvas.addEventListener('click', this.onMouseClick.bind(this), false);
	canvas.addEventListener('mousemove', this.onMouseMove.bind(this), false);		
	
	//Start rendering
	this.draw();
}


//Events
Stage.prototype.addGameEvent = function(name, callback) {
	this.gameEvents[name] = callback;
}

Stage.prototype.setMessage = function(messageText, fade) {
	this.message = messageText;
	//this.messageFade = fade;
}

Stage.prototype.onWin = function(win) {
	this.mode = MODE_WIN;	
	this.winInfo = win;
}

Stage.prototype.onMouseMove = function(e) {	
	var x = e.clientX - this.canvasBounds.left; 
	var y = e.cursorY = e.clientY - this.canvasBounds.top;  
	
	this.curR = Math.floor(y/GRID_UNIT);
	this.curC = Math.floor(x/GRID_UNIT);
	
	this.cursorX = x;
	this.cursorY = y;
}

Stage.prototype.onMouseClick = function(e) {
	//Get direction based on position
	var x = e.clientX - this.canvasBounds.left; 
	var y = e.clientY - this.canvasBounds.top;  

	var r = Math.floor(y/GRID_UNIT);
	var c = Math.floor(x/GRID_UNIT);
	
	if (this.mode == MODE_SELECT_PIN) {
		this.selR = r;
		this.selC = c;
		this.mode = MODE_SELECT_HOLE;
	}
	else if (this.mode == MODE_SELECT_HOLE){
		var move = {sr:this.selR, sc:this.selC, dr:r, dc:c};
		this.selR = -1;
		this.selC = -1;
		this.gameEvents['onMove'](move);
		if (this.mode != MODE_WIN) this.mode = MODE_SELECT_PIN;			
	}
	


}

//Drawing
Stage.prototype.draw = function(time) { //Top-level drawing function	
	
	//Draw board background - also clears the canvas
	var ctx = this.ctx;
	ctx.fillStyle = COLOR_BOARD;
	ctx.fillRect(0, 0, CANVAS_SIZE_X, CANVAS_SIZE_Y);

	//Draw Grid (6x6)
	if (menu.showGrid) this.drawGrid();
	
	//Draw paths
	if (menu.showPaths) this.drawPaths();
		
	//Draw holes and pins
	var board = this.board;
	var turn = board.getTurn();
	for (var r = 0; r < BOARD_COUNT; r++) {
		for (var c = 0; c < BOARD_COUNT; c++) {
			if (board.VALID_SQUARES[r][c]) { //Not all the square in the grid a valid positions
				//Holes
				this.drawHole(r, c);
				
				//Pins
				this.drawPin(r, c, turn);
				
				//Number info
				if (menu.showPositions) this.drawPosNumber(r, c);
			}
		}
	}
			
	
	//Draw signal indicators	
	this.drawSignals();
		
	
	//Draw win
	if (this.mode == MODE_WIN) this.drawWin();
	
	//Draw turn
	else this.drawTurn(turn);
	
	//Draw message
	//if (this.message) this.drawMessage(time);
	
	requestAnimationFrame(this.draw.bind(this)); //Repaint
	
}

Stage.prototype.drawGrid = function() {
	var ctx = this.ctx;
	ctx.strokeStyle = COLOR_GRID;
	ctx.lineWidth = 0.5;
	ctx.strokeRect(0, 0, GRID_SIZE, GRID_SIZE); //Outline
	for (var i = 0; i < BOARD_COUNT; i++) {
		var g = i * GRID_UNIT;
		drawLine(ctx, g, 0, g, GRID_SIZE); //Vertical lines
		drawLine(ctx, 0, g, GRID_SIZE, g); //Horizontal lines	
	}
}

Stage.prototype.drawPosNumber = function(r, c) {	
	var ctx = this.ctx;
	ctx.fillStyle = '#fff';
	var pos = RC_TO_POS[r][c];	
	ctx.fillText(pos, (c * GRID_UNIT) + HALF_GRID - 10, (r * GRID_UNIT) + HALF_GRID) + 10;
}

Stage.prototype.drawTurn = function(turn) {
	var turnText = (turn == BOARD_PLAYER1)? 'Player 1' : 'Player 2';
	this.ctx.fillStyle = COLOR_PATH;
	this.ctx.fillText(turnText, HALF_GRID, GRID_SIZE + 15);
}

Stage.prototype.drawMessage = function(time) {	
	this.ctx.fillStyle = COLOR_PATH;
	this.ctx.fillText(this.message, HALF_GRID, GRID_SIZE + 15);
	//this.
}

Stage.prototype.drawSignals = function() {
	var ctx = this.ctx;
	var offset = 10;
	
	//Player 1
	if (this.board.hasSignal(BOARD_PLAYER1)) this.drawSignal(offset, offset, COLOR_PLAYER1, COLOR_PLAYER1);
	else this.drawEmptySignal(offset, offset);
	
	//Player 2	
	var end = GRID_SIZE - offset - SIGNAL_SIZE;
	if (this.board.hasSignal(BOARD_PLAYER2)) this.drawSignal(end, end, COLOR_PLAYER2, COLOR_HOVER_PLAYER2);
	else this.drawEmptySignal(end, end);
}

Stage.prototype.drawSignal = function(x, y, borderColor, fillColor) {
	var ctx = this.ctx;
	ctx.fillStyle = borderColor; //Border
	ctx.fillRect(x, y, SIGNAL_SIZE, SIGNAL_SIZE); 	
	
	ctx.fillStyle = fillColor;
	ctx.fillRect(x + 1, y + 1, SIGNAL_SIZE - 2, SIGNAL_SIZE - 2); 	
}

Stage.prototype.drawEmptySignal = function(x, y) {
	this.ctx.fillStyle = COLOR_PATH;
	drawRoundedRect(this.ctx, x, y, SIGNAL_SIZE, SIGNAL_SIZE, 3);
}

Stage.prototype.drawPaths = function() {
	var ctx = this.ctx;
	ctx.lineWidth = PATH_WIDTH;
	ctx.strokeStyle = COLOR_PATH;
	
	this.drawCenterPaths();
	
	//Quad Drawing order: 		Q0 | Q1
	//							Q2 | Q3	
	//
	this.drawQuadPath(0, 0); //Q0
	this.drawQuadPath(QUAD_SIZE, 0);  //Q1
	this.drawQuadPath(0, QUAD_SIZE);  //Q2
	this.drawQuadPath(QUAD_SIZE, QUAD_SIZE);  //Q3
		
}

Stage.prototype.drawQuadPath = function(x, y) {
	var ctx = this.ctx;
	ctx.save();
	ctx.translate(x, y);	
	var doubleGrid = GRID_UNIT * 2;
			
	drawLine(ctx, HALF_GRID, HALF_GRID, QUAD_SIZE - HALF_GRID, QUAD_SIZE - HALF_GRID); //Quad center diag 
	drawLine(ctx, QUAD_SIZE - HALF_GRID, HALF_GRID, HALF_GRID, QUAD_SIZE - HALF_GRID); //Quad center diag 	
	ctx.strokeRect(HALF_GRID, HALF_GRID, doubleGrid, doubleGrid); //Path around the quad
			
	ctx.restore();
}

Stage.prototype.drawCenterPaths = function() {	
	// Draw order: 
	// ### 0 ###
	// #Q#   #Q#
	// ### - ###
	// 2 | X | 3
	// ### - ###
	// #Q#   #Q#
	// ### 1 ###
	var ctx = this.ctx;		
	
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

Stage.prototype.drawHole = function(r, c) {
	var ctx = this.ctx;
	
	var holeSize = HOLE_SIZE;
	if (this.curR == r && this.curC == c && this.mode == MODE_SELECT_HOLE) {
		ctx.fillStyle = COLOR_HOVER_HOLE; 
		holeSize += 2;
	}
	else ctx.fillStyle = COLOR_HOLE;
	var center = HALF_GRID - holeSize;
	
	drawCircle(ctx, (c * GRID_UNIT) + center, (r * GRID_UNIT) + center, holeSize, 0); 
}

Stage.prototype.drawPin = function(r, c, turn) {
	var pinType = this.board.get(r, c);
	if (pinType != BOARD_EMPTY) {
		var ctx = this.ctx;
		var center = HALF_GRID - PIN_SIZE;
		
		if (turn == pinType && this.curR == r && this.curC == c) { //Draw Hover
			ctx.fillStyle = (pinType == BOARD_PLAYER1)? COLOR_HOVER_PLAYER1 : COLOR_HOVER_PLAYER2;
		}
		else if (this.selR == r && this.selC == c) {
			ctx.fillStyle = (pinType == BOARD_PLAYER1)? COLOR_HOVER_PLAYER1 : COLOR_HOVER_PLAYER2;
		}
		else ctx.fillStyle = (pinType == BOARD_PLAYER1)? COLOR_PLAYER1 : COLOR_PLAYER2;
				
		//Draw the pin
		drawCircle(ctx, (c * GRID_UNIT) + center, (r * GRID_UNIT) + center, PIN_SIZE, 0); 
	}
}

Stage.prototype.drawWin = function(turn) {
	var ctx = this.ctx;
	ctx.strokeStyle = COLOR_WIN;
	ctx.lineWidth = WIN_WIDTH;
	var win = this.winInfo;
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
	var turnText = (turn == BOARD_PLAYER1)? 'Player 2 Wins!' : 'Player 1 Wins!';
	this.ctx.fillStyle = COLOR_PATH;
	this.ctx.fillText(turnText, HALF_GRID, GRID_SIZE + 15);
}

//End class Stage