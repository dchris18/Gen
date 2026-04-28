"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const eyeButton = document.querySelector(".eye-button");
  const toolButtons = document.querySelectorAll(".tool-btn");
  const container = document.querySelector("#three-platform");

  eyeButton?.addEventListener("click", () => {
    alert("Preview mode");
  });

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  const scene = new THREE.Scene();

  let zoom = 6;

  const camera = new THREE.PerspectiveCamera(45, 300 / 492, 0.1, 100);
  camera.position.set(4, 4, zoom);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(300, 492);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const platformGeometry = new THREE.BoxGeometry(3.8, 0.35, 3.8);

  const materials = [
    new THREE.MeshStandardMaterial({ color: 0x5f7852 }),
    new THREE.MeshStandardMaterial({ color: 0x4f6744 }),
    new THREE.MeshStandardMaterial({ color: 0x6f875e }),
    new THREE.MeshStandardMaterial({ color: 0x3f5237 }),
    new THREE.MeshStandardMaterial({ color: 0x5a704c }),
    new THREE.MeshStandardMaterial({ color: 0x465d3e })
  ];

  const platform = new THREE.Mesh(platformGeometry, materials);
  scene.add(platform);

  const edges = new THREE.EdgesGeometry(platformGeometry);
  const outline = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xf0dfb8 })
  );
  platform.add(outline);

  const grid = new THREE.GridHelper(3.8, 8, 0x8ca27a, 0x8ca27a);
  grid.position.y = 0.181;
  platform.add(grid);

  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(3, 5, 4);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  let dragging = false;
  let previousX = 0;
  let previousY = 0;

  platform.rotation.x = 0.55;
  platform.rotation.y = -0.75;

  container.addEventListener("mousedown", (e) => {
    dragging = true;
    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;

    const moveX = e.clientX - previousX;
    const moveY = e.clientY - previousY;

    platform.rotation.y += moveX * 0.01;
    platform.rotation.x += moveY * 0.01;

    platform.rotation.x = Math.max(-0.4, Math.min(0.8, platform.rotation.x));

    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();

    zoom += e.deltaY * 0.003;
    zoom = Math.max(4.5, Math.min(7.5, zoom));

    camera.position.set(4, 4, zoom);
    camera.lookAt(0, 0, 0);
  });

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
});