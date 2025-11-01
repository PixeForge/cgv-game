// 2nd level/mkChaser.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Pathfinder } from "/2nd level/pathfinder.js";

export class MKChaser {
  constructor(scene, player, roomBounds, environment) {
    this.scene = scene;
    this.player = player;
    this.roomBounds = roomBounds;
    this.environment = environment;

    this.model = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    // --- Pathfinding ---
    this.pathfinder = new Pathfinder(environment, 1.0); // Larger cell size
    this.pathfinder.initGrid(roomBounds);
    this.currentPath = null;
    this.pathUpdateTimer = 0;
    this.pathUpdateInterval = 0.01; // Longer interval - update path every 1 second

    // --- Movement tuning ---
    this.baseSpeed = 0.035;
    this.catchDistance = 1.5;

    this.direction = new THREE.Vector3();

    // --- State machine ---
    this.playerLost = false;
    this.hasCelebrated = false;

    // --- Collision detection ---
    this.MK_HALF_WIDTH = 0.8;
    this.MK_HEIGHT = 2.5;
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
        this.model.scale.set(2.5, 2.5, 2.5);
        this.model.position.set(10, 0, -2);
        this.scene.add(this.model);

        this.mixer = new THREE.AnimationMixer(this.model);

        gltf.animations.forEach((clip) => {
          if (clip.name === "mutant-run" || clip.name === "slash") {
            const action = this.mixer.clipAction(clip);
            if (clip.name === "mutant-run") {
              action.setLoop(THREE.LoopRepeat);
              action.timeScale = 0.8; // Slower running animation
            } else {
              action.setLoop(THREE.LoopOnce);
            }
            action.clampWhenFinished = true;
            this.actions[clip.name] = action;
          }
        });

        if (this.actions['mutant-run']) this.playAction('mutant-run');
        console.log("✅ MK loaded. Animations:", Object.keys(this.actions));
      },
      undefined,
      (err) => console.error("❌ Failed to load MK.glb:", err)
    );
  }

  playAction(name) {
    if (!this.actions[name]) return;
    
    if (this.currentAction === this.actions['slash'] && name !== 'slash') return;
    
    if (this.currentAction) this.currentAction.stop();
    const action = this.actions[name];
    action.reset();
    action.play();
    this.currentAction = action;
  }

  showLossPopup() {
    if (document.getElementById("lossPopup")) return;

    const popup = document.createElement("div");
    popup.id = "lossPopup";
    popup.innerHTML = "<h2 style='margin:0 0 8px 0'>You were caught!</h2><p style='margin:0'>Restarting level...</p>";
    Object.assign(popup.style, {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      background: "rgba(20,20,20,0.95)",
      color: "#fff",
      padding: "28px 40px",
      borderRadius: "12px",
      fontSize: "18px",
      textAlign: "center",
      zIndex: "999999",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
    });
    document.body.appendChild(popup);

    setTimeout(() => window.location.reload(), 2000);
  }

  update(delta = 0.016) {
    if (!this.model || !this.player) return;
    if (this.mixer) this.mixer.update(delta);
  
    const mkPos = this.model.position;
    const playerPos = this.player.position;
    const distance = mkPos.distanceTo(playerPos);
  
    // Player caught
    if (distance <= this.catchDistance && !this.playerLost) {
      if (!this.hasCelebrated) {
        this.hasCelebrated = true;
        this.playerLost = true;
        this.showLossPopup();
        setTimeout(() => {
          if (this.actions['slash']) this.playAction('slash');
        }, 300);
      }
      return;
    }
  
    if (this.playerLost) return;
  
    // Update pathfinding less frequently and only when needed
    this.pathUpdateTimer += delta;
    if (this.pathUpdateTimer >= this.pathUpdateInterval || !this.direction || distance < 5) {
      this.pathfinder.updateGrid();
      const newDirection = this.pathfinder.getNextMoveDirection(mkPos, playerPos);
      
      // Only update direction if we have a valid path and it's significantly different
      if (newDirection && newDirection.length() > 0.1) {
        this.direction = newDirection;
      }
      this.pathUpdateTimer = 0;
    }
  
    // Move along path if available
    if (this.direction && this.direction.length() > 0.1) {
      const movement = new THREE.Vector3()
        .copy(this.direction)
        .multiplyScalar(this.baseSpeed * delta * 60);
      
      this.applyMovementWithCollision(movement);
  
      // Rotation towards movement direction
      const targetAngle = Math.atan2(this.direction.x, this.direction.z);
      this.model.rotation.y = THREE.MathUtils.lerp(this.model.rotation.y, targetAngle, 0.2);
    } else {
      // Fallback: direct movement if pathfinding fails
      this.direction = new THREE.Vector3().subVectors(playerPos, mkPos).normalize();
      const movement = new THREE.Vector3()
        .copy(this.direction)
        .multiplyScalar(this.baseSpeed * delta * 60);
      this.applyMovementWithCollision(movement);
    }
  
    // Keep inside bounds
    if (this.roomBounds) {
      const margin = this.MK_HALF_WIDTH + 0.05;
      mkPos.x = Math.max(this.roomBounds.min.x + margin, Math.min(this.roomBounds.max.x - margin, mkPos.x));
      mkPos.z = Math.max(this.roomBounds.min.z + margin, Math.min(this.roomBounds.max.z - margin, mkPos.z));
    }
  
    // Physics
    this.updateMKPhysics(delta);
  }

  updateMKPhysics(delta) {
    if (!this.model) return;

    const mkPos = this.model.position;

    let collidables = [];
    if (this.environment && typeof this.environment.getCollidables === 'function') {
      collidables = this.environment.getCollidables();
    }

    this.velocityY -= 20 * delta;
    mkPos.y += this.velocityY * delta;

    let groundY = -Infinity;
    this.isOnTopOfBlock = false;
    this.currentBlock = null;

    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;
      const objBox = new THREE.Box3().setFromObject(obj);

      const aligned =
        mkPos.x + this.MK_HALF_WIDTH > objBox.min.x &&
        mkPos.x - this.MK_HALF_WIDTH < objBox.max.x &&
        mkPos.z + this.MK_HALF_WIDTH > objBox.min.z &&
        mkPos.z - this.MK_HALF_WIDTH < objBox.max.z;

      if (!aligned) continue;

      const blockTop = objBox.max.y;
      const mkBottom = mkPos.y;
      const dist = mkBottom - blockTop;

      if (dist >= -0.5 && dist <= 0.1) {
        if (blockTop > groundY) {
          groundY = blockTop;
          this.isOnTopOfBlock = (obj.userData?.isBlock || obj.userData?.isMovingToyBlock);
          this.currentBlock = obj;
        }
      }
    }

    if (groundY > -Infinity && mkPos.y <= groundY + 0.1) {
      mkPos.y = groundY + 0.02;
      this.velocityY = 0;
    } else if (!this.isOnTopOfBlock && mkPos.y <= 0.05) {
      mkPos.y = 0;
      this.velocityY = 0;
    }

    // move with moving block
    if (this.isOnTopOfBlock && this.currentBlock && this.currentBlock.userData?.isMovingToyBlock) {
      mkPos.x += this.currentBlock.userData.velocity.x * delta;
      mkPos.z += this.currentBlock.userData.velocity.z * delta;
    }
  }

  applyMovementWithCollision(movement) {
    if (!this.model || movement.lengthSq() === 0) return;

    const mkPos = this.model.position;
    let collidables = [];
    if (this.environment && typeof this.environment.getCollidables === 'function') {
      collidables = this.environment.getCollidables();
    } else {
      mkPos.add(movement);
      return;
    }

    const newPos = new THREE.Vector3(mkPos.x + movement.x, mkPos.y, mkPos.z + movement.z);
    let canMove = true;

    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;
      if (this.isOnTopOfBlock && obj === this.currentBlock) continue;

      const objBox = new THREE.Box3().setFromObject(obj);
      const mkBox = new THREE.Box3(
        new THREE.Vector3(newPos.x - this.MK_HALF_WIDTH, newPos.y, newPos.z - this.MK_HALF_WIDTH),
        new THREE.Vector3(newPos.x + this.MK_HALF_WIDTH, newPos.y + this.MK_HEIGHT, newPos.z + this.MK_HALF_WIDTH)
      );

      if (mkBox.intersectsBox(objBox)) {
        canMove = false;
        break;
      }
    }

    if (canMove) {
      mkPos.x = newPos.x;
      mkPos.z = newPos.z;
      return;
    }

    // try X only
    const newXPos = new THREE.Vector3(mkPos.x + movement.x, mkPos.y, mkPos.z);
    let canMoveX = true;
    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;
      if (this.isOnTopOfBlock && obj === this.currentBlock) continue;
      const objBox = new THREE.Box3().setFromObject(obj);
      const mkBoxX = new THREE.Box3(
        new THREE.Vector3(newXPos.x - this.MK_HALF_WIDTH, newXPos.y, newXPos.z - this.MK_HALF_WIDTH),
        new THREE.Vector3(newXPos.x + this.MK_HALF_WIDTH, newXPos.y + this.MK_HEIGHT, newXPos.z + this.MK_HALF_WIDTH)
      );
      if (mkBoxX.intersectsBox(objBox)) canMoveX = false;
    }
    if (canMoveX) mkPos.x = newXPos.x;

    // try Z only
    const newZPos = new THREE.Vector3(mkPos.x, mkPos.y, mkPos.z + movement.z);
    let canMoveZ = true;
    for (const obj of collidables) {
      if (obj.userData?.collidable === false) continue;
      if (this.isOnTopOfBlock && obj === this.currentBlock) continue;
      const objBox = new THREE.Box3().setFromObject(obj);
      const mkBoxZ = new THREE.Box3(
        new THREE.Vector3(newZPos.x - this.MK_HALF_WIDTH, newZPos.y, newZPos.z - this.MK_HALF_WIDTH),
        new THREE.Vector3(newZPos.x + this.MK_HALF_WIDTH, newZPos.y + this.MK_HEIGHT, newZPos.z + this.MK_HALF_WIDTH)
      );
      if (mkBoxZ.intersectsBox(objBox)) canMoveZ = false;
    }
    if (canMoveZ) mkPos.z = newZPos.z;
  }

  dispose() {
    if (this.mixer) this.mixer.stopAllAction();
    if (this.model) this.scene.remove(this.model);
    this.model = null;
    this.actions = {};
  }
}