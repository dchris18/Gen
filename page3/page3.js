"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.querySelector(".globe-canvas");
  const stage = document.querySelector(".globe-stage");

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

  let dragging = false;
  let previousX = 0;
  let previousY = 0;

  canvas.addEventListener("mousedown", (e) => {
    dragging = true;
    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const moveX = e.clientX - previousX;
    const moveY = e.clientY - previousY;

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

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();

    zoom += e.deltaY * 0.004;
    zoom = Math.max(4.8, Math.min(7.2, zoom));

    camera.position.set(0, 0, zoom);
    camera.lookAt(0, 0, 0);
  });

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
    renderer.render(scene, camera);
  }

  animate();
});