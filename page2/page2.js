"use strict";

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

document.addEventListener("DOMContentLoaded", () => {
  const eyeButton = document.querySelector(".eye-button");
  const gridMenu = document.querySelector(".grid-menu");
  const rewindButton = document.querySelector(".rewind-button");
  const gridButtons = document.querySelectorAll("[data-grid]");
  const toolButtons = document.querySelectorAll(".tool-btn");
  const potButton = document.querySelector(".tool-pot");
  const plantMenu = document.querySelector(".plant-menu");
  const plantCards = document.querySelectorAll(".plant-card");
  const container = document.querySelector("#three-platform");

const tileMenuButton = document.querySelector(".tile-menu-button");
const tileRemoveButton = document.querySelector(".tile-remove-button");
const removePopup = null;

  const saveButton = document.querySelector(".save-button");
  const bookmarkButton = document.querySelector(".bookmark-button");

  const nameSavePopup = document.querySelector(".name-save-popup");
  const saveNameInput = document.querySelector(".save-name-input");
  const confirmSave = document.querySelector(".confirm-save");
  const cancelSave = document.querySelector(".cancel-save");

  const savedListPopup = document.querySelector(".saved-list-popup");
  const savedList = document.querySelector(".saved-list");
  const closeSaves = document.querySelector(".close-saves");

  if (!container) return;

  let selectedPlant = null;
  let selectedTool = null;
  let platform;
  let addPlane;
  let addPreview;

  let currentSize = 6;
  let selectedSquare = null;

let undoStack = [];
let isRestoringState = false;

let idleTimer = null;
let isIdleMode = false;
let idleTargetX = 0.62;
let idleRotationSpeed = 0.003;
const IDLE_DELAY = 10000;

  let tileMeshes = [];
  let tileStacks = {};
  let plantedItems = {};
  let removedTileIds = [];

  let removeSelectedTiles = [];
  let addedThisDrag = [];

let soilConnectorGroup = null;

  let dragging = false;
  let didDrag = false;
  let previousX = 0;
  let previousY = 0;
  let toolPointerDown = false;


let activePointers = new Map();
let lastPinchDistance = null;

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
      color: 0x765037,
      roughness: 0.9,
      flatShading: true
    }),
    soilDark: new THREE.MeshStandardMaterial({
      color: 0x4f3326,
      roughness: 0.95,
      flatShading: true
    }),
    soilLight: new THREE.MeshStandardMaterial({
      color: 0x916344,
      roughness: 0.88,
      flatShading: true
    }),

    stem: new THREE.MeshStandardMaterial({
      color: 0x5c4a2d,
      roughness: 0.76,
      flatShading: true
    }),
    stemLight: new THREE.MeshStandardMaterial({
      color: 0x786237,
      roughness: 0.72,
      flatShading: true
    }),

    leaf: new THREE.MeshStandardMaterial({
      color: 0x5f944a,
      roughness: 0.66,
      flatShading: true
    }),
    leafDark: new THREE.MeshStandardMaterial({
      color: 0x3d6f35,
      roughness: 0.74,
      flatShading: true
    }),
    leafLight: new THREE.MeshStandardMaterial({
      color: 0x8fc76a,
      roughness: 0.6,
      flatShading: true
    }),
    leafYellow: new THREE.MeshStandardMaterial({
      color: 0xa4bd61,
      roughness: 0.65,
      flatShading: true
    }),

        yellowPetal: new THREE.MeshStandardMaterial({
      color: 0xf2d35d,
      roughness: 0.58,
      flatShading: true
    }),
    purplePetal: new THREE.MeshStandardMaterial({
      color: 0x7650a8,
      roughness: 0.58,
      flatShading: true
    }),
    whitePetal: new THREE.MeshStandardMaterial({
      color: 0xf4ead4,
      roughness: 0.62,
      flatShading: true
    }),
    yellowPetal: new THREE.MeshStandardMaterial({ color: 0xf2d35d, roughness: 0.58, flatShading: true }),
purplePetal: new THREE.MeshStandardMaterial({ color: 0x7650a8, roughness: 0.58, flatShading: true }),
whitePetal: new THREE.MeshStandardMaterial({ color: 0xf4ead4, roughness: 0.62, flatShading: true }),
tulipRed: new THREE.MeshStandardMaterial({ color: 0xd85b58, roughness: 0.6, flatShading: true }),
strawberry: new THREE.MeshStandardMaterial({ color: 0xd94a45, roughness: 0.6, flatShading: true }),
lettuce: new THREE.MeshStandardMaterial({ color: 0xa7c957, roughness: 0.62, flatShading: true }),
peaPod: new THREE.MeshStandardMaterial({ color: 0x6fb84f, roughness: 0.65, flatShading: true }),
radish: new THREE.MeshStandardMaterial({ color: 0xc9475d, roughness: 0.62, flatShading: true }),
    tulipRed: new THREE.MeshStandardMaterial({
      color: 0xd85b58,
      roughness: 0.6,
      flatShading: true
    }),
    strawberry: new THREE.MeshStandardMaterial({
      color: 0xd94a45,
      roughness: 0.6,
      flatShading: true
    }),
    lettuce: new THREE.MeshStandardMaterial({
      color: 0xa7c957,
      roughness: 0.62,
      flatShading: true
    }),
    peaPod: new THREE.MeshStandardMaterial({
      color: 0x6fb84f,
      roughness: 0.65,
      flatShading: true
    }),
    radish: new THREE.MeshStandardMaterial({
      color: 0xc9475d,
      roughness: 0.62,
      flatShading: true
    }),

    flowerPetal: new THREE.MeshStandardMaterial({
      color: 0xd98b96,
      roughness: 0.6,
      flatShading: true
    }),
    flowerPetalLight: new THREE.MeshStandardMaterial({
      color: 0xf0b3ad,
      roughness: 0.55,
      flatShading: true
    }),
    flowerCenter: new THREE.MeshStandardMaterial({
      color: 0xefcc58,
      roughness: 0.6,
      flatShading: true
    }),

    carrot: new THREE.MeshStandardMaterial({
      color: 0xc97935,
      roughness: 0.7,
      flatShading: true
    }),
    potato: new THREE.MeshStandardMaterial({
      color: 0xb98252,
      roughness: 0.84,
      flatShading: true
    }),
    tomato: new THREE.MeshStandardMaterial({
      color: 0xd94c3d,
      roughness: 0.58,
      flatShading: true
    })
  };

if (eyeButton && gridMenu) {
  eyeButton.addEventListener("click", () => {
    const isOpen = gridMenu.classList.contains("open");
    closeAllPopups();
    if (!isOpen) gridMenu.classList.add("open");
  });
}

  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      toolButtons.forEach((item) => item.classList.remove("selected"));
      button.classList.add("selected");

      clearRemoveSelection();

      if (removePopup) removePopup.classList.remove("open");

      if (button.classList.contains("tool-pot")) {
        selectedTool = "plant";
        if (addPreview) addPreview.visible = false;
      } else if (button.classList.contains("tool-shears")) {
        selectedTool = "remove";
        if (plantMenu) plantMenu.classList.remove("open");
        if (addPreview) addPreview.visible = false;
      } else {
        selectedTool = "add";
        if (plantMenu) plantMenu.classList.remove("open");
      }
    });
  });

if (potButton && plantMenu) {
  potButton.addEventListener("click", () => {
    const isOpen = plantMenu.classList.contains("open");
    closeAllPopups();
    if (!isOpen) plantMenu.classList.add("open");
  });
}

if (tileMenuButton) {
  tileMenuButton.addEventListener("click", () => {
    selectedTool = "add";

    if (plantMenu) plantMenu.classList.remove("open");
    if (removePopup) removePopup.classList.remove("open");
    if (addPreview) addPreview.visible = false;

    clearRemoveSelection();
  });
}

if (tileRemoveButton) {
  tileRemoveButton.addEventListener("click", () => {
    selectedTool = "remove";

    if (plantMenu) plantMenu.classList.remove("open");
    if (addPreview) addPreview.visible = false;

    clearRemoveSelection();
  });
}

  if (plantMenu) {
  plantMenu.addEventListener("click", (e) => {
    const categoryButton = e.target.closest(".plant-category-btn");

    if (categoryButton) {
      const category = categoryButton.dataset.category;
      const list = plantMenu.querySelector(`[data-list="${category}"]`);
      const isAlreadyOpen = list && list.classList.contains("open");

      if (!isAlreadyOpen && list) {
        list.classList.add("open");
        categoryButton.classList.add("active");
      } else if (list) {
  list.classList.remove("open");
  categoryButton.classList.remove("active");
}

      return;
    }

    const card = e.target.closest(".plant-card");

    if (!card) return;

    plantMenu.querySelectorAll(".plant-card").forEach((item) => {
      item.classList.remove("selected");
    });

    card.classList.add("selected");
    selectedPlant = card.dataset.plant;
    selectedTool = "plant";

    if (addPreview) addPreview.visible = false;
    plantMenu.classList.remove("open");

    if (selectedSquare && !selectedSquare.userData.removed) {
      plantOnSquare(selectedSquare);
    }
  });
}

