// 2nd level\terrain.js
import * as THREE from "three";
import { createInteractiveToyBlocks } from "./movingToyBlocks.js";

// Utility to create a wall box you can position anywhere (near the mirror, etc.)
export function createWall(width, height, depth, x, y, z, paint, path) {
  const wallgeometry = new THREE.BoxGeometry(width, height, depth);
  const materialOptions = {};

  if (path) {
    const texture = new THREE.TextureLoader().load(path);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    texture.needsUpdate = true;
    materialOptions.map = texture;
  } else if (paint) {
    materialOptions.color = paint;
  }

  const wallmaterial = new THREE.MeshPhongMaterial(materialOptions);
  const wall = new THREE.Mesh(wallgeometry, wallmaterial);
  wall.position.set(x, y, z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  return wall;
}



export function train(scene, camera, player, renderer) {
  const roomGroup = new THREE.Group();
  roomGroup.name = "ChildBedroom";

  // --- Floor ---
  const textureLoader = new THREE.TextureLoader();
  const floorTexture = textureLoader.load("./2nd level/Textures/Could be.webp");
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10);

  const floorGeometry = new THREE.PlaneGeometry(100, 100);
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.2,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  scene.add(floor);

  // --- Toy blocks ---
  const { blocks, update: updateBlocks } = createInteractiveToyBlocks(
    scene,
    camera,
    player,
    renderer
  );

  // --- Wall near mirror ---
  const wallNearMirror = createWall(
    32, 35, 0.2,
    20, 35/2, 6.5,
    null,
    "2nd level/Textures/20251015_2213_Blue Solar System Texture_simple_compose_01k7mr2ssafgj912vz5pqzw3kd.png"
  );
  scene.add(wallNearMirror);

  // --- Ambient light ---
  const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  roomGroup.add(ambient);
  scene.add(roomGroup);

  // ✅ Wrap all toy blocks in a group so they stay together
  const blocksGroup = new THREE.Group();
  blocksGroup.name = "ToyBlocks";

  blocks.forEach(block => blocksGroup.add(block));
  scene.add(blocksGroup);

  // ✅ Return everything cleanly - IMPORTANT: Return individual blocks for collision detection
  return {
    roomGroup,
    blocks: blocks, // Return the individual blocks array, not the group
    blocksGroup: blocksGroup, // Also return the group if needed for organization
    wall: wallNearMirror,
    update: updateBlocks,
    getAllCollidables: function() {
      // Return all collidable objects including blocks and walls
      return [wallNearMirror, ...blocks];
    }
  };
}




