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
    this.backgroundMusic = null
    this.isMusicPlaying = false
    this.init()
  }

  init() {
    this.scene.background = new THREE.Color(0x87ceeb)

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2)
    hemiLight.position.set(0, 200, 0)
    this.scene.add(hemiLight)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(5, 10, 7.5)
    dirLight.castShadow = true
    this.scene.add(dirLight)

    this.hitboxSystem = new Level1Hitboxes(this.scene)
    this.collidables.push(...this.hitboxSystem.getHitboxes())
  }

   url = "./sounds/nature_ambience.mp3";
  async loadBackgroundMusic(url) {
    return new Promise((resolve, reject) => {
      // Create audio listener if it doesn't exist
      if (!this.audioListener) {
        this.audioListener = new THREE.AudioListener()
        // You'll need to add this to the camera later
      }

      // Create audio loader and load the sound
      const audioLoader = new THREE.AudioLoader()
      
      audioLoader.load(
        url,
        (buffer) => {
          this.backgroundMusic = new THREE.Audio(this.audioListener)
          this.backgroundMusic.setBuffer(buffer)
          this.backgroundMusic.setLoop(true)
          this.backgroundMusic.setVolume(0.3) // Lower volume for background music
          
          console.log("Background music loaded successfully")
          resolve(this.backgroundMusic)
        },
        undefined,
        (error) => {
          console.error("Error loading background music:", error)
          reject(error)
        }
      )
    })
  }

  playBackgroundMusic() {
    if (this.backgroundMusic && !this.isMusicPlaying) {
      this.backgroundMusic.play()
      this.isMusicPlaying = true
      console.log("Background music started")
    }
  }

  pauseBackgroundMusic() {
    if (this.backgroundMusic && this.isMusicPlaying) {
      this.backgroundMusic.pause()
      this.isMusicPlaying = false
      console.log("Background music paused")
    }
  }

  resumeBackgroundMusic() {
    if (this.backgroundMusic && !this.isMusicPlaying) {
      this.backgroundMusic.play()
      this.isMusicPlaying = true
      console.log("Background music resumed")
    }
  }

  stopBackgroundMusic() {
    if (this.backgroundMusic) {
      this.backgroundMusic.stop()
      this.isMusicPlaying = false
      console.log("Background music stopped")
    }
  }

  setMusicVolume(volume) {
    if (this.backgroundMusic) {
      this.backgroundMusic.setVolume(volume)
    }
  }

  // Add this method to set the audio listener to the camera
  setAudioListener(camera) {
    if (camera && !camera.children.includes(this.audioListener)) {
      camera.add(this.audioListener)
    }
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

  dispose() {
    this.stopBackgroundMusic()
    if (this.backgroundMusic) {
      this.backgroundMusic = null
    }
    if (this.audioListener && this.camera) {
      this.camera.remove(this.audioListener)
    }
  }
}