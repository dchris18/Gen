"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector(".globe-canvas");
  const stage = document.querySelector(".globe-stage");

  const regionPopup = document.getElementById("regionPopup");
  const regionName = document.getElementById("regionName");
  const confirmRegion = document.getElementById("confirmRegion");
  const cancelRegion = document.getElementById("cancelRegion");

  if (!canvas || !stage) return;

  const scene = new THREE.Scene();
  let zoom = 6.2;

  const camera = new THREE.PerspectiveCamera(
    40,
    stage.clientWidth / stage.clientHeight,
    0.1,
    100
  );

  camera.position.set(0, 0, zoom);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setSize(stage.clientWidth, stage.clientHeight, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
  directionalLight.position.set(4, 3, 6);
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight(0x9fd7ff, 0.9);
  rimLight.position.set(-4, -2, -4);
  scene.add(rimLight);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load("../photos/Earth.png");

  earthTexture.colorSpace = THREE.SRGBColorSpace;
  earthTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  earthTexture.minFilter = THREE.LinearMipmapLinearFilter;
  earthTexture.magFilter = THREE.LinearFilter;
  earthTexture.generateMipmaps = true;

  const earthGeometry = new THREE.SphereGeometry(2.05, 96, 96);

  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.95,
    metalness: 0
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.rotation.x = 0.15;
  earth.rotation.y = 0.6;
  scene.add(earth);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(2.1, 96, 96),
    new THREE.MeshBasicMaterial({
      color: 0xbce6ff,
      transparent: true,
      opacity: 0.16
    })
  );

  scene.add(atmosphere);

  const pinGroup = new THREE.Group();
  earth.add(pinGroup);

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  let selectedRegion = "";
  let dragging = false;
  let moved = false;
  let previousX = 0;
  let previousY = 0;

  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    moved = false;
    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const moveX = e.clientX - previousX;
    const moveY = e.clientY - previousY;

    if (Math.abs(moveX) > 2 || Math.abs(moveY) > 2) {
      moved = true;
    }

    earth.rotation.y += moveX * 0.01;
    earth.rotation.x += moveY * 0.01;

    earth.rotation.x = Math.max(-1.1, Math.min(1.1, earth.rotation.x));
    atmosphere.rotation.copy(earth.rotation);

    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  canvas.addEventListener("click", (e) => {
    if (moved) return;

    const rect = canvas.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObject(earth);

    if (hits.length > 0) {
      const localPoint = earth.worldToLocal(hits[0].point.clone());

      pinGroup.clear();

      const pin = createPin();
      pin.position.copy(localPoint.normalize().multiplyScalar(2.18));
      pin.lookAt(camera.position);
      pinGroup.add(pin);

      selectedRegion = getRegionName(localPoint);

      if (regionName && regionPopup) {
        regionName.textContent = selectedRegion;
        regionPopup.classList.add("show");
      }
    }
  });

  confirmRegion?.addEventListener("click", () => {
    alert(`Region confirmed: ${selectedRegion}`);
    regionPopup?.classList.remove("show");
  });

  cancelRegion?.addEventListener("click", () => {
    selectedRegion = "";
    pinGroup.clear();
    regionPopup?.classList.remove("show");
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    zoom += e.deltaY * 0.004;
    zoom = Math.max(4.8, Math.min(7.2, zoom));

    camera.position.set(0, 0, zoom);
    camera.lookAt(0, 0, 0);
  });

  function createPin() {
    const pin = new THREE.Group();

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 20, 20),
      new THREE.MeshStandardMaterial({ color: 0xd94f45 })
    );

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.28, 16),
      new THREE.MeshStandardMaterial({ color: 0xd94f45 })
    );

    stem.position.y = -0.14;

    pin.add(head);
    pin.add(stem);

    return pin;
  }

  function getRegionName(point) {
    const radius = point.length();
    const lat = THREE.MathUtils.radToDeg(Math.asin(point.y / radius));
    let lon = THREE.MathUtils.radToDeg(Math.atan2(point.z, point.x));

    lon = lon - 90;

    if (lon < -180) lon += 360;
    if (lon > 180) lon -= 360;

    if (lat > 72) return "Arctic Region";
    if (lat < -60) return "Antarctica";

    if (lat >= 15 && lat <= 72 && lon >= -170 && lon <= -50) {
      return "North America";
    }

    if (lat >= -58 && lat <= 15 && lon >= -85 && lon <= -35) {
      return "South America";
    }

    if (lat >= 35 && lat <= 72 && lon >= -25 && lon <= 45) {
      return "Europe";
    }

    if (lat >= -35 && lat <= 38 && lon >= -20 && lon <= 55) {
      return "Africa";
    }

    if (lat >= 5 && lat <= 77 && lon >= 45 && lon <= 180) {
      return "Asia";
    }

    if (lat >= -50 && lat <= 5 && lon >= 105 && lon <= 180) {
      return "Australia / Oceania";
    }

    if (lat >= 5 && lat <= 35 && lon >= -120 && lon <= -60) {
      return "Central America / Caribbean";
    }

    if (lat >= 10 && lat <= 40 && lon >= 35 && lon <= 75) {
      return "Middle East";
    }

    return "Ocean Region";
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
  }

  window.addEventListener("resize", resize);

  function animate() {
    requestAnimationFrame(animate);

    pinGroup.children.forEach((pin) => {
      pin.lookAt(camera.position);
    });

    renderer.render(scene, camera);
  }

  animate();
});