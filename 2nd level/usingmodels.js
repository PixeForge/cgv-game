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
          "Object_2",
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
        // handle regular meshes and skinned meshes
        if (child.isMesh) {
          // ensure unique material instances so highlighting won't leak
          if (child.material) {
            // clone arrays of materials or single material
            if (Array.isArray(child.material)) {
              child.material = child.material.map((m) => (m ? m.clone() : m));
            } else {
              child.material = child.material.clone();
            }
          }

          // Enable shadows for all meshes (skinned or static)
          child.castShadow = true;
          child.receiveShadow = true;

          // If this mesh has textures, mark them sRGB for correct color (common fix for dark textures)
          try {
            const mats = Array.isArray(child.material)
              ? child.material
              : [child.material];
            mats.forEach((mat) => {
              if (!mat) return;
              // If a color map is present, ensure correct encoding and mark for update
              if (mat.map) {
                mat.map.encoding = THREE.sRGBEncoding;
                mat.map.needsUpdate = true;
              }
              if (mat.emissiveMap) {
                mat.emissiveMap.encoding = THREE.sRGBEncoding;
                mat.emissiveMap.needsUpdate = true;
              }
              mat.needsUpdate = true;
            });
          } catch (e) {
            // ignore if THREE.sRGBEncoding isn't available or mapping fails
          }

          // Normalize the node name for matching: lowercase + trim
          const originalName = child.name || "";
          const nameLower = originalName.toLowerCase().trim();

          // standard checks: explicit list (case-insensitive), userData flag, or collision keywords
          const isExplicit = explicitNamesLower.has(nameLower);
          const isMarked = child.userData?.collidable === true;

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

      // --- Level 2: Add room-local lighting to ensure the bedroom is lit and casts shadows ---
      try {
        // Add a hemisphere light for soft ambient illumination
        const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
        hemi.position.set(0, 50, 0);
        roomGroup.add(hemi);

        // Directional light to create clear shadows inside the room
        const dir = new THREE.DirectionalLight(0xffffff, 1.0);
        // position the light above and slightly offset from the room center
        const roomCenter = new THREE.Vector3();
        roomBox.getCenter(roomCenter);
        const roomSize = new THREE.Vector3();
        roomBox.getSize(roomSize);
        dir.position.set(
          roomCenter.x + roomSize.x * 0.5,
          roomCenter.y + Math.max(roomSize.y, 10) + 10,
          roomCenter.z + roomSize.z * 0.5
        );
        dir.castShadow = true;

        // Configure shadow quality and extents based on room size
        const maxDim = Math.max(roomSize.x, roomSize.z, 10);
        try {
          dir.shadow.mapSize.width = 2048;
          dir.shadow.mapSize.height = 2048;
          dir.shadow.camera.near = 0.5;
          dir.shadow.camera.far = Math.max(50, roomSize.length() * 2);
          const ext = Math.max(20, maxDim * 1.2);
          dir.shadow.camera.left = -ext;
          dir.shadow.camera.right = ext;
          dir.shadow.camera.top = ext;
          dir.shadow.camera.bottom = -ext;
          dir.shadow.bias = -0.0005;
        } catch (e) {
          // ignore if shadow camera properties are not available for this build
        }

        roomGroup.add(dir);
      } catch (e) {
        // If lighting fails for any reason, continue without blocking the model load
        console.warn("Failed to add room-local lights for child bedroom:", e);
      }

      resolve({ roomGroup, room, collidables, roomBox, gltf });
    });
  });
}

export default createChildBedroom;
