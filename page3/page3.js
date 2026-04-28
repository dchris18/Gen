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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.25);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.9);
  directionalLight.position.set(4, 3, 6);
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight(0x9fd7ff, 0.8);
  rimLight.position.set(-4, -2, -4);
  scene.add(rimLight);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load("../photos/Earth.png");
  earthTexture.colorSpace = THREE.SRGBColorSpace;

  const earthGeometry = new THREE.SphereGeometry(2.05, 48, 48);

  const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 1,
    metalness: 0
  });

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  earth.rotation.x = 0.15;
  earth.rotation.y = 0.6;
  scene.add(earth);

  const atmosphereGeometry = new THREE.SphereGeometry(2.1, 48, 48);
  const atmosphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xbce6ff,
    transparent: true,
    opacity: 0.18
  });

  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  const pinGroup = new THREE.Group();
  scene.add(pinGroup);

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
      const point = hits[0].point.clone();

      pinGroup.clear();

      const pin = createPin();
      pin.position.copy(point.normalize().multiplyScalar(2.18));
      pin.lookAt(camera.position);
      pinGroup.add(pin);

      selectedRegion = getRegionName(point);

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
      new THREE.SphereGeometry(0.08, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xd94f45 })
    );

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.28, 12),
      new THREE.MeshStandardMaterial({ color: 0xd94f45 })
    );

    stem.position.y = -0.14;

    pin.add(head);
    pin.add(stem);

    return pin;
  }

  function getRegionName(point) {
    const lat = THREE.MathUtils.radToDeg(Math.asin(point.y / point.length()));
    const lon = THREE.MathUtils.radToDeg(Math.atan2(point.z, point.x));

    if (lat > 50) return "Northern Region";
    if (lat < -35) return "Southern Region";

    if (lon > -170 && lon < -30 && lat > 5) {
      return "North America";
    }

    if (lon > -90 && lon < -30 && lat < 15) {
      return "South America";
    }

    if (lon > -20 && lon < 55 && lat > -35) {
      return "Africa";
    }

    if (lon > -15 && lon < 45 && lat > 35) {
      return "Europe";
    }

    if (lon > 45 && lon < 150 && lat > 5) {
      return "Asia";
    }

    if (lon > 105 && lon < 180 && lat < 5) {
      return "Australia / Oceania";
    }

    return "Ocean Region";
  }

  function resize() {
    const width = stage.clientWidth;
    const height = stage.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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