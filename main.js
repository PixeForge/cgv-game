// main.js
// Use the ES module build from a CDN
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createChildBedroom } from './2nd level/usingmodels.js'; 
import { Environment } from './js/environment.js';
import { PlayerController } from './js/playerController.js';
import { train } from './2nd level/terrain.js'; //this is for the blocks tweak after
import { addMirror } from './2nd level/mirror.js'; //mirror
import { addTrain } from './2nd level/train.js'; //train
import { addCorporateHQ } from './1st level/corporate.js'; //corporate hq

// Initialize renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Initialize camera
const camera = new THREE.PerspectiveCamera(
  45, // was 75 i think i changed it to 45
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// Initialize environment and player controller
const environment = new Environment();
const playerController = new PlayerController(environment, camera, renderer);

// Load player model and setup animations
environment.loadPlayerModel()
  .then((gltf) => {
    playerController.setupAnimations(gltf);
  })
  .catch((error) => {
    console.error('Error loading player model:', error);
  });

// =========== LOAD CORPORATE GLB AS TERRAIN ================//
const loader = new GLTFLoader();

loader.load(
  './models/corporate.glb',
  (gltf) => {
    const corporateTerrain = gltf.scene;
    
    // Set name for easy identification
    corporateTerrain.name = 'corporateTerrain';
    
    // Position and scale (adjust these values as needed)
    corporateTerrain.position.set(0, 0, 0);
    corporateTerrain.scale.set(1, 1, 1);
    
    // Enable shadows for all meshes in the terrain
    corporateTerrain.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    
    // Add to scene
    environment.getScene().add(corporateTerrain);
    
    // Extract all meshes for collision detection
    const corporateCollidables = [];
    corporateTerrain.traverse((child) => {
      if (child.isMesh) {
        corporateCollidables.push(child);
      }
    });
    
    // Add to environment collidables
    environment.addCollidables(corporateCollidables);
    
    // Calculate bounding box for the corporate terrain
    const corporateBox = new THREE.Box3().setFromObject(corporateTerrain);
    environment.setRoomBounds(corporateBox);
    
    // Position player in the corporate terrain
    const player = environment.getPlayer();
    if (player) {
      const center = corporateBox.getCenter(new THREE.Vector3());
      // Set player to center, slightly above the floor
      player.position.set(center.x, corporateBox.min.y + 2, center.z);
    }
    
    // Adjust camera distance based on terrain size
    const terrainSize = corporateBox.getSize(new THREE.Vector3());
    playerController.cameraDistance = Math.min(
      playerController.cameraDistance,
      Math.max(5, terrainSize.length() * 0.15)
    );
    
    console.log('Corporate terrain loaded successfully!');
    console.log('Terrain bounds:', corporateBox);
    console.log('Collidable meshes:', corporateCollidables.length);
  },
  (progress) => {
    // Loading progress
    const percent = (progress.loaded / progress.total) * 100;
    console.log(`Loading corporate terrain: ${percent.toFixed(2)}%`);
  },
  (error) => {
    console.error('Error loading corporate terrain:', error);
  }
);

// ====================================================//


// =========== LOAD CORPORATE CLASH TOON HQ INTERIOR (BIGGER & NEXT TO PLAYGROUND) ================//
addCorporateHQ({
  scene: environment.getScene(),
  loader: new GLTFLoader(),
  position: new THREE.Vector3(25, 0, 0), // Positioned to the right of playground
  scale: 2.5, // Bigger scale
  makeCollidable: true
})
.then(({ corporateGroup, collidables, box }) => {
  console.log('Corporate HQ loaded successfully!');
  
  // Add collidable meshes to environment for collision detection
  environment.addCollidables(collidables);
  
  // Store corporate bounds separately or combine with playground bounds
  environment.setCorporateBounds(box);
  
  // Create combined bounds for player containment (playground + corporate HQ)
  const playgroundBox = environment.getRoomBounds(); // Get existing playground bounds
  const combinedBox = playgroundBox ? playgroundBox.clone().union(box) : box;
  environment.setRoomBounds(combinedBox);
  
  console.log('Corporate HQ positioned next to playground');
  console.log('Corporate HQ bounds:', box);
  console.log('Combined bounds:', combinedBox);
  console.log('Collidable meshes:', collidables.length);
})
.catch((error) => {
  console.error('Error loading corporate HQ:', error);
});

// ===========Create terrain from 2nd level================// 
const { blocks } = train(environment.getScene()); //for the funny train

createChildBedroom({
  scene: environment.getScene(),
  THREE: THREE,
  loader: new GLTFLoader(),
  url: './models/stewies_bedroom.glb',
}).then(({ roomGroup, collidables, roomBox }) => {
  console.log('Child bedroom loaded:', roomGroup, collidables, roomBox);

  // Add collidable meshes to environment so player uses them for collisions
  environment.addCollidables(collidables);

  // Expose the room bounding box to environment for clamping player position
  environment.setRoomBounds(roomBox);

  // If player already loaded, set player to room center (slightly above floor)
  const player = environment.getPlayer();
  if (player) {
    const center = roomBox.getCenter(new THREE.Vector3());
    // set player to center horizontally, set Y to room floor + small offset
    player.position.set(center.x, roomBox.min.y + 0.1, center.z);
  }

  // Adjust camera distance so camera starts comfortably inside the room
  playerController.cameraDistance = Math.min(
    playerController.cameraDistance,
    Math.max(3, (roomBox.getSize(new THREE.Vector3()).length() * 0.08))
  );

  //train 
  addTrain({
  scene: environment.getScene(),
  loader: new GLTFLoader(),
  makeCollidable: true
}).then(({ trainGroup }) => {
  console.log('Train added:', trainGroup);
});

  // --- ADD MIRROR HERE ---
  addMirror({
    scene: environment.getScene(),
    THREE: THREE,
    loader: new GLTFLoader(),
    url: './models/mirror_a.glb'
  })
  .then(({ m }) => {
    console.log('Mirror added:', m);
    // if the mirror needs to be collidable:
    environment.addCollidables([m]);
  })
  .catch((err) => {
    console.error('Error loading mirror:', err);
  });
  // --- END ADD MIRROR ---

})
.catch((error) => {
  console.error('Error loading child bedroom:', error);
});

// ====================================================//

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
  const delta = clock.getDelta();
  
  environment.update(delta);
  playerController.update(delta);
  //updateTrain(delta); //aslo for the funny train

  
  renderer.render(environment.getScene(), camera);
  renderer.setAnimationLoop(animate);
}

animate();