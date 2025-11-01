import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { Level1Hitboxes } from "../collision/level1Hitboxes.js"
import { Level1Enemies } from "../entities/level1Enemies.js"
import { CoordinateDisplay } from "../ui/coordinateDisplay.js"
import { PauseMenu } from "../ui/pauseMenu.js"
import { Compass } from "../ui/compass.js"

export class Level1Environment {
  constructor() {
    this.scene = new THREE.Scene()
    this.collidables = []
    this.player = null
    this.mixer = null
    this.hitboxSystem = null
    this.enemySystem = null
    this.coordinateDisplay = null
    this.pauseMenu = null
    this.compass = null
    this.init()
  }

  init() {
    const loader = new THREE.CubeTextureLoader()
    loader.setPath('./1st level/skybox/cubemap/')
    
    const textureCube = loader.load(
      [
        'px.png', 'nx.png',
        'py.png', 'ny.png',
        'pz.png', 'nz.png'
      ],
      () => {
        console.log('Skybox loaded successfully!')
      },
      undefined,
      (error) => {
        console.error('Error loading skybox:', error)
      }
    )
    
    this.scene.background = textureCube

    this.scene.fog = new THREE.Fog(0xadd8e6, 30, 200)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
    hemiLight.position.set(0, 200, 0)
    this.scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7.5)
    dirLight.castShadow = true
    this.scene.add(dirLight)

    this.hitboxSystem = new Level1Hitboxes(this.scene)
    this.collidables.push(...this.hitboxSystem.getHitboxes())
 
