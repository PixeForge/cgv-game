// js/levelManager.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GardenScene } from "../1st level/gardenScene.js";
import { placeModels } from "../1st level/modelPlacer.js";
import { Environment } from "./environment.js";
import { Environment as ClocktowerEnv } from "./level 3/clocktower.js";
import { createChildBedroom } from "../2nd level/usingmodels.js";
import { addMirror } from "../2nd level/mirror.js";
import { addTrain } from "../2nd level/train.js";
import { train } from "../2nd level/terrain.js";
import { createWall } from "../2nd level/terrain.js";

export class LevelManager {
  constructor(renderer, camera, playerController) {
    this.renderer = renderer;
    this.camera = camera;
    this.playerController = playerController;
    this.currentLevel = null;
    this.currentEnvironment = null;
    this.levels = {
      1: "Garden (Level 1)",
      2: "Bedroom (Level 2)",
      3: "Clocktower (Level 3)",
    };
    this.level2Blocks = null; // Store reference to blocks for updates
  }

  async loadLevel(levelNumber) {
    console.log(`Loading level ${levelNumber}...`);

    // Clean up current level
    if (this.currentEnvironment) {
      const scene = this.currentEnvironment.getScene();
      if (scene) {
        // Remove all objects from scene
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
      }
      this.level2Blocks = null; // Clear blocks reference
    }

    // Create new environment based on level
    switch (levelNumber) {
      case 1:
        await this.loadLevel1();
        break;
      case 2:
        await this.loadLevel2();
        break;
      case 3:
        await this.loadLevel3();
        break;
      default:
        console.error("Invalid level number");
        return;
    }

    this.currentLevel = levelNumber;
    console.log(`Level ${levelNumber} loaded successfully`);
  }

  async loadLevel1() {
    // Garden Scene
    this.currentEnvironment = new GardenScene();
    this.playerController.environment = this.currentEnvironment;

    // Load player
    const gltf = await this.currentEnvironment.loadPlayerModel();
    this.playerController.setupAnimations(gltf);

    // Place all models (including trees) in the garden
    await placeModels(this.currentEnvironment);

    // Reset camera
    this.playerController.cameraDistance = 10;

    console.log("Level 1 (Garden) loaded");
  }

  async loadLevel2() {
    // Bedroom Scene
    this.currentEnvironment = new Environment();
    this.playerController.environment = this.currentEnvironment;

    // Load player
    const gltf = await this.currentEnvironment.loadPlayerModel();
    this.playerController.setupAnimations(gltf);

    // Load bedroom terrain and get blocks
    const terrainData = train(
      this.currentEnvironment.getScene(),
      this.camera,
      this.currentEnvironment.getPlayer(),
      this.renderer
    );

    // Store blocks reference for updates
    this.level2Blocks = terrainData.blocks;

    // Add blocks as collidables - FIXED APPROACH
    if (this.level2Blocks && Array.isArray(this.level2Blocks)) {
      // Add each block individually as a collidable
      this.level2Blocks.forEach(block => {
        this.currentEnvironment.addCollidables([block]);
      });
      console.log(`Added ${this.level2Blocks.length} blocks as collidables`);
    }

    // Add wall as collidable
    if (terrainData.wall) {
      this.currentEnvironment.addCollidables([terrainData.wall]);
    }

    // Attach the update function to environment
    if (terrainData.update) {
      this.currentEnvironment.updateBlocks = terrainData.update;
    }

    // Load the main bedroom
    const { roomGroup, collidables, roomBox } = await createChildBedroom({
      scene: this.currentEnvironment.getScene(),
      THREE: THREE,
      loader: new GLTFLoader(),
      url: "./models/Stewie.glb",
    });

    // Add bedroom collidables
    this.currentEnvironment.addCollidables(collidables);
    this.currentEnvironment.setRoomBounds(roomBox);

    // Position player
    const player = this.currentEnvironment.getPlayer();
    if (player) {
      const center = roomBox.getCenter(new THREE.Vector3());
      player.position.set(
        center.x,
        roomBox.min.y + 0.5,
        center.z + 15
      );
    }

    // Set camera distance
    this.playerController.cameraDistance = Math.min(
      this.playerController.cameraDistance,
      Math.max(3, roomBox.getSize(new THREE.Vector3()).length() * 0.08)
    );

    // Add train
    const { trainGroup } = await addTrain({
      scene: this.currentEnvironment.getScene(),
      loader: new GLTFLoader(),
      makeCollidable: true,
    });

    // Add train collidables
    const trainCollidables = [];
    trainGroup.traverse((child) => {
      if (child.isMesh && child.visible && child.geometry) {
        trainCollidables.push(child);
      }
    });
    this.currentEnvironment.addCollidables(trainCollidables);

    // Add mirror
    const { mirrorGroup } = await addMirror({
      scene: this.currentEnvironment.getScene(),
      loader: new GLTFLoader(),
      url: "./models/mirror_a.glb",
    });

    // Add mirror collidables
    const mirrorCollidables = [];
    mirrorGroup.traverse((child) => {
      if (child.isMesh && child.visible && child.geometry) {
        mirrorCollidables.push(child);
      }
    });
    this.currentEnvironment.addCollidables(mirrorCollidables);

    console.log("Level 2 (Bedroom) loaded with block collision support");
  }

  async loadLevel3() {
    // Clocktower Scene
    this.currentEnvironment = new ClocktowerEnv();
    this.playerController.environment = this.currentEnvironment;

    // Load player
    const gltf = await this.currentEnvironment.loadPlayerModel();
    this.playerController.setupAnimations(gltf);

    // Reset camera
    this.playerController.cameraDistance = 10;

    console.log("Level 3 (Clocktower) loaded");
  }

  // Add this method to update blocks in the animation loop
  update(delta, elapsedTime) {
    if (this.currentLevel === 2 && this.currentEnvironment && this.currentEnvironment.updateBlocks) {
      this.currentEnvironment.updateBlocks(delta, elapsedTime);
    }
  }

  getCurrentEnvironment() {
    return this.currentEnvironment;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  // Helper method to get blocks for debugging
  getBlocks() {
    return this.level2Blocks;
  }
}