function makeIco(size, material, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), material);

  mesh.position.set(x, y, z);
  mesh.scale.set(sx, sy, sz);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

function makeCylinder(height, radius, material, x, y, z, rx = 0, rz = 0) {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.75, radius, height, 6),
    material
  );

  stem.position.set(x, y + height / 2, z);
  stem.rotation.x = rx;
  stem.rotation.z = rz;
  stem.castShadow = true;
  stem.receiveShadow = true;

  return stem;
}

function makeSimpleStem(height, radius, material, x, y, z, rx = 0, rz = 0) {
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(radius * 0.75, radius, height, 6),
    material
  );

  stem.position.set(x, y + height / 2, z);
  stem.rotation.x = rx;
  stem.rotation.z = rz;
  stem.castShadow = true;
  stem.receiveShadow = true;

  return stem;
}

  function seededRandom(seedText) {
    let seed = 0;

    for (let i = 0; i < seedText.length; i++) {
      seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
    }

    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function makeStem(height, radius = 0.035, material = materials.stem) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.72, radius, height, 6),
      material
    );

    stem.position.y = height / 2;
    stem.castShadow = true;
    stem.receiveShadow = true;

    return stem;
  }

  function makeLowPolyLeaf(length, width, material) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 7, 5),
      material
    );

    leaf.scale.set(width * 2.2, 0.08, length * 1.65);
    leaf.castShadow = true;
    leaf.receiveShadow = true;

    return leaf;
  }

  function makeChunkLeaf(width, height, depth, material) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 7, 5),
      material
    );

    leaf.scale.set(width, height, depth);
    leaf.castShadow = true;
    leaf.receiveShadow = true;

    return leaf;
  }

function makeSoilBlob(tileId) {
  const group = new THREE.Group();
  const rand = seededRandom(tileId + "-soil");

  const patchCount = 7;

  for (let i = 0; i < patchCount; i++) {
    let material = materials.soil;
    const pick = rand();

    if (pick > 0.78) material = materials.soilDark;
    else if (pick < 0.25) material = materials.soilLight;

    const patch = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.15 + rand() * 0.08,
        0.17 + rand() * 0.09,
        0.026,
        7
      ),
      material
    );

    const angle = (i / patchCount) * Math.PI * 2 + rand() * 0.35;
    const distance = i === 0 ? 0 : 0.12 + rand() * 0.22;

    patch.position.set(
      Math.cos(angle) * distance,
      0.235 + i * 0.002,
      Math.sin(angle) * distance
    );

    patch.scale.set(
      1 + rand() * 0.35,
      1,
      0.75 + rand() * 0.25
    );

    patch.rotation.y = angle + rand() * 0.6;
    patch.castShadow = true;
    patch.receiveShadow = true;

    group.add(patch);
  }

  const centerPatch = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.028, 7),
    materials.soilDark
  );

  centerPatch.position.y = 0.248;
  centerPatch.scale.set(1.05, 1, 0.9);
  centerPatch.rotation.y = rand() * Math.PI * 2;
  centerPatch.castShadow = true;
  centerPatch.receiveShadow = true;

  group.add(centerPatch);

  return group;
}

  function markPlantPieces(group, tileId) {
    group.traverse((child) => {
      child.userData.isPlantPiece = true;
      child.userData.tileId = tileId;
    });
  }

  function placeLeaf(group, leaf, x, y, z, rotX, rotY, rotZ) {
    leaf.position.set(x, y, z);
    leaf.rotation.set(rotX, rotY, rotZ);

    const connector = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.014, 0.18, 5),
      materials.stemLight
    );

    connector.position.set(x * 0.72, y - 0.06, z * 0.72);
    connector.rotation.z = Math.cos(rotZ) * 0.55;
    connector.rotation.x = Math.sin(rotZ) * -0.55;
    connector.castShadow = true;
    connector.receiveShadow = true;

    group.add(connector);
    group.add(leaf);
  }

 function createSproutPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.026, 0.38, 6),
    materials.stemLight
  );
  stem.position.set(0, 0.25 + 0.38 / 2, 0);
  stem.castShadow = true;
  stem.receiveShadow = true;
  plant.add(stem);

  const leafData = [
    { x: 0.11, y: 0.48, z: 0.02, r: 0.75, s: 1 },
    { x: -0.09, y: 0.54, z: 0.04, r: -0.75, s: 0.9 },
    { x: 0.02, y: 0.6, z: -0.09, r: 2.8, s: 0.82 }
  ];

  leafData.forEach((item, i) => {
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.075, 0),
      i === 0 ? materials.leafLight : materials.leaf
    );

    leaf.position.set(item.x, item.y, item.z);
    leaf.scale.set(1.35 * item.s, 0.42 * item.s, 0.75 * item.s);
    leaf.rotation.set(0.45, item.r, 0.3);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    plant.add(leaf);
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createFernPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const fernData = [
    { a: 0, h: 0.36 },
    { a: 1.25, h: 0.32 },
    { a: 2.5, h: 0.34 },
    { a: 3.75, h: 0.31 },
    { a: 5.0, h: 0.35 }
  ];

  fernData.forEach((item, i) => {
    const x = Math.cos(item.a) * 0.07;
    const z = Math.sin(item.a) * 0.07;

    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.019, item.h, 6),
      materials.stemLight
    );

    stem.position.set(x, 0.25 + item.h / 2, z);
    stem.rotation.z = Math.cos(item.a) * 0.35;
    stem.rotation.x = Math.sin(item.a) * -0.35;
    stem.castShadow = true;
    stem.receiveShadow = true;
    plant.add(stem);

    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.085, 0),
      i % 2 === 0 ? materials.leafLight : materials.leaf
    );

    leaf.position.set(
      Math.cos(item.a) * 0.18,
      0.25 + item.h,
      Math.sin(item.a) * 0.18
    );
    leaf.scale.set(1.55, 0.36, 0.72);
    leaf.rotation.set(0.42, item.a, 0.22);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    plant.add(leaf);
  });

  plant.scale.set(0.86, 0.86, 0.86);
  return plant;
}

function createFlowerPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const flowerData = [
    { x: 0, z: 0, h: 0.52, leanX: 0.02, leanZ: 0.02, scale: 1 },
    { x: -0.16, z: 0.08, h: 0.42, leanX: -0.06, leanZ: 0.02, scale: 0.82 },
    { x: 0.15, z: -0.08, h: 0.45, leanX: 0.06, leanZ: -0.02, scale: 0.88 }
  ];

  flowerData.forEach((data, flowerIndex) => {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.024, data.h, 6),
      materials.stem
    );

    stem.position.set(data.x, 0.25 + data.h / 2, data.z);
    stem.rotation.z = data.leanX;
    stem.rotation.x = -data.leanZ;
    stem.castShadow = true;
    stem.receiveShadow = true;
    plant.add(stem);

    const topX = data.x + data.leanX * 0.18;
    const topZ = data.z + data.leanZ * 0.18;
    const topY = 0.25 + data.h;

    const flowerHead = new THREE.Group();
    flowerHead.position.set(topX, topY, topZ);
    flowerHead.scale.set(data.scale, data.scale, data.scale);

    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;

      const petal = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.07, 0),
        i % 2 === 0 ? materials.flowerPetal : materials.flowerPetalLight
      );

      petal.position.set(
        Math.cos(angle) * 0.075,
        Math.sin(angle) * 0.018,
        Math.sin(angle) * 0.075
      );

      petal.scale.set(1.25, 0.58, 0.9);
      petal.rotation.set(0.25, angle, angle * 0.25);
      petal.castShadow = true;
      petal.receiveShadow = true;
      flowerHead.add(petal);
    }

    const center = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.055, 0),
      materials.flowerCenter
    );

    center.position.y = 0.01;
    center.scale.set(1, 0.72, 1);
    center.castShadow = true;
    center.receiveShadow = true;
    flowerHead.add(center);

    flowerHead.rotation.x = 0.2;
    flowerHead.rotation.y = flowerIndex * 0.35;
    plant.add(flowerHead);

    const leafCount = flowerIndex === 0 ? 3 : 2;

    for (let i = 0; i < leafCount; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const leafHeight = 0.34 + i * 0.055;
      const angle = flowerIndex * 1.3 + i * 1.7;

      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.075, 0),
        i % 2 === 0 ? materials.leafLight : materials.leaf
      );

      leaf.position.set(
        data.x + Math.cos(angle) * 0.075 * side,
        leafHeight,
        data.z + Math.sin(angle) * 0.075
      );

      leaf.scale.set(1.25, 0.38, 0.68);
      leaf.rotation.set(0.55, angle, side * 0.55);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      plant.add(leaf);
    }
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createCarrotPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const carrotData = [
    { x: -0.14, z: 0.04, lean: 0.08 },
    { x: 0.03, z: 0.08, lean: -0.05 },
    { x: 0.16, z: -0.05, lean: 0.04 }
  ];

  carrotData.forEach((item, i) => {
    const carrot = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.095, 0),
      materials.carrot
    );

    carrot.position.set(item.x, 0.34, item.z);
    carrot.scale.set(0.55, 1.55, 0.55);
    carrot.rotation.z = item.lean;
    carrot.castShadow = true;
    carrot.receiveShadow = true;
    plant.add(carrot);

    const topStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.012, 0.12, 6),
      materials.stemLight
    );

    topStem.position.set(item.x, 0.45, item.z);
    topStem.castShadow = true;
    topStem.receiveShadow = true;
    plant.add(topStem);

    for (let j = 0; j < 2; j++) {
      const angle = i * 1.1 + j * Math.PI;

      const leaf = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.055, 0),
        materials.leafLight
      );

      leaf.position.set(
        item.x + Math.cos(angle) * 0.045,
        0.52,
        item.z + Math.sin(angle) * 0.045
      );

      leaf.scale.set(1.2, 0.35, 0.65);
      leaf.rotation.set(0.45, angle, 0.25);
      leaf.castShadow = true;
      leaf.receiveShadow = true;
      plant.add(leaf);
    }
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createPotatoPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const potatoData = [
    { x: -0.14, z: -0.04, s: 1 },
    { x: 0.1, z: 0.07, s: 0.85 },
    { x: 0.18, z: -0.1, s: 0.75 }
  ];

  potatoData.forEach((item, i) => {
    const potato = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.1, 0),
      materials.potato
    );

    potato.position.set(item.x, 0.31, item.z);
    potato.scale.set(1.25 * item.s, 0.62 * item.s, 0.9 * item.s);
    potato.rotation.y = i * 0.7;
    potato.castShadow = true;
    potato.receiveShadow = true;
    plant.add(potato);
  });

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.022, 0.28, 6),
    materials.stemLight
  );

  stem.position.set(0, 0.25 + 0.14, 0);
  stem.castShadow = true;
  stem.receiveShadow = true;
  plant.add(stem);

  const leafData = [
    { a: 0, y: 0.45 },
    { a: 2.1, y: 0.48 },
    { a: 4.2, y: 0.44 }
  ];

  leafData.forEach((item, i) => {
    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.07, 0),
      i % 2 === 0 ? materials.leafDark : materials.leaf
    );

    leaf.position.set(
      Math.cos(item.a) * 0.11,
      item.y,
      Math.sin(item.a) * 0.11
    );

    leaf.scale.set(1.3, 0.36, 0.72);
    leaf.rotation.set(0.45, item.a, 0.2);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    plant.add(leaf);
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createTomatoPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const mainStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.024, 0.45, 6),
    materials.stemLight
  );

  mainStem.position.set(0, 0.25 + 0.45 / 2, 0);
  mainStem.castShadow = true;
  mainStem.receiveShadow = true;
  plant.add(mainStem);

  const tomatoData = [
    { a: 0.15, y: 0.56 },
    { a: 2.2, y: 0.6 },
    { a: 4.1, y: 0.55 }
  ];

  tomatoData.forEach((item, i) => {
    const branch = new THREE.Mesh(
      new THREE.CylinderGeometry(0.009, 0.012, 0.16, 6),
      materials.stemLight
    );

    branch.position.set(
      Math.cos(item.a) * 0.055,
      item.y - 0.04,
      Math.sin(item.a) * 0.055
    );

    branch.rotation.z = Math.cos(item.a) * 0.65;
    branch.rotation.x = Math.sin(item.a) * -0.65;
    branch.castShadow = true;
    branch.receiveShadow = true;
    plant.add(branch);

    const tomato = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.075, 0),
      materials.tomato
    );

    tomato.position.set(
      Math.cos(item.a) * 0.16,
      item.y,
      Math.sin(item.a) * 0.16
    );

    tomato.castShadow = true;
    tomato.receiveShadow = true;
    plant.add(tomato);

    const leaf = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.055, 0),
      materials.leafLight
    );

    leaf.position.set(
      Math.cos(item.a) * 0.09,
      item.y + 0.025,
      Math.sin(item.a) * 0.09
    );

    leaf.scale.set(1.1, 0.3, 0.62);
    leaf.rotation.set(0.42, item.a, 0.2);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    plant.add(leaf);
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createCloverPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const clovers = [
    { x: -0.12, z: 0.04, h: 0.24 },
    { x: 0.08, z: 0.08, h: 0.28 },
    { x: 0.16, z: -0.1, h: 0.22 },
    { x: -0.04, z: -0.14, h: 0.26 }
  ];

  clovers.forEach((item, index) => {
    plant.add(makeSimpleStem(item.h, 0.012, materials.stemLight, item.x, 0.25, item.z));

    const topY = 0.25 + item.h;

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + index * 0.4;

      plant.add(
        makeIco(
          0.045,
          i === 0 ? materials.leafLight : materials.leaf,
          item.x + Math.cos(angle) * 0.035,
          topY,
          item.z + Math.sin(angle) * 0.035,
          1.1,
          0.38,
          0.8,
          0.25,
          angle,
          0.15
        )
      );
    }
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}


function createHostaPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2;
    const dist = 0.12 + (i % 2) * 0.04;

    plant.add(makeSimpleStem(0.18, 0.012, materials.stemLight, Math.cos(angle) * 0.04, 0.25, Math.sin(angle) * 0.04, Math.sin(angle) * -0.35, Math.cos(angle) * 0.35));

    plant.add(
      makeIco(
        0.09,
        i % 2 === 0 ? materials.leafLight : materials.leaf,
        Math.cos(angle) * dist,
        0.39,
        Math.sin(angle) * dist,
        1.45,
        0.28,
        0.85,
        0.35,
        angle,
        0
      )
    );
  }

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createGrassPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const h = 0.22 + (i % 3) * 0.05;
    const x = Math.cos(angle) * 0.09;
    const z = Math.sin(angle) * 0.09;

    plant.add(makeSimpleStem(h, 0.011, i % 2 === 0 ? materials.leafLight : materials.leaf, x, 0.25, z, Math.sin(angle) * -0.45, Math.cos(angle) * 0.45));
  }

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createDaffodilPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const flowers = [
    { x: 0, z: 0, h: 0.52, s: 1 },
    { x: -0.13, z: 0.08, h: 0.42, s: 0.82 }
  ];

  flowers.forEach((item, flowerIndex) => {
    plant.add(makeSimpleStem(item.h, 0.018, materials.stemLight, item.x, 0.25, item.z, item.z * -0.25, item.x * 0.25));

    const head = new THREE.Group();
    head.position.set(item.x, 0.25 + item.h, item.z);
    head.scale.set(item.s, item.s, item.s);

    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      head.add(makeIco(0.06, materials.yellowPetal, Math.cos(angle) * 0.06, 0, Math.sin(angle) * 0.06, 1.2, 0.45, 0.8, 0.25, angle, 0));
    }

    head.add(makeIco(0.05, materials.flowerCenter, 0, 0.015, 0, 0.9, 0.7, 0.9));

    plant.add(head);

    plant.add(makeIco(0.065, materials.leafLight, item.x * 0.6, 0.4, item.z * 0.6 + 0.05, 1.25, 0.28, 0.65, 0.35, flowerIndex, 0));
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createIrisPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const stems = [
    { x: 0, z: 0, h: 0.54, s: 1 },
    { x: 0.12, z: -0.06, h: 0.43, s: 0.82 }
  ];

  stems.forEach((item, idx) => {
    plant.add(makeSimpleStem(item.h, 0.017, materials.stemLight, item.x, 0.25, item.z, item.z * -0.2, item.x * 0.25));

    const head = new THREE.Group();
    head.position.set(item.x, 0.25 + item.h, item.z);
    head.scale.set(item.s, item.s, item.s);

    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;

      head.add(makeIco(0.075, materials.purplePetal, Math.cos(angle) * 0.055, 0.015, Math.sin(angle) * 0.055, 0.95, 0.45, 1.25, 0.5, angle, 0.2));
      head.add(makeIco(0.055, materials.purplePetal, Math.cos(angle + 0.45) * 0.035, -0.02, Math.sin(angle + 0.45) * 0.035, 0.8, 0.36, 0.95, 0.2, angle, -0.2));
    }

    head.add(makeIco(0.035, materials.flowerCenter, 0, 0.01, 0, 0.8, 0.7, 0.8));
    plant.add(head);

    plant.add(makeIco(0.07, materials.leafDark, item.x * 0.5 - 0.05, 0.42, item.z * 0.5, 0.8, 0.3, 1.55, 0.5, idx, 0.1));
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createTulipPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const tulips = [
    { x: -0.07, z: 0.03, h: 0.48, s: 1 },
    { x: 0.11, z: -0.05, h: 0.4, s: 0.86 }
  ];

  tulips.forEach((item, idx) => {
    plant.add(makeSimpleStem(item.h, 0.018, materials.stemLight, item.x, 0.25, item.z));

    const head = new THREE.Group();
    head.position.set(item.x, 0.25 + item.h, item.z);
    head.scale.set(item.s, item.s, item.s);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;

      head.add(makeIco(0.065, materials.tulipRed, Math.cos(angle) * 0.04, 0.018, Math.sin(angle) * 0.04, 0.9, 0.65, 1.05, 0.35, angle, 0.15));
    }

    head.add(makeIco(0.05, materials.tulipRed, 0, 0.005, 0, 1, 0.7, 1));
    plant.add(head);

    plant.add(makeIco(0.075, materials.leafLight, item.x + (idx === 0 ? 0.06 : -0.06), 0.4, item.z, 1.3, 0.28, 0.72, 0.35, idx * 1.7, 0));
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createDogwoodPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const trunk = makeSimpleStem(0.38, 0.026, materials.stem, 0, 0.25, 0);
  plant.add(trunk);

  const branches = [
    { a: 0.2, y: 0.52 },
    { a: 2.3, y: 0.5 },
    { a: 4.1, y: 0.54 }
  ];

  branches.forEach((item, idx) => {
    const branch = makeSimpleStem(0.18, 0.012, materials.stem, Math.cos(item.a) * 0.045, item.y - 0.08, Math.sin(item.a) * 0.045, Math.sin(item.a) * -0.7, Math.cos(item.a) * 0.7);
    plant.add(branch);

    const flower = new THREE.Group();
    flower.position.set(Math.cos(item.a) * 0.17, item.y, Math.sin(item.a) * 0.17);

    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      flower.add(makeIco(0.055, materials.whitePetal, Math.cos(angle) * 0.055, 0, Math.sin(angle) * 0.055, 1.25, 0.4, 0.85, 0.25, angle, 0));
    }

    flower.add(makeIco(0.032, materials.flowerCenter, 0, 0.01, 0, 0.85, 0.7, 0.85));
    plant.add(flower);

    plant.add(makeIco(0.055, idx % 2 === 0 ? materials.leafLight : materials.leaf, Math.cos(item.a + 0.3) * 0.12, item.y - 0.03, Math.sin(item.a + 0.3) * 0.12, 1.1, 0.3, 0.65, 0.4, item.a, 0));
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createStrawberryPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const stems = [
    { a: 0, h: 0.25 },
    { a: 2.1, h: 0.23 },
    { a: 4.2, h: 0.26 }
  ];

  stems.forEach((item, i) => {
    const x = Math.cos(item.a) * 0.08;
    const z = Math.sin(item.a) * 0.08;

    plant.add(makeSimpleStem(item.h, 0.012, materials.stemLight, x, 0.25, z, Math.sin(item.a) * -0.25, Math.cos(item.a) * 0.25));

    plant.add(makeIco(0.07, materials.strawberry, Math.cos(item.a) * 0.18, 0.42, Math.sin(item.a) * 0.18, 0.8, 1.05, 0.8, 0.15, item.a, 0));

    plant.add(makeIco(0.06, i % 2 === 0 ? materials.leafLight : materials.leaf, x, 0.47, z, 1.15, 0.32, 0.68, 0.3, item.a, 0));
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createLettucePlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  for (let i = 0; i < 9; i++) {
    const angle = (i / 9) * Math.PI * 2;
    const dist = 0.08 + (i % 3) * 0.035;

    plant.add(
      makeIco(
        0.085,
        i % 2 === 0 ? materials.lettuce : materials.leafLight,
        Math.cos(angle) * dist,
        0.34 + (i % 3) * 0.025,
        Math.sin(angle) * dist,
        1.3,
        0.34,
        0.78,
        0.35,
        angle,
        0.12
      )
    );
  }

  plant.add(makeIco(0.095, materials.lettuce, 0, 0.39, 0, 1.15, 0.5, 1.05));

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createPeasPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const mainStem = makeSimpleStem(0.44, 0.014, materials.stemLight, 0, 0.25, 0);
  plant.add(mainStem);

  for (let i = 0; i < 4; i++) {
    const angle = i % 2 === 0 ? 0.65 : -0.65;
    const y = 0.36 + i * 0.07;
    const side = i % 2 === 0 ? 1 : -1;

    plant.add(makeSimpleStem(0.16, 0.009, materials.stemLight, side * 0.04, y, 0, 0, side * 0.85));

    plant.add(makeIco(0.055, materials.peaPod, side * 0.14, y + 0.06, 0.02 * i, 0.65, 0.4, 1.45, 0.3, angle, 0));

    plant.add(makeIco(0.05, materials.leafLight, side * 0.09, y + 0.02, -0.03, 1.1, 0.3, 0.6, 0.4, angle, 0));
  }

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createRadishPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const radishes = [
    { x: -0.1, z: 0.04 },
    { x: 0.1, z: -0.05 }
  ];

  radishes.forEach((item, idx) => {
    plant.add(makeIco(0.085, materials.radish, item.x, 0.34, item.z, 0.9, 1.15, 0.9));

    plant.add(makeSimpleStem(0.14, 0.01, materials.stemLight, item.x, 0.42, item.z));

    for (let i = 0; i < 3; i++) {
      const angle = idx + i * 2.1;

      plant.add(makeIco(0.06, materials.leafLight, item.x + Math.cos(angle) * 0.055, 0.52, item.z + Math.sin(angle) * 0.055, 1.1, 0.32, 0.65, 0.35, angle, 0));
    }
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createCloverPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const spots = [
    [-0.13, 0.04, 0.22],
    [0.08, 0.09, 0.26],
    [0.16, -0.08, 0.21],
    [-0.03, -0.14, 0.24]
  ];

  spots.forEach(([x, z, h], index) => {
    plant.add(makeCylinder(h, 0.012, materials.stemLight, x, 0.25, z));

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + index * 0.4;
      plant.add(makeIco(0.045, materials.leafLight, x + Math.cos(a) * 0.035, 0.25 + h, z + Math.sin(a) * 0.035, 1.05, 0.35, 0.85, 0.25, a, 0.1));
    }
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createHostaPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const x = Math.cos(a) * 0.06;
    const z = Math.sin(a) * 0.06;

    plant.add(makeCylinder(0.18, 0.012, materials.stemLight, x, 0.25, z, Math.sin(a) * -0.25, Math.cos(a) * 0.25));
    plant.add(makeIco(0.085, i % 2 === 0 ? materials.leafLight : materials.leaf, Math.cos(a) * 0.16, 0.39, Math.sin(a) * 0.16, 1.55, 0.28, 0.9, 0.35, a, 0));
  }

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createGrassPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const h = 0.18 + (i % 4) * 0.035;
    plant.add(makeCylinder(h, 0.01, i % 2 === 0 ? materials.leafLight : materials.leaf, Math.cos(a) * 0.1, 0.25, Math.sin(a) * 0.1, Math.sin(a) * -0.35, Math.cos(a) * 0.35));
  }

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createDaffodilPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const flowers = [
    { x: 0, z: 0, h: 0.5, s: 1 },
    { x: -0.14, z: 0.08, h: 0.4, s: 0.82 }
  ];

  flowers.forEach((f, index) => {
    plant.add(makeCylinder(f.h, 0.018, materials.stemLight, f.x, 0.25, f.z));

    const head = new THREE.Group();
    head.position.set(f.x, 0.25 + f.h, f.z);
    head.scale.set(f.s, f.s, f.s);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      head.add(makeIco(0.06, materials.yellowPetal, Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06, 1.2, 0.45, 0.82, 0.25, a, 0));
    }

    head.add(makeIco(0.045, materials.flowerCenter, 0, 0.015, 0, 0.9, 0.7, 0.9));
    plant.add(head);

    plant.add(makeIco(0.065, materials.leafLight, f.x * 0.6 + 0.04, 0.4, f.z, 1.25, 0.28, 0.65, 0.35, index * 1.5, 0));
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createIrisPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const stems = [
    { x: 0, z: 0, h: 0.54, s: 1 },
    { x: 0.13, z: -0.06, h: 0.43, s: 0.82 }
  ];

  stems.forEach((f, index) => {
    plant.add(makeCylinder(f.h, 0.017, materials.stemLight, f.x, 0.25, f.z));

    const head = new THREE.Group();
    head.position.set(f.x, 0.25 + f.h, f.z);
    head.scale.set(f.s, f.s, f.s);

    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2;
      head.add(makeIco(0.075, materials.purplePetal, Math.cos(a) * 0.055, 0.015, Math.sin(a) * 0.055, 0.95, 0.45, 1.25, 0.5, a, 0.2));
      head.add(makeIco(0.052, materials.purplePetal, Math.cos(a + 0.5) * 0.035, -0.02, Math.sin(a + 0.5) * 0.035, 0.75, 0.35, 0.9, 0.2, a, -0.2));
    }

    plant.add(head);
    plant.add(makeIco(0.07, materials.leafDark, f.x - 0.05, 0.42, f.z, 0.8, 0.3, 1.5, 0.5, index, 0));
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createTulipPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const tulips = [
    { x: -0.08, z: 0.03, h: 0.48, s: 1 },
    { x: 0.12, z: -0.05, h: 0.4, s: 0.86 }
  ];

  tulips.forEach((f, index) => {
    plant.add(makeCylinder(f.h, 0.018, materials.stemLight, f.x, 0.25, f.z));

    const head = new THREE.Group();
    head.position.set(f.x, 0.25 + f.h, f.z);
    head.scale.set(f.s, f.s, f.s);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      head.add(makeIco(0.065, materials.tulipRed, Math.cos(a) * 0.04, 0.015, Math.sin(a) * 0.04, 0.9, 0.65, 1.05, 0.35, a, 0.15));
    }

    plant.add(head);
    plant.add(makeIco(0.075, materials.leafLight, f.x + (index === 0 ? 0.06 : -0.06), 0.4, f.z, 1.3, 0.28, 0.72, 0.35, index * 1.7, 0));
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createDogwoodPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  plant.add(makeCylinder(0.38, 0.026, materials.stem, 0, 0.25, 0));

  const flowers = [
    { a: 0.2, y: 0.52 },
    { a: 2.3, y: 0.5 },
    { a: 4.1, y: 0.54 }
  ];

  flowers.forEach((f, index) => {
    const x = Math.cos(f.a) * 0.16;
    const z = Math.sin(f.a) * 0.16;

    plant.add(makeCylinder(0.18, 0.012, materials.stem, x * 0.4, f.y - 0.15, z * 0.4, Math.sin(f.a) * -0.65, Math.cos(f.a) * 0.65));

    const head = new THREE.Group();
    head.position.set(x, f.y, z);

    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      head.add(makeIco(0.055, materials.whitePetal, Math.cos(a) * 0.055, 0, Math.sin(a) * 0.055, 1.25, 0.4, 0.85, 0.25, a, 0));
    }

    head.add(makeIco(0.03, materials.flowerCenter, 0, 0.01, 0));
    plant.add(head);

    plant.add(makeIco(0.055, materials.leafLight, x * 0.7, f.y - 0.04, z * 0.7, 1.1, 0.3, 0.65, 0.4, f.a, 0));
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createStrawberryPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const berries = [
    { a: 0, h: 0.23 },
    { a: 2.1, h: 0.22 },
    { a: 4.2, h: 0.24 }
  ];

  berries.forEach((b, index) => {
    const x = Math.cos(b.a) * 0.08;
    const z = Math.sin(b.a) * 0.08;

    plant.add(makeCylinder(b.h, 0.012, materials.stemLight, x, 0.25, z));
    plant.add(makeIco(0.07, materials.strawberry, Math.cos(b.a) * 0.18, 0.25 + b.h, Math.sin(b.a) * 0.18, 0.82, 1.05, 0.82, 0.15, b.a, 0));
    plant.add(makeIco(0.055, index % 2 === 0 ? materials.leafLight : materials.leaf, x, 0.46, z, 1.15, 0.32, 0.68, 0.3, b.a, 0));
  });

  plant.scale.set(0.88, 0.88, 0.88);
  return plant;
}

function createLettucePlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dist = 0.08 + (i % 3) * 0.03;
    plant.add(makeIco(0.085, i % 2 === 0 ? materials.lettuce : materials.leafLight, Math.cos(a) * dist, 0.34 + (i % 3) * 0.02, Math.sin(a) * dist, 1.3, 0.34, 0.78, 0.35, a, 0.12));
  }

  plant.add(makeIco(0.095, materials.lettuce, 0, 0.39, 0, 1.15, 0.5, 1.05));

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createPeasPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  plant.add(makeCylinder(0.44, 0.014, materials.stemLight, 0, 0.25, 0));

  for (let i = 0; i < 4; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const y = 0.36 + i * 0.07;

    plant.add(makeCylinder(0.14, 0.009, materials.stemLight, side * 0.04, y, 0, 0, side * 0.75));
    plant.add(makeIco(0.055, materials.peaPod, side * 0.14, y + 0.06, 0.02 * i, 0.65, 0.4, 1.45, 0.3, side * 0.65, 0));
    plant.add(makeIco(0.05, materials.leafLight, side * 0.09, y + 0.02, -0.03, 1.1, 0.3, 0.6, 0.4, side * 0.65, 0));
  }

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function createRadishPlant(tileId) {
  const plant = new THREE.Group();
  plant.add(makeSoilBlob(tileId));

  const spots = [
    { x: -0.1, z: 0.04 },
    { x: 0.1, z: -0.05 }
  ];

  spots.forEach((r, index) => {
    plant.add(makeIco(0.085, materials.radish, r.x, 0.34, r.z, 0.9, 1.15, 0.9));
    plant.add(makeCylinder(0.14, 0.01, materials.stemLight, r.x, 0.42, r.z));

    for (let i = 0; i < 3; i++) {
      const a = index + i * 2.1;
      plant.add(makeIco(0.06, materials.leafLight, r.x + Math.cos(a) * 0.055, 0.52, r.z + Math.sin(a) * 0.055, 1.1, 0.32, 0.65, 0.35, a, 0));
    }
  });

  plant.scale.set(0.9, 0.9, 0.9);
  return plant;
}

function closeAllPopups() {
  if (plantMenu) plantMenu.classList.remove("open");
  if (gridMenu) gridMenu.classList.remove("open");
  if (nameSavePopup) nameSavePopup.classList.remove("open");
  if (savedListPopup) savedListPopup.classList.remove("open");
}

function createPlant(type, tileId) {
  let plant;

  if (type === "fern") plant = createFernPlant(tileId);
  else if (type === "sprout") plant = createSproutPlant(tileId);
  else if (type === "clover") plant = createCloverPlant(tileId);
  else if (type === "hosta") plant = createHostaPlant(tileId);
  else if (type === "grass") plant = createGrassPlant(tileId);
  else if (type === "flower") plant = createFlowerPlant(tileId);
  else if (type === "daffodil") plant = createDaffodilPlant(tileId);
  else if (type === "iris") plant = createIrisPlant(tileId);
  else if (type === "tulip") plant = createTulipPlant(tileId);
  else if (type === "dogwood") plant = createDogwoodPlant(tileId);
  else if (type === "tomato") plant = createTomatoPlant(tileId);
  else if (type === "carrot") plant = createCarrotPlant(tileId);
  else if (type === "potato") plant = createPotatoPlant(tileId);
  else if (type === "strawberry") plant = createStrawberryPlant(tileId);
  else if (type === "lettuce") plant = createLettucePlant(tileId);
  else if (type === "peas") plant = createPeasPlant(tileId);
  else if (type === "radish") plant = createRadishPlant(tileId);
  else plant = createSproutPlant(tileId);

  plant.userData.isPlant = true;
  plant.userData.plantType = type;
  plant.rotation.y = Math.floor(Math.random() * 8) * (Math.PI / 4);
  plant.position.y = 0;

  return plant;
}

  function coordKey(row, col) {
    return `${row}-${col}`;
  }

  function registerTile(tile) {
    const key = tile.userData.coordKey;

    if (!tileStacks[key]) {
      tileStacks[key] = [];
    }

    tileStacks[key].push(tile);
    tileStacks[key].sort((a, b) => a.userData.level - b.userData.level);
  }

function getTopLevel(row, col) {
  const stack = tileStacks[coordKey(row, col)] || [];

  if (stack.length === 0) return -1;

  return Math.max(...stack.map((tile) => tile.userData.level));
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

function captureGardenState() {
  return {
    tiles: tileMeshes.map((tile) => ({
      row: tile.userData.row,
      col: tile.userData.col,
      level: tile.userData.level,
      removed: tile.userData.removed
    })),
    plants: Object.keys(plantedItems)
      .filter((tileId) => plantedItems[tileId])
      .map((tileId) => ({
        tileId,
        type: plantedItems[tileId].userData.plantType,
        rotationY: plantedItems[tileId].rotation.y
      })),
    removedTiles: [...removedTileIds],
    rotation: {
      x: platform.rotation.x,
      y: platform.rotation.y
    },
    cameraZ: camera.position.z
  };
}

function saveUndoState() {
  if (isRestoringState || !platform) return;

  undoStack.push(captureGardenState());

  if (undoStack.length > 40) {
    undoStack.shift();
  }
}

function restoreGardenState(state) {
  if (!state || !platform) return;

  isRestoringState = true;

  tileMeshes.forEach((tile) => {
    platform.remove(tile.userData.tileGroup);
  });

  tileMeshes = [];
  tileStacks = {};
  plantedItems = {};
  removedTileIds = [...state.removedTiles];

  state.tiles.forEach((tileData) => {
    const tile = createTile(tileData.row, tileData.col, tileData.level);
    platform.add(tile.userData.tileGroup);

    if (tileData.removed) {
      tile.userData.removed = true;
      tile.userData.visibleTile.visible = false;

      tile.userData.tileLines.forEach((line) => {
        line.visible = false;
      });
    }
  });

  state.plants.forEach((plantData) => {
    const tile = tileMeshes.find((item) => {
      return item.userData.tileId === plantData.tileId;
    });

    if (tile && !tile.userData.removed) {
      const plant = createPlant(plantData.type, plantData.tileId);
      markPlantPieces(plant, plantData.tileId);

      plant.rotation.y = plantData.rotationY;

      tile.parent.add(plant);
      plantedItems[plantData.tileId] = plant;
    }
  });

  platform.rotation.x = state.rotation.x;
  platform.rotation.y = state.rotation.y;

  camera.position.z = state.cameraZ;
  camera.lookAt(0, 0, 0);

  clearRemoveSelection();
  selectedSquare = null;

  if (removePopup) removePopup.classList.remove("open");

  isRestoringState = false;
}

function undoLastAction() {
  if (undoStack.length === 0) return;

  const previousState = undoStack.pop();
  restoreGardenState(previousState);
}

function getTileById(tileId) {
  return tileMeshes.find((tile) => tile.userData.tileId === tileId);
}

function hasPlantAt(row, col, level) {
  const tileId = `${row}-${col}-${level}`;
  return Boolean(plantedItems[tileId]);
}

function makeSoilPatch(width, depth, x, z, y, seedText) {
  const group = new THREE.Group();
  const rand = seededRandom(seedText);

  for (let i = 0; i < 5; i++) {
    const material =
      i % 3 === 0
        ? materials.soilDark
        : i % 2 === 0
        ? materials.soilLight
        : materials.soil;

    const patch = new THREE.Mesh(
      new THREE.CylinderGeometry(
        0.16 + rand() * 0.05,
        0.2 + rand() * 0.06,
        0.028,
        7
      ),
      material
    );

    patch.position.set(
      x + (rand() - 0.5) * width,
      y + i * 0.003,
      z + (rand() - 0.5) * depth
    );

    patch.scale.set(
      1.2 + rand() * 0.45,
      1,
      0.8 + rand() * 0.35
    );

    patch.rotation.y = rand() * Math.PI * 2;
    patch.castShadow = true;
    patch.receiveShadow = true;

    group.add(patch);
  }

  return group;
}

function rebuildSoilConnectors() {
  if (!platform) return;

  if (soilConnectorGroup) {
    platform.remove(soilConnectorGroup);
  }

  soilConnectorGroup = new THREE.Group();

  Object.keys(plantedItems).forEach((tileId) => {
    const plant = plantedItems[tileId];
    if (!plant) return;

    const tile = getTileById(tileId);
    if (!tile || tile.userData.removed) return;

    const row = tile.userData.row;
    const col = tile.userData.col;
    const level = tile.userData.level;

    const baseX = col - currentSize / 2 + 0.5;
    const baseZ = row - currentSize / 2 + 0.5;
    const baseY = level * 0.35 + 0.265;

    if (hasPlantAt(row, col + 1, level)) {
      soilConnectorGroup.add(
        makeSoilPatch(
          0.72,
          0.48,
          baseX + 0.5,
          baseZ,
          baseY,
          `soil-right-${row}-${col}-${level}`
        )
      );
    }

    if (hasPlantAt(row + 1, col, level)) {
      soilConnectorGroup.add(
        makeSoilPatch(
          0.48,
          0.72,
          baseX,
          baseZ + 0.5,
          baseY,
          `soil-down-${row}-${col}-${level}`
        )
      );
    }

    if (
      hasPlantAt(row, col + 1, level) &&
      hasPlantAt(row + 1, col, level) &&
      hasPlantAt(row + 1, col + 1, level)
    ) {
      soilConnectorGroup.add(
        makeSoilPatch(
          0.82,
          0.82,
          baseX + 0.5,
          baseZ + 0.5,
          baseY + 0.003,
          `soil-middle-${row}-${col}-${level}`
        )
      );
    }
  });

    platform.add(soilConnectorGroup);
}

function plantOnSquare(tile) {
  if (!selectedPlant || tile.userData.removed) return;

  saveUndoState();

  const tileId = tile.userData.tileId;

  removePlantFromSquare(tile);

  const plant = createPlant(selectedPlant, tileId);
  markPlantPieces(plant, tileId);

  tile.parent.add(plant);
  plantedItems[tileId] = plant;
  rebuildSoilConnectors();
}

function clearTileHighlight(tile) {
  if (!tile) return;

    tile.userData.outerGlow.material.opacity = 0;
    tile.userData.glow.material.opacity = 0;
    tile.userData.redGlow.material.opacity = 0;

    if (tile.userData.greenGlow) {
      tile.userData.greenGlow.material.opacity = 0;
    }

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

  function addTileToRemoveSelection(tile) {
    if (!tile || tile.userData.removed) return;

    if (!removeSelectedTiles.includes(tile)) {
      removeSelectedTiles.push(tile);

      tile.userData.redGlow.material.opacity = 0.62;
      tile.userData.border.material.opacity = 1;
      tile.userData.raisedHighlight.material.opacity = 0.16;
      tile.userData.border.material.color.set(0xff4b4b);
    }
  }

  function clearRemoveSelection() {
    removeSelectedTiles.forEach((tile) => {
      clearTileHighlight(tile);
    });

    removeSelectedTiles = [];
  }

  function openRemoveTilesPopup() {
    if (removeSelectedTiles.length === 0) return;

    if (removePopup) {
      const title = removePopup.querySelector("h2");

      if (title) {
        title.textContent =
          removeSelectedTiles.length === 1 ? "Remove Tile" : "Remove Tiles";
      }

      removePopup.classList.add("open");
    }
  }

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

  function hideTile(tile) {
    const tileId = tile.userData.tileId;

    removePlantFromSquare(tile);

    tile.userData.removed = true;
    tile.userData.visibleTile.visible = false;

    tile.userData.tileLines.forEach((line) => {
      line.visible = false;
    });

    clearTileHighlight(tile);
    plantedItems[tileId] = null;
rebuildSoilConnectors();

    if (!removedTileIds.includes(tileId)) {
      removedTileIds.push(tileId);
    }
  }

  function restoreTile(tile) {
    const tileId = tile.userData.tileId;

    tile.userData.removed = false;
    tile.userData.visibleTile.visible = true;

    tile.userData.tileLines.forEach((line) => {
      line.visible = true;
    });

    removedTileIds = removedTileIds.filter((id) => id !== tileId);

    tile.userData.greenGlow.material.opacity = 0.65;
    tile.userData.border.material.opacity = 1;
    tile.userData.raisedHighlight.material.opacity = 0.18;
    tile.userData.border.material.color.set(0x7dff8a);

    setTimeout(() => {
      clearTileHighlight(tile);
    }, 220);
  }

  function flashAddedTile(tile) {
    tile.userData.greenGlow.material.opacity = 0.65;
    tile.userData.border.material.opacity = 1;
    tile.userData.raisedHighlight.material.opacity = 0.18;
    tile.userData.border.material.color.set(0x7dff8a);

    setTimeout(() => {
      clearTileHighlight(tile);
    }, 220);
  }

  function createAddPreview() {
    const previewGroup = new THREE.Group();

    const outline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 0.37, 1.02)),
      new THREE.LineBasicMaterial({
        color: 0x7dff8a,
        transparent: true,
        opacity: 0.95
      })
    );

    previewGroup.add(outline);
    previewGroup.visible = false;

    return previewGroup;
  }

  function updateAddPreview(e) {
    if (selectedTool !== "add" || !platform || !addPreview) {
      if (addPreview) addPreview.visible = false;
      return;
    }

    const coord = getAddCoordFromMouseEvent(e);

    if (!coord || !canAddAtCoord(coord.row, coord.col)) {
      addPreview.visible = false;
      return;
    }

    const nextLevel = getTopLevel(coord.row, coord.col) + 1;

    addPreview.position.set(
      coord.col - currentSize / 2 + 0.5,
      nextLevel * 0.35,
      coord.row - currentSize / 2 + 0.5
    );

    addPreview.visible = true;
  }

  function updateMouseFromEvent(e) {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function getTileFromMouseEvent(e) {
    updateMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);

    const visibleTiles = tileMeshes.filter((tile) => !tile.userData.removed);
    const hits = raycaster.intersectObjects(visibleTiles);

    if (hits.length > 0) {
      return hits[0].object;
    }

    const hiddenHits = raycaster.intersectObjects(tileMeshes);

    if (hiddenHits.length > 0) {
      return hiddenHits[0].object;
    }

    return null;
  }

  function getAddCoordFromMouseEvent(e) {
    updateMouseFromEvent(e);
    raycaster.setFromCamera(mouse, camera);

    const tileHits = raycaster.intersectObjects(tileMeshes);

    if (tileHits.length > 0) {
      const tile = tileHits[0].object;

      return {
        row: tile.userData.row,
        col: tile.userData.col
      };
    }

    if (!addPlane || !platform) return null;

    const planeHits = raycaster.intersectObject(addPlane);

    if (planeHits.length === 0) return null;

    const platformPoint = platform.worldToLocal(planeHits[0].point.clone());

    const col = Math.floor(platformPoint.x + currentSize / 2);
    const row = Math.floor(platformPoint.z + currentSize / 2);

    return { row, col };
  }

  function canAddAtCoord(row, col) {
    const visibleTiles = tileMeshes.filter((tile) => !tile.userData.removed);

    if (visibleTiles.length === 0) return true;

    const rows = visibleTiles.map((tile) => tile.userData.row);
    const cols = visibleTiles.map((tile) => tile.userData.col);

    const minRow = Math.min(...rows) - 1;
    const maxRow = Math.max(...rows) + 1;
    const minCol = Math.min(...cols) - 1;
    const maxCol = Math.max(...cols) + 1;

    return row >= minRow && row <= maxRow && col >= minCol && col <= maxCol;
  }

  function addTileAtCoord(row, col) {
    if (!platform) return null;
    if (!canAddAtCoord(row, col)) return null;

    const key = coordKey(row, col);
    const stack = tileStacks[key] || [];
    const hiddenTile = stack.find((tile) => tile.userData.removed);

    if (hiddenTile) {
      restoreTile(hiddenTile);
      return hiddenTile;
    }

    const nextLevel = getTopLevel(row, col) + 1;
    const newTile = createTile(row, col, nextLevel);

    platform.add(newTile.userData.tileGroup);
    flashAddedTile(newTile);

    return newTile;
  }

  function addFromMouseEvent(e) {
    const coord = getAddCoordFromMouseEvent(e);

    if (!coord) return;

    const dragKey = `${coord.row}-${coord.col}`;

    if (addedThisDrag.includes(dragKey)) return;

if (addedThisDrag.length === 0) {
  saveUndoState();
}

const addedTile = addTileAtCoord(coord.row, coord.col);

    if (addedTile) {
      addedThisDrag.push(dragKey);
      updateAddPreview(e);
    }
  }

  function createTile(row, col, level) {
    const tileGroup = new THREE.Group();

    tileGroup.position.x = col - currentSize / 2 + 0.5;
    tileGroup.position.z = row - currentSize / 2 + 0.5;
    tileGroup.position.y = level * 0.35;

    const visibleTile = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.35, 1),
      [
        materials.tileSide,
        materials.tileSide,
        materials.tileTop,
        materials.tileSide,
        materials.tileSide,
        materials.tileSide
      ]
    );

    visibleTile.castShadow = true;
    visibleTile.receiveShadow = true;

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
    clickTile.position.y = 0.19;

    clickTile.userData.isTile = true;
    clickTile.userData.row = row;
    clickTile.userData.col = col;
    clickTile.userData.level = level;
    clickTile.userData.coordKey = coordKey(row, col);
    clickTile.userData.tileId = `${row}-${col}-${level}`;
    clickTile.userData.tileGroup = tileGroup;
    clickTile.userData.visibleTile = visibleTile;
    clickTile.userData.removed = false;

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xf0dfb8,
      transparent: true,
      opacity: 0.58
    });

    const lineY = 0.196;

    const topLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, lineY, -0.5),
        new THREE.Vector3(0.5, lineY, -0.5)
      ]),
      lineMaterial
    );

    const bottomLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, lineY, 0.5),
        new THREE.Vector3(0.5, lineY, 0.5)
      ]),
      lineMaterial
    );

    const leftLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.5, lineY, -0.5),
        new THREE.Vector3(-0.5, lineY, 0.5)
      ]),
      lineMaterial
    );

    const rightLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.5, lineY, -0.5),
        new THREE.Vector3(0.5, lineY, 0.5)
      ]),
      lineMaterial
    );

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

    const greenGlow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.08, 1.08),
      new THREE.MeshBasicMaterial({
        color: 0x7dff8a,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );

    greenGlow.rotation.x = -Math.PI / 2;
    greenGlow.position.y = 0.23;

    const border = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)),
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
    clickTile.userData.greenGlow = greenGlow;
    clickTile.userData.border = border;
    clickTile.userData.raisedHighlight = raisedHighlight;
    clickTile.userData.tileLines = [topLine, bottomLine, leftLine, rightLine];

    tileGroup.add(visibleTile);
    tileGroup.add(clickTile);
    tileGroup.add(topLine);
    tileGroup.add(bottomLine);
    tileGroup.add(leftLine);
    tileGroup.add(rightLine);
    tileGroup.add(outerGlow);
    tileGroup.add(glow);
    tileGroup.add(redGlow);
    tileGroup.add(greenGlow);
    tileGroup.add(border);
    tileGroup.add(raisedHighlight);

    tileMeshes.push(clickTile);
    registerTile(clickTile);

    return clickTile;
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
    tileStacks = {};
    plantedItems = {};
    removedTileIds = [];
    removeSelectedTiles = [];
    addedThisDrag = [];

    if (removePopup) removePopup.classList.remove("open");

    const platformGroup = new THREE.Group();

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const tile = createTile(row, col, 0);
        platformGroup.add(tile.userData.tileGroup);
      }
    }

    addPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(size + 14, size + 14),
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );

    addPlane.rotation.x = -Math.PI / 2;
    addPlane.position.y = 0.23;
    platformGroup.add(addPlane);

    addPreview = createAddPreview();
    platformGroup.add(addPreview);

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
      removedTileIds = [];
      createPlatform(Number(button.dataset.grid));
      if (gridMenu) gridMenu.classList.remove("open");
    });
  });

