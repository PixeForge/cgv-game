// reflectorMirror.js - Create a standalone reflective mirror using THREE.js Reflector
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

/**
 * Creates a reflective mirror plane using the Reflector class
 * @param {Object} options - Configuration options
 * @param {THREE.Scene} options.scene - The scene to add the mirror to
 * @param {number} [options.width=10] - Width of the mirror
 * @param {number} [options.height=10] - Height of the mirror
 * @param {Object} [options.position={x:0, y:0, z:0}] - Position of the mirror
 * @param {Object} [options.rotation={x:0, y:0, z:0}] - Rotation of the mirror (in radians)
 * @param {number} [options.textureWidth=1024] - Resolution width of the reflection texture
 * @param {number} [options.textureHeight=1024] - Resolution height of the reflection texture
 * @param {number} [options.clipBias=0.003] - Clip bias for the reflection
 * @param {number} [options.color=0x889999] - Tint color of the reflection
 * @param {boolean} [options.addFrame=true] - Whether to add a decorative frame around the mirror
 * @param {number} [options.frameThickness=0.2] - Thickness of the frame
 * @param {number} [options.frameColor=0x8B4513] - Color of the frame (default brown/wood)
 * @returns {Object} Object containing the mirror group, reflector, and frame
 */
export function createReflectorMirror({
  scene,
  width = 10,
  height = 10,
  position = { x: 0, y: 0, z: 0 },
  rotation = { x: 0, y: 0, z: 0 },
  textureWidth = 1024,
  textureHeight = 1024,
  clipBias = 0.003,
  color = 0x889999,
  addFrame = true,
  frameThickness = 0.2,
  frameColor = 0x8B4513
} = {}) {
  if (!scene || typeof scene.add !== 'function') {
    throw new Error('createReflectorMirror: missing or invalid scene parameter');
  }

  // Create a group to hold everything
  const mirrorGroup = new THREE.Group();
  mirrorGroup.name = 'reflector_mirror_group';

  // Create the reflective surface geometry
  const geometry = new THREE.PlaneGeometry(width, height);

  // Create the Reflector
  const reflector = new Reflector(geometry, {
    clipBias: clipBias,
    textureWidth: textureWidth,
    textureHeight: textureHeight,
    color: color,
    multisample: 4
  });

  reflector.name = 'mirror_reflector';
  mirrorGroup.add(reflector);

  // Optionally add a decorative frame
  let frame = null;
  if (addFrame) {
    frame = createMirrorFrame(width, height, frameThickness, frameColor);
    mirrorGroup.add(frame);
  }

  // Apply position
  mirrorGroup.position.set(position.x, position.y, position.z);

  // Apply rotation
  mirrorGroup.rotation.set(rotation.x, rotation.y, rotation.z);

  // Add to scene
  scene.add(mirrorGroup);

  console.log(`✓ Reflector mirror created at position (${position.x}, ${position.y}, ${position.z})`);
  console.log(`  Size: ${width} x ${height}`);
  console.log(`  Reflection resolution: ${textureWidth} x ${textureHeight}`);

  return {
    mirrorGroup,
    reflector,
    frame,
    // Helper methods to adjust the mirror after creation
    setPosition: (x, y, z) => {
      mirrorGroup.position.set(x, y, z);
    },
    setRotation: (x, y, z) => {
      mirrorGroup.rotation.set(x, y, z);
    },
    setScale: (x, y, z) => {
      mirrorGroup.scale.set(x, y, z);
    }
  };
}

/**
 * Creates a decorative frame around the mirror
 */
function createMirrorFrame(width, height, thickness, color) {
  const frameGroup = new THREE.Group();
  frameGroup.name = 'mirror_frame';

  const frameMaterial = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.8,
    metalness: 0.2
  });

  // Top bar
  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(width + thickness * 2, thickness, thickness),
    frameMaterial
  );
  topBar.position.set(0, height / 2 + thickness / 2, 0);
  topBar.castShadow = true;
  topBar.receiveShadow = true;
  frameGroup.add(topBar);

  // Bottom bar
  const bottomBar = new THREE.Mesh(
    new THREE.BoxGeometry(width + thickness * 2, thickness, thickness),
    frameMaterial
  );
  bottomBar.position.set(0, -height / 2 - thickness / 2, 0);
  bottomBar.castShadow = true;
  bottomBar.receiveShadow = true;
  frameGroup.add(bottomBar);

  // Left bar
  const leftBar = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, height, thickness),
    frameMaterial
  );
  leftBar.position.set(-width / 2 - thickness / 2, 0, 0);
  leftBar.castShadow = true;
  leftBar.receiveShadow = true;
  frameGroup.add(leftBar);

  // Right bar
  const rightBar = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, height, thickness),
    frameMaterial
  );
  rightBar.position.set(width / 2 + thickness / 2, 0, 0);
  rightBar.castShadow = true;
  rightBar.receiveShadow = true;
  frameGroup.add(rightBar);

  return frameGroup;
}

export default createReflectorMirror;

