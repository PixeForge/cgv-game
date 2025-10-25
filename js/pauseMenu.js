// js/pauseMenu.js - Adventurous Pause Menu

export function createPauseMenu() {
  let isPaused = false;
  let onPauseCallback = null;
  let onResumeCallback = null;

  // Create the pause menu overlay
  const pauseOverlay = document.createElement("div");
  pauseOverlay.id = "pause-menu-overlay";
  pauseOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(20, 30, 48, 0.95) 0%, rgba(36, 59, 85, 0.95) 100%);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(10px);
    animation: fadeIn 0.3s ease-in-out;
  `;

  // Create the menu container
  const menuContainer = document.createElement("div");
  menuContainer.style.cssText = `
    background: linear-gradient(145deg, #1a2332 0%, #2d4059 100%);
    border: 3px solid #d4af37;
    border-radius: 20px;
    padding: 40px 60px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7), inset 0 0 30px rgba(212, 175, 55, 0.1);
    text-align: center;
    max-width: 500px;
    position: relative;
    animation: slideIn 0.4s ease-out;
  `;

  // Add decorative corners
  const cornerStyle = `
    position: absolute;
    width: 30px;
    height: 30px;
    border: 3px solid #d4af37;
  `;
  
  const topLeftCorner = document.createElement("div");
  topLeftCorner.style.cssText = cornerStyle + "top: -3px; left: -3px; border-right: none; border-bottom: none;";
  
  const topRightCorner = document.createElement("div");
  topRightCorner.style.cssText = cornerStyle + "top: -3px; right: -3px; border-left: none; border-bottom: none;";
  
  const bottomLeftCorner = document.createElement("div");
  bottomLeftCorner.style.cssText = cornerStyle + "bottom: -3px; left: -3px; border-right: none; border-top: none;";
  
  const bottomRightCorner = document.createElement("div");
  bottomRightCorner.style.cssText = cornerStyle + "bottom: -3px; right: -3px; border-left: none; border-top: none;";

  menuContainer.appendChild(topLeftCorner);
  menuContainer.appendChild(topRightCorner);
  menuContainer.appendChild(bottomLeftCorner);
  menuContainer.appendChild(bottomRightCorner);

  // Create title
  const title = document.createElement("h1");
  title.innerText = "⚔️ PAUSED ⚔️";
  title.style.cssText = `
    color: #d4af37;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 48px;
    margin: 0 0 30px 0;
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.5);
    letter-spacing: 4px;
    font-weight: bold;
  `;

  // Create instruction text
  const instruction = document.createElement("p");
  instruction.innerText = "Press 'O' to Resume Your Adventure";
  instruction.style.cssText = `
    color: #e8d4a0;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 20px;
    margin: 20px 0;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    letter-spacing: 1px;
  `;

  // Create decorative divider
  const divider = document.createElement("div");
  divider.style.cssText = `
    width: 80%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #d4af37, transparent);
    margin: 20px auto;
  `;

  // Create tips section
  const tipsContainer = document.createElement("div");
  tipsContainer.style.cssText = `
    margin-top: 30px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    border: 1px solid rgba(212, 175, 55, 0.3);
  `;

  const tipsTitle = document.createElement("p");
  tipsTitle.innerText = "🗺️ Adventurer's Tips";
  tipsTitle.style.cssText = `
    color: #d4af37;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 18px;
    margin: 0 0 15px 0;
    font-weight: bold;
  `;

  const tips = document.createElement("p");
  tips.innerHTML = `
    <span style="display: block; margin: 8px 0; color: #c9b88a; font-family: 'Georgia', serif; font-size: 14px;">
      🎮 Use WASD to move through the realm
    </span>
    <span style="display: block; margin: 8px 0; color: #c9b88a; font-family: 'Georgia', serif; font-size: 14px;">
      🔍 Explore every corner for secrets
    </span>
    <span style="display: block; margin: 8px 0; color: #c9b88a; font-family: 'Georgia', serif; font-size: 14px;">
      ⚡ Press 'O' anytime to pause your quest
    </span>
  `;

  tipsContainer.appendChild(tipsTitle);
  tipsContainer.appendChild(tips);

  // Assemble the menu
  menuContainer.appendChild(title);
  menuContainer.appendChild(instruction);
  menuContainer.appendChild(divider);
  menuContainer.appendChild(tipsContainer);
  pauseOverlay.appendChild(menuContainer);
  document.body.appendChild(pauseOverlay);

  // Add CSS animations
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideIn {
      from {
        transform: translateY(-50px) scale(0.9);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }

    #pause-menu-overlay h1 {
      animation: glow 2s ease-in-out infinite alternate;
    }

    @keyframes glow {
      from {
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.5);
      }
      to {
        text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8), 0 0 30px rgba(212, 175, 55, 0.8), 0 0 40px rgba(212, 175, 55, 0.6);
      }
    }
  `;
  document.head.appendChild(style);

  // Key listener for toggling pause
  function handleKeyPress(event) {
    if (event.key.toLowerCase() === "o") {
      togglePause();
    }
  }

  window.addEventListener("keydown", handleKeyPress);

  // Toggle pause function
  function togglePause() {
    isPaused = !isPaused;
    
    if (isPaused) {
      pauseOverlay.style.display = "flex";
      if (onPauseCallback) onPauseCallback();
    } else {
      pauseOverlay.style.display = "none";
      if (onResumeCallback) onResumeCallback();
    }
  }

  // Public API
  return {
    toggle: togglePause,
    isPaused: () => isPaused,
    show: () => {
      if (!isPaused) togglePause();
    },
    hide: () => {
      if (isPaused) togglePause();
    },
    onPause: (callback) => {
      onPauseCallback = callback;
    },
    onResume: (callback) => {
      onResumeCallback = callback;
    },
    destroy: () => {
      window.removeEventListener("keydown", handleKeyPress);
      document.body.removeChild(pauseOverlay);
      document.head.removeChild(style);
    }
  };
}

