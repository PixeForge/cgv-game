// js/levelManager.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GardenScene } from "../1st level/gardenScene.js";
import { placeModels } from "../1st level/modelPlacer.js";
import { Environment } from "./environment.js";
import { Environment as ClocktowerEnv } from "./Level 3/clocktower.js";
import { createChildBedroom } from "../2nd level/usingmodels.js";
//import { addMirror } from "../2nd level/mirror.js";
import { addTrain } from "../2nd level/train.js";
import { train } from "../2nd level/terrain.js";
import { createWall } from "../2nd level/terrain.js";
import { createReflectorMirror } from "../2nd level/reflectorMirror.js";
import { createAdventureTimer } from "../2nd level/Level2Timer.js";
import { createKey, setupKeyInteraction } from "../2nd level/key.js";
import { MKChaser } from "../2nd level/mkChaser.js";
import { createLevel2Quizzes } from "../2nd level/quiz.js";

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
    this.adventureTimer = null; // Timer for Level 2
  }

  async loadLevel(levelNumber) {
    console.log(`Loading level ${levelNumber}...`);

    // Handle timer visibility based on level
    if (this.adventureTimer) {
      if (levelNumber === 2) {
        // Timer will be shown and started in loadLevel2
      } else {
        // Hide and stop timer for other levels
        this.adventureTimer.stop();
        this.adventureTimer.hide();
      }
    }

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
  
    // Load the main bedroom FIRST to get proper room bounds
    const { roomGroup, collidables, roomBox } = await createChildBedroom({
      scene: this.currentEnvironment.getScene(),
      THREE: THREE,
      loader: new GLTFLoader(),
      url: "./models/Stewie.glb",
    });
  
    // Add bedroom collidables
    this.currentEnvironment.addCollidables(collidables);
    this.currentEnvironment.setRoomBounds(roomBox);
    console.log(`Added ${collidables.length} bedroom collidables`);
  
    // POSITION PLAYER FIRST - before loading blocks and other objects
    const player = this.currentEnvironment.getPlayer();
    if (player) {
      // Get room center and size for proper positioning
      const roomCenter = new THREE.Vector3();
      roomBox.getCenter(roomCenter);
      const roomSize = new THREE.Vector3();
      roomBox.getSize(roomSize);
      
      // Position player safely inside the bedroom
      // Use fixed coordinates that are known to be inside the bedroom
      player.position.set(
        roomCenter.x - 5,  // Move left from center
        roomBox.min.y + 1.0, // Start above floor
        roomCenter.z + 25   // Move toward camera from center
      );
      
      console.log('Player positioned at:', player.position);
      console.log('Room bounds:', {
        min: `(${roomBox.min.x.toFixed(2)}, ${roomBox.min.y.toFixed(2)}, ${roomBox.min.z.toFixed(2)})`,
        max: `(${roomBox.max.x.toFixed(2)}, ${roomBox.max.y.toFixed(2)}, ${roomBox.max.z.toFixed(2)})`,
        center: `(${roomCenter.x.toFixed(2)}, ${roomCenter.y.toFixed(2)}, ${roomCenter.z.toFixed(2)})`
      });
    }

    // ADD KEY TO THE SCENE - FIXED POSITION
    try {
      console.log('Loading key...');
      const keyResult = await createKey(
        this.currentEnvironment.getScene(),
        new GLTFLoader(),
        { x: 0, y: 2, z: 0 } // Try a more visible position first
      );
      
      this.level2Key = keyResult.keyObject;
      
      // Set up key interaction
      this.keyInteraction = setupKeyInteraction(
        this.level2Key,
        player,
        () => this.onKeyCollected()
      );
      
      console.log('✅ Key successfully added to Level 2 at position:', this.level2Key.position);
    } catch (error) {
      console.error('❌ Could not load key model:', error);
    }
  
    // NOW load bedroom terrain and get blocks (after player is positioned)
    const terrainData = train(
      this.currentEnvironment.getScene(),
      this.camera,
      this.currentEnvironment.getPlayer(),
      this.renderer
    );

    // ADD KEY TO THE SCENE
    try {
      const keyResult = await createKey(
        this.currentEnvironment.getScene(),
        new GLTFLoader(),
        { x: 20, y: 3, z: -15 } // Position the key - adjust as needed
      );
      
      this.level2Key = keyResult.keyObject;
      
      // Set up key interaction
      this.keyInteraction = setupKeyInteraction(
        this.level2Key,
        player,
        () => this.onKeyCollected() // Callback when key is collected
      );
      
      console.log('Key added to Level 2');
    } catch (error) {
      console.warn('Could not load key model:', error);
    }
  
    // Store blocks reference for updates
    this.level2Blocks = terrainData.blocks;
  
    // DEBUG: Check what we're getting from terrain data
    console.log('Terrain data received:', terrainData);
    console.log('Blocks array:', this.level2Blocks);
    console.log('Blocks count:', this.level2Blocks?.length);
  
    // FIXED: Add blocks as collidables with proper identification
    if (this.level2Blocks && Array.isArray(this.level2Blocks)) {
      // First, mark all blocks with identification flags
      this.level2Blocks.forEach(block => {
        if (!block.userData) block.userData = {};
        block.userData.isBlock = true;
        block.userData.isMovingToyBlock = true;
        block.userData.collidable = true;
      });
  
      // Clear any previous blocks to avoid duplicates
      const currentCollidables = this.currentEnvironment.getCollidables();
      const nonBlockCollidables = currentCollidables.filter(obj => !obj.userData?.isBlock);
      this.currentEnvironment.collidables = nonBlockCollidables;
      
      // Add all blocks to collidables
      this.currentEnvironment.addCollidables(this.level2Blocks);
      console.log(`Successfully added ${this.level2Blocks.length} blocks as collidables`);
    }
  
    // Add wall as collidable if it exists
    if (terrainData.wall) {
      if (!terrainData.wall.userData) terrainData.wall.userData = {};
      terrainData.wall.userData.isWall = true;
      terrainData.wall.userData.collidable = true;
      this.currentEnvironment.addCollidables([terrainData.wall]);
      console.log('Added wall as collidable');
    }
  
    // Attach the update function to environment
    if (terrainData.update) {
      this.currentEnvironment.updateBlocks = terrainData.update;
      console.log('Block update function attached to environment');
    }
  
    // Set camera distance
    this.playerController.cameraDistance = Math.min(
      this.playerController.cameraDistance,
      Math.max(3, roomBox.getSize(new THREE.Vector3()).length() * 0.08)
    );
  
    // Add train
    try {
      const { trainGroup, collidables: trainCollidables } = await addTrain({
        scene: this.currentEnvironment.getScene(),
        loader: new GLTFLoader(),
        makeCollidable: true,
      });
  
      // Add train collidables
      if (trainCollidables && trainCollidables.length > 0) {
        this.currentEnvironment.addCollidables(trainCollidables);
        console.log(`Added ${trainCollidables.length} train collidables from returned array`);
      } else {
        // Fallback: traverse the train group to find collidables
        const fallbackTrainCollidables = [];
        trainGroup.traverse((child) => {
          if (child.isMesh && child.visible && child.geometry) {
            if (!child.userData) child.userData = {};
            child.userData.isTrain = true;
            child.userData.collidable = true;
            fallbackTrainCollidables.push(child);
          }
        });
        this.currentEnvironment.addCollidables(fallbackTrainCollidables);
        console.log(`Added ${fallbackTrainCollidables.length} train collidables from traversal`);
      }
    } catch (error) {
      console.warn('Failed to load train:', error);
    }
  
    // Add reflective mirror using Reflector class
    try {
      const reflectorMirror = createReflectorMirror({
        scene: this.currentEnvironment.getScene(),
        width: 3,
        height: 8,
        position: { x: 20, y: 5, z: 6.2 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        textureWidth: 512,
        textureHeight: 512,
        color: 0xcccccc,
        addFrame: true,
        frameThickness: 0.3,
        frameColor: 0x8B4513
      });
      console.log('Reflector mirror added successfully');
    } catch (error) {
      console.warn('Failed to create reflector mirror:', error);
    }

    // --- Initialize Level 2 Quizzes ---
    try {
      this.level2Quizzes = createLevel2Quizzes({
        scene: this.currentEnvironment.getScene(),
        player: this.currentEnvironment.getPlayer(),
        camera: this.camera
      });

      // Define first quiz zone: by the mirror by the wall
      this.level2Quizzes.addZone({
        id: 'quiz-mirror',
        position: { x: 20, y: 0, z: 6.2 },
        radius: 3.5,
        quizIndex: 0
      });

      // Disable blocks’ P interaction while quizzes are active
      window.LEVEL2_DISABLE_BLOCK_PUSH = true;
      console.log('Level 2 quizzes initialized');
    } catch (e) {
      console.warn('Failed to initialize Level 2 quizzes:', e);
    }

    // --- Add MK enemy that chases the player ---
    // In loadLevel2 method - ensure MKChaser is properly set up
    // In loadLevel2 method - ensure MKChaser is properly set up
    try {
      this.mkChaser = new MKChaser(
        this.currentEnvironment.getScene(),
        this.currentEnvironment.getPlayer(),
        this.currentEnvironment.getRoomBounds(),
        this.currentEnvironment
      );
      
      // Add the enemy model to collidables if needed
      if (this.mkChaser.model) {
        this.mkChaser.model.traverse((child) => {
          if (child.isMesh) {
            if (!child.userData) child.userData = {};
            child.userData.isEnemy = true;
            child.userData.collidable = true;
          }
        });
      }
      
      console.log("MK chaser initialized in Level 2");
    } catch (err) {
      console.error("Failed to initialize MK chaser:", err);
    }

  
    // Create and start the adventure timer for Level 2
    if (!this.adventureTimer) {
      this.adventureTimer = createAdventureTimer();
    }
    this.adventureTimer.reset();
    this.adventureTimer.show();
    this.adventureTimer.start();
  
    // Final verification
    console.log("=== LEVEL 2 LOAD COMPLETE ===");
    console.log("Level 2 (Bedroom) loaded with:", {
      blocks: this.level2Blocks?.length || 0,
      totalCollidables: this.currentEnvironment.getCollidables().length,
      blocksInCollidables: this.currentEnvironment.getCollidables().filter(obj => obj.userData?.isBlock).length,
      hasUpdateFunction: !!this.currentEnvironment.updateBlocks,
      playerPosition: player ? `(${player.position.x.toFixed(2)}, ${player.position.y.toFixed(2)}, ${player.position.z.toFixed(2)})` : 'No player'
    });
  
    return true;
  }

  // In LevelManager class - add this method
  checkMKCollisions() {
    if (!this.mkChaser || !this.mkChaser.model || !this.currentEnvironment) return;
    
    const player = this.currentEnvironment.getPlayer();
    if (!player) return;
    
    const mkPos = this.mkChaser.model.position;
    const playerPos = player.position;
    const distance = mkPos.distanceTo(playerPos);
    
    // Only damage player if enemy is attacking and close enough
    if (this.mkChaser.isAttacking && distance < 2.0) {
      // Add your player damage logic here
      console.log("MK attacks player! Distance:", distance);
      
      // Example damage system - you'll need to implement this based on your player health system
      if (player.takeDamage) {
        player.takeDamage(1);
      }
      
      // Optional: Add visual/audio feedback
      this.createDamageFeedback();
    }
  }

  createDamageFeedback() {
    // Add screen flash, sound, or other feedback when player takes damage
    console.log("Player takes damage!");
    
    // Example: Screen flash effect
    document.body.style.backgroundColor = 'red';
    setTimeout(() => {
      document.body.style.backgroundColor = '';
    }, 100);
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

      // Update MK chaser if it exists
      if (this.mkChaser) {
        this.mkChaser.update(delta);
      }

      // Add collision detection for MK enemy
      this.checkMKCollisions();

      // Update quizzes (no-op for now, kept for future timers)
      if (this.level2Quizzes && this.level2Quizzes.update) {
        this.level2Quizzes.update(delta, elapsedTime);
      }
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