import * as THREE from "three";

export function createPortal({ scene, position = { x: 0, y: 1, z: 0 } } = {}) {
  const group = new THREE.Group();
  group.name = "MagicPortal";

  // Ring
  const ringGeo = new THREE.TorusGeometry(1.8, 0.16, 24, 100);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x66ccff,
    emissive: 0x1188ff,
    emissiveIntensity: 1.5,
    metalness: 0.2,
    roughness: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.castShadow = true;
  ring.receiveShadow = true;
  group.add(ring);

  // Core plane shimmer (increased size to match larger ring)
  const coreWidth = 3.0;
  const coreHeight = 3.8;
  const coreGeo = new THREE.PlaneGeometry(coreWidth, coreHeight);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x66ccff,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.rotation.y = Math.PI; // face camera if placed with rotation
  group.add(core);

  // Invisible collider (so player collision can detect portal)
  const colliderThickness = 0.2;
  const colliderGeo = new THREE.BoxGeometry(coreWidth, coreHeight, colliderThickness);
  const colliderMat = new THREE.MeshBasicMaterial({ visible: false });
  const collider = new THREE.Mesh(colliderGeo, colliderMat);
  collider.name = 'PortalCollider';
  collider.userData = collider.userData || {};
  collider.userData.collidable = true;
  collider.userData.isPortal = true;
  group.add(collider);

  // Light
  const light = new THREE.PointLight(0x66ccff, 1.2, 6);
  light.position.set(0, 0, 0);
  group.add(light);

  // Particles
  const particleCount = 80;
  const positions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.1 + Math.random() * 0.3;
    positions[i * 3 + 0] = Math.cos(a) * r;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
    positions[i * 3 + 2] = Math.sin(a) * r * 0.2;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const pMat = new THREE.PointsMaterial({ color: 0x99ddff, size: 0.05, transparent: true, opacity: 0.9 });
  const particles = new THREE.Points(pGeo, pMat);
  group.add(particles);

  group.position.set(position.x, position.y, position.z);

  let t = 0;
  function update(delta = 0.016) {
    t += delta;
    ring.rotation.x = Math.sin(t * 0.8) * 0.2;
    ring.rotation.z += delta * 0.6;
    core.material.opacity = 0.5 + Math.sin(t * 3.0) * 0.15;
    light.intensity = 1.1 + Math.sin(t * 2.2) * 0.4;

    // subtle particle drift
    const pos = pGeo.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      const iy = i * 3 + 1;
      pos.array[iy] += (Math.sin(t * 2 + i) * 0.002);
    }
    pos.needsUpdate = true;
  }

  if (scene) scene.add(group);

  return {
    group,
    setPosition: (x, y, z) => group.position.set(x, y, z),
    setRotation: (x, y, z) => group.rotation.set(x, y, z),
    update,
    collider,
    dispose: () => {
      if (scene) scene.remove(group);
      ringGeo.dispose();
      coreGeo.dispose();
      colliderGeo.dispose();
      pGeo.dispose();
    }
  };
}

export default createPortal;


