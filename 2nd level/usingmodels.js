// usingmodels.js
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export async function createChildBedroom({
  scene,
  THREE,
  loader,
  url = "./models/Stewie.glb",
  onProgress,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!THREE) {
      reject(
        new Error(
          "createChildBedroom: missing THREE instance. Pass `THREE` from your main app."
        )
      );
      return;
    }
    if (!loader) {
      reject(
        new Error(
          "createChildBedroom: missing GLTFLoader instance. Pass `loader` from your main app."
        )
      );
      return;
    }

    loader.load(url, (gltf) => {
      const room = gltf.scene || (gltf.scenes && gltf.scenes[0]);
      if (!room) {
        reject(new Error("GLTF loaded but contains no scene"));
        return;
      }

      // Create group with the same THREE instance
      const roomGroup = new THREE.Group();
      room.name = "child_bedroom";
      room.scale.set(5.5, 5.5, 5.5);
      room.position.set(0, -1.75, 0);
      room.updateMatrixWorld(true);

      // Compute bounding box after scale/position
      let box = new THREE.Box3().setFromObject(room);
      const height = box.getSize(new THREE.Vector3()).y;

      room.updateMatrixWorld(true);

      // Recompute bounding box now that we've shifted the room vertically
      const roomBox = new THREE.Box3().setFromObject(room);

      const collidables = [];

      // --- explicit Object names you requested to be collidable ---
      // Store everything in lowercase to make matching case-insensitive.
      const explicitNamesLower = new Set(
        [
          // previous walls
          "Object_6",
          "Object_10",
          "Object_13",
          "Object_22",
          "Object_24",
          "Object_98", // wall
          "Base",
          "Cabinet",
          "Object_181", // wall
          "chest",
          //table with two chairs
          //"c1",
          //"c2",
          "l1",
          "l2",
          "l3",
          "l4",
          "l5",
          "l6",
          "l7",
          "l8",
          "tableTop",
          "leg1",
          "leg2",
          "leg3",
          "leg4",
        ].map((n) => n.toLowerCase())
      );

      // debugging helper: record names that were matched (use original names for clarity)
      const matchedNames = [];

      room.traverse((child) => {
        if (child.isMesh) {
          // ensure unique material instances so highlighting won't leak
          if (child.material) {
            child.material = child.material.clone();
          }

          child.castShadow = true;
          child.receiveShadow = true;

          // Normalize the node name for matching: lowercase + trim
          const originalName = child.name || "";
          const nameLower = originalName.toLowerCase().trim();

          // standard checks: explicit list (case-insensitive), userData flag, or collision keywords
          const isExplicit = explicitNamesLower.has(nameLower);
          const isMarked = child.userData?.collidable === true;
          // keyword matching done in lowercase form so it's resilient to case

          if (isExplicit || isMarked) {
            collidables.push(child);
            matchedNames.push(originalName || "(unnamed)");
          }
        }
      });

      // Add room into a group and to scene
      roomGroup.add(room);

      if (scene && typeof scene.add === "function") {
        scene.add(roomGroup);
      }

      resolve({ roomGroup, room, collidables, roomBox, gltf });
    });
  });
}

export default createChildBedroom;
