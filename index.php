<!DOCTYPE html>
<html>
	<head>
		<title></title>
		<style>
			body {
				padding: 0;
				margin: 0;
				position: fixed;
			}

			#renderCanvas {
				border: 1px solid red;
				width: 100vw;
				max-width: 100vh;
			}
		</style>
	</head>
	<body>
		<canvas id='renderCanvas' width="500" height='500'></canvas>
		<script src='js/vector.js?a=2'></script>
		<script src='js/inputHandler.js?a=4'></script>
		<script src='js/renderer.js?a=3'></script>
		<script src='js/world.js?a=8'></script>
		
		<script>

			for (let i = 0; i < 5000; i++)
			{
				let ant = new Ant({
					position: new Vector(
						World.size.value[0] * .9,
						World.size.value[1] * .9
					)
				});
				World.addAnt(ant);
			}

			// let length = 1;
			// let size = new Vector(2, 2);
			// let obj3 = new Object({position: new Vector(0, 5), distanceFunction: function (_coord) {
			// 	let delta = _coord.difference(this.position);
			// 	return delta.getLength() - 5;

			// }});
			// World.addObject(obj3);

			World.setup();
		</script>

	</body>
</html>