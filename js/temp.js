// environment.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class Environment {
  constructor() {
    this.scene = new THREE.Scene();
    this.collidables = [];
    this.player = null;
    this.mixer = null;
    this.roomBounds = null; // THREE.Box3
    this.init();
  }

  init() {
    // Scene background color
    this.scene.background = new THREE.Color(0xaec6cf);

    // Lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7.5);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    // NOTE: removed the brown ground mesh here so the room's floor (from GLB)
    // is used instead. If you want a global ground, re-add it or ensure
    // your model includes an internal floor.
    // this.createObstacles();
  }

  addCollidables(collidables = []) {
    // Accept array of THREE.Object3D (meshes)
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
        "./models/AJ.glb",
        (gltf) => {
          this.player = gltf.scene;
          this.player.scale.set(1, 1, 1);
          // We'll set the player position later (after room loads) if needed.
          this.player.position.set(0, 0, 0);
          this.player.name = "player";
          this.scene.add(this.player);

          // Animation mixer
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
