"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const eyeButton = document.querySelector(".eye-button");
  const gridMenu = document.querySelector(".grid-menu");
  const gridButtons = document.querySelectorAll("[data-grid]");
  const toolButtons = document.querySelectorAll(".tool-btn");
  const potButton = document.querySelector(".tool-pot");
  const plantMenu = document.querySelector(".plant-menu");
  const plantCards = document.querySelectorAll(".plant-card");
  const container = document.querySelector("#three-platform");

  if (!container) {
    console.error("Missing #three-platform div in HTML");
    return;
  }

  if (eyeButton && gridMenu) {
    eyeButton.addEventListener("click", () => {
      gridMenu.classList.toggle("open");
    });
  }

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");
    });
  });

  if (potButton && plantMenu) {
    potButton.addEventListener("click", () => {
      plantMenu.classList.toggle("open");
    });
  }

  plantCards.forEach((card) => {
    card.addEventListener("click", () => {
      plantCards.forEach((item) => item.classList.remove("selected"));
      card.classList.add("selected");
    });
  });

  const scene = new THREE.Scene();

  const width = container.clientWidth || 300;
  const height = container.clientHeight || 560;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(5, 5, 7.8);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
  });

  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(3, 5, 4);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  let platform;
  let currentSize = 6;
  let selectedSquare = null;
  let tileMeshes = [];

  let savedRotation = {
    x: 0.55,
    y: -0.75
  };

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function createPlatform(size) {
    if (platform) {
      savedRotation.x = platform.rotation.x;
      savedRotation.y = platform.rotation.y;

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
    selectedSquare = null;
    tileMeshes = [];

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

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tileSize = 1;

        const tileGroup = new THREE.Group();

        tileGroup.position.x = col - size / 2 + 0.5;
        tileGroup.position.z = row - size / 2 + 0.5;
        tileGroup.position.y = 0.205;

        const clickGeometry = new THREE.PlaneGeometry(tileSize, tileSize);
        const clickMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        const clickTile = new THREE.Mesh(clickGeometry, clickMaterial);
        clickTile.rotation.x = -Math.PI / 2;
        clickTile.userData.isTile = true;

        const outerGlowGeometry = new THREE.PlaneGeometry(
          tileSize * 1.08,
          tileSize * 1.08
        );

        const outerGlowMaterial = new THREE.MeshBasicMaterial({
          color: 0xffdf8a,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
        outerGlow.rotation.x = -Math.PI / 2;
        outerGlow.position.y = 0.006;

        const glowGeometry = new THREE.PlaneGeometry(
          tileSize * 0.92,
          tileSize * 0.92
        );

        const glowMaterial = new THREE.MeshBasicMaterial({
          color: 0xfff1b8,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false
        });

        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.012;

        const borderGeometry = new THREE.EdgesGeometry(
          new THREE.PlaneGeometry(tileSize * 0.96, tileSize * 0.96)
        );

        const borderMaterial = new THREE.LineBasicMaterial({
          color: 0xfff1b8,
          transparent: true,
          opacity: 0
        });

        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        border.rotation.x = -Math.PI / 2;
        border.position.y = 0.025;

        const raisedHighlightGeometry = new THREE.BoxGeometry(
          tileSize * 0.82,
          0.04,
          tileSize * 0.82
        );

        const raisedHighlightMaterial = new THREE.MeshBasicMaterial({
          color: 0xfff4c7,
          transparent: true,
          opacity: 0,
          depthWrite: false
        });

        const raisedHighlight = new THREE.Mesh(
          raisedHighlightGeometry,
          raisedHighlightMaterial
        );

        raisedHighlight.position.y = 0.025;

        tileGroup.add(clickTile);
        tileGroup.add(outerGlow);
        tileGroup.add(glow);
        tileGroup.add(border);
        tileGroup.add(raisedHighlight);

        clickTile.userData.outerGlow = outerGlow;
        clickTile.userData.glow = glow;
        clickTile.userData.border = border;
        clickTile.userData.raisedHighlight = raisedHighlight;

        tileMeshes.push(clickTile);
        platformGroup.add(tileGroup);
      }
    }

    platformGroup.rotation.x = savedRotation.x;
    platformGroup.rotation.y = savedRotation.y;
    platformGroup.rotation.z = 0;
    platformGroup.position.set(0, -0.2, 0);

    if (size === 3) {
      platformGroup.scale.set(1.15, 1, 1.15);
      camera.position.set(5, 5, 7);
    } else if (size === 6) {
      platformGroup.scale.set(0.95, 1, 0.95);
      camera.position.set(5, 5, 7.8);
    } else if (size === 9) {
      platformGroup.scale.set(0.75, 1, 0.75);
      camera.position.set(5, 5, 9.5);
    }

    camera.lookAt(0, 0, 0);

    platform = platformGroup;
    scene.add(platform);
  }

  createPlatform(6);

  gridButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const size = Number(button.dataset.grid);
      createPlatform(size);

      if (gridMenu) {
        gridMenu.classList.remove("open");
      }
    });
  });

  let dragging = false;
  let didDrag = false;
  let previousX = 0;
  let previousY = 0;

  container.addEventListener("mousedown", (e) => {
    dragging = true;
    didDrag = false;
    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mousemove", (e) => {
    if (!dragging || !platform) return;

    const moveX = e.clientX - previousX;
    const moveY = e.clientY - previousY;

    if (Math.abs(moveX) > 2 || Math.abs(moveY) > 2) {
      didDrag = true;
    }

    platform.rotation.y += moveX * 0.01;
    platform.rotation.x += moveY * 0.01;

    platform.rotation.x = Math.max(-0.4, Math.min(0.9, platform.rotation.x));

    previousX = e.clientX;
    previousY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    dragging = false;
  });

  container.addEventListener("click", (e) => {
    if (didDrag) return;

    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(tileMeshes);

    if (hits.length > 0) {
      if (selectedSquare) {
        selectedSquare.userData.outerGlow.material.opacity = 0;
        selectedSquare.userData.glow.material.opacity = 0;
        selectedSquare.userData.border.material.opacity = 0;
        selectedSquare.userData.raisedHighlight.material.opacity = 0;
      }

      selectedSquare = hits[0].object;

      selectedSquare.userData.outerGlow.material.opacity = 0.25;
      selectedSquare.userData.glow.material.opacity = 0.42;
      selectedSquare.userData.border.material.opacity = 1;
      selectedSquare.userData.raisedHighlight.material.opacity = 0.22;
    }
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();

    camera.position.z += e.deltaY * 0.045;

    if (currentSize === 3) {
      camera.position.z = Math.max(3, Math.min(10, camera.position.z));
    } else if (currentSize === 6) {
      camera.position.z = Math.max(4, Math.min(15, camera.position.z));
    } else if (currentSize === 9) {
      camera.position.z = Math.max(5, Math.min(20, camera.position.z));
    }

    camera.lookAt(0, 0, 0);
  });

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }

  animate();
});