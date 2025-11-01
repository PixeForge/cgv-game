// main.js
import * as THREE from 'three';
import { Level1Environment } from "./1st level/core/level1Environment.js"
import { PlayerController1 } from "./1st level/entities/playerController1.js"
import { Environment as ClocktowerEnv } from './3rd level/clocktower.js';
import { LevelManager } from './js/levelManager.js';
import { PlayerController3 } from './3rd level/playerController3.js';
import { PlayerController } from './js/playerController.js';
import { Environment as ClocktowerEnv } from './3rd level/clocktower.js';

class Game {
  constructor() {
    this.currentPlayerController = null;
    this.init();
    this.setupUI();
    this.animate();
  }

  init() {
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Current level state
    this.currentEnvironment = null;
    this.currentLevel = null;

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Listen for level load events from portal (Level 1 -> Level 3)
    window.addEventListener("loadLevel", (e) => {
      const levelNumber = e.detail.level;
      // Redirect level 2 to level 3 (skip bedroom)
      if (levelNumber === 2) {
        this.loadLevel(3);
      } else {
        this.loadLevel(levelNumber);
      }
    });

    // Load Level 1 by default
    this.loadLevel(1);
  }

  async loadLevel(levelNumber) {
    console.log(`Loading Level ${levelNumber}...`);

    // Clean up current level
    if (this.currentEnvironment) {
      const scene = this.currentEnvironment.getScene();
      if (scene) {
        while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
        }
      }

      // Dispose of any UI elements from previous level
      if (this.currentEnvironment.getCompass) {
        const compass = this.currentEnvironment.getCompass();
        if (compass) compass.dispose();
      }
      if (this.currentEnvironment.getCoordinateDisplay) {
        const coordDisplay = this.currentEnvironment.getCoordinateDisplay();
        if (coordDisplay) coordDisplay.dispose();
      }
      if (this.currentEnvironment.getPauseMenu) {
        const pauseMenu = this.currentEnvironment.getPauseMenu();
        if (pauseMenu) pauseMenu.dispose();
      }
      if (this.currentEnvironment.getEnemySystem) {
        const enemySystem = this.currentEnvironment.getEnemySystem();
        if (enemySystem) enemySystem.dispose();
      }
    }

    // Remove old event listeners by recreating player controller
    this.currentPlayerController = null;