    this.createFire(12.69, 0, -10.59, 2) 
  }

  createFire(x, y, z, size = 1) {
    const fireGroup = new THREE.Group()
    fireGroup.position.set(x, y, z)
  
    // Fire particles
    const particleCount = 150
    const particles = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const velocities = []
    const lifetimes = []
  
    for (let i = 0; i < particleCount; i++) {
      // Initial positions (wider base)
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * size * 1.5 // Wider base radius
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = Math.random() * 0.2
      positions[i * 3 + 2] = Math.sin(angle) * radius
      
      // Slower velocities (reduced by ~60%)
      velocities.push({
        x: (Math.random() - 0.5) * 0.012, // was 0.03
        y: Math.random() * 0.03 + 0.015,  // was 0.08 + 0.04
        z: (Math.random() - 0.5) * 0.012  // was 0.03
      })
      
      // Random lifetimes
      lifetimes.push(Math.random())
      
      // Color gradient (red to orange to yellow)
      const colorChoice = Math.random()
      if (colorChoice < 0.3) {
        // Red
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.1
        colors[i * 3 + 2] = 0.0
      } else if (colorChoice < 0.7) {
        // Orange
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.4
        colors[i * 3 + 2] = 0.0
      } else {
        // Yellow
        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.8
        colors[i * 3 + 2] = 0.1
      }
      
      // Particle sizes (larger at base)
      sizes[i] = Math.random() * size * 0.6 + size * 0.3
    }
  
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
  
    // Fire material
    const fireMaterial = new THREE.PointsMaterial({
      size: size * 0.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })
  
    const fireParticles = new THREE.Points(particles, fireMaterial)
    fireGroup.add(fireParticles)
  
    // Larger glow at base
    const glowGeometry = new THREE.CircleGeometry(size * 2, 32)
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    })
    const glow = new THREE.Mesh(glowGeometry, glowMaterial)
    glow.rotation.x = -Math.PI / 2
    glow.position.y = 0.1
    fireGroup.add(glow)
  
    // Point light for fire illumination
    const fireLight = new THREE.PointLight(0xff4400, 3, 15 * size)
    fireLight.position.set(0, size, 0)
    fireLight.castShadow = true
    fireLight.shadow.bias = -0.001
    fireGroup.add(fireLight)
  
    // Store animation data
    fireGroup.userData = {
      particles: fireParticles,
      velocities: velocities,
      lifetimes: lifetimes,
      positions: positions,
      colors: colors,
      sizes: sizes,
      size: size,
      glow: glow,
      light: fireLight,
      time: 0
    }
  
    this.scene.add(fireGroup)
    
    // Store fire for animation updates
    if (!this.fires) this.fires = []
    this.fires.push(fireGroup)
    
    return fireGroup
  }
  
  updateFires(delta) {
    if (!this.fires) return
  
    this.fires.forEach(fireGroup => {
      const data = fireGroup.userData
      const positions = data.positions
      const colors = data.colors
      const sizes = data.sizes
      
      data.time += delta
  
      for (let i = 0; i < data.velocities.length; i++) {
        const currentHeight = positions[i * 3 + 1]
        const heightRatio = currentHeight / (data.size * 3)
        
        // Calculate taper factor (narrows as it rises)
        const taperFactor = 1 - (heightRatio * 0.7) // Reduces width by 70% at top
        
        // Update particle positions (move upward and drift)
        positions[i * 3] += data.velocities[i].x
        positions[i * 3 + 1] += data.velocities[i].y
        positions[i * 3 + 2] += data.velocities[i].z
        
        // Pull particles inward as they rise (creates taper effect)
        const centerX = 0
        const centerZ = 0
        const pullStrength = 0.008 * heightRatio // Stronger pull higher up
        positions[i * 3] += (centerX - positions[i * 3]) * pullStrength
        positions[i * 3 + 2] += (centerZ - positions[i * 3 + 2]) * pullStrength
        
        // Add slower turbulence/wind effect
        positions[i * 3] += Math.sin(data.time * 1 + i) * 0.001  // was 0.002
        positions[i * 3 + 2] += Math.cos(data.time * 1 + i) * 0.001 // was 0.002
        
        // Update lifetime (slower decay)
        data.lifetimes[i] -= delta * 0.4 // was 0.8 (50% slower)
        
        // Fade out particles as they rise
        const lifeRatio = data.lifetimes[i]
        
        // Change color from red->orange->yellow as particle rises
        if (lifeRatio > 0.7) {
          // Red at bottom
          colors[i * 3] = 1.0
          colors[i * 3 + 1] = 0.1
          colors[i * 3 + 2] = 0.0
        } else if (lifeRatio > 0.4) {
          // Orange in middle
          colors[i * 3] = 1.0
          colors[i * 3 + 1] = 0.5
          colors[i * 3 + 2] = 0.0
        } else {
          // Yellow at top (fading)
          colors[i * 3] = 1.0
          colors[i * 3 + 1] = 0.8
          colors[i * 3 + 2] = 0.2
        }
        
        // Shrink particles as they rise (more dramatic taper)
        sizes[i] = (data.size * 0.6) * lifeRatio * taperFactor
        
        // Reset particles that have expired
        if (data.lifetimes[i] <= 0 || positions[i * 3 + 1] > data.size * 3) {
          // Reset to base of fire (wider spawn area)
          const angle = Math.random() * Math.PI * 2
          const radius = Math.random() * data.size * 1.5
          positions[i * 3] = Math.cos(angle) * radius
          positions[i * 3 + 1] = 0
          positions[i * 3 + 2] = Math.sin(angle) * radius
          data.lifetimes[i] = 1
          
          // New random velocity (slower)
          data.velocities[i].x = (Math.random() - 0.5) * 0.012
          data.velocities[i].y = Math.random() * 0.03 + 0.015
          data.velocities[i].z = (Math.random() - 0.5) * 0.012
          
          // Reset size
          sizes[i] = Math.random() * data.size * 0.6 + data.size * 0.3
        }
      }
      
      // Mark attributes for update
      data.particles.geometry.attributes.position.needsUpdate = true
      data.particles.geometry.attributes.color.needsUpdate = true
      data.particles.geometry.attributes.size.needsUpdate = true
      
      // Slower flickering light
      data.light.intensity = 3 + Math.sin(data.time * 2.5) * 0.5 + Math.sin(data.time * 1.5) * 0.3
      
      // Slower pulse glow effect
      data.glow.material.opacity = 0.3 + Math.sin(data.time * 2) * 0.1
      data.glow.scale.set(
        1 + Math.sin(data.time * 1.5) * 0.1,
        1 + Math.sin(data.time * 1.5) * 0.1,
        1
      )
    })
  }

  loadTerrainModel(path, scale = 1) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.load(
        path,
        (gltf) => {
          const terrain = gltf.scene
          terrain.position.set(0, 0, 0)
          terrain.scale.set(scale, scale, scale)
          terrain.name = "terrain"

          terrain.traverse((child) => {
            if (child.isMesh) {
              child.receiveShadow = true
              child.castShadow = true
            }
          })

          this.scene.add(terrain)
          console.log("Terrain model loaded successfully")
          resolve(terrain)
        },
        undefined,
        (error) => {
          console.error("Error loading terrain:", error)
          reject(error)
        },
      )
    })
  }

  addCollidables(collidables = []) {
    for (const c of collidables) {
      if (c && !this.collidables.includes(c)) this.collidables.push(c)
    }
  }

  loadPlayerModel() {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader()
      loader.load(
        "./models/AJ.glb",
        (gltf) => {
          this.player = gltf.scene
          this.player.scale.set(1, 1, 1)
          this.player.position.set(0, 0, 0)
          this.player.name = "player"
          this.scene.add(this.player)

          this.mixer = new THREE.AnimationMixer(this.player)

          this.coordinateDisplay = new CoordinateDisplay(this.player)

          this.enemySystem = new Level1Enemies(this.scene, this.player, this.collidables)
          this.enemySystem.createBook()
          this.enemySystem.spawnFrogs(4)
          this.enemySystem.spawnCrocodiles(3)

          this.pauseMenu = new PauseMenu(this.enemySystem)

          // Create compass and set initial target to the book
          this.compass = new Compass(this.player, this.enemySystem.getBook())

          resolve(gltf)
        },
        undefined,
        (error) => {
          reject(error)
        },
      )
    })
  }

  getCollidables() {
    return this.collidables
  }

  getScene() {
    return this.scene
  }

  getPlayer() {
    return this.player
  }

  getMixer() {
    return this.mixer
  }

  getHitboxSystem() {
    return this.hitboxSystem
  }

  getEnemySystem() {
    return this.enemySystem
  }

  getCoordinateDisplay() {
    return this.coordinateDisplay
  }

  getPauseMenu() {
    return this.pauseMenu
  }

  getCompass() {
    return this.compass
  }

  update(delta) {
    if (this.mixer) {
      this.mixer.update(delta)
    }

    if (this.coordinateDisplay) {
      this.coordinateDisplay.update()
    }

    if (this.enemySystem) {
      this.enemySystem.update(delta)

      this.updateFires(delta)

      // Update compass target based on game state
      if (this.compass) {
        const gameState = this.enemySystem.getGameState()
        
        if (gameState === "playing" && this.enemySystem.getBook()) {
          // Point to book during gameplay
          this.compass.setTarget(this.enemySystem.getBook())
          this.compass.update()
        } else if (gameState === "won" && this.enemySystem.getPortal()) {
          // Point to portal after winning
          this.compass.setTarget(this.enemySystem.getPortal().getPosition())
          this.compass.update()
        }
      }
    }
  }
}