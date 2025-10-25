// main.js
import * as THREE from "three";
import { PlayerController } from "./js/playerController.js";
import { LevelManager } from "./js/levelManager.js";
import { createPauseMenu } from "./2nd level/pauseMenu.js";

class Game {
  constructor() {
    this.clock = new THREE.Clock();
    this.camera = null;
    this.renderer = null;
    this.playerController = null;
    this.levelManager = null;
    this.pauseMenu = null;

    this.init();
  }

  init() {
    // Setup renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Setup camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Create player controller (will be initialized with environment later)
    this.playerController = new PlayerController(
      null,
      this.camera,
      this.renderer
    );

    // Create level manager
    this.levelManager = new LevelManager(
      this.renderer,
      this.camera,
      this.playerController
    );

    // Setup UI
    this.setupUI();

    // Initialize pause menu
    this.pauseMenu = createPauseMenu();
    
    // Optional: Stop clock when paused, resume when unpaused
    this.pauseMenu.onPause(() => {
      this.clock.stop();
    });
    this.pauseMenu.onResume(() => {
      this.clock.start();
    });

    // Load initial level
    this.loadInitialLevel();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  async loadInitialLevel() {
    try {
      await this.levelManager.loadLevel(1); // Start with Level 1 (Garden with trees)
      console.log("Initial level loaded");
    } catch (error) {
      console.error("Error loading initial level:", error);
    }
  }

  setupUI() {
    // Create level selector UI
    const uiContainer = document.createElement("div");
    uiContainer.style.position = "fixed";
    uiContainer.style.top = "20px";
    uiContainer.style.left = "20px";
    uiContainer.style.zIndex = "1000";
    uiContainer.style.fontFamily = "Arial, sans-serif";

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
          await this.levelManager.loadLevel(i);
        } catch (error) {
          console.error(`Error loading level ${i}:`, error);
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
      C - Toggle First/Third Person<br>
      O - Pause/Resume<br>
      P - Push Blocks (Level 2)
    `;
    uiContainer.appendChild(controls);

    document.body.appendChild(uiContainer);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // In main.js - fix the animate method
animate() {
  requestAnimationFrame(() => this.animate());

  const environment = this.levelManager.getCurrentEnvironment();

  // Always render scene, but skip updates if paused
  if (environment) {
    // Only update game logic if not paused
    if (!this.pauseMenu || !this.pauseMenu.isPaused()) {
      const delta = this.clock.getDelta();
      const elapsedTime = this.clock.getElapsedTime();

      // --- CRITICAL FIX: Only update blocks ONCE per frame ---
      // Remove the environment.updateBlocks call here since it's already called in PlayerController
      
      // Update environment
      if (environment.update && typeof environment.update === 'function') {
        environment.update(delta);
      }

      // Update player controller (this includes block updates)
      if (this.playerController) {
        this.playerController.update(delta, elapsedTime);
      }
    }

    // Render scene (even when paused to show the scene)
    this.renderer.render(environment.getScene(), this.camera);
  }
}
}

// Start the game when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});