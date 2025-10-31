import * as THREE from 'three';

export class PlayerController {
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
    this.isMouseDown = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.cameraAngleX = 0;
    this.cameraAngleY = 0.5;
    this.cameraDistance = 10;

    this.jumpCooldown = false;
    this.lastSpaceTime = 0;
    this.DOUBLE_TAP_MS = 300;

    this.PLAYER_HALF_WIDTH = 0.5;
    this.PLAYER_HEIGHT = 2.0;

    this.init();
  }

  init() {
    this.setupInputHandlers();
  }

  setupAnimations(gltf) {
    const mixer = this.environment.getMixer();

    gltf.animations.forEach((clip) => {
      const name = clip.name.toLowerCase();
      const action = mixer.clipAction(clip);
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

    mixer.addEventListener('finished', (e) => {
      const finishedName = this.getActionNameFromAction(e.action);
      if (!finishedName) return;

      if (finishedName === 'landing' || finishedName === 'jumping') {
        this.overlayPlaying = null;
        this.playBaseAction(this.determineBaseAction());
      }
    });
  }

  getActionNameFromAction(action) {
    for (const n in this.actions) {
      if (this.actions[n] === action) return n;
    }
    return null;
  }

  playBaseAction(name) {
    if (!this.actions[name]) return;
    if (this.baseActionName === name && this.lastBaseActionName === name) {
      this.actions[name].setEffectiveWeight(1.0);
      return;
    }
    this.lastBaseActionName = this.baseActionName;
    this.baseActionName = name;

    for (const n of Object.keys(this.actions)) {
      if (n === name) {
        this.actions[n].reset().setEffectiveWeight(1.0).setEffectiveTimeScale(1).play();
      } else if (n === this.lastBaseActionName && (n === 'idle' || n === 'running')) {
        this.actions[n].fadeOut(0.25);
      }
    }
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
    a.fadeIn(fadeIn);
    a.setEffectiveWeight(1.0);
    a.play();

    if (stopAfter) {
      setTimeout(() => {
        if (this.overlayPlaying === name) {
          a.fadeOut(fadeOut);
          this.overlayPlaying = null;
          this.playBaseAction(this.determineBaseAction());
        }
      }, stopAfter * 1000);
    }
  }

  determineBaseAction() {
    if (!this.onGround) return 'jumping';
    return this.baseActionName;
  }

  setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
      if (e.code) this.keys[e.code] = true;

      if (e.code === 'Space') {
        this.handleSpacePress();
        e.preventDefault();
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code) this.keys[e.code] = false;
    });

    document.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    document.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isMouseDown) {
        const dx = e.clientX - this.mouseX;
        const dy = e.clientY - this.mouseY;
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        this.cameraAngleX -= dx * 0.005;
        this.cameraAngleY -= dy * 0.005;
        this.cameraAngleY = Math.max(0.1, Math.min(Math.PI / 2, this.cameraAngleY));
      }
    });

    document.addEventListener('wheel', (e) => {
      this.cameraDistance += e.deltaY * 0.01;
      this.cameraDistance = Math.max(4, Math.min(20, this.cameraDistance));
    });
  }

  handleSpacePress() {
    this.triggerJump();
  }

  triggerJump() {
    const player = this.environment.getPlayer();
    if (!player || !this.onGround || this.jumpCooldown) return;

    const collidables = this.environment.getCollidables();
    const playerTopY = player.position.y + this.PLAYER_HEIGHT;
    const CEILING_BUFFER = this.PLAYER_HEIGHT / 2; // prevent jumping through low ceilings

    // Check for ceiling collisions directly above the player
    for (const obj of collidables) {
        const box = new THREE.Box3().setFromObject(obj);

        const intersectsX = player.position.x + this.PLAYER_HALF_WIDTH > box.min.x &&
                            player.position.x - this.PLAYER_HALF_WIDTH < box.max.x;
        const intersectsZ = player.position.z + this.PLAYER_HALF_WIDTH > box.min.z &&
                            player.position.z - this.PLAYER_HALF_WIDTH < box.max.z;

        const objectBottom = box.min.y;

        // Block jump only if ceiling is within CEILING_BUFFER
        if (intersectsX && intersectsZ && objectBottom < playerTopY + CEILING_BUFFER && objectBottom > player.position.y) {
            return; // Cannot jump through this object
        }
    }

    // Jump is allowed
    this.velocityY = 8;
    this.onGround = false;
    this.playOverlayAction('jumping', { fadeIn: 0.08, fadeOut: 0.12, stopAfter: 1.0 });

    this.jumpCooldown = true;
    setTimeout(() => (this.jumpCooldown = false), 200);
}



  update(delta) {
    this.updatePlayer(delta);
    this.updateCamera();
  }

  updatePlayer(delta) {
    const player = this.environment.getPlayer();
    if (!player) return;

    const speed = 5;
    const move = new THREE.Vector3();

    // --- Capture input ---
    if (this.keys['KeyW']) move.z -= 1;
    if (this.keys['KeyS']) move.z += 1;
    if (this.keys['KeyA']) move.x -= 1;
    if (this.keys['KeyD']) move.x += 1;

    const isMoving = move.lengthSq() > 0;
    if (isMoving) {
        move.normalize();
        move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngleX);
        move.multiplyScalar(speed * delta);
    }

    const collidables = this.environment.getCollidables();
    const PAD = 0.5;
    const STEP_HEIGHT = 0.5;

    // --- Determine current ground under player ---
    let groundY = 0;
    for (const obj of collidables) {
        const box = new THREE.Box3().setFromObject(obj);
        const px = player.position.x;
        const pz = player.position.z;

        if (px > box.min.x - PAD && px < box.max.x + PAD &&
            pz > box.min.z - PAD && pz < box.max.z + PAD) {
            groundY = Math.max(groundY, box.max.y);
        }
    }

    // --- Horizontal movement + step-up ---
    const nextPos = player.position.clone().add(move);

    let blocked = false;
    let maxStepUpY = -Infinity;

    for (const obj of collidables) {
        const box = new THREE.Box3().setFromObject(obj);

        // Horizontal collision box at player current height
        const playerBox = new THREE.Box3(
            new THREE.Vector3(nextPos.x - this.PLAYER_HALF_WIDTH, player.position.y, nextPos.z - this.PLAYER_HALF_WIDTH),
            new THREE.Vector3(nextPos.x + this.PLAYER_HALF_WIDTH, player.position.y + this.PLAYER_HEIGHT, nextPos.z + this.PLAYER_HALF_WIDTH)
        );

        // Skip objects below player's feet
        if (box.max.y <= player.position.y + 0.01) continue;

        if (playerBox.intersectsBox(box)) {
            const objectTop = box.max.y;

            // Step-up if obstacle is slightly above feet
            if (objectTop - player.position.y > 0 && objectTop - player.position.y <= STEP_HEIGHT) {
                maxStepUpY = Math.max(maxStepUpY, objectTop);
            } else {
                blocked = true;
                break;
            }
        }
    }

    if (!blocked) {
        player.position.add(move);

        if (maxStepUpY > -Infinity) {
            player.position.y = maxStepUpY;
            this.velocityY = 0;
            this.onGround = true;
        }
    }

    // --- Gravity ---
    this.velocityY -= 20 * delta;
    player.position.y += this.velocityY * delta;

    // --- Landing ---
    if (player.position.y <= groundY + 0.001) {
        if (!this.onGround) {
            this.playOverlayAction('landing', { fadeIn: 0.06, fadeOut: 0.12, stopAfter: 0.5 });
        }
        player.position.y = groundY;
        this.velocityY = 0;
        this.onGround = true;
    } else {
        this.onGround = false;
    }

    // --- Base animations ---
    if (this.onGround) {
        if (isMoving) this.playBaseAction('running');
        else this.playBaseAction('idle');
    }

    // --- Face movement direction ---
    if (isMoving) {
        const angle = Math.atan2(move.x, move.z);
        player.rotation.y = angle;
    }
}




  updateCamera() {
    const player = this.environment.getPlayer();
    if (!player) return;

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
