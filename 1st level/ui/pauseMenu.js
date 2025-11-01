export class PauseMenu {
    constructor(enemySystem) {
      this.enemySystem = enemySystem
      this.pauseButton = null
      this.init()
    }
  
    init() {
      this.pauseButton = document.createElement("button")
      this.pauseButton.id = "pause-button"
      this.pauseButton.textContent = "⏸ PAUSE"
      this.pauseButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.7);
        color: white;
        border: 2px solid white;
        padding: 10px 20px;
        border-radius: 5px;
        font-size: 16px;
        font-weight: bold;
        cursor: pointer;
        z-index: 1000;
        transition: all 0.3s;
      `
  
      this.pauseButton.addEventListener("mouseenter", () => {
        this.pauseButton.style.background = "rgba(255, 255, 255, 0.2)"
        this.pauseButton.style.transform = "scale(1.05)"
      })
  
      this.pauseButton.addEventListener("mouseleave", () => {
        this.pauseButton.style.background = "rgba(0, 0, 0, 0.7)"
        this.pauseButton.style.transform = "scale(1)"
      })
  
      this.pauseButton.addEventListener("click", () => {
        if (this.enemySystem) {
          this.enemySystem.togglePause()
        }
      })
  
      document.body.appendChild(this.pauseButton)
    }
  
    dispose() {
      if (this.pauseButton && this.pauseButton.parentNode) {
        this.pauseButton.parentNode.removeChild(this.pauseButton)
      }
    }
  }
  