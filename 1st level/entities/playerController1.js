import * as THREE from "three"

export class PlayerController1 {
  constructor(environment, camera, renderer) {
    this.environment = environment
    this.camera = camera
    this.renderer = renderer

    this.actions = {}
    this.baseActionName = "idle"
    this.lastBaseActionName = null
    this.overlayPlaying = null

    this.onGround = true

    this.velocityY = 0
    this.keys = {}
    this.isMouseDown = false
    this.mouseX = 0
    this.mouseY = 0
    this.cameraAngleX = 0
    this.cameraAngleY = 0.5
    this.cameraDistance = 10

    this.jumpCooldown = false

    this.PLAYER_HALF_WIDTH = 0.5
    this.PLAYER_HEIGHT = 2.0

    this.init()
  }

  init() {
    this.setupInputHandlers()
  }

  setupAnimations(gltf) {
    const mixer = this.environment.getMixer()

    gltf.animations.forEach((clip) => {
      const name = clip.name.toLowerCase()
      const action = mixer.clipAction(clip)
      this.actions[name] = action

      if (name === "idle" || name === "running") {
        action.setLoop(THREE.LoopRepeat)
      } else {
        action.setLoop(THREE.LoopOnce, 0)
        action.clampWhenFinished = true
      }

      action.enabled = true
      action.setEffectiveWeight(0)
      action.play()
    })

    this.playBaseAction("idle")

    mixer.addEventListener("finished", (e) => {
      const finishedName = this.getActionNameFromAction(e.action)
      if (!finishedName) return

      if (finishedName === "landing" || finishedName === "jumping") {
        this.overlayPlaying = null
        this.playBaseAction(this.determineBaseAction())
      }
    })
  }

  getActionNameFromAction(action) {
    for (const n in this.actions) {
      if (this.actions[n] === action) return n
    }
    return null
  }

  playBaseAction(name) {
    if (!this.actions[name]) return
    if (this.baseActionName === name && this.lastBaseActionName === name) {
      this.actions[name].setEffectiveWeight(1.0)
      return
    }
    this.lastBaseActionName = this.baseActionName
    this.baseActionName = name

    for (const n of Object.keys(this.actions)) {
      if (n === name) {
        this.actions[n].reset().setEffectiveWeight(1.0).setEffectiveTimeScale(1).play()
      } else if (n === this.lastBaseActionName && (n === "idle" || n === "running")) {
        this.actions[n].fadeOut(0.25)
      }
    }
  }

  playOverlayAction(name, { fadeIn = 0.12, fadeOut = 0.12, stopAfter = null } = {}) {
    if (!this.actions[name]) return
    if (this.overlayPlaying && this.overlayPlaying !== name && this.actions[this.overlayPlaying]) {
      this.actions[this.overlayPlaying].fadeOut(fadeOut)
    }

    this.overlayPlaying = name
    const a = this.actions[name]
    a.reset()
    a.setLoop(THREE.LoopOnce, 0)
    a.clampWhenFinished = true
    a.enabled = true
    a.fadeIn(fadeIn)
    a.setEffectiveWeight(1.0)
    a.play()

    if (stopAfter) {
      setTimeout(() => {
        if (this.overlayPlaying === name) {
          a.fadeOut(fadeOut)
          this.overlayPlaying = null
          this.playBaseAction(this.determineBaseAction())
        }
      }, stopAfter * 1000)
    }
  }

  determineBaseAction() {
    if (!this.onGround) return "jumping"
    return this.baseActionName
  }

