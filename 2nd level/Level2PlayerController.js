// 2nd level/Level2PlayerController.js - Player Controller for Level 2
import * as THREE from 'three';

export class Level2PlayerController {
  constructor(environment, camera, renderer) {
    this.environment = environment;
    this.camera = camera;
    this.renderer = renderer;

    this.actions = {};
    this.baseActionName = 'idle';
    this.lastBaseActionName = null;
    this.overlayPlaying = null;

    this.onGround = true;
    this.velocityY = 0;
    this.keys = {};
    this.cameraAngleX = 0;
    this.cameraAngleY = 0.5;

    this.cameraDistance = 6; // third-person default
    this.firstPerson = false; // toggle mode
    this.pointerLocked = false;

    this.jumpCooldown = false;
    this.lastSpaceTime = 0;
    this.DOUBLE_TAP_MS = 300;

    this.PLAYER_HALF_WIDTH = 0.5;
    this.PLAYER_HEIGHT = 2.0;

    this.isOnTopOfBlock = false;  // Add this
     this.currentBlock = null;     // Add this

    this.mixer = null; // will be set when animations are initialized

    this.init();
  }

  init() {
    this.setupInputHandlers();
    this.enablePointerLock();
  }

  enablePointerLock() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      if (canvas.requestPointerLock) canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    document.addEventListener('pointerlockerror', () => {
      this.pointerLocked = false;
    });
  }

  setupAnimations(gltf) {
    // store mixer for later use
    this.mixer = this.environment.getMixer();

    gltf.animations.forEach((clip) => {
      const name = clip.name.toLowerCase();
      const action = this.mixer.clipAction(clip);
      this.actions[name] = action;

      if (name === 'idle' || name === 'running') {
        action.setLoop(THREE.LoopRepeat);
      } else {
        action.setLoop(THREE.LoopOnce, 0);
        action.clampWhenFinished = true;
      }

      action.enabled = true;
      action.setEffectiveWeight(0);
      action.play();
    });

    this.playBaseAction('idle');

    if (this.mixer) {
      this.mixer.addEventListener('finished', (e) => {
        const finishedName = this.getActionNameFromAction(e.action);
        if (!finishedName) return;
        if (finishedName === 'landing' || finishedName === 'jumping') {
          this.overlayPlaying = null;
          this.playBaseAction(this.determineBaseAction());
        }
      });
    }
  }

  getActionNameFromAction(action) {
    for (const n in this.actions) {
      if (this.actions[n] === action) return n;
    }
    return null;
  }

  playBaseAction(name) {
    if (!this.actions[name]) return;

    if (this.baseActionName === name) {
      this.actions[name].setEffectiveWeight(1.0);
      return;
    }

    this.lastBaseActionName = this.baseActionName;
    this.baseActionName = name;

    if (this.lastBaseActionName && this.actions[this.lastBaseActionName]) {
      const prev = this.actions[this.lastBaseActionName];
      prev.fadeOut(0.25);
    }

    const curr = this.actions[name];
    curr.reset();

    if (name === 'running') {
      curr.setEffectiveTimeScale(1.2);
    } else {
      curr.setEffectiveTimeScale(1.0);
    }

    curr.setEffectiveWeight(1.0);
    curr.fadeIn(0.25);
    curr.play();
  }

  playOverlayAction(name, { fadeIn = 0.12, fadeOut = 0.12, stopAfter = null } = {}) {
    if (!this.actions[name]) return;

    if (this.overlayPlaying && this.overlayPlaying !== name && this.actions[this.overlayPlaying]) {
      this.actions[this.overlayPlaying].fadeOut(fadeOut);
    }

    this.overlayPlaying = name;
    const a = this.actions[name];
    a.reset();
    a.setLoop(THREE.LoopOnce, 0);
    a.clampWhenFinished = true;
    a.enabled = true;
    a.setEffectiveWeight(1.0);
    a.setEffectiveTimeScale(1.0);
    a.fadeIn(fadeIn);
    a.play();

    if (stopAfter) {
      setTimeout(() => {
        if (this.overlayPlaying === name) {
          if (a) a.fadeOut(fadeOut);
          this.overlayPlaying = null;
          this.playBaseAction(this.determineBaseAction());
        }
      }, stopAfter * 1000);
    }
  }

  determineBaseAction() {
    if (!this.onGround) return 'jumping';
    return this.baseActionName || 'idle';
  }

  setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.code) this.keys[e.code] = true;

      if (e.code === 'Space') {
        this.handleSpacePress();
        e.preventDefault();
      }

      if (e.code === 'KeyC') {
        this.firstPerson = !this.firstPerson;
        this.cameraDistance = this.firstPerson ? 0.1 : 6;

        const player = this.environment.getPlayer();
        if (player) {
          player.visible = !this.firstPerson;
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code) this.keys[e.code] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.pointerLocked) {
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;
        this.cameraAngleX -= dx * 0.0025;
        this.cameraAngleY -= dy * 0.0025;
        this.cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2 - 0.01, this.cameraAngleY));
      }
    });

    document.addEventListener('wheel', (e) => {
      if (!this.firstPerson) {
        this.cameraDistance += e.deltaY * 0.01;
        this.cameraDistance = Math.max(3, Math.min(20, this.cameraDistance));
      }
    });
  }

  handleSpacePress() {
    this.triggerJump();
  }

  triggerJump() {
    const player = this.environment.getPlayer();
    if (!player || !this.onGround || this.jumpCooldown) return;
  
    // Simple jump - no complex ceiling detection
    this.velocityY = 8;
    this.onGround = false;
    this.playOverlayAction('jumping', { fadeIn: 0.08, fadeOut: 0.12, stopAfter: 1.0 });
  
    this.jumpCooldown = true;
    setTimeout(() => (this.jumpCooldown = false), 200);
  }
  
  update(delta, elapsedTime = 0) {
    if (this.mixer) this.mixer.update(delta);

    // Update environment moving parts (blocks) first so collisions use up-to-date positions
    // if (this.environment && typeof this.environment.updateBlocks === 'function') {
    //   try {
    //     this.environment.updateBlocks(delta, elapsedTime);
    //   } catch (e) {
    //     // ignore errors from environment updateBlocks to avoid breaking player update loop
    //     // console.warn('updateBlocks error', e);
    //   }
    // }

    this.updatePlayer(delta);
    this.updateCamera();
  }

  // Replace your entire updatePlayer method with this:

  updatePlayer(delta) {
    const player = this.environment.getPlayer();
    if (!player) return;
  
    const speed = 3;
    const move = new THREE.Vector3();
  
    if (this.keys['KeyW']) move.z -= 1;
    if (this.keys['KeyS']) move.z += 1;
    if (this.keys['KeyA']) move.x -= 1;
    if (this.keys['KeyD']) move.x += 1;
  
    const isMoving = move.lengthSq() > 0;
    const collidables = this.environment.getCollidables();
  
    // STEP 1: Build movement vector
    let movement = new THREE.Vector3();
    if (isMoving) {
      move.normalize();
      const forward = new THREE.Vector3(Math.sin(this.cameraAngleX), 0, Math.cos(this.cameraAngleX));
      const right = new THREE.Vector3(forward.z, 0, -forward.x);
  
      if (this.firstPerson) {
        movement.addScaledVector(forward, -move.z);
        movement.addScaledVector(right, -move.x);
      } else {
        movement.addScaledVector(forward, move.z);
        movement.addScaledVector(right, move.x);
      }
  
      movement.setY(0);
      movement.normalize().multiplyScalar(speed * delta);
    }
  
    // STEP 2: Apply gravity first
    this.velocityY -= 20 * delta;
    player.position.y += this.velocityY * delta;
  
    // STEP 3: Ground detection - find what we're standing on
    let groundY = -Infinity;
    this.isOnTopOfBlock = false;
    this.currentBlock = null;
  
    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;
  
      const objBox = new THREE.Box3().setFromObject(obj);
      
      // Check horizontal alignment
      const horizontallyAligned =
        player.position.x + this.PLAYER_HALF_WIDTH > objBox.min.x &&
        player.position.x - this.PLAYER_HALF_WIDTH < objBox.max.x &&
        player.position.z + this.PLAYER_HALF_WIDTH > objBox.min.z &&
        player.position.z - this.PLAYER_HALF_WIDTH < objBox.max.z;
  
      if (!horizontallyAligned) continue;
  
      const blockTop = objBox.max.y;
      const playerBottom = player.position.y; // Player's bottom is at position.y
      const distance = playerBottom - blockTop;
  
      // Check if we're standing on this object
      if (distance >= -0.5 && distance <= 0.1) {
        if (blockTop > groundY) {
          groundY = blockTop;
          this.isOnTopOfBlock = (obj.userData?.isBlock || obj.userData?.isMovingToyBlock);
          this.currentBlock = obj;
        }
      }
    }
  
    // STEP 4: Apply ground positioning
    if (groundY > -Infinity && player.position.y <= groundY + 0.1) {
      player.position.y = groundY + 0.02; // Small offset to prevent sinking
      this.velocityY = 0;
      this.onGround = true;
    } else if (!this.isOnTopOfBlock && player.position.y <= 0.05) {
      player.position.y = 0;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }
  
    // STEP 5: Horizontal movement with simplified collision detection
    if (movement.lengthSq() > 0) {
      const newPos = new THREE.Vector3(
        player.position.x + movement.x,
        player.position.y,
        player.position.z + movement.z
      );
  
      let canMove = true;
      
      // Check for collisions, but skip blocks we're standing on
      for (const obj of collidables) {
        if (obj.userData?.collidable === false) continue;
        
        // Skip the block we're currently standing on
        if (this.isOnTopOfBlock && obj === this.currentBlock) continue;
  
        const objBox = new THREE.Box3().setFromObject(obj);
        const playerBox = new THREE.Box3(
          new THREE.Vector3(
            newPos.x - this.PLAYER_HALF_WIDTH,
            newPos.y, // Player bottom at ground level
            newPos.z - this.PLAYER_HALF_WIDTH
          ),
          new THREE.Vector3(
            newPos.x + this.PLAYER_HALF_WIDTH,
            newPos.y + this.PLAYER_HEIGHT, // Player top
            newPos.z + this.PLAYER_HALF_WIDTH
          )
        );
  
        // Only check collision if we're not clearly above the object
        const playerBottom = playerBox.min.y;
        const objectTop = objBox.max.y;
        
        // If player is above the object, allow movement
        if (playerBottom > objectTop + 0.1) {
          continue;
        }
  
        if (playerBox.intersectsBox(objBox)) {
          canMove = false;
          break;
        }
      }
  
      if (canMove) {
        player.position.x = newPos.x;
        player.position.z = newPos.z;
      }
    }
  
    // STEP 6: Move with block if standing on a moving one
    if (this.isOnTopOfBlock && this.currentBlock && this.currentBlock.userData?.isMovingToyBlock) {
      player.position.x += this.currentBlock.userData.velocity.x * delta;
      player.position.z += this.currentBlock.userData.velocity.z * delta;
    }
  
    // STEP 7: Room bounds
    const roomBox = this.environment.getRoomBounds();
    if (roomBox) {
      const margin = this.PLAYER_HALF_WIDTH + 0.05;
      player.position.x = Math.max(roomBox.min.x + margin, Math.min(roomBox.max.x - margin, player.position.x));
      player.position.z = Math.max(roomBox.min.z + margin, Math.min(roomBox.max.z - margin, player.position.z));
    }
  
    // STEP 8: Animation state
    if (this.onGround) {
      if (isMoving) this.playBaseAction('running');
      else this.playBaseAction('idle');
    } else {
      if (!this.overlayPlaying) {
        this.playOverlayAction('jumping', { fadeIn: 0.08, fadeOut: 0.12 });
      }
    }
  
    // STEP 9: Rotate to face movement
    if (isMoving && movement.lengthSq() > 0) {
      const dir = new THREE.Vector3(movement.x, 0, movement.z).normalize();
      player.rotation.y = Math.atan2(dir.x, dir.z);
    }
  }

  updateCamera() {
    const player = this.environment.getPlayer();
    if (!player) return;

    if (this.firstPerson) {
      const eyeHeight = 1.6;
      const forward = new THREE.Vector3(Math.sin(this.cameraAngleX), 0, Math.cos(this.cameraAngleX));

      const eyePos = new THREE.Vector3(player.position.x, player.position.y + eyeHeight, player.position.z);
      const lookAt = new THREE.Vector3(player.position.x + forward.x, player.position.y + eyeHeight, player.position.z + forward.z);

      this.camera.position.copy(eyePos);
      this.camera.lookAt(lookAt);
    } else {
      const offsetX = Math.sin(this.cameraAngleX) * this.cameraDistance * Math.cos(this.cameraAngleY);
      const offsetY = Math.sin(this.cameraAngleY) * this.cameraDistance;
      const offsetZ = Math.cos(this.cameraAngleX) * this.cameraDistance * Math.cos(this.cameraAngleY);

      this.camera.position.set(
        player.position.x + offsetX,
        player.position.y + offsetY + 2,
        player.position.z + offsetZ
      );
      this.camera.lookAt(player.position.x, player.position.y + 1.5, player.position.z);
    }
  }
}

