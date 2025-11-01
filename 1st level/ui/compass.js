import * as THREE from "three"

export class Compass {
  constructor(player, targetObject = null) {
    this.player = player
    this.targetObject = targetObject
    this.compassElement = null
    this.needleElement = null
    this.distanceElement = null
    this.init()
  }

  init() {
    // Create compass container
    this.compassElement = document.createElement("div")
    this.compassElement.id = "compass"
    this.compassElement.style.cssText = `
      position: fixed;
      top: 280px;
      left: 20px;
      width: 120px;
      height: 120px;
      background: radial-gradient(circle, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.9) 100%);
      border: 3px solid #ffd700;
      border-radius: 50%;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    // Create compass face with cardinal directions
    const compassFace = document.createElement("div")
    compassFace.style.cssText = `
      position: absolute;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    `

    // Add cardinal direction markers
    const directions = [
      { label: "N", angle: 0, color: "#ff0000" },
      { label: "E", angle: 90, color: "#ffffff" },
      { label: "S", angle: 180, color: "#ffffff" },
      { label: "W", angle: 270, color: "#ffffff" },
    ]

    directions.forEach((dir) => {
      const marker = document.createElement("div")
      marker.textContent = dir.label
      marker.style.cssText = `
        position: absolute;
        color: ${dir.color};
        font-weight: bold;
        font-size: 14px;
        transform: rotate(${dir.angle}deg) translateY(-40px) rotate(-${dir.angle}deg);
      `
      compassFace.appendChild(marker)
    })

    this.compassElement.appendChild(compassFace)

    // Create needle
    this.needleElement = document.createElement("div")
    this.needleElement.style.cssText = `
      position: absolute;
      width: 4px;
      height: 50px;
      background: linear-gradient(to bottom, #ff0000 0%, #ff0000 50%, #ffffff 50%, #ffffff 100%);
      transform-origin: center center;
      transition: transform 0.3s ease;
      border-radius: 2px;
      box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
    `
    this.compassElement.appendChild(this.needleElement)

    // Create center dot
    const centerDot = document.createElement("div")
    centerDot.style.cssText = `
      position: absolute;
      width: 8px;
      height: 8px;
      background: #ffd700;
      border-radius: 50%;
      box-shadow: 0 0 5px #ffd700;
    `
    this.compassElement.appendChild(centerDot)

    // Create distance display
    this.distanceElement = document.createElement("div")
    this.distanceElement.style.cssText = `
      position: fixed;
      top: 410px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: #ffd700;
      padding: 8px 12px;
      border-radius: 5px;
      font-family: 'Courier New', monospace;
      font-size: 14px;
      border: 2px solid #ffd700;
      z-index: 1000;
      min-width: 120px;
      text-align: center;
    `
    this.distanceElement.textContent = "No target"

    document.body.appendChild(this.compassElement)
    document.body.appendChild(this.distanceElement)
  }

  setTarget(targetObject) {
    this.targetObject = targetObject
  }

  update() {
    if (!this.player || !this.targetObject || !this.needleElement) return

    const playerPos = this.player.position
    const targetPos = this.targetObject.position || this.targetObject

    // Calculate direction to target
    const direction = new THREE.Vector3()
    direction.subVectors(targetPos, playerPos)
    direction.y = 0 // Keep it horizontal
    direction.normalize()

    // Calculate angle (in degrees)
    let angle = Math.atan2(direction.x, direction.z) * (180 / Math.PI)

    // Rotate needle to point at target
    this.needleElement.style.transform = `rotate(${angle}deg) translateY(-25px)`

    // Calculate distance
    const distance = playerPos.distanceTo(targetPos)

    // Update distance display
    if (distance < 100) {
      this.distanceElement.textContent = `${distance.toFixed(1)}m`
      this.distanceElement.style.color = distance < 10 ? "#00ff00" : "#ffd700"
    } else {
      this.distanceElement.textContent = `${distance.toFixed(0)}m`
      this.distanceElement.style.color = "#ffd700"
    }

    // Add pulsing effect when very close
    if (distance < 5) {
      this.compassElement.style.boxShadow = `0 0 ${20 + Math.sin(Date.now() * 0.01) * 10}px rgba(0, 255, 0, 0.8)`
    } else {
      this.compassElement.style.boxShadow = "0 0 20px rgba(255, 215, 0, 0.5)"
    }
  }

  hide() {
    if (this.compassElement) {
      this.compassElement.style.display = "none"
    }
    if (this.distanceElement) {
      this.distanceElement.style.display = "none"
    }
  }

  show() {
    if (this.compassElement) {
      this.compassElement.style.display = "flex"
    }
    if (this.distanceElement) {
      this.distanceElement.style.display = "block"
    }
  }

  dispose() {
    if (this.compassElement && this.compassElement.parentNode) {
      this.compassElement.parentNode.removeChild(this.compassElement)
    }
    if (this.distanceElement && this.distanceElement.parentNode) {
      this.distanceElement.parentNode.removeChild(this.distanceElement)
    }
  }
}