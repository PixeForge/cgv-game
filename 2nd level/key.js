// 2nd level/key.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function createKey(scene, loader = null, position = null) {
  return new Promise((resolve, reject) => {
    const usedLoader = loader || new GLTFLoader();
    
    usedLoader.load(
      './models/key.glb',
      (gltf) => {
        const key = gltf.scene;
        
        // Set key properties
        key.name = 'level2_key';
        key.scale.set(10000, 10000, 10000); // Large scale since key might be small
        
        // Set position
        if (position) {
          key.position.set(position.x, position.y, position.z);
        } else {
          // Default position
          key.position.set(5, 3, 30);
        }
        
        // Add user data
        key.userData = {
          isKey: true,
          collected: false,
          originalY: key.position.y
        };
        
        // Set up key properties
        key.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        // Add point light to make key glow
        const keyLight = new THREE.PointLight(0xffd700, 2, 8);
        keyLight.position.set(0, 0.5, 0);
        key.add(keyLight);
        
        scene.add(key);
        
        console.log('Key created at position:', key.position);
        
        resolve({
          keyObject: key,
          gltf: gltf
        });
      },
      undefined,
      (error) => {
        console.error('Error loading key model:', error);
        reject(error);
      }
    );
  });
}

export function setupKeyInteraction(keyObject, player, onKeyCollect) {
  const collectDistance = 2.0;
  let isCollected = false;
  
  function update() {
    if (isCollected || !player || !keyObject.parent) return;
    
    const distance = keyObject.position.distanceTo(player.position);
    
    // Debug: log distance occasionally
    if (Date.now() % 3000 < 50) {
      console.log('Distance to key:', distance.toFixed(2));
    }
    
    if (distance < collectDistance) {
      collectKey();
    }
    
    // Floating animation
    if (!isCollected) {
      keyObject.position.y = keyObject.userData.originalY + Math.sin(Date.now() * 0.002) * 0.2;
      keyObject.rotation.y += 0.02;
    }
  }
  
  function collectKey() {
    if (isCollected) return;
    
    isCollected = true;
    keyObject.userData.collected = true;
    
    console.log('🎉 Key collected!');
    
    // Visual effects when collected
    keyObject.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.transparent = true;
        child.material.opacity = 0.7;
      }
    });
    
    // Remove from scene after a delay
    setTimeout(() => {
      if (keyObject.parent) {
        keyObject.parent.remove(keyObject);
        console.log('Key removed from scene');
      }
    }, 500);
    
    // Call callback
    if (onKeyCollect) {
      onKeyCollect();
    }
  }
  
  return {
    update,
    isCollected: () => isCollected,
    collectKey
  };
}