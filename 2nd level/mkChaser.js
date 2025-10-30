// 2nd level/mkChaser.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class MKChaser {
  constructor(scene, player, roomBounds, environment) {
    this.scene = scene;
    this.player = player;
    this.roomBounds = roomBounds;
    this.environment = environment;

    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.activeActions = new Set();

    // Animation state
    this.currentBaseAction = 'idle';
    this.desiredBaseAction = 'idle';
    this.overlayAction = null;
    this.isTransitioning = false;

    this.runAnimationPreservedTime = null;
    this.wasRunning = false;

    // --- Movement tuning ---
    this.baseSpeed = 0.1;          // Base chase speed
    this.minDistance = 2.5;        // Stop distance
    this.attackDistance = 3.0;     // Attack trigger range

    this.direction = new THREE.Vector3();

    // --- State machine ---
    this.onGround = true;
    this.attackCooldown = 0;
    this.attackCooldownTime = 3000;
    this.hasDealtDamage = false;
    this.lastAttackTime = 0;

    // --- Collision detection ---
    this.MK_HALF_WIDTH = 0.8;      // Slightly wider than player
    this.MK_HEIGHT = 2.5;          // Slightly taller than player
    this.velocityY = 0;
    this.isOnTopOfBlock = false;
    this.currentBlock = null;

    this.loadModel();
  }

  loadModel() {
    const loader = new GLTFLoader();
    loader.load(
      "./models/MK.glb",
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.set(1.8, 1.8, 1.8);
        this.model.position.set(5, 0, -5);
        this.model.name = "MK_Enemy";

        // Disable root motion (prevents teleporting)
        this.model.traverse((child) => {
          if (child.isSkinnedMesh) child.frustumCulled = false;
          if (
            child.name.toLowerCase().includes("hips") ||
            child.name.toLowerCase().includes("root") ||
            child.name.toLowerCase().includes("armature")
          ) {
            child.position.set(0, 0, 0);
          }
        });

        this.scene.add(this.model);
        this.mixer = new THREE.AnimationMixer(this.model);

        // Setup animations
        gltf.animations.forEach((clip) => {
          const name = clip.name;
          const action = this.mixer.clipAction(clip);
          this.actions[name] = action;

          if (name === "idle" || name === "mutant-run") {
            action.setLoop(THREE.LoopRepeat);
          } else {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
          }
        });

        this.fadeToAction('idle', 0.3);

        // Listen for animation end
        this.mixer.addEventListener('finished', (e) => {
          this.handleAnimationFinished(e);
        });

        console.log("✅ MK model loaded. Animations:", Object.keys(this.actions));
      },
      undefined,
      (err) => console.error("❌ Failed to load MK.glb:", err)
    );
  }

  handleAnimationFinished(e) {
    const finishedAction = e.action;
    const finishedName = this.getActionNameFromAction(finishedAction);
    if (!finishedName) return;

    // Handle overlay animations ending
    if (this.overlayAction === finishedName) {
      console.log(`Overlay animation finished: ${finishedName}`);
      
      // Reset attack state
      if (finishedName === 'jump-attack' || finishedName === 'slash') {
        this.hasDealtDamage = false;
        this.attackCooldown = this.attackCooldownTime;
        this.lastAttackTime = Date.now();
      }

      // Fade out the overlay
      this.fadeOutOverlay(0.2);
      
      // IMPORTANT: Ensure base animation resumes
      this.resumeBaseAnimation();
    }
  }

  resumeBaseAnimation() {
    if (this.overlayAction) return; // Still fading out
    
    const desiredBaseAction = this.determineBaseAction();
    if (this.currentBaseAction !== desiredBaseAction) {
      console.log(`Resuming base animation: ${desiredBaseAction}`);
      this.fadeToAction(desiredBaseAction, 0.2);
    } else if (this.currentBaseAction && this.actions[this.currentBaseAction]) {
      // Make sure current base action is still playing
      const currentAction = this.actions[this.currentBaseAction];
      if (!currentAction.isRunning()) {
        console.log(`Restarting base animation: ${this.currentBaseAction}`);
        currentAction.reset().fadeIn(0.2).play();
      }
    }
  }

  getActionNameFromAction(action) {
    for (const n in this.actions) {
      if (this.actions[n] === action) return n;
    }
    return null;
  }

  fadeToAction(actionName, duration) {
    if (!this.actions[actionName] || this.currentBaseAction === actionName) return;

    console.log(`Fading to action: ${actionName}`);

    // Store running animation time
    if (this.currentBaseAction === 'mutant-run' && this.actions['mutant-run']) {
      const runAction = this.actions['mutant-run'];
      this.runAnimationPreservedTime = runAction.time;
      this.wasRunning = true;
    }

    // Fade out current action
    if (this.currentBaseAction && this.actions[this.currentBaseAction]) {
      const currentAction = this.actions[this.currentBaseAction];
      currentAction.fadeOut(duration);
      setTimeout(() => {
        if (currentAction.isRunning() && this.currentBaseAction !== actionName) {
          currentAction.stop();
        }
      }, duration * 1000);
    }

    // Fade in new action
    const newAction = this.actions[actionName];
    
    // Restore running animation time if applicable
    if (actionName === 'mutant-run' && this.runAnimationPreservedTime !== null) {
      newAction.time = this.runAnimationPreservedTime;
    }
    
    // Ensure the action is properly set up
    newAction.reset();
    newAction.setEffectiveTimeScale(1.0);
    newAction.setEffectiveWeight(1.0);
    newAction.fadeIn(duration);
    newAction.play();

    this.currentBaseAction = actionName;
    this.activeActions.add(actionName);
    this.wasRunning = actionName === 'mutant-run';
  }

  playOverlayAction(actionName, fadeDuration = 0.15) {
    if (!this.actions[actionName] || this.overlayAction === actionName) return;

    console.log(`Playing overlay action: ${actionName}`);

    // Save running time before overlay
    if (this.currentBaseAction === 'mutant-run' && !this.overlayAction) {
      const runAction = this.actions['mutant-run'];
      this.runAnimationPreservedTime = runAction.time;
      this.wasRunning = true;
    }

    // Stop old overlay
    if (this.overlayAction && this.actions[this.overlayAction]) {
      this.fadeOutOverlay(fadeDuration);
    }

    // Fade out base animation slightly during overlay
    if (this.currentBaseAction && this.actions[this.currentBaseAction]) {
      const baseAction = this.actions[this.currentBaseAction];
      baseAction.setEffectiveWeight(0.3); // Reduce weight but don't stop
    }

    // Play overlay
    const overlayAction = this.actions[actionName];
    overlayAction.reset();
    overlayAction.setLoop(THREE.LoopOnce);
    overlayAction.clampWhenFinished = true;
    overlayAction.setEffectiveTimeScale(1.0);
    overlayAction.setEffectiveWeight(1.0);
    overlayAction.fadeIn(fadeDuration);
    overlayAction.play();

    this.overlayAction = actionName;
    this.activeActions.add(actionName);

    if (actionName === 'jump-attack' || actionName === 'slash') {
      this.hasDealtDamage = false;
    }
  }

  fadeOutOverlay(fadeDuration) {
    if (this.overlayAction && this.actions[this.overlayAction]) {
      const action = this.actions[this.overlayAction];
      action.fadeOut(fadeDuration);
      setTimeout(() => {
        if (this.overlayAction && this.actions[this.overlayAction] === action) {
          action.stop();
          this.activeActions.delete(this.overlayAction);
          this.overlayAction = null;
          
          // Restore base animation weight
          if (this.currentBaseAction && this.actions[this.currentBaseAction]) {
            const baseAction = this.actions[this.currentBaseAction];
            baseAction.setEffectiveWeight(1.0);
          }
        }
      }, fadeDuration * 1000);
    }
  }

  determineBaseAction() {
    const distance = this.model.position.distanceTo(this.player.position);
    return distance <= this.minDistance ? 'idle' : 'mutant-run';
  }

  updateRunningAnimationTime() {
    if (this.currentBaseAction === 'mutant-run' && this.actions['mutant-run']) {
      this.runAnimationPreservedTime = this.actions['mutant-run'].time;
    }
  }

  update(delta = 0.016) {
    if (!this.model || !this.player) return;

    if (this.mixer) this.mixer.update(delta);
    if (this.currentBaseAction === 'mutant-run') this.updateRunningAnimationTime();

    // Apply gravity and collision detection
    this.updateMKPhysics(delta);

    if (this.attackCooldown > 0) {
      this.attackCooldown -= delta * 1000;
    }

    const mkPos = this.model.position;
    const playerPos = this.player.position;
    this.direction.subVectors(playerPos, mkPos);
    const distance = this.direction.length();

    // Handle base animation switching - only when no overlay is active
    if (!this.overlayAction) {
      const desiredAction = this.determineBaseAction();
      if (desiredAction !== this.currentBaseAction && !this.isTransitioning) {
        this.fadeToAction(desiredAction, 0.25);
      }

      // Trigger attack if in range
      if (distance <= this.attackDistance && this.attackCooldown <= 0) {
        const attackType = Math.random() > 0.5 ? 'jump-attack' : 'slash';
        this.playOverlayAction(attackType, 0.15);
      }
    }

    // --- Movement (with collision detection) ---
    if (this.currentBaseAction === 'mutant-run' && !this.overlayAction && distance > this.minDistance) {
      this.direction.normalize();

      // Smooth scaling of chase speed
      let moveSpeed = this.baseSpeed;
      if (distance > 10) moveSpeed *= 1.6;
      else if (distance > 6) moveSpeed *= 1.3;
      else if (distance < 4) moveSpeed *= 0.8;

      // Frame-independent motion with collision detection
      const movement = new THREE.Vector3();
      movement.copy(this.direction).multiplyScalar(moveSpeed * delta * 60);
      
      this.applyMovementWithCollision(movement, delta);
    }

    // --- Rotation (more responsive) ---
    if ((this.currentBaseAction !== 'idle' || this.overlayAction)) {
      const targetAngle = Math.atan2(this.direction.x, this.direction.z);
      this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, targetAngle, 0.2); // faster turn
    }

    // --- Bounds check ---
    if (this.roomBounds) {
      const margin = this.MK_HALF_WIDTH + 0.05;
      mkPos.x = Math.max(this.roomBounds.min.x + margin, Math.min(this.roomBounds.max.x - margin, mkPos.x));
      mkPos.z = Math.max(this.roomBounds.min.z + margin, Math.min(this.roomBounds.max.z - margin, mkPos.z));
    }
  }

  updateMKPhysics(delta) {
    if (!this.model) return;

    const mkPos = this.model.position;
    const collidables = this.environment ? this.environment.getCollidables() : [];

    // STEP 1: Apply gravity
    this.velocityY -= 20 * delta;
    mkPos.y += this.velocityY * delta;

    // STEP 2: Ground detection - find what we're standing on
    let groundY = -Infinity;
    this.isOnTopOfBlock = false;
    this.currentBlock = null;

    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;

      const objBox = new THREE.Box3().setFromObject(obj);
      
      // Check horizontal alignment
      const horizontallyAligned =
        mkPos.x + this.MK_HALF_WIDTH > objBox.min.x &&
        mkPos.x - this.MK_HALF_WIDTH < objBox.max.x &&
        mkPos.z + this.MK_HALF_WIDTH > objBox.min.z &&
        mkPos.z - this.MK_HALF_WIDTH < objBox.max.z;

      if (!horizontallyAligned) continue;

      const blockTop = objBox.max.y;
      const mkBottom = mkPos.y; // MK's bottom is at position.y
      const distance = mkBottom - blockTop;

      // Check if we're standing on this object
      if (distance >= -0.5 && distance <= 0.1) {
        if (blockTop > groundY) {
          groundY = blockTop;
          this.isOnTopOfBlock = (obj.userData?.isBlock || obj.userData?.isMovingToyBlock);
          this.currentBlock = obj;
        }
      }
    }

    // STEP 3: Apply ground positioning
    if (groundY > -Infinity && mkPos.y <= groundY + 0.1) {
      mkPos.y = groundY + 0.02; // Small offset to prevent sinking
      this.velocityY = 0;
      this.onGround = true;
    } else if (!this.isOnTopOfBlock && mkPos.y <= 0.05) {
      mkPos.y = 0;
      this.velocityY = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    // STEP 4: Move with block if standing on a moving one
    if (this.isOnTopOfBlock && this.currentBlock && this.currentBlock.userData?.isMovingToyBlock) {
      mkPos.x += this.currentBlock.userData.velocity.x * delta;
      mkPos.z += this.currentBlock.userData.velocity.z * delta;
    }
  }

  applyMovementWithCollision(movement, delta) {
    if (!this.model || movement.lengthSq() === 0) return;

    const mkPos = this.model.position;
    const collidables = this.environment ? this.environment.getCollidables() : [];

    const newPos = new THREE.Vector3(
      mkPos.x + movement.x,
      mkPos.y,
      mkPos.z + movement.z
    );

    let canMove = true;
    
    // Check for collisions, but skip blocks we're standing on
    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;
      
      // Skip the block we're currently standing on
      if (this.isOnTopOfBlock && obj === this.currentBlock) continue;

      const objBox = new THREE.Box3().setFromObject(obj);
      const mkBox = new THREE.Box3(
        new THREE.Vector3(
          newPos.x - this.MK_HALF_WIDTH,
          newPos.y, // MK bottom at ground level
          newPos.z - this.MK_HALF_WIDTH
        ),
        new THREE.Vector3(
          newPos.x + this.MK_HALF_WIDTH,
          newPos.y + this.MK_HEIGHT, // MK top
          newPos.z + this.MK_HALF_WIDTH
        )
      );

      // Only check collision if we're not clearly above the object
      const mkBottom = mkBox.min.y;
      const objectTop = objBox.max.y;
      
      // If MK is above the object, allow movement
      if (mkBottom > objectTop + 0.1) {
        continue;
      }

      if (mkBox.intersectsBox(objBox)) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      mkPos.x = newPos.x;
      mkPos.z = newPos.z;
    }
  }

  canDamagePlayer() {
    if (!this.overlayAction || this.hasDealtDamage) return false;

    const distance = this.model.position.distanceTo(this.player.position);
    const canDamage = distance <= this.attackDistance + 0.5;
    const currentAction = this.actions[this.overlayAction];

    if (currentAction) {
      const clipDuration = currentAction.getClip().duration;
      const currentTime = currentAction.time;
      const damageStart = clipDuration * 0.3;
      const damageEnd = clipDuration * 0.7;

      if (canDamage && currentTime >= damageStart && currentTime <= damageEnd) {
        this.hasDealtDamage = true;
        console.log("MK dealing damage to player!");
        return true;
      }
    }
    return false;
  }

  dispose() {
    if (this.mixer) {
      this.mixer.stopAllAction();
      this.mixer.removeEventListener("finished");
    }
  }
}