import * as THREE from "three";

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

export function train(Scene) {
  const roomGroup = new THREE.Group();
  roomGroup.name = "ChildBedroom";

  // Create the floor with marble texture
  const textureLoader = new THREE.TextureLoader();
  const floorTexture = textureLoader.load("./2nd level/Textures/Could be.webp");
  floorTexture.wrapS = THREE.RepeatWrapping;
  floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 10); // Adjust the repeat values to control texture tiling

  const floorGeometry = new THREE.PlaneGeometry(100, 100); // Adjust size as needed
  const floorMaterial = new THREE.MeshStandardMaterial({
    map: floorTexture,
    roughness: 0.2,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2; // Rotate to be horizontal
  floor.position.y = 0; // Place at ground level
  floor.receiveShadow = true;
  Scene.add(floor);

  // --- TOY BLOCKS (scattered colorful cubes) ---
  const blockColors = [0xff6b6b, 0xffb86b, 0xfff77a, 0x8bd3dd, 0x9b8cff];
  const blocks = new THREE.Group();
  for (let i = 0; i < 12; i++) {
    const size = 0.18 + Math.random() * 0.12;
    const g = new THREE.BoxGeometry(size, size, size);
    const m = new THREE.MeshStandardMaterial({
      color: blockColors[i % blockColors.length],
    });
    const cube = new THREE.Mesh(g, m);
    cube.position.set(
      (Math.random() - 0.5) * 3.5,
      size / 2,
      (Math.random() - 0.2) * 3.5
    );
    cube.rotation.y = Math.random() * Math.PI;
    cube.castShadow = true;
    blocks.add(cube);
  }
  blocks.scale.set(1.8, 2.2, 1.8);
  blocks.position.set(17, 0, -24);
  roomGroup.add(blocks);

  // --- AMBIENT LIGHT ---
  const ambient = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
  roomGroup.add(ambient);

  // Final position: put the room so that floor y=0 in world space
  roomGroup.position.y = 0;

  Scene.add(blocks); //code to add blocks to the scene

  return { roomGroup, blocks };
}
