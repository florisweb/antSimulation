
const Renderer = new function() {
	this.canvas = renderCanvas;
	let ctx = this.canvas.getContext("2d");
	ctx.constructor.prototype.circle = function(x, y, size) {
		if (size < 0) return;
		this.ellipse(
			x, 
			y, 
			size,
			size,
			0,
			0,
			2 * Math.PI
		);
	};

	this.camera = new Renderer_Camera();

	this.settings = {
		drawAnts: false
	}

	this.update = function() {
		ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		World.grid.draw(ctx);

		setTimeout(function () {Renderer.update()}, 100);

		if (!this.settings.drawAnts) return;
		for (let ant of World.ants)
		{
			ant.draw(ctx);
		}
		// requestAnimationFrame(function () {Renderer.update()});
	}



	this.drawRect = function({position, size, fillColor, strokeColor}) {
		let startPoint = Renderer.camera.worldPosToCanvPos(position);
		let delta = size.copy().scale(1 / Renderer.camera.zoom);
		ctx.fillStyle = fillColor;
		if (strokeColor) ctx.strokeStyle = strokeColor;
		ctx.beginPath();
		ctx.rect(startPoint.value[0], startPoint.value[1], delta.value[0], delta.value[1]);
		ctx.closePath();
		if (fillColor) ctx.fill();
		if (strokeColor) ctx.stroke();
	} 

	this.drawLine = function({position, delta, color}) {
		let startPoint = Renderer.camera.worldPosToCanvPos(position);
		let endPoint = startPoint.copy().add(delta.copy().scale(1 / Renderer.camera.zoom));
		
		ctx.strokeStyle = color;
		ctx.beginPath();
		ctx.moveTo(startPoint.value[0], startPoint.value[1])
		ctx.lineTo(endPoint.value[0], endPoint.value[1]);
		ctx.closePath();
		if (color) ctx.stroke();
	}

}





function Renderer_Camera() {
	this.size = new Vector(500, 500); // canvas
	this.position = new Vector(25, 25); // In the center of the world
	this.zoom = .03; // percent of the camsize you can see

	this.getWorldProjectionSize = function() {
		return this.size.copy().scale(this.zoom);
	}

	this.worldPosToCanvPos = function(_position) {
		let rPos = this.position.copy().add(this.getWorldProjectionSize().scale(-.5)).difference(_position);
		return rPos.scale(1 / this.zoom);
	}
	
	this.canvPosToWorldPos = function(_position) {
		let rPos = _position.copy().scale(this.zoom).add(this.getWorldProjectionSize().scale(-.5));
		return this.position.copy().add(rPos); 
	}
}

