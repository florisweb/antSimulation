
const InputHandler = new _InputHandler();

let tileSize;
const World = new function() {
	this.size = new Vector(50, 50);

	this.grid;

	this.ants = [];
	this.addAnt = function(_ant) {
		this.ants.push(_ant);
	}

	this.setup = function() {
		this.grid = new Grid(50, 50);
		this.update();
		Renderer.update();
	}

	this.update = function() {
		this.grid.update();
		for (let ant of this.ants)
		{
			ant.update();
		}
		
		setTimeout(function () {World.update()}, 1);
	}


}

function Grid(_width, _height) {
	tileSize = new Vector(
		World.size.value[0] / _width,
		World.size.value[1] / _height,
	);

	let grid = [];
	grid.width = _width;
	grid.height = _height;

	for (let x = 0; x < _width; x++)
	{
		grid[x] = [];
		for (let y = 0; y < _height; y++)
		{
			grid[x][y] = new Tile(x, y, grid);
		}
	}

	grid.draw = function(ctx) {
		for (let x = 0; x < grid.length; x++)
		{
			for (let y = 0; y < grid[x].length; y++)
			{
				grid[x][y].draw(ctx);
			}
		}
	}
	grid.update = function() {
		for (let x = 0; x < grid.length; x++)
		{
			for (let y = 0; y < grid[x].length; y++)
			{
				grid[x][y].update();
			}
		}
	}
	
	grid.getTileByPos = function(_position) {
		let x = Math.floor(_position.value[0] / tileSize.value[0]);
		if (x > grid.length - 1 || x < 0) return false;
		let y = Math.floor(_position.value[1] / tileSize.value[1]);
		return grid[x][y];
	}

	return grid;
}

function Tile(x, y, grid) {
	this.gridCoord = new Vector(x, y)
	this.position = this.gridCoord.copy().scaleWithVector(tileSize);

	this.isSolid = x == 0 || x == grid.width - 1 || y == 0 || y == grid.height - 1;
	this.isNest = x > grid.width - 5 && y > grid.height - 5;;
	this.food = x < 4 && y < 4;

	this.toFeromone = 0; //(x == y) * .1;// ((y - x) % 2) * .1;// (x == y - 2) * .5; // To foodsource
	// if (this.toFeromone < 0) this.toFeromone = 0;
	this.fromFeromone = 0; // from nest
	const disapearenceSpeed = .001;

	this.draw = function(ctx) {
		Renderer.drawRect({
			position: this.position,
			size: tileSize,
			fillColor: "rgb(" + this.food * 255 + ", " + this.toFeromone * 255 + ", " + this.fromFeromone * 255 + ")",
			strokeColor: this.isNest ? "#fa0" : this.isSolid ? "#f00" : false
		});
	}
	this.update = function() {
		this.toFeromone *= 1 - disapearenceSpeed;
		this.fromFeromone *= 1 - disapearenceSpeed;
	}

}




function Ant({position}) {
	this.position = position;
	this.direction = new Vector(1, 0).setAngle(Math.random() * 2 * Math.PI);
	this.hasFood = false;
	
	const speed = .1;
	const eyeDistance = 1;
	const margin = .01;
	const biteSize = .001;
	const dropSize = .0001;
	const fieldOfView = .3 * Math.PI;

	this.update = function() {
		this.position.add(this.direction.copy().scale(speed));
		let tile = World.grid.getTileByPos(this.position);
		this.checkCollisions(tile);
		
		if (!tile) return;

		if (tile.food > 0) 
		{
			this.hasFood = true;
			tile.food -= biteSize;
			if (tile.food < 0) tile.food = 0;
		}

		if (tile.isNest) 
		{
			this.hasFood = false;
		}

		this.dropFeromones(tile);
		this.calcNewDirection(tile);
	}

	this.checkCollisions = function(_tile) {
		if (!_tile || !_tile.isSolid) return;

		let delta = this.position.difference(_tile.position);
		if (Math.abs(delta.value[0]) > Math.abs(delta.value[1])) return this.direction.value[0] *= -1;
		this.direction.value[1] *= -1;
	}

	this.dropFeromones = function(_tile) {
		if (this.hasFood)
		{
			_tile.fromFeromone += dropSize;
			if (_tile.fromFeromone > 1) _tile.fromFeromone = 1;
		} else {
			_tile.toFeromone += dropSize;
			if (_tile.toFeromone > 1) _tile.toFeromone = 1;	
		}
	}

	this.calcNewDirection = function() {

		let dirA = this.direction.copy().rotate(-fieldOfView).setLength(eyeDistance);
		let dirC = this.direction.copy().rotate(fieldOfView).setLength(eyeDistance);



		let tileA = World.grid.getTileByPos(this.position.copy().add(dirA));
		let tileC = World.grid.getTileByPos(this.position.copy().add(dirC));

		let newAngle = 0;
		if (tileA && tileC)
		{
			newAngle = (
				dirA.getAngle() * tileA.fromFeromone + 
				dirC.getAngle() * tileC.fromFeromone
			) / (tileA.fromFeromone + tileC.fromFeromone);

			if (this.hasFood) newAngle = (
				dirA.getAngle() * tileA.toFeromone + 
				dirC.getAngle() * tileC.toFeromone
			) / (tileA.toFeromone + tileC.toFeromone);
			
		}

		if (isNaN(newAngle)) newAngle = this.direction.getAngle() + .03 - Math.random() * .06;

		// console.log(newAngle);

		// if (this.hasFood)
		// {
		// 	tiles.sort(function(a, b) {
		// 		return a.toFeromone - b.toFeromone;
		// 	});
		// } else {
		// 	tiles.sort(function(a, b) {
		// 		return a.fromFeromone - b.fromFeromone;
		// 	});
		// }
		let margin = .02;
		let dAngle = (newAngle - this.direction.getAngle()) * .1 + margin - margin * 2 * Math.random();//(this.direction.getAngle() - tiles[0].direction.getAngle()) *
		// console.log(dAngle);

		this.direction.setAngle(
			this.direction.getAngle() + dAngle,
			1
		);
	}



	this.draw = function(ctx) {
		let color = "#00f";
		if (this.hasFood) color = "#f00";
		Renderer.drawLine({position: this.position, delta: this.direction, color: color});
		// Renderer.drawLine({position: this.position, delta: this.direction.copy().rotate(fieldOfView).setLength(eyeDistance), color: "#0f0"});
		// Renderer.drawLine({position: this.position, delta: this.direction.copy().rotate(-fieldOfView).setLength(eyeDistance), color: "#0f0"});
	}
}


