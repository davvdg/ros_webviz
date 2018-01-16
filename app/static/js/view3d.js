			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
			var controls = new THREE.TrackballControls( camera );
			controls.rotateSpeed = 5.0;
			controls.zoomSpeed = 1.2;
			controls.panSpeed = 0.8;
			controls.noZoom = false;
			controls.noPan = false;
			controls.staticMoving = true;
			controls.dynamicDampingFactor = 0.3;
			controls.keys = [ 65, 83, 68 ];
			controls.addEventListener( 'change', render );


			var renderer = new THREE.WebGLRenderer();
			renderer.setSize( window.innerWidth, window.innerHeight );
			document.body.appendChild( renderer.domElement );

			var geometry = new THREE.BoxGeometry( 1, 1, 1 );
			var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
			var cube = new THREE.Mesh( geometry, material );
			//scene.add( cube );
			camera.position.x = 5;
			camera.position.z = 5;
			camera.position.y = 5;
			camera.lookAt(new THREE.Vector3(0,0,0));


			var axisHelper = new THREE.AxisHelper( 1 );
			scene.add( axisHelper );
			var ros = new ROSLIB.Ros({
			  url : 'wss://'+window.location.hostname +':9090'
			});
			
			ros.on('connection', function() {
  				console.log('Connected to websocket server.');
  			});
			
			ros.on('error', function(error) {
				console.log('Error connecting to websocket server: ', error);
			});
			
			ros.on('close', function() {
				console.log('Connection to websocket server closed.');
			});

			listener = new ROSLIB.Topic({
  				ros : ros,
  				name : '/xlba_window_points_computed',
  				messageType : 'sensor_msgs/PointCloud2'
  			});

  			listener.subscribe(function(message) {
  				//console.log('Received message on ' + listener.name + ': ' + message.fields);

  				message.fields.forEach(function(field) {console.log(field)});

  				d = message.data;
  				atobs = window.atob(d);

  				var ptSize = message.point_step;
  				var rowSize = message.row_step;
  				var numPoints = message.height;

  				var buf = new ArrayBuffer(numPoints * rowSize);
  				var bigEndian = message.is_bigendian;

  				var bufView = new DataView(buf);
  				for (var i=0, strLen=numPoints * rowSize; i < strLen; i++) {
    				bufView.setUint8(i, atobs.charCodeAt(i), !bigEndian);
  				}

  				var float32view   = new Float32Array(buf);
  				var uint32View    = new Uint32Array(buf);

  				var geometry = new THREE.BufferGeometry();
  				var positions = new Float32Array( numPoints * 3 );
  				var colors = 	new Float32Array( numPoints * 3 );

  				for (var i=0; i<numPoints; i++) {
  					var pIdx = i * 3;
  					var rIdx = i * 4;

  					positions[pIdx+0] = float32view[rIdx+1];
  					positions[pIdx+1] = float32view[rIdx+2];
  					positions[pIdx+2] = float32view[rIdx+3];
  					colors[pIdx+0] = 1.0;
  					colors[pIdx+1] = 1.0;
					colors[pIdx+2] = 1.0;
  				}
  				geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
				geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
				geometry.computeBoundingSphere();
				//
				var material = new THREE.PointsMaterial( { size: 0.01, vertexColors: THREE.VertexColors } );
				points = new THREE.Points( geometry, material );
				scene.add( points );


  			});



			function onWindowResize() {
				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();
				renderer.setSize( window.innerWidth, window.innerHeight );
				controls.handleResize();
				render();
			}
			function animate() {
				requestAnimationFrame( animate );
				controls.update();
				render();
			}
			function render() {
				renderer.render( scene, camera );
				//stats.update();
			}

			animate()