  setupInputHandlers() {
    document.addEventListener("keydown", (e) => {
      if (e.code) this.keys[e.code] = true

      if (e.code === "Space") {
        this.handleSpacePress()
        e.preventDefault()
      }

      if (e.code === "Escape") {
        const enemySystem = this.environment.getEnemySystem()
        if (enemySystem) {
          enemySystem.togglePause()
        }
        e.preventDefault()
      }
    })

    document.addEventListener("keyup", (e) => {
      if (e.code) this.keys[e.code] = false
    })

    document.addEventListener("mousedown", (e) => {
      this.isMouseDown = true
      this.mouseX = e.clientX
      this.mouseY = e.clientY
    })

    document.addEventListener("mouseup", () => {
      this.isMouseDown = false
    })

    document.addEventListener("mousemove", (e) => {
      if (this.isMouseDown) {
        const dx = e.clientX - this.mouseX
        const dy = e.clientY - this.mouseY
        this.mouseX = e.clientX
        this.mouseY = e.clientY

        this.cameraAngleX -= dx * 0.005
        this.cameraAngleY -= dy * 0.005
        this.cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2, this.cameraAngleY))
      }
    })

    document.addEventListener("wheel", (e) => {
      this.cameraDistance += e.deltaY * 0.01
      this.cameraDistance = Math.max(4, Math.min(20, this.cameraDistance))
    })
  }

  handleSpacePress() {
    this.triggerJump()
  }

  triggerJump() {
    const player = this.environment.getPlayer()
    if (!player || !this.onGround || this.jumpCooldown) return

    this.velocityY = 8
    this.onGround = false
    this.playOverlayAction("jumping", { fadeIn: 0.08, fadeOut: 0.12, stopAfter: 1.0 })

    this.jumpCooldown = true
    setTimeout(() => (this.jumpCooldown = false), 200)
  }

  update(delta) {
    this.updatePlayer(delta)
    this.updateCamera()
  }

  updatePlayer(delta) {
    const player = this.environment.getPlayer()
    if (!player) return

    const enemySystem = this.environment.getEnemySystem()
    if (enemySystem && enemySystem.isPaused) {
      return
    }

    const speed = 5
    const move = new THREE.Vector3()

    if (this.keys["KeyW"]) move.z -= 1
    if (this.keys["KeyS"]) move.z += 1
    if (this.keys["KeyA"]) move.x -= 1
    if (this.keys["KeyD"]) move.x += 1

    const isMoving = move.lengthSq() > 0
    if (isMoving) {
      move.normalize()
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngleX)
      move.multiplyScalar(speed * delta)
    }

    const originalPosition = player.position.clone()
    const newPosition = player.position.clone().add(move)

    if (isMoving && this.checkCollision(newPosition)) {
      const testX = originalPosition.clone()
      testX.x = newPosition.x
      const testZ = originalPosition.clone()
      testZ.z = newPosition.z

      if (!this.checkCollision(testX)) {
        player.position.x = newPosition.x
      }
      if (!this.checkCollision(testZ)) {
        player.position.z = newPosition.z
      }
    } else {
      player.position.add(move)
    }

    this.velocityY -= 20 * delta
    const newY = player.position.y + this.velocityY * delta

    const groundInfo = this.getGroundLevel(player.position.x, newY, player.position.z)

    if (this.velocityY < 0) {
      if (newY <= groundInfo.groundY) {
        if (!this.onGround) {
          this.playOverlayAction("landing", { fadeIn: 0.06, fadeOut: 0.12, stopAfter: 0.5 })
        }
        player.position.y = groundInfo.groundY
        this.velocityY = 0
        this.onGround = true
      } else {
        player.position.y = newY
        this.onGround = false
      }
    } else if (this.velocityY > 0) {
      const ceilingY = this.getCeilingLevel(player.position.x, newY, player.position.z)
      if (newY + this.PLAYER_HEIGHT >= ceilingY) {
        player.position.y = ceilingY - this.PLAYER_HEIGHT
        this.velocityY = 0
      } else {
        player.position.y = newY
      }
      this.onGround = false
    } else {
      player.position.y = newY
    }

    if (this.onGround) {
      if (isMoving) this.playBaseAction("running")
      else this.playBaseAction("idle")
    }

    if (isMoving) {
      const angle = Math.atan2(move.x, move.z)
      player.rotation.y = angle
    }
  }

  checkCollision(position) {
    const collidables = this.environment.getCollidables()
    if (!collidables || collidables.length === 0) return false

    const playerBottom = position.y

    for (const collidable of collidables) {
      if (!collidable || !collidable.geometry) continue

      const hitboxType = collidable.userData.hitboxType || "box"

      if (hitboxType === "box") {
        const isBelow = this.isHitboxBelowPlayer(collidable, playerBottom)
        if (isBelow) continue

        if (this.checkOBBCollision(position, collidable)) {
          return true
        }
      } else if (hitboxType === "wedge") {
        const isBelow = this.isHitboxBelowPlayer(collidable, playerBottom)
        if (isBelow) continue

        // Allow movement if on the ramp surface
        const groundInfo = this.getGroundLevel(position.x, position.y, position.z)
        if (Math.abs(position.y - groundInfo.groundY) < 0.5) {
          continue
        }

        if (this.checkOBBCollision(position, collidable)) {
          return true
        }
      } else if (hitboxType === "circular") {
        if (this.checkCylinderCollision(position, collidable)) {
          return true
        }
      }
    }

    return false
  }

  isHitboxBelowPlayer(collidable, playerBottom) {
    const box = new THREE.Box3().setFromObject(collidable)
    return box.max.y <= playerBottom + 0.05
  }

  checkOBBCollision(playerPosition, hitbox) {
    const geometry = hitbox.geometry
    geometry.computeBoundingBox()
    const localBox = geometry.boundingBox

    const worldToLocal = new THREE.Matrix4()
    worldToLocal.copy(hitbox.matrixWorld).invert()

    const localPlayerPos = new THREE.Vector3(
      playerPosition.x,
      playerPosition.y + this.PLAYER_HEIGHT / 2,
      playerPosition.z,
    )
    localPlayerPos.applyMatrix4(worldToLocal)

    const playerLocalBox = new THREE.Box3().setFromCenterAndSize(
      localPlayerPos,
      new THREE.Vector3(this.PLAYER_HALF_WIDTH * 2, this.PLAYER_HEIGHT, this.PLAYER_HALF_WIDTH * 2),
    )

    return playerLocalBox.intersectsBox(localBox)
  }

  checkCylinderCollision(playerPosition, cylinder) {
    const cylinderRadius = cylinder.userData.radius || 1
    const cylinderHeight = cylinder.userData.height || 2

    const worldToLocal = new THREE.Matrix4()
    worldToLocal.copy(cylinder.matrixWorld).invert()

    const localPlayerPos = new THREE.Vector3(playerPosition.x, playerPosition.y, playerPosition.z)
    localPlayerPos.applyMatrix4(worldToLocal)

    const distance2D = Math.sqrt(localPlayerPos.x * localPlayerPos.x + localPlayerPos.z * localPlayerPos.z)

    if (distance2D >= cylinderRadius + this.PLAYER_HALF_WIDTH) {
      return false
    }

    const cylinderBottom = -cylinderHeight / 2
    const cylinderTop = cylinderHeight / 2

    const playerBottom = localPlayerPos.y
    const playerTop = localPlayerPos.y + this.PLAYER_HEIGHT

    return playerTop >= cylinderBottom && playerBottom <= cylinderTop
  }

  getGroundLevel(x, y, z) {
    const collidables = this.environment.getCollidables()
    let highestGround = 0

    if (!collidables || collidables.length === 0) {
      return { groundY: highestGround }
    }

    for (const collidable of collidables) {
      if (!collidable || !collidable.geometry) continue

      const hitboxType = collidable.userData.hitboxType || "box"

      if (hitboxType === "box") {
        const groundY = this.getBoxGroundLevel(x, y, z, collidable)
        if (groundY !== null) {
          highestGround = Math.max(highestGround, groundY)
        }
      } else if (hitboxType === "wedge") {
        const groundY = this.getWedgeGroundLevel(x, y, z, collidable)
        if (groundY !== null) {
          highestGround = Math.max(highestGround, groundY)
        }
      } else if (hitboxType === "circular" && collidable.userData.canStandOn) {
        const groundY = this.getCylinderGroundLevel(x, y, z, collidable)
        if (groundY !== null) {
          highestGround = Math.max(highestGround, groundY)
        }
      }
    }

    return { groundY: highestGround }
  }

  getBoxGroundLevel(x, y, z, box) {
    const worldToLocal = new THREE.Matrix4()
    worldToLocal.copy(box.matrixWorld).invert()

    const localPos = new THREE.Vector3(x, y, z)
    localPos.applyMatrix4(worldToLocal)

    const geometry = box.geometry
    geometry.computeBoundingBox()
    const localBox = geometry.boundingBox

    if (
      localPos.x >= localBox.min.x - this.PLAYER_HALF_WIDTH &&
      localPos.x <= localBox.max.x + this.PLAYER_HALF_WIDTH &&
      localPos.z >= localBox.min.z - this.PLAYER_HALF_WIDTH &&
      localPos.z <= localBox.max.z + this.PLAYER_HALF_WIDTH
    ) {
      if (localPos.y <= localBox.max.y && localPos.y >= localBox.min.y) {
        const topPoint = new THREE.Vector3(localPos.x, localBox.max.y, localPos.z)
        topPoint.applyMatrix4(box.matrixWorld)
        return topPoint.y
      }
    }

    return null
  }

  getWedgeGroundLevel(x, y, z, wedge) {
    const wedgeSize = wedge.userData.size

    const worldToLocal = new THREE.Matrix4()
    worldToLocal.copy(wedge.matrixWorld).invert()

    const localPos = new THREE.Vector3(x, y, z)
    localPos.applyMatrix4(worldToLocal)

    const halfWidth = wedgeSize.width / 2
    const halfDepth = wedgeSize.depth / 2

    if (
      localPos.x >= -halfWidth - this.PLAYER_HALF_WIDTH &&
      localPos.x <= halfWidth + this.PLAYER_HALF_WIDTH &&
      localPos.z >= -halfDepth - this.PLAYER_HALF_WIDTH &&
      localPos.z <= halfDepth + this.PLAYER_HALF_WIDTH
    ) {
      const normalizedZ = (localPos.z + halfDepth) / wedgeSize.depth
      const rampHeight = normalizedZ * wedgeSize.height

      if (localPos.y <= rampHeight + 0.5 && localPos.y >= rampHeight - 1) {
        const rampPoint = new THREE.Vector3(localPos.x, rampHeight, localPos.z)
        rampPoint.applyMatrix4(wedge.matrixWorld)
        return rampPoint.y
      }
    }

    return null
  }

  getCylinderGroundLevel(x, y, z, cylinder) {
    const cylinderRadius = cylinder.userData.radius || 1
    const cylinderHeight = cylinder.userData.height || 2

    const worldToLocal = new THREE.Matrix4()
    worldToLocal.copy(cylinder.matrixWorld).invert()

    const localPos = new THREE.Vector3(x, y, z)
    localPos.applyMatrix4(worldToLocal)

    const distance2D = Math.sqrt(localPos.x * localPos.x + localPos.z * localPos.z)

    if (distance2D < cylinderRadius) {
      const topY = cylinderHeight / 2
      if (localPos.y <= topY && localPos.y >= topY - 1) {
        const topPoint = new THREE.Vector3(localPos.x, topY, localPos.z)
        topPoint.applyMatrix4(cylinder.matrixWorld)
        return topPoint.y
      }
    }

    return null
  }

  getCeilingLevel(x, y, z) {
    const collidables = this.environment.getCollidables()
    let lowestCeiling = Number.POSITIVE_INFINITY

    if (!collidables || collidables.length === 0) {
      return lowestCeiling
    }

    for (const collidable of collidables) {
      if (!collidable || !collidable.geometry) continue

      const hitboxType = collidable.userData.hitboxType || "box"

      if (hitboxType === "box" || hitboxType === "wedge") {
        const ceilingY = this.getBoxCeilingLevel(x, y, z, collidable)
        if (ceilingY !== null) {
          lowestCeiling = Math.min(lowestCeiling, ceilingY)
        }
      }
    }

    return lowestCeiling
  }

  getBoxCeilingLevel(x, y, z, box) {
    const worldToLocal = new THREE.Matrix4()
    worldToLocal.copy(box.matrixWorld).invert()

    const localPos = new THREE.Vector3(x, y, z)
    localPos.applyMatrix4(worldToLocal)

    const geometry = box.geometry
    geometry.computeBoundingBox()
    const localBox = geometry.boundingBox

    if (
      localPos.x >= localBox.min.x - this.PLAYER_HALF_WIDTH &&
      localPos.x <= localBox.max.x + this.PLAYER_HALF_WIDTH &&
      localPos.z >= localBox.min.z - this.PLAYER_HALF_WIDTH &&
      localPos.z <= localBox.max.z + this.PLAYER_HALF_WIDTH
    ) {
      if (localPos.y + this.PLAYER_HEIGHT >= localBox.min.y && localPos.y < localBox.min.y) {
        const bottomPoint = new THREE.Vector3(localPos.x, localBox.min.y, localPos.z)
        bottomPoint.applyMatrix4(box.matrixWorld)
        return bottomPoint.y
      }
    }

    return null
  }

  updateCamera() {
    const player = this.environment.getPlayer()
    if (!player) return

    const offsetX = Math.sin(this.cameraAngleX) * this.cameraDistance * Math.cos(this.cameraAngleY)
    const offsetY = Math.sin(this.cameraAngleY) * this.cameraDistance
    const offsetZ = Math.cos(this.cameraAngleX) * this.cameraDistance * Math.cos(this.cameraAngleY)

    this.camera.position.set(player.position.x + offsetX, player.position.y + offsetY + 2, player.position.z + offsetZ)
    this.camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z)
  }
}
