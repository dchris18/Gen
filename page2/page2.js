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

  if (!container) return;

  let selectedPlant = null;

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
      selectedPlant = card.dataset.plant;
      plantMenu.classList.remove("open");
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

  scene.add(new THREE.DirectionalLight(0xffffff, 1.8).position.set(3, 5, 4));
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));

  const light = new THREE.DirectionalLight(0xffffff, 1.8);
  light.position.set(3, 5, 4);
  scene.add(light);

  const ambient = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambient);

  let platform;
  let currentSize = 6;
  let selectedSquare = null;
  let tileMeshes = [];
  let plantedItems = {};

  let savedRotation = {
    x: 0.55,
    y: -0.75
  };

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function makeStem(height = 0.55) {
    const stemGeometry = new THREE.CylinderGeometry(0.035, 0.045, height, 10);
    const stemMaterial = new THREE.MeshStandardMaterial({ color: 0x527447 });
    const stem = new THREE.Mesh(stemGeometry, stemMaterial);
    stem.position.y = height / 2;
    return stem;
  }

  function makeLeaf(x, y, z, rotateZ) {
    const leafGeometry = new THREE.SphereGeometry(0.17, 16, 12);
    const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x6f985d });
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

    leaf.scale.set(1.4, 0.22, 0.65);
    leaf.position.set(x, y, z);
    leaf.rotation.z = rotateZ;
    leaf.rotation.y = rotateZ * 0.4;

    return leaf;
  }

  function createSproutPlant() {
    const plant = new THREE.Group();

    const soilGeometry = new THREE.CylinderGeometry(0.28, 0.32, 0.12, 24);
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x7b513b });
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 0.06;
    plant.add(soil);

    const stem = makeStem(0.52);
    stem.position.y = 0.12;
    plant.add(stem);

    plant.add(makeLeaf(-0.13, 0.48, 0, 0.65));
    plant.add(makeLeaf(0.13, 0.55, 0, -0.65));

    plant.scale.set(0.8, 0.8, 0.8);
    return plant;
  }

  function createFernPlant() {
    const plant = new THREE.Group();

    const soilGeometry = new THREE.CylinderGeometry(0.3, 0.34, 0.12, 24);
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x7b513b });
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 0.06;
    plant.add(soil);

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;

      const stem = makeStem(0.5);
      stem.position.set(Math.cos(angle) * 0.08, 0.12, Math.sin(angle) * 0.08);
      stem.rotation.z = Math.cos(angle) * 0.55;
      stem.rotation.x = Math.sin(angle) * -0.55;
      plant.add(stem);

      const leaf = makeLeaf(
        Math.cos(angle) * 0.28,
        0.48,
        Math.sin(angle) * 0.28,
        angle
      );

      leaf.scale.set(1.6, 0.18, 0.48);
      plant.add(leaf);
    }

    plant.scale.set(0.75, 0.75, 0.75);
    return plant;
  }

  function createFlowerPlant() {
    const plant = new THREE.Group();

    const soilGeometry = new THREE.CylinderGeometry(0.28, 0.32, 0.12, 24);
    const soilMaterial = new THREE.MeshStandardMaterial({ color: 0x7b513b });
    const soil = new THREE.Mesh(soilGeometry, soilMaterial);
    soil.position.y = 0.06;
    plant.add(soil);

    const stem = makeStem(0.7);
    stem.position.y = 0.12;
    plant.add(stem);

    plant.add(makeLeaf(-0.13, 0.42, 0, 0.75));
    plant.add(makeLeaf(0.13, 0.5, 0, -0.75));

    const petalMaterial = new THREE.MeshStandardMaterial({ color: 0xe8a3a8 });
    const centerMaterial = new THREE.MeshStandardMaterial({ color: 0xf0df8a });

    for (let i = 0; i < 6; i++) {
      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 12),
        petalMaterial
      );

      const angle = (i / 6) * Math.PI * 2;
      petal.position.set(Math.cos(angle) * 0.15, 0.78, Math.sin(angle) * 0.15);
      petal.scale.set(1, 0.45, 0.7);
      plant.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      centerMaterial
    );
    center.position.y = 0.78;
    plant.add(center);

    plant.scale.set(0.8, 0.8, 0.8);
    return plant;
  }

  function createPlant(type) {
    if (type === "fern") return createFernPlant();
    if (type === "flower") return createFlowerPlant();
    return createSproutPlant();
  }

  function plantOnSquare(tile) {
    if (!selectedPlant) return;

    const tileId = tile.userData.tileId;

    if (plantedItems[tileId]) {
      tile.parent.remove(plantedItems[tileId]);
    }

    const plant = createPlant(selectedPlant);
    plant.position.y = 0.08;

    tile.parent.add(plant);
    plantedItems[tileId] = plant;
  }

  function createPlatform(size) {
    if (platform) {
      savedRotation.x = platform.rotation.x;
      savedRotation.y = platform.rotation.y;
      scene.remove(platform);
    }

    currentSize = size;
    selectedSquare = null;
    tileMeshes = [];
    plantedItems = {};

    const platformGroup = new THREE.Group();

    const platformGeometry = new THREE.BoxGeometry(size, 0.35, size);

    const base = new THREE.Mesh(
      platformGeometry,
      new THREE.MeshStandardMaterial({ color: 0x5f7852 })
    );

    platformGroup.add(base);

    const grid = new THREE.GridHelper(size, size, 0x9fb892, 0x9fb892);
    grid.position.y = 0.181;
    platformGroup.add(grid);

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tileGroup = new THREE.Group();

        tileGroup.position.x = col - size / 2 + 0.5;
        tileGroup.position.z = row - size / 2 + 0.5;
        tileGroup.position.y = 0.205;

        const clickTile = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        clickTile.rotation.x = -Math.PI / 2;
        clickTile.userData.tileId = `${row}-${col}`;

        const glow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.92, 0.92),
          new THREE.MeshBasicMaterial({
            color: 0xfff1b8,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.012;

        const border = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.96, 0.96)),
          new THREE.LineBasicMaterial({
            color: 0xfff1b8,
            transparent: true,
            opacity: 0
          })
        );

        border.rotation.x = -Math.PI / 2;
        border.position.y = 0.025;

        clickTile.userData.glow = glow;
        clickTile.userData.border = border;

        tileGroup.add(clickTile);
        tileGroup.add(glow);
        tileGroup.add(border);

        tileMeshes.push(clickTile);
        platformGroup.add(tileGroup);
      }
    }

    platformGroup.rotation.x = savedRotation.x;
    platformGroup.rotation.y = savedRotation.y;
    platformGroup.position.set(0, -0.2, 0);

    if (size === 3) {
      platformGroup.scale.set(1.15, 1, 1.15);
      camera.position.set(5, 5, 7);
    } else if (size === 6) {
      platformGroup.scale.set(0.95, 1, 0.95);
      camera.position.set(5, 5, 7.8);
    } else {
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
      createPlatform(Number(button.dataset.grid));
      gridMenu.classList.remove("open");
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

    if (Math.abs(moveX) > 2 || Math.abs(moveY) > 2) didDrag = true;

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
        selectedSquare.userData.glow.material.opacity = 0;
        selectedSquare.userData.border.material.opacity = 0;
      }

      selectedSquare = hits[0].object;
      selectedSquare.userData.glow.material.opacity = 0.38;
      selectedSquare.userData.border.material.opacity = 1;

      plantOnSquare(selectedSquare);
    }
  });

  container.addEventListener("wheel", (e) => {
    e.preventDefault();

    camera.position.z += e.deltaY * 0.045;

    if (currentSize === 3) {
      camera.position.z = Math.max(3, Math.min(10, camera.position.z));
    } else if (currentSize === 6) {
      camera.position.z = Math.max(4, Math.min(15, camera.position.z));
    } else {
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