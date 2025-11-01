import * as THREE from "three"

export class Portal {
  constructor(scene, position = { x: 0, y: 0, z: 0 }) {
    this.scene = scene
    this.portal = null
    this.position = position
    this.isActive = false
    this.playerInRange = false
    this.interactionRadius = 3
  }

  create() {
    const portalGroup = new THREE.Group()

    // Outer ring
    const outerRingGeo = new THREE.TorusGeometry(2, 0.15, 16, 50)
    const outerRingMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    })
    const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat)
    outerRing.rotation.x = Math.PI / 2
    portalGroup.add(outerRing)

    // Inner ring
    const innerRingGeo = new THREE.TorusGeometry(1.5, 0.1, 16, 50)
    const innerRingMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.7,
      metalness: 0.8,
      roughness: 0.2,
    })
    const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat)
    innerRing.rotation.x = Math.PI / 2
    portalGroup.add(innerRing)

    // Portal surface (swirling effect)
    const portalSurfaceGeo = new THREE.CircleGeometry(1.8, 32)
    const portalSurfaceMat = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    })
    const portalSurface = new THREE.Mesh(portalSurfaceGeo, portalSurfaceMat)
    portalSurface.rotation.x = Math.PI / 2
    portalGroup.add(portalSurface)
    portalGroup.userData.surface = portalSurface

    // Particle effect
    const particlesGeo = new THREE.BufferGeometry()
    const particleCount = 100
    const positions = new Float32Array(particleCount * 3)

    for (let i = 0; i < particleCount * 3; i += 3) {
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 1.5
      positions[i] = Math.cos(angle) * radius
      positions[i + 1] = (Math.random() - 0.5) * 0.5
      positions[i + 2] = Math.sin(angle) * radius
    }

    particlesGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3))

    const particlesMat = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    })

    const particles = new THREE.Points(particlesGeo, particlesMat)
    particles.rotation.x = Math.PI / 2
    portalGroup.add(particles)
    portalGroup.userData.particles = particles

    // Glowing aura
    const glowGeo = new THREE.CircleGeometry(2.5, 32)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    glow.rotation.x = Math.PI / 2
    portalGroup.add(glow)
    portalGroup.userData.glow = glow

    portalGroup.position.set(this.position.x, this.position.y + 2, this.position.z)
    portalGroup.userData.startY = this.position.y + 2
    portalGroup.userData.rotationSpeed = 0

    this.scene.add(portalGroup)
    this.portal = portalGroup
    this.isActive = true

    console.log(`Portal created at (${this.position.x}, ${this.position.y}, ${this.position.z})`)

    return portalGroup
  }

  update(delta, playerPosition) {
    if (!this.portal || !this.isActive) return

    const time = Date.now() * 0.001

    // Float up and down
    this.portal.position.y = this.portal.userData.startY + Math.sin(time * 2) * 0.3

    // Rotate rings
    const outerRing = this.portal.children[0]
    const innerRing = this.portal.children[1]
    outerRing.rotation.z += delta * 0.5
    innerRing.rotation.z -= delta * 0.8

    // Animate portal surface
    const surface = this.portal.userData.surface
    if (surface) {
      surface.rotation.z += delta * 1.5
      surface.material.opacity = 0.5 + Math.sin(time * 3) * 0.1
    }

    // Animate particles
    const particles = this.portal.userData.particles
    if (particles) {
      particles.rotation.z += delta * 2
      const positions = particles.geometry.attributes.position.array
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + i) * 0.01
      }
      particles.geometry.attributes.position.needsUpdate = true
    }

    // Pulse glow
    const glow = this.portal.userData.glow
    if (glow) {
      glow.material.opacity = 0.15 + Math.sin(time * 4) * 0.1
      glow.scale.set(1 + Math.sin(time * 3) * 0.1, 1 + Math.sin(time * 3) * 0.1, 1)
    }

    // Check player distance
    if (playerPosition) {
      const distance = this.portal.position.distanceTo(playerPosition)
      const wasInRange = this.playerInRange
      this.playerInRange = distance < this.interactionRadius

      if (this.playerInRange && !wasInRange) {
        this.showInteractionPrompt()
      } else if (!this.playerInRange && wasInRange) {
        this.hideInteractionPrompt()
      }

      return this.playerInRange
    }

    return false
  }

  showInteractionPrompt() {
    const existingPrompt = document.getElementById("portal-prompt")
    if (existingPrompt) return

    const prompt = document.createElement("div")
    prompt.id = "portal-prompt"
    prompt.textContent = "Press E to enter portal"
    prompt.style.cssText = `
      position: fixed;
      bottom: 150px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 255, 255, 0.9);
      color: black;
      padding: 15px 30px;
      border-radius: 10px;
      font-size: 20px;
      font-weight: bold;
      z-index: 999;
      pointer-events: none;
      animation: pulse 1s infinite;
    `

    const style = document.createElement("style")
    style.textContent = `
      @keyframes pulse {
        0%, 100% { transform: translateX(-50%) scale(1); }
        50% { transform: translateX(-50%) scale(1.05); }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(prompt)
  }

  hideInteractionPrompt() {
    const prompt = document.getElementById("portal-prompt")
    if (prompt) {
      prompt.remove()
    }
  }

  isPlayerInRange() {
    return this.playerInRange
  }

  remove() {
    if (this.portal) {
      this.scene.remove(this.portal)
      this.portal = null
      this.isActive = false
      this.hideInteractionPrompt()
    }
  }

  getPosition() {
    return this.portal ? this.portal.position : null
  }
}