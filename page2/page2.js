"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".garden-container");
  const eyeButton = document.querySelector(".eye-icon");

  let scene;
  let camera;
  let renderer;
  let controls;
  let platform;
  let gridHelper;

  let currentGridSize = 6;

  init();
  createSizeMenu();
  createPlatform(currentGridSize);
  animate();

  function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    camera.position.set(0, 8, 10);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    controls.enableZoom = true;
    controls.minDistance = 1.2;
    controls.maxDistance = 80;
    controls.zoomSpeed = 1.3;

    controls.enablePan = true;
    controls.target.set(0, 0, 0);
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(4, 8, 6);
    scene.add(directionalLight);

    window.addEventListener("resize", onWindowResize);
  }

  function createPlatform(gridSize) {
    if (platform) {
      scene.remove(platform);
      platform.geometry.dispose();
      platform.material.dispose();
    }

    if (gridHelper) {
      scene.remove(gridHelper);
      gridHelper.geometry.dispose();
      gridHelper.material.dispose();
    }

    const scaleAmount = 0.45;
    const platformSize = gridSize * scaleAmount;

    const platformGeometry = new THREE.BoxGeometry(
      platformSize,
      0.18,
      platformSize
    );

    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0xd7c4a3,
      roughness: 0.8,
      metalness: 0.05
    });

    platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.1;
    scene.add(platform);

    gridHelper = new THREE.GridHelper(
      platformSize,
      gridSize,
      0x6f5f45,
      0x9b8765
    );

    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    currentGridSize = gridSize;
  }

  function createSizeMenu() {
    if (!eyeButton) return;

    eyeButton.style.position = "absolute";
    eyeButton.style.left = "14px";
    eyeButton.style.top = "50%";
    eyeButton.style.transform = "translateY(-50%)";
    eyeButton.style.zIndex = "20";
    eyeButton.style.cursor = "pointer";

    const menu = document.createElement("div");
    menu.classList.add("grid-size-menu");

    menu.innerHTML = `
      <button data-size="3">3x3</button>
      <button data-size="6">6x6</button>
      <button data-size="9">9x9</button>
    `;

    menu.style.position = "absolute";
    menu.style.left = "55px";
    menu.style.top = "50%";
    menu.style.transform = "translateY(-50%)";
    menu.style.display = "none";
    menu.style.flexDirection = "column";
    menu.style.gap = "8px";
    menu.style.zIndex = "25";

    container.style.position = "relative";
    container.appendChild(menu);

    eyeButton.addEventListener("click", () => {
      if (menu.style.display === "none") {
        menu.style.display = "flex";
      } else {
        menu.style.display = "none";
      }
    });

    const buttons = menu.querySelectorAll("button");

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const newSize = Number(button.dataset.size);
        createPlatform(newSize);
        menu.style.display = "none";
      });
    });
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate() {
    requestAnimationFrame(animate);

    controls.update();
    renderer.render(scene, camera);
  }
});