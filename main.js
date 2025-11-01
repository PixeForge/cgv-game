// main.js
import * as THREE from "three";
import { LevelManager } from "./js/levelManager.js";
import { PlayerController3 } from "./3rd level/playerController3.js";
import { PlayerController } from "./js/playerController.js";
import { Environment as ClocktowerEnv } from "./3rd level/clocktower.js";
import { Level2PlayerController } from "./2nd level/Level2PlayerController.js";
import { createPauseMenu } from "./2nd level/pauseMenu.js";

class Game {
  constructor() {
    this.clock = new THREE.Clock();
    this.camera = null;
    this.renderer = null;
    this.currentPlayerController = null;
    this.Level2PlayerController = null;
    this.levelManager = null;
    this.pauseMenu = null;
    this.isPaused = false;
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

    // Start with regular player controller (will be swapped per level)
    this.currentPlayerController = new PlayerController(null, this.camera, this.renderer);

    // Create Level2PlayerController for Level 2
    this.Level2PlayerController = new Level2PlayerController(
      null,
      this.camera,
      this.renderer
    );

    // Initialize level manager - start with currentPlayerController
    this.levelManager = new LevelManager(this.renderer, this.camera, this.currentPlayerController);

    // Initialize pause menu (only active in Level 2)
    this.pauseMenu = createPauseMenu({
      isEnabled: () => this.levelManager?.getCurrentLevel?.() === 2
    });
    
    // Handle pause state properly
    if (this.pauseMenu) {
      this.pauseMenu.onPause(() => {
        this.isPaused = true;
        this.clock.stop(); // Stop the clock to freeze delta time
      });
      
      this.pauseMenu.onResume(() => {
        this.isPaused = false;
        this.clock.start(); // Restart the clock
        // Reset the clock to avoid large delta values after pause
        this.clock.getDelta();
      });
    }

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Handle visibility change (tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clock.stop();
      } else {
        this.clock.start();
        this.clock.getDelta(); // Reset delta
      }
    });
  }

  setupUI() {
    // Create UI container for level selection
    const uiContainer = document.createElement("div");
    uiContainer.id = "level-ui";
    uiContainer.style.position = "absolute";
    uiContainer.style.top = "20px";
    uiContainer.style.left = "20px";
    uiContainer.style.zIndex = "1000";
    uiContainer.style.padding = "20px";
    uiContainer.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    uiContainer.style.borderRadius = "10px";

    const title = document.createElement("h3");
    title.textContent = "Select Level:";
    title.style.color = "white";
    title.style.margin = "0 0 10px 0";
    uiContainer.appendChild(title);

    // Create buttons for each level
    for (let i = 1; i <= 3; i++) {
      const button = document.createElement("button");
      button.textContent = `Level ${i}`;
      button.style.display = "block";
      button.style.margin = "5px 0";
      button.style.padding = "10px 20px";
      button.style.cursor = "pointer";
      button.style.border = "none";
      button.style.borderRadius = "5px";
      button.style.backgroundColor = "#4CAF50";
      button.style.color = "white";
      button.style.fontSize = "14px";

      button.addEventListener("click", async () => {
        try {
          // Hide level selection UI
          uiContainer.style.display = "none";
          
          // Switch player controller based on level
          if (i === 3) {
            // Use PlayerController3 for level 3
            this.currentPlayerController = new PlayerController3(null, this.camera, this.renderer);
            this.levelManager.playerController = this.currentPlayerController;
          } else {
            // Use regular PlayerController for levels 1 and 2
            this.currentPlayerController = new PlayerController(null, this.camera, this.renderer);
            this.levelManager.playerController = this.currentPlayerController;
          }
          
          // Load the level
          await this.levelManager.loadLevel(i);
          
          // Load soundtrack for level 3
          if (i === 3) {
            const env = this.levelManager.getCurrentEnvironment();
            if (env && env.loadSoundtrack) {
              try {
                await env.loadSoundtrack('./3rd level/public/clocktower_soundtrack.mp3');
                env.playSoundtrack();
              } catch (error) {
                console.error('Failed to load soundtrack:', error);
              }
            }
          }
          
          // Show pause button
          this.showPauseButton();
        } catch (error) {
          console.error(`Error loading level ${i}:`, error);
          uiContainer.style.display = "block"; // Show UI again on error
        }
      });

      uiContainer.appendChild(button);
    }

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
      C - Toggle First/Third Person (Level 2)<br>
      O - Pause/Resume (Level 2)<br>
      I - Interact/Quiz (Level 2)<br>
      P - Push Blocks (Level 2)
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

    const environment = this.levelManager.getCurrentEnvironment();

    if (environment) {
      const quizActive = !!window.LEVEL2_QUIZ_ACTIVE;
      // Get delta time - if paused or quiz active, use 0 to freeze animations
      const delta = (this.isPaused || quizActive) ? 0 : this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      // Only update game logic if not paused and no quiz active
      if (!this.isPaused && !quizActive) {
        // Update level manager (this handles block updates)
        if (this.levelManager.update) {
          this.levelManager.update(delta, elapsedTime);
        }

        // Update environment
        if (environment.update) {
          environment.update(delta);
        }

        // Update the current player controller (switches based on level)
        if (this.currentPlayerController) {
          this.currentPlayerController.update(delta);
        }

        // Update Level 2 player controller if active
        if (this.Level2PlayerController && this.levelManager.getCurrentLevel() === 2) {
          this.Level2PlayerController.update(delta, elapsedTime);
        }

        // Update MKChaser (animations will use delta=0 when paused)
        if (this.levelManager.mkChaser) {
          this.levelManager.mkChaser.update();
        }
      } else {
        // When paused, we still need to update animations with delta=0
        // This keeps them in their current state without progressing
        if (this.levelManager.mkChaser && this.levelManager.mkChaser.mixer) {
          this.levelManager.mkChaser.mixer.update(0);
        }
        
        // Also update player animations with delta=0 when paused
        if (this.Level2PlayerController && this.Level2PlayerController.mixer) {
          this.Level2PlayerController.mixer.update(0);
        }
        if (this.currentPlayerController && this.currentPlayerController.mixer) {
          this.currentPlayerController.mixer.update(0);
        }
      }

      // Always render scene (even when paused)
      this.renderer.render(environment.getScene(), this.camera);
    }
  }
}

// Start the game when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});