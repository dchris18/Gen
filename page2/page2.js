"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const eyeButton = document.querySelector(".eye-button");
  const gridMenu = document.querySelector(".grid-menu");
  const gridButtons = document.querySelectorAll("[data-grid]");
  const toolButtons = document.querySelectorAll(".tool-btn");
  const potButton = document.querySelector(".tool-pot");
  const removeButton = document.querySelector(".tool-shears");
  const plantMenu = document.querySelector(".plant-menu");
  const plantCards = document.querySelectorAll(".plant-card");
  const container = document.querySelector("#three-platform");

  if (!container) {
    console.error("Missing #three-platform div in HTML");
    return;
  }

  let selectedPlant = null;
  let selectedTool = null;

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

      if (plantMenu) {
        plantMenu.classList.remove("open");
      }

      if (selectedSquare) {
        plantOnSquare(selectedSquare);
      }
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

  const materials = {
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
    pot: new THREE.MeshStandardMaterial({
      color: 0xc98961,
      roughness: 0.75
    }),
    potDark: new THREE.MeshStandardMaterial({
      color: 0x9b6248,
      roughness: 0.8
    })
  };

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
    saucer.castShadow = true;
    saucer.receiveShadow = true;

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.33, 0.11, 28),
      materials.soil
    );
    soil.position.y = 0.12;
    soil.castShadow = true;
    soil.receiveShadow = true;

    const topSoil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.27, 0.025, 28),
      materials.soilDark
    );
    topSoil.position.y = 0.19;
    topSoil.castShadow = true;
    topSoil.receiveShadow = true;

    group.add(saucer);
    group.add(soil);
    group.add(topSoil);

    return group;
  }

  function createSproutPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const stem = makeStem(0.58, 0.035, materials.stem);
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

      const smallLeafA = roundedLeaf(0.7, 0.13, 0.28, materials.leafDark);
      smallLeafA.position.set(
        Math.cos(angle + 0.25) * 0.18,
        0.43,
        Math.sin(angle + 0.25) * 0.18
      );
      smallLeafA.rotation.z = angle + 0.4;
      plant.add(smallLeafA);

      const smallLeafB = roundedLeaf(0.7, 0.13, 0.28, materials.leafLight);
      smallLeafB.position.set(
        Math.cos(angle - 0.25) * 0.22,
        0.48,
        Math.sin(angle - 0.25) * 0.22
      );
      smallLeafB.rotation.z = angle - 0.4;
      plant.add(smallLeafB);
    }

    plant.scale.set(0.68, 0.68, 0.68);
    return plant;
  }

  function createFlowerPlant() {
    const plant = new THREE.Group();

    plant.add(makeSoilBase());

    const mainStem = makeStem(0.72, 0.035, materials.stem);
    mainStem.position.y = 0.18;
    plant.add(mainStem);

    const sideStemA = makeStem(0.42, 0.022, materials.stemLight);
    sideStemA.position.set(-0.08, 0.25, 0);
    sideStemA.rotation.z = 0.6;
    plant.add(sideStemA);

    const sideStemB = makeStem(0.38, 0.022, materials.stemLight);
    sideStemB.position.set(0.08, 0.3, 0);
    sideStemB.rotation.z = -0.6;
    plant.add(sideStemB);

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

      petal.position.set(Math.cos(angle) * 0.14, Math.sin(angle) * 0.02, Math.sin(angle) * 0.14);
      petal.scale.set(1.05, 0.42, 0.75);
      petal.rotation.y = angle;
      petal.castShadow = true;
      flowerGroup.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.105, 18, 14),
      materials.flowerCenter
    );
    center.castShadow = true;
    flowerGroup.add(center);

    flowerGroup.rotation.x = 0.15;
    plant.add(flowerGroup);

    plant.scale.set(0.7, 0.7, 0.7);
    return plant;
  }

  function createPlant(type) {
    let plant;

    if (type === "fern") {
      plant = createFernPlant();
    } else if (type === "flower") {
      plant = createFlowerPlant();
    } else {
      plant = createSproutPlant();
    }

    plant.userData.isPlant = true;
    plant.rotation.y = Math.random() * Math.PI * 2;
    plant.position.y = 0.08;

    return plant;
  }

  function removePlantFromSquare(tile) {
    const tileId = tile.userData.tileId;

    if (plantedItems[tileId]) {
      tile.parent.remove(plantedItems[tileId]);
      plantedItems[tileId] = null;
    }
  }

  function plantOnSquare(tile) {
    if (!selectedPlant) return;

    const tileId = tile.userData.tileId;

    removePlantFromSquare(tile);

    const plant = createPlant(selectedPlant);
    tile.parent.add(plant);

    plantedItems[tileId] = plant;
  }

  function setSelectedSquare(tile) {
    if (selectedSquare) {
      selectedSquare.userData.outerGlow.material.opacity = 0;
      selectedSquare.userData.glow.material.opacity = 0;
      selectedSquare.userData.border.material.opacity = 0;
      selectedSquare.userData.raisedHighlight.material.opacity = 0;
    }

    selectedSquare = tile;

    selectedSquare.userData.outerGlow.material.opacity = 0.25;
    selectedSquare.userData.glow.material.opacity = 0.42;
    selectedSquare.userData.border.material.opacity = 1;
    selectedSquare.userData.raisedHighlight.material.opacity = 0.22;
  }

  function createPlatform(size) {
    if (platform) {
      savedRotation.x = platform.rotation.x;
      savedRotation.y = platform.rotation.y;

      scene.remove(platform);

      platform.traverse((child) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
      });
    }

    currentSize = size;
    selectedSquare = null;
    tileMeshes = [];
    plantedItems = {};

    const platformGroup = new THREE.Group();

    const platformGeometry = new THREE.BoxGeometry(size, 0.35, size);

    const platformMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x5f7852, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0x4f6744, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0x6f875e, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0x3f5237, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0x5a704c, roughness: 0.72 }),
      new THREE.MeshStandardMaterial({ color: 0x465d3e, roughness: 0.72 })
    ];

    const base = new THREE.Mesh(platformGeometry, platformMaterials);
    base.receiveShadow = true;
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
        clickTile.userData.isTile = true;
        clickTile.userData.tileId = `${row}-${col}`;

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
        outerGlow.position.y = 0.006;

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

        const raisedHighlight = new THREE.Mesh(
          new THREE.BoxGeometry(0.82, 0.04, 0.82),
          new THREE.MeshBasicMaterial({
            color: 0xfff4c7,
            transparent: true,
            opacity: 0,
            depthWrite: false
          })
        );

        raisedHighlight.position.y = 0.025;

        clickTile.userData.outerGlow = outerGlow;
        clickTile.userData.glow = glow;
        clickTile.userData.border = border;
        clickTile.userData.raisedHighlight = raisedHighlight;

        tileGroup.add(clickTile);
        tileGroup.add(outerGlow);
        tileGroup.add(glow);
        tileGroup.add(border);
        tileGroup.add(raisedHighlight);

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
      const clickedTile = hits[0].object;

      setSelectedSquare(clickedTile);

      if (selectedTool === "remove") {
        removePlantFromSquare(clickedTile);
        return;
      }

      if (selectedTool === "plant" && selectedPlant) {
        plantOnSquare(clickedTile);
      }
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

    Object.values(plantedItems).forEach((plant) => {
      if (plant) {
        plant.children.forEach((piece) => {
          if (piece.userData.floaty) {
            piece.rotation.y += 0.006;
          }
        });
      }
    });

    renderer.render(scene, camera);
  }

  animate();
});