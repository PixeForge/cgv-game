// 2nd level/Level2Timer.js - Stewie's Room themed timer

export function createAdventureTimer() {
  let startTime = null;
  let elapsedSeconds = 0;
  let isRunning = false;
  let animationFrameId = null;

  // Create timer container with Stewie's blue and red theme
  const timerContainer = document.createElement("div");
  timerContainer.id = "adventure-timer";
  timerContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(145deg, #e6f3ff 0%, #cce7ff 100%);
    border: 4px solid #3399ff;
    border-radius: 20px;
    padding: 15px 25px;
    box-shadow: 0 10px 25px rgba(51, 153, 255, 0.6), 
                inset 0 0 20px rgba(51, 153, 255, 0.3),
                0 0 0 2px #66b3ff;
    z-index: 999;
    font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', cursive;
    text-align: center;
    min-width: 150px;
  `;

  // Add decorative icon - rocket for Stewie's adventurous nature
  const icon = document.createElement("div");
  icon.innerText = "🚀";
  icon.style.cssText = `
    font-size: 26px;
    margin-bottom: 5px;
  `;
  timerContainer.appendChild(icon);

  // Add label with Stewie's styling
  const label = document.createElement("div");
  label.innerText = "Mission Time";
  label.style.cssText = `
    color: #ff3333;
    font-size: 15px;
    letter-spacing: 1px;
    margin-bottom: 8px;
    text-shadow: 2px 2px 0px rgba(0, 102, 204, 0.5);
    font-weight: bold;
  `;
  timerContainer.appendChild(label);

  // Add time display with Stewie's styling
  const timeDisplay = document.createElement("div");
  timeDisplay.innerText = "00:00";
  timeDisplay.style.cssText = `
    color: #0066cc;
    font-size: 32px;
    font-weight: bold;
    letter-spacing: 2px;
    text-shadow: 3px 3px 0px #ff6666;
    font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', cursive;
  `;
  timerContainer.appendChild(timeDisplay);

  // Add quizzes attempted tag under the timer
  const quizTag = document.createElement("div");
  quizTag.id = "quiz-progress";
  quizTag.innerText = "Quizzes: 0/2";
  quizTag.style.cssText = `
    color: #003d80;
    font-size: 14px;
    margin-top: 6px;
    font-weight: bold;
  `;
  timerContainer.appendChild(quizTag);

  // Add decorative corners with Stewie's colors
  const cornerStyle = `
    position: absolute;
    width: 12px;
    height: 12px;
    border: 3px solid #3399ff;
    border-radius: 3px;
  `;
  
  const topLeftCorner = document.createElement("div");
  topLeftCorner.style.cssText = cornerStyle + "top: -3px; left: -3px; border-right: none; border-bottom: none; background: #66b3ff;";
  
  const topRightCorner = document.createElement("div");
  topRightCorner.style.cssText = cornerStyle + "top: -3px; right: -3px; border-left: none; border-bottom: none; background: #99ccff;";
  
  const bottomLeftCorner = document.createElement("div");
  bottomLeftCorner.style.cssText = cornerStyle + "bottom: -3px; left: -3px; border-right: none; border-top: none; background: #99ccff;";
  
  const bottomRightCorner = document.createElement("div");
  bottomRightCorner.style.cssText = cornerStyle + "bottom: -3px; right: -3px; border-left: none; border-top: none; background: #66b3ff;";

  timerContainer.appendChild(topLeftCorner);
  timerContainer.appendChild(topRightCorner);
  timerContainer.appendChild(bottomLeftCorner);
  timerContainer.appendChild(bottomRightCorner);

  // No animations - clean styling
  const style = document.createElement("style");
  style.textContent = `
    #adventure-timer {
      transition: all 0.3s ease;
    }
  `;
  document.head.appendChild(style);

  // Append to body
  document.body.appendChild(timerContainer);

  // Format time as MM:SS
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Update timer display
  function updateDisplay() {
    if (!isRunning) return;
    
    const currentTime = Date.now();
    elapsedSeconds = (currentTime - startTime) / 1000;
    timeDisplay.innerText = formatTime(elapsedSeconds);
    
    animationFrameId = requestAnimationFrame(updateDisplay);
  }

  // Public API
  return {
    start: () => {
      if (!isRunning) {
        startTime = Date.now() - (elapsedSeconds * 1000);
        isRunning = true;
        updateDisplay();
        console.log("⏳ Adventure timer started!");
      }
    },
    
    stop: () => {
      if (isRunning) {
        isRunning = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
        console.log(`⏳ Adventure timer stopped at ${formatTime(elapsedSeconds)}`);
      }
    },
    
    reset: () => {
      elapsedSeconds = 0;
      startTime = Date.now();
      timeDisplay.innerText = "00:00";
      console.log("⏳ Adventure timer reset!");
    },
    
    getTime: () => {
      return elapsedSeconds;
    },
    
    getFormattedTime: () => {
      return formatTime(elapsedSeconds);
    },
    
    show: () => {
      timerContainer.style.display = "block";
    },
    
    hide: () => {
      timerContainer.style.display = "none";
    },
    
    destroy: () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.body.removeChild(timerContainer);
      document.head.removeChild(style);
    },
    setQuizProgress: (attempted, total) => {
      quizTag.innerText = `Quizzes: ${attempted}/${total}`;
    }
  };
}