container.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  container.setPointerCapture(e.pointerId);

  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  didDrag = false;

  if (selectedTool === "add") {
    toolPointerDown = true;
    addedThisDrag = [];
    addFromMouseEvent(e);
    return;
  }

  if (selectedTool === "remove") {
    toolPointerDown = true;
    clearRemoveSelection();

    const tile = getTileFromMouseEvent(e);
    addTileToRemoveSelection(tile);
    return;
  }

  dragging = true;
  previousX = e.clientX;
  previousY = e.clientY;
});

container.addEventListener("pointermove", (e) => {
  e.preventDefault();

  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  if (activePointers.size === 2) {
    const points = [...activePointers.values()];
    const dx = points[0].x - points[1].x;
    const dy = points[0].y - points[1].y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (lastPinchDistance !== null) {
      const delta = distance - lastPinchDistance;

      camera.position.z -= delta * 0.025;
      camera.position.z = Math.max(3.2, Math.min(18, camera.position.z));
      camera.lookAt(0, 0, 0);
    }

    lastPinchDistance = distance;
    return;
  }

if (activePointers.has(e.pointerId)) {
  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
}

if (activePointers.size === 2) {
  const pinchDistance = getPinchDistance();

  if (lastPinchDistance !== null && pinchDistance !== null) {
    const delta = pinchDistance - lastPinchDistance;

    camera.position.z -= delta * 0.025;
    camera.position.z = Math.max(3.2, Math.min(18, camera.position.z));
    camera.lookAt(0, 0, 0);
  }

  lastPinchDistance = pinchDistance;
  return;
}

  if (selectedTool === "add" && !toolPointerDown) {
    updateAddPreview(e);
  }

  if (toolPointerDown && selectedTool === "add") {
    didDrag = true;
    addFromMouseEvent(e);
    return;
  }

  if (toolPointerDown && selectedTool === "remove") {
    didDrag = true;

    const tile = getTileFromMouseEvent(e);
    addTileToRemoveSelection(tile);
    return;
  }

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

container.addEventListener("pointerup", (e) => {
  e.preventDefault();

  activePointers.delete(e.pointerId);
  lastPinchDistance = null;

if (toolPointerDown && selectedTool === "remove") {
  toolPointerDown = false;

  if (removeSelectedTiles.length > 0) {
    saveUndoState();

    removeSelectedTiles.forEach((tile) => {
      if (!tile) return;

      const tileId = tile.userData.tileId;

      tile.userData.removed = true;
      tile.userData.visibleTile.visible = false;

      tile.userData.tileLines.forEach((line) => {
        line.visible = false;
      });

      removePlantByTileId(tileId);
      removedTileIds.push(tileId);
    });

    clearRemoveSelection();
    rebuildSoilConnectors();
  }

  return;
}

  dragging = false;
});

container.addEventListener("pointercancel", (e) => {
  activePointers.delete(e.pointerId);
  lastPinchDistance = null;

  toolPointerDown = false;
  dragging = false;
  addedThisDrag = [];
});

container.addEventListener("click", (e) => {
  if (selectedTool === "add") return;
  if (didDrag) return;

  updateMouseFromEvent(e);

  plantRaycaster.setFromCamera(mouse, camera);

  const plantHits = plantRaycaster.intersectObjects(
    Object.values(plantedItems).filter(Boolean),
    true
  );

  if (plantHits.length > 0) {
    const tileId = plantHits[0].object.userData.tileId;

    if (selectedTool === "remove") {
      saveUndoState();
      removePlantByTileId(tileId);
      rebuildSoilConnectors();
      return;
    }

    const plant = plantedItems[tileId];

    if (plant) {
      plant.rotation.y += Math.PI / 4;
    }

    return;
  }

  if (selectedTool === "remove") return;

  raycaster.setFromCamera(mouse, camera);

    const visibleTiles = tileMeshes.filter((tile) => !tile.userData.removed);
    const hits = raycaster.intersectObjects(visibleTiles);

    if (hits.length > 0) {
      const clickedTile = hits[0].object;

      setSelectedSquare(clickedTile);

      if (selectedTool === "plant" && selectedPlant) {
        plantOnSquare(clickedTile);
      }
    }
  });

  function getSavedGardens() {
    return JSON.parse(localStorage.getItem("gardenSavesPage2")) || [];
  }

  function setSavedGardens(saves) {
    localStorage.setItem("gardenSavesPage2", JSON.stringify(saves));
  }

  function saveCurrentGarden(name) {
    const plants = [];

    Object.keys(plantedItems).forEach((tileId) => {
      const plant = plantedItems[tileId];

      if (plant) {
        plants.push({
          tileId: tileId,
          type: plant.userData.plantType,
          rotationY: plant.rotation.y
        });
      }
    });

    const tiles = tileMeshes.map((tile) => {
      return {
        tileId: tile.userData.tileId,
        row: tile.userData.row,
        col: tile.userData.col,
        level: tile.userData.level,
        removed: tile.userData.removed
      };
    });

    const saveData = {
      id: Date.now(),
      name: name,
      gridSize: currentSize,
      platformRotation: {
        x: platform.rotation.x,
        y: platform.rotation.y
      },
      cameraZ: camera.position.z,
      removedTiles: [...removedTileIds],
      tiles: tiles,
      plants: plants
    };

    const saves = getSavedGardens();
    saves.push(saveData);
    setSavedGardens(saves);
  }

  function loadGarden(saveData) {
    createPlatform(saveData.gridSize);

    if (saveData.tiles) {
      tileMeshes.forEach((tile) => {
        platform.remove(tile.userData.tileGroup);
      });

      tileMeshes = [];
      tileStacks = {};
      plantedItems = {};
      removedTileIds = [];

      saveData.tiles.forEach((tileData) => {
        const tile = createTile(tileData.row, tileData.col, tileData.level);
        platform.add(tile.userData.tileGroup);

        if (tileData.removed) {
          hideTile(tile);
        }
      });
    } else {
      removedTileIds = [...saveData.removedTiles];

      removedTileIds.forEach((tileId) => {
        const tile = tileMeshes.find((item) => item.userData.tileId === tileId);

        if (tile) {
          hideTile(tile);
        }
      });
    }

    platform.rotation.x = saveData.platformRotation.x;
    platform.rotation.y = saveData.platformRotation.y;
    camera.position.z = saveData.cameraZ;
    camera.lookAt(0, 0, 0);

    saveData.plants.forEach((plantData) => {
      const tile = tileMeshes.find((item) => item.userData.tileId === plantData.tileId);

      if (tile && !tile.userData.removed) {
        selectedPlant = plantData.type;
        plantOnSquare(tile);

        if (plantedItems[plantData.tileId]) {
          plantedItems[plantData.tileId].rotation.y = plantData.rotationY;
        }
      }
    });

    selectedPlant = null;
    selectedSquare = null;
  }

  function renderSavedList() {
    const saves = getSavedGardens();

    if (!savedList) return;

    savedList.innerHTML = "";

    if (saves.length === 0) {
      savedList.innerHTML = `<p style="color:#7a4144; margin:0;">No saves yet.</p>`;
      return;
    }

    saves.forEach((saveData) => {
      const row = document.createElement("div");
      row.className = "saved-row";

      const button = document.createElement("button");
      button.className = "saved-item";
      button.textContent = saveData.name;

      button.addEventListener("click", () => {
        loadGarden(saveData);
        if (savedListPopup) savedListPopup.classList.remove("open");
      });

      const deleteButton = document.createElement("button");
      deleteButton.className = "delete-save";
      deleteButton.textContent = "×";
      deleteButton.setAttribute("aria-label", "Delete save");

      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();

        const wantsDelete = confirm(`Remove save "${saveData.name}"?`);

        if (!wantsDelete) return;

        const updatedSaves = getSavedGardens().filter((item) => {
          return item.id !== saveData.id;
        });

        setSavedGardens(updatedSaves);
        renderSavedList();
      });

      row.appendChild(button);
      row.appendChild(deleteButton);
      savedList.appendChild(row);
    });
  }

