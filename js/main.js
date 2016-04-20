(function () {
  // Height and width on canvas.
  var LAT_HEIGHT_PX = 36;
  var LNG_WIDTH_PX = 72;

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
  // scene.add(clouds)

  var renderedHeatSphere = null;
  animateHeatSphere();

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
      if (!simulationClicked) {
        sphere.rotation.y += 0.0005;
      }
      clouds.rotation.y = sphere.rotation.y;
      if (renderedHeatSphere) {
        renderedHeatSphere.rotation.y = sphere.rotation.y;
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
    var jumpToElt = document.getElementById('jump-to');
    jumpToElt.onchange = function() {
      animationYear = parseInt(this.value);
      if (animationInterval) {
        clearInterval(animationInterval);
      }
      animateHeatSphere();
    };
    document.getElementById('range-select').oninput = function() {
      document.getElementById('range-value').innerHTML = this.value;
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

  function createHeatSphere(radius, segments, heatMap) {
    var map = new THREE.Texture(heatMap);
    map.needsUpdate = true;

    return new THREE.Mesh(
      new THREE.SphereGeometry(radius + 0.006, segments, segments),
      new THREE.MeshPhongMaterial({
        map:         map,
        transparent: true,
        opacity: 0.5,
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

  var hm = h337.create({
    container: document.getElementById('heatmap'),
    blur: 0,
    radius: 1,
    maxOpacity: 1,
    minOpacity: 0.5,
    gradient: {
      '0.': 'blue',
      '.7': 'yellow',
      '1.': 'red',
    }
  });

  function getHeatmapForMonth(month, year) {
    var points = [];
    var max = Number.MIN_VALUE;
    var min = Number.MAX_VALUE;

    monthData = getDataForMonth(month, year);
    assert(monthData[0] == month, 'Data must be aligned properly');
    assert(monthData[1] == year, 'Data must be aligned properly');

    var arridx = 2;
    for (var latBucket = 0; latBucket < LAT_HEIGHT_PX; latBucket++) {
      for (var lngBucket = 0; lngBucket < LNG_WIDTH_PX; lngBucket++) {
        var val = monthData[arridx];
        if (val == -9999) {
          arridx++;
          continue;
        }
        // val = Math.abs(val);

        max = Math.max(val, max);
        min = Math.min(val, min);
        points.push({
          y: latBucket,
          x: lngBucket,
          value: val,
        });
        arridx++;
      }
    }

    data = {
      min: -100,
      max: 900,
      data: points
    };

    hm.setData(data);

    return document.querySelector('#heatmap canvas');
  }

  function getDataForMonth(month, year) {
    var monthSize = LAT_HEIGHT_PX * LNG_WIDTH_PX + 2;
    var yearOffset = year - 1880;
    var monthOffset = month - 1;
    var totalOffset = (yearOffset * 12 + monthOffset) * monthSize;
    return window.DATA.slice(totalOffset, totalOffset + monthSize);
  }

  var animationMonth = 1;
  var animationYear = 1880;
  var animationInterval;

  function animateHeatSphere() {
    animationInterval = setInterval(function() {
      renderHeatSphereForMonth(animationMonth, animationYear);
      document.getElementById('bottom-title').innerHTML =
          animationMonth + '/' + animationYear;
      animationMonth++;

      if (animationYear > 2015) {
        clearInterval(animationInterval);
      }
      if (animationMonth > 12) {
        animationMonth = 1;
        animationYear++;
      }
    }, 100);
  }

  function renderHeatSphereForMonth(month, year) {
    var heatMap = getHeatmapForMonth(month, year);
    if (renderedHeatSphere) {
      // TODO(ian): dispose of old texture?
      renderedHeatSphere.material.map = new THREE.Texture(heatMap);
      renderedHeatSphere.material.map.needsUpdate = true;
      renderedHeatSphere.material.needsUpdate = true;
    } else {
      renderedHeatSphere = createHeatSphere(radius, segments, heatMap);
      scene.add(renderedHeatSphere);
    }
  }

	function assert(condition, message) {
    if (!condition) {
      message = message || "Assertion failed";
      if (typeof Error !== "undefined") {
        throw new Error(message);
      }
      throw message; // Fallback
    }
	}
}());
