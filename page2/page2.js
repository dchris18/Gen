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

  const removePopup = document.querySelector(".remove-popup");
  const confirmRemove = document.querySelector(".confirm-remove");
  const backRemove = document.querySelector(".back-remove");

  if (!container) return;

  let selectedPlant = null;
  let selectedTool = null;
  let platform;
  let currentSize = 6;
  let selectedSquare = null;
  let tileMeshes = [];
  let plantedItems = {};
  let tileWaitingForRemoval = null;

  let savedRotation = { x: 0.55, y: -0.75 };

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
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  const mainLight = new THREE.DirectionalLight(0xffffff, 2);
  mainLight.position.set(3, 6, 4);
  mainLight.castShadow = true;
  scene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0xf8e6c8, 0.8);
  fillLight.position.set(-4, 3, -3);
  scene.add(fillLight);

  const ambient = new THREE.AmbientLight(0xffffff, 1.15);
  scene.add(ambient);

  const raycaster = new THREE.Raycaster();
  const plantRaycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  const materials = {
    tileTop: new THREE.MeshStandardMaterial({
      color: 0x5f7852,
      roughness: 0.75
    }),

    tileSide: new THREE.MeshStandardMaterial({
      color: 0x465d3e,
      roughness: 0.8
    }),

    soil: new THREE.MeshStandardMaterial({
      color: 0x7a5038,
      roughness: 0.85
    }),

    soilDark: new THREE.MeshStandardMaterial({
      color: 0x5f3f2f,
      roughness: 0.9
    }),

    stem: new THREE.MeshStandardMaterial({
      color: 0x55784b,
      roughness: 0.65
    }),

    stemLight: new THREE.MeshStandardMaterial({
      color: 0x6f985d,
      roughness: 0.65
    }),

    leaf: new THREE.MeshStandardMaterial({
      color: 0x6f985d,
      roughness: 0.6
    }),

    leafDark: new THREE.MeshStandardMaterial({
      color: 0x4f7445,
      roughness: 0.7
    }),

    leafLight: new THREE.MeshStandardMaterial({
      color: 0x92b978,
      roughness: 0.55
    }),

    flowerPetal: new THREE.MeshStandardMaterial({
      color: 0xe8a3a8,
      roughness: 0.55
    }),

    flowerPetalLight: new THREE.MeshStandardMaterial({
      color: 0xf2c0bd,
      roughness: 0.5
    }),

    flowerCenter: new THREE.MeshStandardMaterial({
      color: 0xf0d77a,
      roughness: 0.55
    }),

    potDark: new THREE.MeshStandardMaterial({
      color: 0x9b6248,
      roughness: 0.8
    }),

    carrot: new THREE.MeshStandardMaterial({
      color: 0xe9853f,
      roughness: 0.6
    }),

    carrotDark: new THREE.MeshStandardMaterial({
      color: 0xb75f31,
      roughness: 0.7
    }),

    potato: new THREE.MeshStandardMaterial({
      color: 0xb98b5d,
      roughness: 0.85
    }),

    potatoDark: new THREE.MeshStandardMaterial({
      color: 0x7b5138,
      roughness: 0.95
    }),

    tomato: new THREE.MeshStandardMaterial({
      color: 0xd94f3d,
      roughness: 0.55
    }),

    tomatoDark: new THREE.MeshStandardMaterial({
      color: 0xa73931,
      roughness: 0.65
    })
  };

  if (eyeButton && gridMenu) {
    eyeButton.addEventListener("click", () => {
      gridMenu.classList.toggle("open");
    });
  }

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");

      if (button.classList.contains("tool-pot")) {
        selectedTool = "plant";
      } else if (button.classList.contains("tool-shears")) {
        selectedTool = "remove";
        if (plantMenu) plantMenu.classList.remove("open");
      } else {
        selectedTool = "trowel";
        if (plantMenu) plantMenu.classList.remove("open");
      }
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
      selectedTool = "plant";

      if (plantMenu) plantMenu.classList.remove("open");

      if (selectedSquare && !selectedSquare.userData.removed) {
        plantOnSquare(selectedSquare);
      }
    });
  });

  function roundedLeaf(width, height, depth, material) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 20, 14),
      material
    );

    leaf.scale.set(width, height, depth);
    leaf.castShadow = true;
    leaf.receiveShadow = true;

    return leaf;
  }

  function makeStem(height, radius = 0.035, material = materials.stem) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.75, radius, height, 14),
      material
    );

    stem.position.y = height / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;

    return stem;
  }

  function makeSoilBase() {
    const group = new THREE.Group();

    const saucer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.38, 0.08, 28),
      materials.potDark
    );
    saucer.position.y = 0.04;

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.33, 0.11, 28),
      materials.soil
    );
    soil.position.y = 0.12;

    const topSoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.27, 0.025, 28),
      materials.soilDark
    );
    topSoil.position.y = 0.19;

    group.add(saucer, soil, topSoil);

    return group;
  }

  function markPlantPieces(group, tileId) {
    group.traverse((child) => {
      child.userData.isPlantPiece = true;
      child.userData.tileId = tileId;
    });
  }

  function createSproutPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const stem = makeStem(0.58);
    stem.position.y = 0.18;
    plant.add(stem);

    const leftLeaf = roundedLeaf(1.25, 0.28, 0.62, materials.leafLight);
    leftLeaf.position.set(-0.16, 0.63, 0);
    leftLeaf.rotation.z = 0.72;
    leftLeaf.rotation.y = -0.35;
    plant.add(leftLeaf);

    const rightLeaf = roundedLeaf(1.25, 0.28, 0.62, materials.leaf);
    rightLeaf.position.set(0.16, 0.7, 0.02);
    rightLeaf.rotation.z = -0.72;
    rightLeaf.rotation.y = 0.35;
    plant.add(rightLeaf);

    const tinyLeaf = roundedLeaf(0.85, 0.2, 0.45, materials.leafDark);
    tinyLeaf.position.set(0.02, 0.52, 0.14);
    tinyLeaf.rotation.z = -0.2;
    tinyLeaf.rotation.x = 0.4;
    plant.add(tinyLeaf);

    plant.scale.set(0.72, 0.72, 0.72);

    return plant;
  }

  function createFernPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2;
      const height = i % 2 === 0 ? 0.62 : 0.5;

      const stem = makeStem(height, 0.025, materials.stemLight);
      stem.position.set(Math.cos(angle) * 0.05, 0.18, Math.sin(angle) * 0.05);
      stem.rotation.z = Math.cos(angle) * 0.62;
      stem.rotation.x = Math.sin(angle) * -0.62;
      plant.add(stem);

      const leaf = roundedLeaf(
        i % 2 === 0 ? 1.5 : 1.15,
        0.16,
        0.42,
        i % 2 === 0 ? materials.leaf : materials.leafLight
      );

      leaf.position.set(
        Math.cos(angle) * 0.3,
        0.55 + (i % 2) * 0.05,
        Math.sin(angle) * 0.3
      );

      leaf.rotation.z = angle;
      leaf.rotation.x = Math.sin(angle) * 0.55;
      leaf.rotation.y = Math.cos(angle) * 0.45;
      plant.add(leaf);
    }

    plant.scale.set(0.68, 0.68, 0.68);

    return plant;
  }

  function createFlowerPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const mainStem = makeStem(0.72);
    mainStem.position.y = 0.18;
    plant.add(mainStem);

    const leftLeaf = roundedLeaf(1.05, 0.2, 0.45, materials.leaf);
    leftLeaf.position.set(-0.2, 0.52, 0.02);
    leftLeaf.rotation.z = 0.75;
    leftLeaf.rotation.y = -0.4;
    plant.add(leftLeaf);

    const rightLeaf = roundedLeaf(1.05, 0.2, 0.45, materials.leafLight);
    rightLeaf.position.set(0.21, 0.56, 0.02);
    rightLeaf.rotation.z = -0.75;
    rightLeaf.rotation.y = 0.4;
    plant.add(rightLeaf);

    const flowerGroup = new THREE.Group();
    flowerGroup.position.y = 0.92;

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;

      const petal = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 18, 12),
        i % 2 === 0 ? materials.flowerPetal : materials.flowerPetalLight
      );

      petal.position.set(
        Math.cos(angle) * 0.14,
        Math.sin(angle) * 0.02,
        Math.sin(angle) * 0.14
      );

      petal.scale.set(1.05, 0.42, 0.75);
      petal.rotation.y = angle;
      flowerGroup.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 18, 14),
      materials.flowerCenter
    );

    flowerGroup.add(center);
    flowerGroup.rotation.x = 0.15;
    plant.add(flowerGroup);

    plant.scale.set(0.7, 0.7, 0.7);

    return plant;
  }

  function createCarrotPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const body = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.55, 20),
      materials.carrot
    );
    body.position.y = 0.42;
    body.rotation.x = Math.PI;
    body.castShadow = true;
    plant.add(body);

    const top = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 18, 12),
      materials.carrot
    );
    top.scale.set(1, 0.5, 1);
    top.position.y = 0.68;
    top.castShadow = true;
    plant.add(top);

    const ringOne = new THREE.Mesh(
      new THREE.TorusGeometry(0.105, 0.008, 8, 24),
      materials.carrotDark
    );
    ringOne.rotation.x = Math.PI / 2;
    ringOne.position.y = 0.48;
    plant.add(ringOne);

    const ringTwo = new THREE.Mesh(
      new THREE.TorusGeometry(0.075, 0.007, 8, 24),
      materials.carrotDark
    );
    ringTwo.rotation.x = Math.PI / 2;
    ringTwo.position.y = 0.34;
    plant.add(ringTwo);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;

      const leaf = roundedLeaf(
        0.72,
        0.12,
        0.3,
        i % 2 === 0 ? materials.leafLight : materials.leaf
      );

      leaf.position.set(
        Math.cos(angle) * 0.14,
        0.9 + (i % 2) * 0.04,
        Math.sin(angle) * 0.14
      );

      leaf.rotation.z = angle;
      leaf.rotation.x = Math.sin(angle) * 0.6;
      leaf.rotation.y = Math.cos(angle) * 0.45;

      plant.add(leaf);
    }

    plant.scale.set(0.72, 0.72, 0.72);

    return plant;
  }

  function createPotatoPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 22, 16),
      materials.potato
    );

    body.scale.set(1.2, 0.7, 0.9);
    body.position.y = 0.38;
    body.rotation.z = -0.15;
    body.castShadow = true;
    plant.add(body);

    const lump = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 16, 12),
      materials.potato
    );

    lump.position.set(0.18, 0.42, 0.04);
    lump.scale.set(1, 0.6, 0.9);
    lump.castShadow = true;
    plant.add(lump);

    for (let i = 0; i < 5; i++) {
      const spot = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 8, 8),
        materials.potatoDark
      );

      spot.position.set(
        -0.15 + i * 0.08,
        0.44 + Math.sin(i) * 0.03,
        0.2
      );

      spot.scale.set(1, 0.4, 0.6);
      plant.add(spot);
    }

    const stem = makeStem(0.4, 0.025, materials.stemLight);
    stem.position.y = 0.55;
    plant.add(stem);

    const leafA = roundedLeaf(0.9, 0.15, 0.35, materials.leaf);
    leafA.position.set(-0.18, 0.8, 0);
    leafA.rotation.z = 0.7;
    plant.add(leafA);

    const leafB = roundedLeaf(0.9, 0.15, 0.35, materials.leafLight);
    leafB.position.set(0.18, 0.85, 0);
    leafB.rotation.z = -0.7;
    plant.add(leafB);

    plant.scale.set(0.72, 0.72, 0.72);

    return plant;
  }

  function createTomatoPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const stem = makeStem(0.7, 0.03, materials.stem);
    stem.position.y = 0.18;
    plant.add(stem);

    const branchA = makeStem(0.4, 0.02, materials.stemLight);
    branchA.position.set(-0.08, 0.48, 0);
    branchA.rotation.z = 0.7;
    plant.add(branchA);

    const branchB = makeStem(0.4, 0.02, materials.stemLight);
    branchB.position.set(0.08, 0.48, 0);
    branchB.rotation.z = -0.7;
    plant.add(branchB);

    for (let i = 0; i < 3; i++) {
      const tomato = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 20, 14),
        i === 1 ? materials.tomatoDark : materials.tomato
      );

      tomato.position.set(-0.15 + i * 0.15, 0.7 + Math.sin(i) * 0.04, 0.08);
      tomato.castShadow = true;
      plant.add(tomato);

      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(0.05, 0.06, 6),
        materials.leafDark
      );

      cap.position.set(
        tomato.position.x,
        tomato.position.y + 0.1,
        tomato.position.z
      );
      cap.rotation.x = Math.PI;
      plant.add(cap);
    }

    const leafA = roundedLeaf(1, 0.15, 0.35, materials.leafLight);
    leafA.position.set(-0.22, 0.6, 0);
    leafA.rotation.z = 0.85;
    plant.add(leafA);

    const leafB = roundedLeaf(1, 0.15, 0.35, materials.leaf);
    leafB.position.set(0.22, 0.63, 0);
    leafB.rotation.z = -0.85;
    plant.add(leafB);

    const topLeaf = roundedLeaf(0.75, 0.12, 0.3, materials.leafDark);
    topLeaf.position.set(0, 0.9, 0);
    topLeaf.rotation.x = 0.35;
    plant.add(topLeaf);

    plant.scale.set(0.72, 0.72, 0.72);

    return plant;
  }

  function createPlant(type) {
    let plant;

    if (type === "fern") {
      plant = createFernPlant();
    } else if (type === "flower") {
      plant = createFlowerPlant();
    } else if (type === "carrot") {
      plant = createCarrotPlant();
    } else if (type === "potato") {
      plant = createPotatoPlant();
    } else if (type === "tomato") {
      plant = createTomatoPlant();
    } else {
      plant = createSproutPlant();
    }

    plant.userData.isPlant = true;
    plant.rotation.y = Math.random() * Math.PI * 2;
    plant.position.y = 0.24;

    return plant;
  }

  function removePlantFromSquare(tile) {
    const tileId = tile.userData.tileId;

    if (plantedItems[tileId]) {
      tile.parent.remove(plantedItems[tileId]);
      plantedItems[tileId] = null;
    }
  }

  function removePlantByTileId(tileId) {
    const tile = tileMeshes.find((item) => item.userData.tileId === tileId);

    if (tile) {
      showPlantRemoveFlash(tile);
      removePlantFromSquare(tile);
    }
  }

  function plantOnSquare(tile) {
    if (!selectedPlant || tile.userData.removed) return;

    const tileId = tile.userData.tileId;

    removePlantFromSquare(tile);

    const plant = createPlant(selectedPlant);
    markPlantPieces(plant, tileId);

    tile.parent.add(plant);
    plantedItems[tileId] = plant;
  }

  function clearTileHighlight(tile) {
    if (!tile) return;

    tile.userData.outerGlow.material.opacity = 0;
    tile.userData.glow.material.opacity = 0;
    tile.userData.redGlow.material.opacity = 0;
    tile.userData.border.material.opacity = 0;
    tile.userData.raisedHighlight.material.opacity = 0;
    tile.userData.border.material.color.set(0xfff1b8);
  }

  function setSelectedSquare(tile) {
    clearTileHighlight(selectedSquare);

    selectedSquare = tile;

    tile.userData.outerGlow.material.opacity = 0.25;
    tile.userData.glow.material.opacity = 0.42;
    tile.userData.border.material.opacity = 1;
    tile.userData.raisedHighlight.material.opacity = 0.22;
    tile.userData.border.material.color.set(0xfff1b8);
  }

  function setRemoveSquare(tile) {
    clearTileHighlight(selectedSquare);

    selectedSquare = tile;
    tileWaitingForRemoval = tile;

    tile.userData.redGlow.material.opacity = 0.62;
    tile.userData.border.material.opacity = 1;
    tile.userData.raisedHighlight.material.opacity = 0.16;
    tile.userData.border.material.color.set(0xff4b4b);

    if (removePopup) removePopup.classList.add("open");
  }

  saveButton.classList.add("saved");

