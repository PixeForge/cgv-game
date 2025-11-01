export class CoordinateDisplay {
  constructor(player) {
    this.player = player
    this.displayElement = null
    this.init()
  }

  init() {
    this.displayElement = document.createElement("div")
    this.displayElement.id = "coordinate-display"
    this.displayElement.style.cssText = `
      position: fixed;
      top: 10px;
      right: 150px;
      background: rgba(0, 0, 0, 0.7);
      color: #00ff00;
      padding: 10px 15px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
      line-height: 1.6;
    `
    document.body.appendChild(this.displayElement)
  }

  update() {
    if (!this.player || !this.displayElement) return

    const x = this.player.position.x.toFixed(2)
    const y = this.player.position.y.toFixed(2)
    const z = this.player.position.z.toFixed(2)

    this.displayElement.innerHTML = `
      <div>X: ${x}</div>
      <div>Y: ${y}</div>
      <div>Z: ${z}</div>
    `
  }

  dispose() {
    if (this.displayElement && this.displayElement.parentNode) {
      this.displayElement.parentNode.removeChild(this.displayElement)
    }
  }
}