    try {
      switch (levelNumber) {
        case 1:
          await this.loadLevel1();
          break;
        case 3:
          await this.loadLevel3();
          break;
        default:
          console.error(`Level ${levelNumber} not implemented`);
          return;
      }

      this.currentLevel = levelNumber;
      console.log(`Level ${levelNumber} loaded successfully!`);
    } catch (error) {
      console.error(`Error loading level ${levelNumber}:`, error);
    }
  }

  async loadLevel1() {
    // Garden/Green Plane Scene
    this.currentEnvironment = new Level1Environment();
    this.currentPlayerController = new PlayerController1(
      this.currentEnvironment, 
      this.camera, 
      this.renderer
    );

    try {
      await this.currentEnvironment.loadTerrainModel("./models/level_1.glb", 0.02);
      console.log("Level 1 terrain loaded");
    } catch (error) {
      console.warn("Terrain model not found, continuing without terrain:", error);
    }

    // Load background music
    try {
      await this.currentEnvironment.loadBackgroundMusic('../1st level/sounds/nature.wav')
      this.currentEnvironment.playBackgroundMusic()
    } catch (error) {
      console.warn("Background music not found, continuing without music:", error)
    }


    // Load player model
    const gltf = await this.currentEnvironment.loadPlayerModel();
    this.currentPlayerController.setupAnimations(gltf);

    // Reset camera distance
    this.currentPlayerController.cameraDistance = 10;

    console.log("Level 1 (Garden) loaded");
  }

  async loadLevel3() {
    // Clocktower Scene
    this.currentEnvironment = new ClocktowerEnv();
    this.currentPlayerController = new PlayerController3(
      this.currentEnvironment, 
      this.camera, 
      this.renderer
    );

    // Load player model
    const gltf = await this.currentEnvironment.loadPlayerModel();
    this.currentPlayerController.setupAnimations(gltf);

    // Reset camera distance
    this.currentPlayerController.cameraDistance = 10;

    // Load soundtrack for level 3
    if (this.currentEnvironment.loadSoundtrack) {
      try {
        await this.currentEnvironment.loadSoundtrack('./3rd level/public/clocktower_soundtrack.mp3');
        this.currentEnvironment.playSoundtrack();
      } catch (error) {
        console.error('Failed to load soundtrack:', error);
      }
    }

    console.log("Level 3 (Clocktower) loaded");
  }

  setupUI() {
    const uiContainer = document.createElement("div");
    uiContainer.id = "level-ui";
    uiContainer.style.position = "absolute";
    uiContainer.style.top = "20px";
    uiContainer.style.left = "20px";
    uiContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
    uiContainer.style.padding = "10px";
    uiContainer.style.borderRadius = "8px";
    uiContainer.style.zIndex = "10";
    uiContainer.style.color = "white";
    uiContainer.style.fontFamily = "sans-serif";

    const title = document.createElement("h3");
    title.textContent = "Select Level:";
    title.style.margin = "0 0 10px 0";
    uiContainer.appendChild(title);

    const levels = [
      { num: 1, name: "Green Plane" },
      { num: 3, name: "Clock Tower" },
    ];

    levels.forEach(({ num, name }) => {
      const button = document.createElement("button");
      button.textContent = `Level ${num}: ${name}`;
      button.style.display = "block";
      button.style.margin = "5px 0";
      button.style.padding = "10px 20px";
      button.style.cursor = "pointer";
      button.style.border = "none";
      button.style.borderRadius = "5px";
      button.style.backgroundColor = "#4CAF50";
      button.style.color = "white";
      button.style.fontSize = "14px";

      button.addEventListener("click", () => {
        this.loadLevel(num);
      });

      uiContainer.appendChild(button);
    });

    // Add controls info
    const controls = document.createElement("div");
    controls.style.color = "white";
    controls.style.marginTop = "20px";
    controls.style.fontSize = "12px";
    controls.innerHTML = `
      <strong>Controls:</strong><br>
      WASD - Move<br>
      Mouse Drag - Rotate Camera<br>
      Mouse Wheel - Zoom<br>
      Space - Jump<br>
      E - Enter Portal (Level 1)<br>
      ESC - Pause (Level 1)
    `;
    uiContainer.appendChild(controls);

    document.body.appendChild(uiContainer);
  }

  showPauseButton() {
    // Remove existing pause button if any
    const existingPause = document.getElementById("pause-ui");
    if (existingPause) {
      existingPause.remove();
    }

    // Create pause button container
    const pauseContainer = document.createElement("div");
    pauseContainer.id = "pause-ui";
    pauseContainer.style.position = "absolute";
    pauseContainer.style.top = "20px";
    pauseContainer.style.right = "20px";
    pauseContainer.style.zIndex = "1000";

    // Pause button
    const pauseButton = document.createElement("button");
    pauseButton.textContent = "⏸ Pause";
    pauseButton.style.padding = "10px 20px";
    pauseButton.style.cursor = "pointer";
    pauseButton.style.border = "none";
    pauseButton.style.borderRadius = "5px";
    pauseButton.style.backgroundColor = "#FF9800";
    pauseButton.style.color = "white";
    pauseButton.style.fontSize = "14px";
    pauseButton.style.fontWeight = "bold";

    let isPaused = false;
    pauseButton.addEventListener("click", () => {
      isPaused = !isPaused;
      
      if (isPaused) {
        pauseButton.textContent = "▶ Resume";
        pauseButton.style.backgroundColor = "#4CAF50";
        this.clock.stop();
        
        // Pause soundtrack if on level 3
        const env = this.levelManager.getCurrentEnvironment();
        if (env && env.pauseSoundtrack) {
          env.pauseSoundtrack();
        }
      } else {
        pauseButton.textContent = "⏸ Pause";
        pauseButton.style.backgroundColor = "#FF9800";
        this.clock.start();
        
        // Resume soundtrack if on level 3
        const env = this.levelManager.getCurrentEnvironment();
        if (env && env.resumeSoundtrack) {
          env.resumeSoundtrack();
        }
      }
    });

    pauseContainer.appendChild(pauseButton);

    // Level selector button
    const levelButton = document.createElement("button");
    levelButton.textContent = "📋 Change Level";
    levelButton.style.padding = "10px 20px";
    levelButton.style.cursor = "pointer";
    levelButton.style.border = "none";
    levelButton.style.borderRadius = "5px";
    levelButton.style.backgroundColor = "#2196F3";
    levelButton.style.color = "white";
    levelButton.style.fontSize = "14px";
    levelButton.style.fontWeight = "bold";
    levelButton.style.marginLeft = "10px";

    levelButton.addEventListener("click", () => {
      // Stop soundtrack if on level 3
      const env = this.levelManager.getCurrentEnvironment();
      if (env && env.stopSoundtrack) {
        env.stopSoundtrack();
      }
      
      // Show level selection UI
      const levelUI = document.getElementById("level-ui");
      if (levelUI) {
        levelUI.style.display = "block";
      }
      
      // Hide pause UI
      pauseContainer.style.display = "none";
    });

    pauseContainer.appendChild(levelButton);

    document.body.appendChild(pauseContainer);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();

    if (this.currentEnvironment && this.currentPlayerController) {
      // Update environment
      environment.update(delta);

      // Update the current player controller (switches based on level)
      if (this.currentPlayerController) {
        this.currentPlayerController.update(delta);
      }

      // Render scene
      this.renderer.render(this.currentEnvironment.getScene(), this.camera);
    }
  }
}

// Start the game when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});