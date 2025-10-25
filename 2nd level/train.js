import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export async function addTrain({
  scene,
  loader = null,
  url = "./models/3_december2020_day_7_train_set.glb",
  position = null,
  scale = 0.045,
  makeCollidable = false,
  onProgress = null,
} = {}) {
  if (!scene || typeof scene.add !== "function") {
    return Promise.reject(
      new Error("addTrain: missing `scene`. Pass a valid THREE.Scene instance.")
    );
  }

  const usedLoader = loader || new GLTFLoader();

  return new Promise((resolve, reject) => {
    usedLoader.load(
      url,
      (gltf) => {
        const train = gltf.scene || (gltf.scenes && gltf.scenes[0]);
        if (!train) {
          reject(new Error("GLTF loaded but contains no scene"));
          return;
        }

        // Create a group that we can rotate later (the "track" center)
        const trainGroup = new THREE.Group();
        trainGroup.name = "train_group";

        train.scale.set(scale, scale, scale);
        train.position.set(30, 0, 0); // start position along X axis
        train.updateMatrixWorld(true);

        trainGroup.add(train);

        // Position the group correctly
        if (position) {
          trainGroup.position.set(
            position.x || 0,
            position.y || 0,
            position.z || 0
          );
        }

        // Shadows + collidables
        const collidables = [];
        trainGroup.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            const name = (child.name || "").toLowerCase();
            if (
              makeCollidable ||
              child.userData?.collidable === true ||
              name.includes("collide") ||
              name.includes("collision")
            ) {
              collidables.push(child);
            }
          }
        });

        scene.add(trainGroup);

        resolve({
          trainGroup,
          train,
          collidables,
          gltf,
        });
      },
      (xhr) => {
        if (xhr && xhr.lengthComputable && typeof onProgress === "function") {
          onProgress((xhr.loaded / xhr.total) * 100);
        }
      },
      (error) => reject(error)
    );
  });
}

export default addTrain;
