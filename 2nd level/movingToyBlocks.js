// 2nd level\movingToyBlocks.js

import * as THREE from "three";

export function createInteractiveToyBlocks(Scene, camera, player, renderer) {
  // --- Create individual blocks ---
  const blockColors = [0xff6b6b, 0xffb86b, 0xfff77a, 0x8bd3dd, 0x9b8cff];
  const blocks = [];
  const interactionDistance = 3.0;

  for (let i = 0; i < 10; i++) {
    const size = (0.3 + Math.random() * 0.15) * 3.5; // scaled by 3.5
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({
      color: blockColors[i % blockColors.length],
      roughness: 0.4,
      metalness: 0.2,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.0, // default: off
    });

    const block = new THREE.Mesh(geometry, material);
    block.position.set(
      (Math.random() - 0.5) * 3 + 27, // keep x position more stable
      size / 2,
      (Math.random() - 0.5) * 10 - 24 // spread out along z axis
    );

    //block.scale.set(3.5, 3.5, 3.5);
    block.updateMatrixWorld(true);


    block.castShadow = true;
    block.receiveShadow = true;

    const light = new THREE.PointLight(0xffffff, 0.0, 3.0); // light off by default
    block.add(light);

    block.userData = {
      velocity: new THREE.Vector3(),
      pushing: false,
      isBlock: true, // ADD THIS LINE
      isMovingToyBlock: true // ADD THIS LINE
    };

    Scene.add(block);
    blocks.push(block);
  }

  // --- Flash animation control ---
  let flashTime = 0;

  // --- Popup setup ---
  const popup = document.createElement("div");
  popup.style.position = "absolute";
  popup.style.top = "50%";
  popup.style.left = "50%";
  popup.style.transform = "translate(-50%, -50%)";
  popup.style.padding = "10px 20px";
  popup.style.background = "rgba(255, 255, 255, 0.8)";
  popup.style.color = "black";
  popup.style.fontFamily = "Arial, sans-serif";
  popup.style.fontSize = "20px";
  popup.style.borderRadius = "10px";
  popup.style.display = "none";
  popup.style.pointerEvents = "none";
  popup.innerText = "Press P to push";
  document.body.appendChild(popup);

  // --- Keyboard ---
  const keys = {};
  window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
  window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

  // --- Find closest block to player ---
  function getClosestBlock() {
    let closest = null;
    let minDist = Infinity;
    const playerPos = player?.position ?? new THREE.Vector3();

    for (const b of blocks) {
      const dist = b.position.distanceTo(playerPos);
      if (dist < minDist) {
        minDist = dist;
        closest = b;
      }
    }

    return minDist < interactionDistance ? closest : null;
  }

  // --- Physics simulation ---
  function applyPhysics(delta) {
    blocks.forEach((block) => {
      const v = block.userData.velocity;

      // Update position based on velocity
      block.position.addScaledVector(v, delta);
      v.multiplyScalar(0.9); // friction

      // prevent block from falling below ground
      const minY = block.geometry.parameters.height / 2;
      if (block.position.y < minY) {
        block.position.y = minY;
        v.y = 0;
      }

      block.updateMatrixWorld(true);
    });
  }

  // --- Main update ---
  // --- Main update ---
function update(delta, elapsedTime) {
  flashTime += delta * 2;
  const glow = (Math.sin(flashTime) + 1) / 2;

  const nearest = getClosestBlock();
  const playerPos = player?.position ?? new THREE.Vector3();

  let playerIsNearAnyBlock = false;

  blocks.forEach((block) => {
    const dist = block.position.distanceTo(playerPos);
    const light = block.children[0];

    // Only glow if the block is close enough
    if (dist < interactionDistance) {
      const intensity = glow * 1.5;
      block.material.emissiveIntensity = intensity;
      if (light?.isPointLight) light.intensity = glow * 1.2;
      playerIsNearAnyBlock = true; // Player is near at least one block
    } else {
      block.material.emissiveIntensity = 0.0;
      if (light?.isPointLight) light.intensity = 0.0;
    }
  });

  // Only show popup if player is actually near a block
  if (playerIsNearAnyBlock && nearest) {
    popup.style.display = "block";

    // Toggle push mode on P
    if (keys["p"]) {
      nearest.userData.pushing = !nearest.userData.pushing;
      keys["p"] = false; // prevent rapid toggles
    }

    // If currently pushing, move in player's facing direction
    if (nearest.userData.pushing) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      nearest.userData.velocity.copy(dir.multiplyScalar(2.5));
    }
  } else {
    popup.style.display = "none";
    // Also make sure to turn off pushing if player moves away
    if (nearest && nearest.userData.pushing) {
      nearest.userData.pushing = false;
    }
  }

  applyPhysics(delta);
}

  return { blocks, update };
}
