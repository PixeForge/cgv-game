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
import { train, createWall } from "../2nd level/terrain.js";

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

    // Load bedroom
    const { blocks } = train(this.currentEnvironment.getScene());
    //blocks.position.set(1, 0, 4.0);

    // Add blocks as collidables
    const blockCollidables = [];
    blocks.traverse((child) => {
      if (child.isMesh && child.visible && child.geometry) {
        blockCollidables.push(child);
      }
    });
    this.currentEnvironment.addCollidables(blockCollidables);

    const { roomGroup, collidables, roomBox } = await createChildBedroom({
      scene: this.currentEnvironment.getScene(),
      THREE: THREE,
      loader: new GLTFLoader(),
      url: "./models/Stewie.glb",
    });

    this.currentEnvironment.addCollidables(collidables);
    this.currentEnvironment.setRoomBounds(roomBox);

    const player = this.currentEnvironment.getPlayer();
    if (player) {
      // Get the room's center and adjust for room position
      const center = roomBox.getCenter(new THREE.Vector3());
      // Place player in the middle of the room, slightly above floor to prevent clipping
      player.position.set(
        center.x, // Center X (left/right)
        roomBox.min.y + 0.5, // Floor level + small offset to prevent clipping
        center.z + 15
      );
    }

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

    // Instead of adding the whole group, add individual mesh collidables
    const trainCollidables = [];
    trainGroup.traverse((child) => {
      // Only add meshes that are visible and have actual geometry
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

    // Add individual mirror mesh collidables
    const mirrorCollidables = [];
    mirrorGroup.traverse((child) => {
      // Only add meshes that are visible and have actual geometry
      if (child.isMesh && child.visible && child.geometry) {
        mirrorCollidables.push(child);
      }
    });
    this.currentEnvironment.addCollidables(mirrorCollidables);

    // Add fourth wall
    const wallColor = new THREE.Color(0x6cceff);
    const wallNearMirror = createWall(
      32,
      35,
      0.2,
      20,
      1.5,
      6.5,
      null,
      "2nd level/Textures/20251015_2213_Blue Solar System Texture_simple_compose_01k7mr2ssafgj912vz5pqzw3kd.png"
    );
    this.currentEnvironment.getScene().add(wallNearMirror);
    this.currentEnvironment.addCollidables([wallNearMirror]);

    console.log("Level 2 (Bedroom) loaded");
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

  getCurrentEnvironment() {
    return this.currentEnvironment;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }
}