setTimeout(() => {
  saveButton.classList.remove("saved");
}, 300);

  function showPlantRemoveFlash(tile) {
    clearTileHighlight(selectedSquare);

    selectedSquare = tile;

    tile.userData.redGlow.material.opacity = 0.68;
    tile.userData.border.material.opacity = 1;
    tile.userData.border.material.color.set(0xff4b4b);

    setTimeout(() => {
      clearTileHighlight(tile);
      if (selectedSquare === tile) selectedSquare = null;
    }, 180);
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
    tileWaitingForRemoval = null;

    if (removePopup) removePopup.classList.remove("open");

    const platformGroup = new THREE.Group();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tileGroup = new THREE.Group();

        tileGroup.position.x = col - size / 2 + 0.5;
        tileGroup.position.z = row - size / 2 + 0.5;
        tileGroup.position.y = 0;

        const visibleTile = new THREE.Mesh(
          new THREE.BoxGeometry(0.96, 0.35, 0.96),
          [
            materials.tileSide,
            materials.tileSide,
            materials.tileTop,
            materials.tileSide,
            materials.tileSide,
            materials.tileSide
          ]
        );

        visibleTile.position.y = 0;
        visibleTile.castShadow = true;
        visibleTile.receiveShadow = true;

        const clickTile = new THREE.Mesh(
          new THREE.PlaneGeometry(0.96, 0.96),
          new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        clickTile.rotation.x = -Math.PI / 2;
        clickTile.position.y = 0.19;
        clickTile.userData.isTile = true;
        clickTile.userData.tileId = `${row}-${col}`;
        clickTile.userData.tileGroup = tileGroup;
        clickTile.userData.visibleTile = visibleTile;
        clickTile.userData.removed = false;

        const outerGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(1.08, 1.08),
          new THREE.MeshBasicMaterial({
            color: 0xffdf8a,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        outerGlow.rotation.x = -Math.PI / 2;
        outerGlow.position.y = 0.205;

        const glow = new THREE.Mesh(
          new THREE.PlaneGeometry(0.9, 0.9),
          new THREE.MeshBasicMaterial({
            color: 0xfff1b8,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.215;

        const redGlow = new THREE.Mesh(
          new THREE.PlaneGeometry(1.08, 1.08),
          new THREE.MeshBasicMaterial({
            color: 0xff4b4b,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );

        redGlow.rotation.x = -Math.PI / 2;
        redGlow.position.y = 0.225;

        const border = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(0.96, 0.96)),
          new THREE.LineBasicMaterial({
            color: 0xfff1b8,
            transparent: true,
            opacity: 0
          })
        );

        border.rotation.x = -Math.PI / 2;
        border.position.y = 0.24;

        const raisedHighlight = new THREE.Mesh(
          new THREE.BoxGeometry(0.78, 0.045, 0.78),
          new THREE.MeshBasicMaterial({
            color: 0xfff4c7,
            transparent: true,
            opacity: 0,
            depthWrite: false
          })
        );

        raisedHighlight.position.y = 0.215;

        clickTile.userData.outerGlow = outerGlow;
        clickTile.userData.glow = glow;
        clickTile.userData.redGlow = redGlow;
        clickTile.userData.border = border;
        clickTile.userData.raisedHighlight = raisedHighlight;

        tileGroup.add(visibleTile);
        tileGroup.add(clickTile);
        tileGroup.add(outerGlow);
        tileGroup.add(glow);
        tileGroup.add(redGlow);
        tileGroup.add(border);
        tileGroup.add(raisedHighlight);

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
      if (gridMenu) gridMenu.classList.remove("open");
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

  function updateMouseFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  container.addEventListener("click", (e) => {
    if (didDrag) return;

    updateMouseFromEvent(e);

    if (selectedTool === "remove") {
      plantRaycaster.setFromCamera(mouse, camera);

      const plantHits = plantRaycaster.intersectObjects(
        Object.values(plantedItems).filter(Boolean),
        true
      );

      if (plantHits.length > 0) {
        const tileId = plantHits[0].object.userData.tileId;
        removePlantByTileId(tileId);
        return;
      }
    }

    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(tileMeshes);

    if (hits.length > 0) {
      const clickedTile = hits[0].object;

      if (clickedTile.userData.removed) return;

      if (selectedTool === "remove") {
        const tileId = clickedTile.userData.tileId;

        if (plantedItems[tileId]) {
          showPlantRemoveFlash(clickedTile);
          removePlantFromSquare(clickedTile);
          return;
        }

        setRemoveSquare(clickedTile);
        return;
      }

      setSelectedSquare(clickedTile);

      if (selectedTool === "plant" && selectedPlant) {
        plantOnSquare(clickedTile);
      }
    }
  });

  if (backRemove) {
    backRemove.addEventListener("click", () => {
      if (tileWaitingForRemoval) clearTileHighlight(tileWaitingForRemoval);

      tileWaitingForRemoval = null;

      if (removePopup) removePopup.classList.remove("open");
    });
  }

  if (confirmRemove) {
    confirmRemove.addEventListener("click", () => {
      if (!tileWaitingForRemoval) return;

      const tileId = tileWaitingForRemoval.userData.tileId;

      removePlantFromSquare(tileWaitingForRemoval);

      tileWaitingForRemoval.userData.removed = true;
      tileWaitingForRemoval.userData.tileGroup.visible = false;

      tileMeshes = tileMeshes.filter((tile) => tile !== tileWaitingForRemoval);
      plantedItems[tileId] = null;

      if (selectedSquare === tileWaitingForRemoval) selectedSquare = null;

      tileWaitingForRemoval = null;

      if (removePopup) removePopup.classList.remove("open");
    });
  }

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