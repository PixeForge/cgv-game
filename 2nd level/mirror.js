// addMirror.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function addMirror({
  scene,
  loader = null,
  url = './models/mirror_a.glb',
  position = null,
  scale = 5,
  makeCollidable = false,
  onProgress = null
} = {}) {
  if (!scene || typeof scene.add !== 'function') {
    return Promise.reject(new Error('addMirror: missing `scene`. Pass a valid THREE.Scene instance.'));
  }

  const usedLoader = loader || new GLTFLoader();

  return new Promise((resolve, reject) => {
    usedLoader.load(
      url,
      (gltf) => {
        const mirror = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (!mirror) {
          reject(new Error('GLTF loaded but contains no scene'));
          return;
        }

        // Group to hold the mirror (keeps transforms tidy)
        const mirrorGroup = new THREE.Group();
        mirrorGroup.name = 'mirror_group';

        // Apply scale to the loaded mirror object (not the group) so bounding box accounts for scale
        mirror.scale.set(scale, scale, scale);
        mirror.rotateY(Math.PI); 
        mirror.position.set(20, 0,5);
        mirror.updateMatrixWorld(true);

        // Add mirror to group
        mirrorGroup.add(mirror);

        // Compute bounding box for the mirror (in world space after scale)
        mirror.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(mirror);
        const size = box.getSize(new THREE.Vector3());
        const height = size.y;

        // If no explicit position provided, align bottom of mirror to y = 0 (floor)
        if (!position) {
          // box.min.y is mirror's bottom in world coordinates (before group translate)
          // We want to move the group up so box.min.y becomes 0
          mirrorGroup.position.y = -box.min.y;
        } else {
          // apply provided position to the group
          mirrorGroup.position.set(position.x || 0, position.y || 0, position.z || 0);
        }

        // Recompute bounding box now that we may have translated mirrorGroup
        mirrorGroup.updateMatrixWorld(true);
        const worldBox = new THREE.Box3().setFromObject(mirrorGroup);

        // Collect collidable meshes inside the mirror if requested or if meshes marked collidable
        const collidables = [];
        mirrorGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = (child.name || '').toLowerCase();
            // treat as collidable if explicitly flagged or if caller asked to make collidables
            if (makeCollidable || child.userData?.collidable === true || name.includes('collide') || name.includes('collision')) {
              collidables.push(child);
            }
          }
        });

        // Add to scene
        scene.add(mirrorGroup);

        // Slight log for debugging
        // console.log('Mirror added:', { position: mirrorGroup.position.clone(), box: worldBox.clone() });

        resolve({
          mirrorGroup,
          mirror,
          collidables,
          box: worldBox,
          gltf
        });
      },
      (xhr) => {
        if (xhr && xhr.lengthComputable && typeof onProgress === 'function') {
          onProgress((xhr.loaded / xhr.total) * 100);
        }
      },
      (error) => {
        reject(error);
      }
    );
  });
}

export default addMirror;
