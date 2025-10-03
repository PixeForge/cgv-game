// corporate.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function addCorporateHQ({
  scene,
  loader = null,
  url = './models/corporate_clash_toon_hq_interior.glb',
  position = null,
  scale = 2.5, // Increased from 1 to 2.5 for bigger size
  makeCollidable = true,
  onProgress = null
} = {}) {
  if (!scene || typeof scene.add !== 'function') {
    return Promise.reject(new Error('addCorporateHQ: missing `scene`. Pass a valid THREE.Scene instance.'));
  }

  const usedLoader = loader || new GLTFLoader();

  return new Promise((resolve, reject) => {
    usedLoader.load(
      url,
      (gltf) => {
        const corporateHQ = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (!corporateHQ) {
          reject(new Error('GLTF loaded but contains no scene'));
          return;
        }

        // Group to hold the corporate HQ (keeps transforms tidy)
        const corporateGroup = new THREE.Group();
        corporateGroup.name = 'corporate_hq_group';

        // Apply larger scale to the loaded model
        corporateHQ.scale.set(scale, scale, scale);
        corporateHQ.updateMatrixWorld(true);

        // Add corporate HQ to group
        corporateGroup.add(corporateHQ);

        // Compute bounding box for the model (in world space after scale)
        corporateHQ.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(corporateHQ);

        // Position next to playground - to the right side
        if (!position) {
          // Position to the right of the playground with some spacing
          corporateGroup.position.set(25, -box.min.y, 0); // Moved right (positive X) and aligned to floor
        } else {
          // apply provided position to the group
          corporateGroup.position.set(position.x || 0, position.y || 0, position.z || 0);
        }

        // Recompute bounding box now that we may have translated the group
        corporateGroup.updateMatrixWorld(true);
        const worldBox = new THREE.Box3().setFromObject(corporateGroup);

        // Collect collidable meshes
        const collidables = [];
        corporateGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = (child.name || '').toLowerCase();
            
            // Treat as collidable if explicitly flagged or if caller asked to make collidables
            if (makeCollidable || child.userData?.collidable === true || name.includes('collide') || name.includes('collision')) {
              collidables.push(child);
            }
            
            // Optional: Add specific material enhancements for toon style
            if (child.material) {
              // Enhance toon appearance if needed
              child.material.metalness = 0.1;
              child.material.roughness = 0.8;
            }
          }
        });

        // Add to scene
        scene.add(corporateGroup);

        console.log('Corporate HQ added:', { 
          position: corporateGroup.position.clone(), 
          box: worldBox.clone(),
          collidableMeshes: collidables.length,
          scale: scale
        });

        resolve({
          corporateGroup,
          corporateHQ,
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

export default addCorporateHQ;