"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const eyeButton = document.querySelector(".eye-button");
  const gridMenu = document.querySelector(".grid-menu");
  const gridButtons = document.querySelectorAll("[data-grid]");
  const toolButtons = document.querySelectorAll(".tool-btn");
  const container = document.querySelector("#three-platform");

  eyeButton.addEventListener("click", () => {
    gridMenu.classList.toggle("open");
  });

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 300 / 560, 0.1, 100);
  camera.position.set(5, 5, 7);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(300, 560);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(3, 5, 4);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  let platform;
  let currentSize = 6;

  function createPlatform(size) {
    if (platform) {
      scene.remove(platform);

      platform.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }

        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    }

    currentSize = size;

    const platformGroup = new THREE.Group();

    const platformGeometry = new THREE.BoxGeometry(size, 0.35, size);

    const platformMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x5f7852 }),
      new THREE.MeshStandardMaterial({ color: 0x4f6744 }),
      new THREE.MeshStandardMaterial({ color: 0x6f875e }),
      new THREE.MeshStandardMaterial({ color: 0x3f5237 }),
      new THREE.MeshStandardMaterial({ color: 0x5a704c }),
      new THREE.MeshStandardMaterial({ color: 0x465d3e })
    ];

    const base = new THREE.Mesh(platformGeometry, platformMaterials);
    platformGroup.add(base);

    const edges = new THREE.EdgesGeometry(platformGeometry);
    const outline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0xf0dfb8 })
    );
    base.add(outline);

    const grid = new THREE.GridHelper(size, size, 0x9fb892, 0x9fb892);
    grid.position.y = 0.181;
    platformGroup.add(grid);

    platformGroup.rotation.x = 0.55;
    platformGroup.rotation.y = -0.75;
    platformGroup.position.y = -0.2;

    if (size === 3) {
      platformGroup.scale.set(1.15, 1, 1.15);
    } else if (size === 6) {
      platformGroup.scale.set(0.95, 1, 0.95);
    } else if (size === 9) {
      platformGroup.scale.set(0.75, 1, 0.75);
    }

    platform = platformGroup;
    scene.add(platform);

    camera.position.set(5, 5, 7);
    camera.lookAt(0, 0, 0);
  }

  createPlatform(6);

  gridButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const size = Number(button.dataset.grid);
      createPlatform(size);
      gridMenu.classList.remove("open");
    });
  });

  let dragging = false;
  let previousX = 0;
  let previousY = 0;

  container.addEventListener("mousedown", (e) => {
    dragging = true;
    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging || !platform) return;

    const moveX = e.clientX - previousX;
    const moveY = e.clientY - previousY;

    platform.rotation.y += moveX * 0.01;
    platform.rotation.x += moveY * 0.01;

    platform.rotation.x = Math.max(-0.4, Math.min(0.9, platform.rotation.x));

    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();

    camera.position.z += e.deltaY * 0.003;
    camera.position.z = Math.max(5.5, Math.min(8.5, camera.position.z));

    camera.lookAt(0, 0, 0);
  });

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
});