if (saveButton && nameSavePopup) {
  saveButton.addEventListener("click", () => {
    closeAllPopups();
    nameSavePopup.classList.add("open");
  });
}

  if (cancelSave) {
    cancelSave.addEventListener("click", () => {
      if (nameSavePopup) nameSavePopup.classList.remove("open");
    });
  }

  if (confirmSave) {
    confirmSave.addEventListener("click", () => {
      if (!saveNameInput) return;

      const name = saveNameInput.value.trim();

      if (!name) return;

      saveCurrentGarden(name);

      if (nameSavePopup) nameSavePopup.classList.remove("open");

      if (saveButton) {
        saveButton.classList.add("saved");

        setTimeout(() => {
          saveButton.classList.remove("saved");
        }, 350);
      }
    });
  }

if (bookmarkButton && savedListPopup) {
  bookmarkButton.addEventListener("click", () => {
    closeAllPopups();

    if (typeof renderSavedGardens === "function") {
      renderSavedGardens();
    }

    savedListPopup.classList.add("open");
  });
}

if (rewindButton) {
  rewindButton.addEventListener("click", () => {
    undoLastAction();
  });
}

  if (closeSaves) {
    closeSaves.addEventListener("click", () => {
      if (savedListPopup) savedListPopup.classList.remove("open");
    });
  }

  container.addEventListener("wheel", (e) => {
    e.preventDefault();

    camera.position.z += e.deltaY * 0.065;

    if (currentSize === 3) {
      camera.position.z = Math.max(2.2, Math.min(18, camera.position.z));
    } else if (currentSize === 6) {
      camera.position.z = Math.max(2.8, Math.min(24, camera.position.z));
    } else {
      camera.position.z = Math.max(3.5, Math.min(30, camera.position.z));
    }

    camera.lookAt(0, 0, 0);
  });

function resetIdleTimer() {
  isIdleMode = false;

  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  idleTimer = setTimeout(() => {
    isIdleMode = true;
  }, IDLE_DELAY);
}

function updateIdleMode() {
  if (!isIdleMode || !platform) return;

  // smoothly move camera/platform to a nice upper viewing angle
  platform.rotation.x += (idleTargetX - platform.rotation.x) * 0.025;

  // slowly rotate all the way around
  platform.rotation.y += idleRotationSpeed;
}

["mousedown", "mousemove", "wheel", "click", "touchstart", "keydown"].forEach((eventName) => {
  document.addEventListener(eventName, resetIdleTimer);
});

resetIdleTimer();

function animate() {
  requestAnimationFrame(animate);

  updateIdleMode();

  renderer.render(scene, camera);
}

animate();
});