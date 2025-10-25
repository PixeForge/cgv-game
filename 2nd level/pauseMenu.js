// 2nd level/pauseMenu.js - Stewie's Room Themed Pause Menu

export function createPauseMenu() {
  let isPaused = false;
  let onPauseCallback = null;
  let onResumeCallback = null;

  // Create the pause menu overlay with Stewie's blue theme
  const pauseOverlay = document.createElement("div");
  pauseOverlay.id = "pause-menu-overlay";
  pauseOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(ellipse at center, rgba(100, 180, 255, 0.95) 0%, rgba(50, 120, 200, 0.96) 100%);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(8px);
    animation: fadeIn 0.3s ease-in-out;
  `;

  // Create the menu container with Stewie's blue and red colors
  const menuContainer = document.createElement("div");
  menuContainer.style.cssText = `
    background: linear-gradient(145deg, #e6f3ff 0%, #cce7ff 100%);
    border: 5px solid #3399ff;
    border-radius: 20px;
    padding: 40px 60px;
    box-shadow: 0 15px 40px rgba(51, 153, 255, 0.6), 
                inset 0 0 30px rgba(100, 180, 255, 0.3),
                0 0 0 3px #66b3ff;
    text-align: center;
    max-width: 500px;
    position: relative;
  `;

  // Add decorative corners with Stewie's colors
  const cornerStyle = `
    position: absolute;
    width: 30px;
    height: 30px;
    border: 4px solid #3399ff;
    border-radius: 5px;
  `;
  
  const topLeftCorner = document.createElement("div");
  topLeftCorner.style.cssText = cornerStyle + "top: -5px; left: -5px; border-right: none; border-bottom: none; background: #66b3ff;";
  
  const topRightCorner = document.createElement("div");
  topRightCorner.style.cssText = cornerStyle + "top: -5px; right: -5px; border-left: none; border-bottom: none; background: #99ccff;";
  
  const bottomLeftCorner = document.createElement("div");
  bottomLeftCorner.style.cssText = cornerStyle + "bottom: -5px; left: -5px; border-right: none; border-top: none; background: #99ccff;";
  
  const bottomRightCorner = document.createElement("div");
  bottomRightCorner.style.cssText = cornerStyle + "bottom: -5px; right: -5px; border-left: none; border-top: none; background: #66b3ff;";

  menuContainer.appendChild(topLeftCorner);
  menuContainer.appendChild(topRightCorner);
  menuContainer.appendChild(bottomLeftCorner);
  menuContainer.appendChild(bottomRightCorner);

  // Create title with Stewie's theme
  const title = document.createElement("h1");
  title.innerText = "🚀 PAUSED 🚀";
  title.style.cssText = `
    color: #ff3333;
    font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', cursive;
    font-size: 52px;
    margin: 0 0 25px 0;
    text-shadow: 3px 3px 0px #0066cc, 5px 5px 10px rgba(51, 153, 255, 0.5);
    letter-spacing: 4px;
    font-weight: bold;
  `;

  // Create instruction text with Stewie's styling
  const instruction = document.createElement("p");
  instruction.innerText = "Press 'O' to Resume Conquest!";
  instruction.style.cssText = `
    color: #0066cc;
    font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', cursive;
    font-size: 22px;
    margin: 20px 0;
    text-shadow: 2px 2px 0px rgba(255, 51, 51, 0.5);
    letter-spacing: 1px;
  `;

  // Create decorative divider with Stewie's colors
  const divider = document.createElement("div");
  divider.style.cssText = `
    width: 80%;
    height: 4px;
    background: repeating-linear-gradient(
      90deg,
      #ff3333 0px,
      #ff6666 10px,
      #3399ff 20px,
      #66b3ff 30px,
      #0066cc 40px,
      #ff3333 50px
    );
    margin: 25px auto;
    border-radius: 2px;
  `;

  // Create tips section with Stewie's theme
  const tipsContainer = document.createElement("div");
  tipsContainer.style.cssText = `
    margin-top: 30px;
    padding: 20px;
    background: linear-gradient(135deg, #e6f3ff 0%, #ffe6e6 100%);
    border-radius: 15px;
    border: 3px dashed #ff3333;
    box-shadow: inset 0 0 15px rgba(51, 153, 255, 0.3);
  `;

  const tipsTitle = document.createElement("p");
  tipsTitle.innerText = "🎯 Mission Control";
  tipsTitle.style.cssText = `
    color: #ff3333;
    font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', cursive;
    font-size: 28px;
    margin: 0 0 15px 0;
    font-weight: bold;
    text-shadow: 2px 2px 0px rgba(0, 102, 204, 0.5);
  `;

  const tips = document.createElement("p");
  tips.innerHTML = `
    <span style="display: block; margin: 10px 0; color: #0066cc; font-family: 'Comic Sans MS', cursive; font-size: 20px;">
      🎮 Use WASD to navigate the room
    </span>
    <span style="display: block; margin: 10px 0; color: #0066cc; font-family: 'Comic Sans MS', cursive; font-size: 20px;">
      🚀 Explore and conquer objectives
    </span>
    <span style="display: block; margin: 10px 0; color: #0066cc; font-family: 'Comic Sans MS', cursive; font-size: 20px;">
      ⏸️ Press 'O' to pause your mission
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

  // Add CSS for fade in effect only
  const style = document.createElement("style");
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
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

