// main.js
import * as THREE from 'three';
import { LevelManager } from './js/levelManager.js';
import { PlayerController3 } from './3rd level/playerController3.js';

class Game {
  constructor() {
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

    // Initialize player controller
    
    this.playerController = new PlayerController3(null, this.camera, this.renderer);

    // Initialize level manager
    this.levelManager = new LevelManager(this.renderer, this.camera, this.playerController);

    // Clock for delta time
    this.clock = new THREE.Clock();

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());
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
          
          // Load the level
          await this.levelManager.loadLevel(i);
          
          // Load soundtrack for level 3
          if (i === 3) {
            const env = this.levelManager.getCurrentEnvironment();
            if (env && env.loadSoundtrack) {
              await env.loadSoundtrack('./3rd level/public/clocktower_soundtrack.mp3');
              env.playSoundtrack();
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
      Space - Jump
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
    const environment = this.levelManager.getCurrentEnvironment();

    if (environment) {
      // Update environment
      environment.update(delta);

      // Update player controller
      if (this.playerController) {
        this.playerController.update(delta);
      }

      // Render scene
      this.renderer.render(environment.getScene(), this.camera);
    }
  }
}

// Start the game when DOM is ready
window.addEventListener("DOMContentLoaded", () => {
  new Game();
});