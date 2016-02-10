function drawLine(ctx, x1, y1, x2, y2) {
	ctx.beginPath();	
	ctx.moveTo(x1, y1);
	
	ctx.lineTo(x2,y2);    
    ctx.closePath();		
	ctx.stroke();   
}

function drawCircle(ctx, x, y, r, margin) {
	ctx.beginPath();    
	ctx.arc(x + r,y + r, r - margin, 0, 2 * Math.PI, true);
	ctx.closePath();    
	ctx.fill();		
}


function drawRoundedRect(ctx, x, y, w, h, r) {
	//http://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
	if (w < 2 * r) r = w / 2;
	if (h < 2 * r) r = h / 2;
	ctx.beginPath();
	ctx.moveTo(x+r, y);
	ctx.arcTo(x+w, y,   x+w, y+h, r);
	ctx.arcTo(x+w, y+h, x,   y+h, r);
	ctx.arcTo(x,   y+h, x,   y,   r);
	ctx.arcTo(x,   y,   x+w, y,   r);
	ctx.closePath();	
	ctx.fill();		
}
