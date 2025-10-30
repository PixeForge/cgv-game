// 2nd level/mkChaser.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class MKChaser {
  constructor(scene, player, roomBounds) {
    this.scene = scene;
    this.player = player;
    this.roomBounds = roomBounds;

    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.activeActions = new Set();
    
    // Animation state
    this.currentBaseAction = 'idle';
    this.desiredBaseAction = 'idle';
    this.overlayAction = null;
    this.isTransitioning = false;

    // Store the last time position for running animation
    this.lastRunTime = 0;
    this.wasRunning = false;
    this.runAnimationPreservedTime = null; // Track preserved running time

    // --- Movement tuning ---
    this.baseSpeed = 0.01;
    this.minDistance = 2.5;
    this.attackDistance = 3.0;

    this.direction = new THREE.Vector3();

    // --- State machine ---
    this.onGround = true;
    this.attackCooldown = 0;
    this.attackCooldownTime = 3000;

    // Damage control
    this.hasDealtDamage = false;
    this.lastAttackTime = 0;

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

        this.model.traverse((child) => {
          if (child.isSkinnedMesh) child.frustumCulled = false;
        });

        this.scene.add(this.model);
        this.mixer = new THREE.AnimationMixer(this.model);

        // --- Setup animations ---
        gltf.animations.forEach((clip) => {
          const name = clip.name;
          const action = this.mixer.clipAction(clip);
          this.actions[name] = action;

          // Set loops
          if (name === "idle" || name === "mutant-run") {
            action.setLoop(THREE.LoopRepeat);
          } else {
            action.setLoop(THREE.LoopOnce);
            action.clampWhenFinished = true;
          }
        });

        // Start with idle
        this.fadeToAction('idle', 0.5);

        // Listen for finished events
        this.mixer.addEventListener('finished', (e) => {
          const finishedAction = e.action;
          const finishedName = this.getActionNameFromAction(finishedAction);
          
          if (!finishedName) return;
          
          // Handle overlay animations finishing
          if (this.overlayAction === finishedName) {
            this.fadeOutOverlay(0.2);
            
            if (finishedName === 'jump-attack' || finishedName === 'slash') {
              this.hasDealtDamage = false;
              this.attackCooldown = this.attackCooldownTime;
              this.lastAttackTime = Date.now();
            }
          }
        });

        console.log("✅ MK model loaded. Animations:", Object.keys(this.actions));
      },
      undefined,
      (err) => console.error("❌ Failed to load MK.glb:", err)
    );
  }

  getActionNameFromAction(action) {
    for (const n in this.actions) {
      if (this.actions[n] === action) return n;
    }
    return null;
  }

  fadeToAction(actionName, duration) {
    if (!this.actions[actionName] || this.currentBaseAction === actionName) {
      return;
    }

    // Store running animation time before transitioning away
    if (this.currentBaseAction === 'mutant-run' && this.actions['mutant-run']) {
      const runAction = this.actions['mutant-run'];
      this.runAnimationPreservedTime = runAction.time; // Store the exact time
      this.wasRunning = true;
      console.log(`Stored run time: ${this.runAnimationPreservedTime}`);
    }

    // Fade out current base action
    if (this.currentBaseAction && this.actions[this.currentBaseAction]) {
      const currentAction = this.actions[this.currentBaseAction];
      currentAction.fadeOut(duration);
      
      // Schedule removal after fade out
      setTimeout(() => {
        if (currentAction.isRunning() && this.currentBaseAction !== actionName) {
          currentAction.stop();
        }
      }, duration * 1000);
    }

    // Fade in new action
    const newAction = this.actions[actionName];
    
    // For running animation, resume from preserved time if available
    if (actionName === 'mutant-run' && this.runAnimationPreservedTime !== null) {
      newAction.time = this.runAnimationPreservedTime;
      console.log(`Resuming run animation from time: ${this.runAnimationPreservedTime}`);
    } else {
      newAction.reset();
      this.runAnimationPreservedTime = null; // Reset when starting fresh
    }
    
    newAction.setEffectiveTimeScale(1.0);
    newAction.setEffectiveWeight(1.0);
    newAction.fadeIn(duration);
    newAction.play();

    this.currentBaseAction = actionName;
    this.activeActions.add(actionName);
    
    // Update running state
    if (actionName === 'mutant-run') {
      this.wasRunning = true;
    } else {
      this.wasRunning = false;
      // Don't reset preserved time when switching away from running
      // We want to keep it for when we return to running
    }
    
    console.log(`MK Base Action: ${actionName}`);
  }

  playOverlayAction(actionName, fadeDuration = 0.15) {
    if (!this.actions[actionName] || this.overlayAction === actionName) {
      return;
    }

    // Store running animation time before overlay - but don't interfere with preserved time
    if (this.currentBaseAction === 'mutant-run' && this.actions['mutant-run'] && !this.overlayAction) {
      const runAction = this.actions['mutant-run'];
      this.runAnimationPreservedTime = runAction.time;
      this.wasRunning = true;
      console.log(`Stored run time for overlay: ${this.runAnimationPreservedTime}`);
    }

    // Fade out current overlay
    if (this.overlayAction && this.actions[this.overlayAction]) {
      this.fadeOutOverlay(fadeDuration);
    }

    // Play new overlay
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

    // Set damage flag when starting attack
    if (actionName === 'jump-attack' || actionName === 'slash') {
      this.hasDealtDamage = false;
    }
  }

  fadeOutOverlay(fadeDuration) {
    if (this.overlayAction && this.actions[this.overlayAction]) {
      const action = this.actions[this.overlayAction];
      action.fadeOut(fadeDuration);
      
      // Schedule removal after fade out
      setTimeout(() => {
        if (this.overlayAction && this.actions[this.overlayAction] === action) {
          action.stop();
          this.activeActions.delete(this.overlayAction);
        }
      }, fadeDuration * 1000);
    }
    
    this.overlayAction = null;
  }

  determineBaseAction() {
    const distance = this.model.position.distanceTo(this.player.position);
    
    if (distance <= this.minDistance) {
      return 'idle';
    } else {
      return 'mutant-run';
    }
  }

  // Continuously update the preserved running time while running
  updateRunningAnimationTime() {
    if (this.currentBaseAction === 'mutant-run' && this.actions['mutant-run']) {
      const runAction = this.actions['mutant-run'];
      this.runAnimationPreservedTime = runAction.time;
    }
  }

  update(delta = null) {
    if (!this.model || !this.player) return;

    const actualDelta = delta !== null ? delta : 0.016;
    
    if (this.mixer) this.mixer.update(actualDelta);

    // Update the running animation time continuously while running
    if (this.currentBaseAction === 'mutant-run') {
      this.updateRunningAnimationTime();
    }

    // Update attack cooldown - only when not paused (delta > 0)
    if (this.attackCooldown > 0 && actualDelta > 0) {
      this.attackCooldown -= actualDelta * 1000;
    }

    const mkPos = this.model.position;
    const playerPos = this.player.position;
    this.direction.subVectors(playerPos, mkPos);
    const distance = this.direction.length();

    // --- AI Logic ---
    // Only change base actions when not in an overlay animation AND game is not paused
    if (!this.overlayAction && actualDelta > 0) {
      const desiredAction = this.determineBaseAction();
      
      if (desiredAction !== this.currentBaseAction && !this.isTransitioning) {
        this.fadeToAction(desiredAction, 0.3);
      }

      // Check for attack opportunity - only when not paused
      if (distance <= this.attackDistance && this.attackCooldown <= 0) {
        const attackType = Math.random() > 0.5 ? 'jump-attack' : 'slash';
        console.log("Starting attack:", attackType);
        this.playOverlayAction(attackType, 0.15);
      }
    }

    // --- Movement (only when chasing, not attacking, and not paused) ---
    if (this.currentBaseAction === 'mutant-run' && !this.overlayAction && distance > this.minDistance && actualDelta > 0) {
      this.direction.normalize();
      const moveSpeed = this.baseSpeed * (distance > 8 ? 1.3 : 1.0);
      mkPos.addScaledVector(this.direction, moveSpeed);
    }

    // --- Rotation ---
    if ((this.currentBaseAction !== 'idle' || this.overlayAction) && actualDelta > 0) {
      const targetAngle = Math.atan2(this.direction.x, this.direction.z);
      this.model.rotation.y = THREE.MathUtils.lerp(
        this.model.rotation.y,
        targetAngle,
        0.1
      );
    }

    // --- Bounds ---
    if (this.roomBounds) {
      mkPos.x = Math.max(this.roomBounds.min.x, Math.min(this.roomBounds.max.x, mkPos.x));
      mkPos.z = Math.max(this.roomBounds.min.z, Math.min(this.roomBounds.max.z, mkPos.z));
    }
  }

  // Damage system that works like player collision
  canDamagePlayer() {
    // Only allow damage if:
    // 1. We're in an attack animation
    // 2. We haven't dealt damage this attack yet  
    // 3. We're close enough to the player
    // 4. The attack animation has progressed enough (mid-attack)
    if (!this.overlayAction || this.hasDealtDamage) {
      return false;
    }
    
    const distance = this.model.position.distanceTo(this.player.position);
    const canDamage = distance <= this.attackDistance + 0.5;
    
    // Check if we're in the "active frames" of the attack
    const currentAction = this.actions[this.overlayAction];
    if (currentAction) {
      const clipDuration = currentAction.getClip().duration;
      const currentTime = currentAction.time;
      
      // Only deal damage during the middle portion of the attack
      const damageStart = clipDuration * 0.3; // 30% through
      const damageEnd = clipDuration * 0.7;   // 70% through
      
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