import * as THREE from "https://unpkg.com/three@0.180.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.180.0/examples/jsm/controls/OrbitControls.js";

const canvas = document.querySelector(".globe-canvas");
const stage = document.querySelector(".globe-stage");

if (canvas && stage) {
  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(
    40,
    stage.clientWidth / stage.clientHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 6.5);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(stage.clientWidth, stage.clientHeight, false);

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
  directionalLight.position.set(4, 3, 6);
  scene.add(directionalLight);

  const rimLight = new THREE.DirectionalLight(0x9fd7ff, 0.8);
  rimLight.position.set(-4, -2, -4);
  scene.add(rimLight);

  const textureLoader = new THREE.TextureLoader();
 const earthTexture = textureLoader.load("../photos/Earth.png");
 earthTexture.colorSpace = THREE.SRGBColorSpace;

  const geometry = new THREE.SphereGeometry(2.05, 24, 24);
  const material = new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 1,
    metalness: 0
  });

  const earth = new THREE.Mesh(geometry, material);
  earth.rotation.y = 0.6;
  earth.rotation.x = 0.15;
  scene.add(earth);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.9;
  controls.minDistance = 6.5;
  controls.maxDistance = 6.5;

  function render() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(render);
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
  render();
}