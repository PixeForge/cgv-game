// Use the ES module build from a CDN
import * as THREE from 'three';
import { Environment } from './3rd level/clocktower.js';
import { PlayerController3 } from './3rd level/playerController3.js';

// Initialize renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Initialize camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

//LEVEL 3
const level3 = new Environment();
const playerController3 = new PlayerController3(level3, camera, renderer);
document.addEventListener('click', async () => {
  await level3.loadSoundtrack('./3rd level/public/clocktower_soundtrack.mp3');
  level3.playSoundtrack();
}, { once: true });
level3.loadPlayerModel()
  .then((gltf) => {
    playerController3.setupAnimations(gltf);
  })
  .catch((error) => {
    console.error('Error loading player model:', error);
  });
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();

  level3.update(delta);
  playerController3.update(delta);

  renderer.render(level3.getScene(), camera);
  renderer.setAnimationLoop(animate);
}

animate();