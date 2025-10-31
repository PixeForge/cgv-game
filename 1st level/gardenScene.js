// level1/gardenScene.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class GardenScene {
  constructor() {
    this.scene = new THREE.Scene();
    this.collidables = [];
    this.player = null;
    this.mixer = null;
    this.roomBounds = null;
    this.models = []; // Store loaded models for easy management
    this.init();
  }

  init() {
    // Sky blue background
    this.scene.background = new THREE.Color(0x87CEEB);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d7c6b, 1.0);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    this.scene.add(dirLight);

    // Create terrain/ground
    this.createTerrain();
    
    // Set room bounds for a large outdoor area
    this.roomBounds = new THREE.Box3(
      new THREE.Vector3(-40, 0, -40),
      new THREE.Vector3(40, 20, 40)
    );
  }

  createTerrain() {
    // Large grass ground plane
    const groundSize = 80;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x3a7d44, // grass green
      roughness: 0.9 
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    ground.name = 'ground';
    this.scene.add(ground);
    this.collidables.push(ground);
  }

  // Method to add a model to the scene
  async addModel({
    url,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 },
    scale = 1,
    makeCollidable = true,
    name = null
  }) {
    const loader = new GLTFLoader();
    
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => {
          const model = gltf.scene;
          
          // Apply transformations
          model.position.set(position.x, position.y, position.z);
          model.rotation.set(rotation.x, rotation.y, rotation.z);
          model.scale.set(scale, scale, scale);
          
          if (name) model.name = name;
          
          // Enable shadows
          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Add to collidables if requested
              if (makeCollidable) {
                this.collidables.push(child);
              }
            }
          });
          
          this.scene.add(model);
          this.models.push(model);
          
          console.log(`Model loaded: ${name || url}`);
          resolve({ model, gltf });
        },
        undefined,
        (error) => {
          console.error(`Error loading model ${url}:`, error);
          reject(error);
        }
      );
    });
  }

  // Remove a model from the scene
  removeModel(model) {
    const index = this.models.indexOf(model);
    if (index > -1) {
      this.models.splice(index, 1);
      this.scene.remove(model);
      
      // Remove from collidables
      model.traverse((child) => {
        const collIndex = this.collidables.indexOf(child);
        if (collIndex > -1) {
          this.collidables.splice(collIndex, 1);
        }
      });
    }
  }

  addCollidables(collidables = []) {
    for (const c of collidables) {
      if (c && !this.collidables.includes(c)) this.collidables.push(c);
    }
  }

  setRoomBounds(box3) {
    if (box3 && box3.isBox3) this.roomBounds = box3.clone();
  }

  getRoomBounds() {
    return this.roomBounds;
  }

  loadPlayerModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load(
        './models/AJ.glb',
        (gltf) => {
          this.player = gltf.scene;
          this.player.scale.set(1, 1, 1);
          this.player.position.set(0, 0, 0);
          this.player.name = 'player';
          this.scene.add(this.player);

          this.mixer = new THREE.AnimationMixer(this.player);
          resolve(gltf);
        },
        undefined,
        (error) => {
          reject(error);
        }
      );
    });
  }

  getCollidables() {
    return this.collidables;
  }

  getScene() {
    return this.scene;
  }

  getPlayer() {
    return this.player;
  }

  getMixer() {
    return this.mixer;
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta);
    }
  }
}