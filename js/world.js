
const FoodPheromone = Symbol();
const NestPheromone = Symbol();

const InputHandler = new _InputHandler();

let tileSize;
const World = new function() {
	this.size = new Vector(50, 50);

	this.grid;
	this.curTime = 0;
	this.ants = [];
	this.addAnt = function(_ant) {
		this.ants.push(_ant);
	}

	this.setup = function() {
		this.grid = new Grid(15, 15);
		this.update();
		Renderer.update();
	}

	let lastUpdate = new Date();
	this.desiredUPS = 60;
	this.UPS = 0;
	this.update = function() {
		let dt = (new Date() - lastUpdate) / 1000 * this.desiredUPS;

		this.curTime += dt;
		if (this.curTime % 5 < 1) this.grid.update(dt);
		for (let ant of this.ants)
		{
			ant.update(dt);
		}
		
		setTimeout(function () {World.update()}, 1);
		this.UPS = Math.round(10000 / (new Date() - lastUpdate)) / 10;

		lastUpdate = new Date();

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

	grid.update = function(_dt) {
		for (let x = 0; x < grid.length; x++)
		{
			for (let y = 0; y < grid[x].length; y++)
			{
				grid[x][y].update(_dt);
			}
		}
	}

	const eyeRadius = tileSize.getLength() * .5;
	grid.getPheromonesByPos = function(_position, _type) {
		let pheromones = [];
		let curTile = this.getTileByPos(_position);
		for (let dx = -1; dx < 2; dx++)
		{
			for (let dy = -1; dy < 2; dy++)
			{
				let x = curTile.gridCoord.value[0] + dx;
				let y = curTile.gridCoord.value[1] + dy;
				if (x < 0 || y < 0 || x >= this.width || y >= this.height) continue;
				let tile = this[x][y];
				
				for (let p = 0; p < tile.pheromones.length; p++)
				{
					if (tile.pheromones[p].type != _type) continue;
					let delta = _position.difference(tile.pheromones[p].position);
					if (tile.pheromones[p].isPointer) 
					{
						if (delta.getSquaredLength() > eyeRadius * eyeRadius) continue;
					}

					tile.pheromones[p].delta = delta;
					pheromones.push(tile.pheromones[p]);
				}
			}
		}
		return pheromones;
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

	this.isNest = x == 7 && y == 7;
	this.food = (x == 0 && y == 0) || (x == 0 && y == grid.height - 1) || (x == grid.width - 1 && y == 0) || (x == grid.width - 1 && y == grid.height - 1); //x < 4 && y < 4;

	this.pheromones = [];


	this.addPheromone = function(_pheromone) {
		for (let p = 0; p < this.pheromones.length; p++)
		{
			if (this.pheromones[p].type != _pheromone.type) continue;
			let delta = this.pheromones[p].position.difference(_pheromone.position);
			
			if (delta.getSquaredLength() > .4) continue;
			this.pheromones[p].intensity += _pheromone.intensity;
			return;
		}


		this.pheromones.push(_pheromone);
	}
	
	if (this.isNest || this.food > 0) 
	{
		let pheromone = new Pheromone({
			position: this.position.copy().add(tileSize.copy().scale(.5)),
			intensity: 100,
			type: this.isNest ? NestPheromone : FoodPheromone
		})
		pheromone.isPointer = true;
		this.addPheromone(pheromone);
	}



	this.draw = function(ctx) {
		if (Renderer.settings.drawGrid) Renderer.drawRect({
			position: this.position,
			size: tileSize,
			strokeColor: this.isNest ? "#fa0" : this.food > 0 ? "#f00" : "#333"
		});

		if (!Renderer.settings.drawPheromones) return;
		for (let i = 0; i < this.pheromones.length; i++)
		{
			this.pheromones[i].draw();
		}	
	}


	this.update = function(_dt) {
		if (this.isNest || this.food > 0) this.pheromones[0].intensity = 100;

		for (let i = this.pheromones.length - 1; i >= 0; i--)
		{
			this.pheromones[i].update(_dt);
			if (this.pheromones[i].intensity > .1) continue;
			this.pheromones.splice(i, 1);
		}
	}
}

function Pheromone({position, intensity, type}) {
	this.type = type;
	this.position = position.copy();
	this.intensity = intensity;
	this.isPointer = false;

	this.update = function(_dt) {
		this.intensity *= 1 - .001 * _dt;
	}

	this.draw = function() {
		Renderer.drawCircle({
			position: this.position,
			radius: Math.pow(this.intensity, .3) * .2,
			fillColor: this.type == FoodPheromone ? "#00f" : "#0f0"
		})

	}
}




function Ant({position}) {
	this.position = position;
	this.direction = new Vector(1, 0).setAngle(Math.random() * 2 * Math.PI);
	this.food = 0;
	
	const speed = .05;
	// const margin = .05;
	const dropSize = .3;
	const biteSize = .01;

	const wanderStrength = 1;
	const fieldOfView = .3 * Math.PI;


	let lastPheromoneDrop = 0;
	const pheromoneDropFrequency = 30;
	let lastDirectionCalc = 0;
	const directionCalcFrequency = 1;
	this.update = function(_dt) {
		this.position.add(this.direction.copy().scale(speed * _dt));
		let tile = World.grid.getTileByPos(this.position);
		this.checkCollisions(tile);
		if (!tile) return;

		if (tile.food > 0 && this.food == 0) 
		{
			this.food = 1; //biteSize;
			tile.food -= biteSize;
			this.direction.scale(-1);
			if (tile.food < 0) tile.food = 0;
		}

		if (tile.isNest && this.food > 0) 
		{
			this.food = 0;
			this.direction.scale(-1);
		}

		if (lastDirectionCalc + directionCalcFrequency > World.curTime) return;
		lastDirectionCalc = World.curTime;
		this.calcNewDirection(tile);

		if (lastPheromoneDrop + pheromoneDropFrequency > World.curTime) return;
		lastPheromoneDrop = World.curTime;
		this.dropPheromones(tile);
	}

	this.checkCollisions = function(_tile) {
		if (_tile) return;
		if (this.position.value[0] < 0)
		{
			this.position.value[0] = 0;
			this.direction.value[0] *= -1;
		} else if (this.position.value[0] > World.size.value[0])
		{
			this.position.value[0] = World.size.value[0];
			this.direction.value[0] *= -1;
		}

		if (this.position.value[1] < 0)
		{
			this.position.value[1] = 0;
			this.direction.value[1] *= -1;
		} else if (this.position.value[1] > World.size.value[1])
		{
			this.position.value[1] = World.size.value[1];
			this.direction.value[1] *= -1;
		}
	}


	const turnSpeed = .01;
	this.dropPheromones = function(_tile) {
		let pheromone = new Pheromone({position: this.position, intensity: dropSize, type: NestPheromone});
		if (this.food > 0) pheromone = new Pheromone({position: this.position, intensity: dropSize, type: FoodPheromone});
		
		_tile.addPheromone(pheromone);
	}

	this.calcNewDirection = function() {
		let pheromones = World.grid.getPheromonesByPos(this.position, this.food > 0 ? NestPheromone : FoodPheromone);
		let dAngle = 0;
		let angle = this.direction.getAngle();
		
		
		let curPheromone = false;
		let highScore = -Infinity;
		
		for (let p = 0; p < pheromones.length; p++)
		{
			let score = pheromones[p].intensity;// / pheromones[p].delta.getLength();
			let curAngle = pheromones[p].delta.getAngle();
			if (Math.abs(curAngle - angle) > fieldOfView) continue;

			if (score < highScore) continue;
			highScore = score;
			curPheromone = pheromones[p];

			// newAngle += pheromones[p].delta.getAngle() * pheromones[p].intensity;// / pheromones[p].delta.getSquaredLength();
			// totalStrength += pheromones[p].intensity;// / pheromones[p].delta.getSquaredLength();
		}

		if (curPheromone) dAngle = angle - curPheromone.delta.getAngle();

		let delta = dAngle - wanderStrength + 2 * wanderStrength * Math.random()
		this.direction.setAngle(angle - delta * .02, 1);

		// console.log(pheromones.length);
	}

	// this.calcNewDirection = function() {
	// 	let dirA = this.direction.copy().rotate(-fieldOfView).setLength(eyeDistance);
	// 	let dirB = this.direction.copy().rotate(fieldOfView).setLength(eyeDistance);


	// 	let tileA = World.grid.getTileByPos(this.position.copy().add(dirA));
	// 	let tileB = World.grid.getTileByPos(this.position.copy().add(dirB));

	// 	let newAngle = 0;
	// 	if (!tileA) tileA = {
	// 		nestPhermone: 0,
	// 		foodPhermone: 0
	// 	}
	// 	if (!tileB) tileB = {
	// 		nestPhermone: 0,
	// 		foodPhermone: 0
	// 	}
	// 	newAngle = (
	// 		dirA.getAngle() * tileA.foodPhermone + 
	// 		dirB.getAngle() * tileB.foodPhermone
	// 	) / (tileA.foodPhermone + tileB.foodPhermone);

	// 	if (this.food > 0) newAngle = (
	// 		dirA.getAngle() * tileA.nestPhermone + 
	// 		dirB.getAngle() * tileB.nestPhermone
	// 	) / (tileA.nestPhermone + tileB.nestPhermone);
		
	// 	if (isNaN(newAngle)) newAngle = this.direction.getAngle() + .03 - Math.random() * .06;

	// 	let dAngle = (newAngle - this.direction.getAngle()) * .1 + margin - margin * 2 * Math.random();//(this.direction.getAngle() - tiles[0].direction.getAngle()) *

	// 	this.direction.setAngle(
	// 		this.direction.getAngle() + dAngle,
	// 		1
	// 	);
	// }



	this.draw = function(ctx) {
		let color = "rgb(" + this.food * 255 + ", " + (1 - this.food) * 255 + ", 0)";
		Renderer.drawLine({position: this.position, delta: this.direction, color: color});
		// Renderer.drawLine({position: this.position, delta: this.direction.copy().rotate(fieldOfView).setLength(eyeDistance), color: "#0f0"});
		// Renderer.drawLine({position: this.position, delta: this.direction.copy().rotate(-fieldOfView).setLength(eyeDistance), color: "#0f0"});
	}
}


