(function () {
  var webglEl = document.getElementById('webgl');

  if (!Detector.webgl) {
    Detector.addGetWebGLMessage(webglEl);
    return;
  }

  var width  = window.innerWidth,
    height = window.innerHeight;

  // UI elements
  var yearsago = document.getElementById('years-ago');

  // Earth params
  var radius = 0.5,
    segments = 32,
    rotation = 11;

  var sphereGeometry = new THREE.SphereGeometry(radius, segments, segments);

  var noRotation = false;
  var simulationClicked = false;
	webglEl.addEventListener( 'mousedown', function() {
    simulationClicked = true;
  }, false);

  var scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000);
  camera.position.z = 4;

  var renderer = new THREE.WebGLRenderer();
  renderer.setSize(width, height);

  scene.add(new THREE.AmbientLight(0xffffff));

  /*
  var light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(5,3,5);
  scene.add(light);
  */

  var loadedCount = 0;

  var sphere = createSphere(radius, segments);
  scene.add(sphere);

  var clouds = createClouds(radius, segments);
  clouds.rotation.y = rotation;
  scene.add(clouds)

  var stars = createStars(90, 64);
  scene.add(stars);

  var controls = new THREE.OrbitControls(camera, webglEl);
  controls.minDistance = 1;
  controls.maxDistance = 20;
  controls.noKeys = true;
  controls.rotateSpeed = 1.4;

  THREEx.WindowResize(renderer, camera);

  webglEl.appendChild(renderer.domElement);

  setupControls();

  render();

  function render() {
    controls.update();

    if (!noRotation) {
      if (simulationClicked) {
        sphere.rotation.y += 0.0005;
        clouds.rotation.y += 0.0005;
      } else {
        sphere.rotation.y += 0.001;
        clouds.rotation.y += 0.001;
      }
    }

    requestAnimationFrame(render);
    renderer.render(scene, camera);
  }

  function setupControls() {
    var removeCloudsElt = document.getElementById('remove-clouds');
    removeCloudsElt.onclick = function() {
      scene.remove(clouds);
      removeCloudsElt.style.display = 'none';
    };
    var stopRotationElt = document.getElementById('stop-rotation');
    stopRotationElt.onclick = function() {
      noRotation = true;
      stopRotationElt.style.display = 'none';
    };
  }

  function createClouds(radius, segments) {
    var map = THREE.ImageUtils.loadTexture('images/fair_clouds_4k.png', undefined, function() {
      if (++loadedCount >= 1) {
        document.getElementById('loading').style.display = 'none';
      }
    });
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.003, segments, segments),
      new THREE.MeshPhongMaterial({
        map:         map,
        transparent: true,
        opacity: 1.0,
      })
    );
  }

  function createStars(radius, segments) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, segments, segments),
      new THREE.MeshBasicMaterial({
        map:  THREE.ImageUtils.loadTexture('images/galaxy_starfield.png'),
        side: THREE.BackSide
      })
    );
  }

  function createSphere(radius, segments) {
		return new THREE.Mesh(
			new THREE.SphereGeometry(radius, segments, segments),
			new THREE.MeshPhongMaterial({
				map:         THREE.ImageUtils.loadTexture('images/2_no_clouds_4k.jpg'),
				bumpMap:     THREE.ImageUtils.loadTexture('images/elev_bump_4k.jpg'),
				bumpScale:   0.005,
				specularMap: THREE.ImageUtils.loadTexture('images/water_4k.png'),
				specular:    new THREE.Color('grey')
			})
		);
  }
}());
