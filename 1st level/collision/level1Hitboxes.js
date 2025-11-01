import * as THREE from "three"

export class Level1Hitboxes {
  constructor(scene) {
    this.scene = scene
    this.hitboxes = []
    this.init()
  }

  init() {
    this.addBoxHitbox({
      position: { x: 33, y: 1, z: 20 },
      size: { width: 9.5, height: 2, depth: 2 },
      rotation: { x: 0, y: 10.2, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -1.4, y: 1, z: 28.3 },
      size: { width: 9.5, height: 2, depth: 1.5 },
      rotation: { x: 0, y: 9.5, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -18.5, y: 1, z: 12.5 },
      size: { width: 11, height: 2, depth: 1.5 },
      rotation: { x: 0, y: 10.7, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 8, y: 1, z: 54 },
      size: { width: 11, height: 2, depth: 2 },
      rotation: { x: 0, y: 10.45, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 44, y: 0, z: -49 },
      size: { width: 10, height: 3, depth: 2 },
      rotation: { x: 0, y: 10.8, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -7, y: 0, z: 53 },
      size: { width: 13, height: 3, depth: 2 },
      rotation: { x: 0, y: 10.8, z: 0 },
    })
 
 
    this.addBoxHitbox({
      position: { x: 86, y: 1, z: -30 },
      size: { width: 40, height: 4, depth: 40 },
      rotation: { x: 0, y: 11, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 86, y: 1, z: 6 },
      size: { width: 30, height: 4, depth: 40 },
      rotation: { x: 0, y: 11, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -6, y: 1, z: 80 },
      size: { width: 38, height: 4, depth: 40 },
      rotation: { x: 0, y: 11, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 4.4, y: 0, z: 14.8 },
      size: { width: 11.3, height: 3, depth: 2 },
      rotation: { x: 0, y: 11.4, z: 0 },
    })


    this.addBoxHitbox({
      position: { x: 82, y: 1, z: 45 },
      size: { width: 30, height: 8, depth: 5 },
      rotation: { x: 0, y: 10, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -36, y: 0, z: -45 },
      size: { width: 40, height: 10, depth: 40 },
      rotation: { x: 0, y: 0, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 43, y: 1, z: 29 },
      size: { width: 9, height: 2, depth: 2 },
      rotation: { x: 0, y: 10.2, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -58, y: 1, z: -2 },
      size: { width: 50, height: 5, depth: 50 },
      rotation: { x: 0, y: 10.2, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: -56, y: 1, z: 42 },
      size: { width: 40, height: 5, depth: 50 },
      rotation: { x: 0, y: 11, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 46.68, y: 1, z: -64.68 },
      size: { width: 7, height: 10, depth: 7 },
      rotation: { x: 0, y: 10.7, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 12.9, y: 0, z: -32.19 },
      size: { width: 12, height: 5, depth: 2},
      rotation: { x: 0, y: 6.3, z: 0 },
    })

    
    this.addBoxHitbox({
      position: { x: 13.9, y: 0, z: -45.19 },
      size: { width: 12, height: 5, depth: 2},
      rotation: { x: 0, y: 12.2, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 12.09, y: 0, z: -41.19 },
      size: { width: 12, height: 5, depth: 2},
      rotation: { x: 0, y: 8.3, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 12.09, y: 0, z: -71.19 },
      size: { width: 30, height: 30, depth: 2},
      rotation: { x: 0, y: 16, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 11.28, y: 0, z: -43.22 },
      size: { width: 12, height: 5, depth: 2},
      rotation: { x: 0, y: 10.5, z: 0 },
    })

    this.addBoxHitbox({
      position: { x: 44, y: 1, z: 6 },
      size: { width: 10, height: 2, depth: 2 },
      rotation: { x: 0, y: -2, z: 0 },
    })

    this.addCircularHitbox({
      position: { x: 64, y: 0, z: 16 },
      radius: 4,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 15, y: 0, z: -64.98 },
      radius: 5,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 24.3, y: 0, z: -65 },
      radius: 3.5,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })


    this.addCircularHitbox({
      position: { x: 38.17, y: 0, z: -65.5 },
      radius: 6.8,
      height: 15,
      rotation: {x:0 ,y:0 ,z: 0},
    })


    this.addCircularHitbox({
      position: { x: -1.6, y: 0, z: -4.5 },
      radius: 0.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -35.4, y: 0, z: 21.33 },
      radius: 1,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -13.5, y: 0, z: 5.2 },
      radius: 0.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 50.33, y: 0, z: 36.6 },
      radius: 0.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 66.4, y: 0, z: 56.9 },
      radius: 0.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 70.75, y: 0, z: 37.87 },
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 66.50, y: 0, z: 26.75 },
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 44.6, y: 0, z: -54.98 },
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    
    this.addCircularHitbox({
      position: { x: 42.61, y: 0, z: -39.10 },
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    
    this.addCircularHitbox({
      position: { x: 95, y: 0, z: 26.2 },
      radius: 8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    
    this.addCircularHitbox({
      position: { x: 65.59, y: 0, z: 45.48 },
      radius: 1.2,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })


    this.addCircularHitbox({
      position: { x: -7, y: 0, z: -8 },
      radius: 1.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -2.53, y: 0, z: -16.2 },
      radius: 1,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -6.77, y: 0, z: -27 },
      radius: 1,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 5.8, y: 0, z: -23.3 },
      radius: 1.8,
      height: 2,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 18.3, y: 0, z: -14.2 },
      radius: 0.6,
      height: 10,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 40, y: 0, z: 65 },
      radius: 24,
      height: 20,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -6, y: 0, z: 45.4 },
      radius: 0.8,
      height: 20,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -8, y: 0, z: 30 },
      radius: 0.8,
      height: 20,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 5.3, y: 0, z: 27.5 },
      radius: 0.8,
      height: 20,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 38.5, y: 0, z: 14.2},
      radius: 1,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -1.78, y: 0, z: 20},
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -14.4, y: 0, z: 14},
      radius: 1.5,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -29, y: 0, z: 13.3},
      radius: 1.5,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -26.3, y: 0, z: -2.3},
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -38.6, y: 0, z: 16},
      radius: 0.8,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -31.6, y: 0, z: -9.4},
      radius: 1.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 51, y: 0, z: 22.5},
      radius: 1,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -8.6, y: 0, z: -48},
      radius: 1.7,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 46.0, y: 0, z: -0.5 },
      radius: 1,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })
    
    this.addCircularHitbox({
      position: { x: 15, y: 0, z: 0.6 },
      radius: 2,
      height: 8,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 36.5, y: 0, z: -2.6 },
      radius: 4,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 39, y: 0, z: -17 },
      radius: 3.2,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 26.5, y: 0, z: 9 },
      radius: 0.8,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 17.4, y: 0, z: 19 },
      radius: 1.4,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 20, y: 0, z: 46.4 },
      radius: 1.4,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 12.6, y: 0, z: 46.2 },
      radius: 1,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 25, y: 0, z: -17 },
      radius: 3.2,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 13, y: 0, z: -18 },
      radius: 2.1,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: -27, y: 0, z: -20 },
      radius: 6,
      height: 10,
      rotation: {x:0 ,y:0 ,z: 0},
    })

    this.addCircularHitbox({
      position: { x: 30, y: 0, z: -10 },
      radius: 8,
      height: 4,
      rotation: {x:0 ,y:0 ,z: 0},
    })


  }

  addBoxHitbox({ position, size, rotation = { x: 0, y: 0, z: 0 } }) {
    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth)

    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)

    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0,
      wireframe: false,
    })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(position.x, position.y, position.z)
    mesh.rotation.set(rotation.x, rotation.y, rotation.z)

    wireframe.position.set(position.x, position.y, position.z)
    wireframe.rotation.set(rotation.x, rotation.y, rotation.z)

    mesh.userData.isCollisionBox = true
    mesh.userData.hitboxType = "box"
    mesh.name = "hitbox"

    this.scene.add(mesh)

    this.hitboxes.push(mesh)

    return mesh
  }

  addCircularHitbox({ position, radius, height, rotation = { x: 0, y: 0, z: 0 }, canStandOn = false }) {
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16)

    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)

    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0,
      wireframe: false,
    })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(position.x, position.y, position.z)
    mesh.rotation.set(rotation.x, rotation.y, rotation.z)

    wireframe.position.set(position.x, position.y, position.z)
    wireframe.rotation.set(rotation.x, rotation.y, rotation.z)

    mesh.userData.isCollisionBox = true
    mesh.userData.hitboxType = "circular"
    mesh.userData.radius = radius
    mesh.userData.height = height
    mesh.userData.canStandOn = canStandOn
    mesh.name = "hitbox-circular"

    this.scene.add(mesh)

    this.hitboxes.push(mesh)

    return mesh
  }

  addWedgeHitbox({ position, size, rotation = { x: 0, y: 0, z: 0 } }) {
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.lineTo(size.depth, 0)
    shape.lineTo(size.depth, size.height)
    shape.lineTo(0, 0)

    const extrudeSettings = {
      depth: size.width,
      bevelEnabled: false,
    }

    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.rotateY(Math.PI / 2)
    geometry.translate(-size.width / 2, 0, -size.depth / 2)

    const edges = new THREE.EdgesGeometry(geometry)
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff, linewidth: 2 })
    const wireframe = new THREE.LineSegments(edges, lineMaterial)

    const material = new THREE.MeshBasicMaterial({
      color: 0x0000ff,
      transparent: true,
      opacity: 0,
      wireframe: false,
    })
    const mesh = new THREE.Mesh(geometry, material)

    mesh.position.set(position.x, position.y, position.z)
    mesh.rotation.set(rotation.x, rotation.y, rotation.z)

    wireframe.position.set(position.x, position.y, position.z)
    wireframe.rotation.set(rotation.x, rotation.y, rotation.z)

    mesh.userData.isCollisionBox = true
    mesh.userData.hitboxType = "wedge"
    mesh.userData.size = size
    mesh.name = "hitbox-wedge"

    this.scene.add(mesh)

    this.hitboxes.push(mesh)

    return mesh
  }

  removeHitbox(hitbox) {
    const index = this.hitboxes.indexOf(hitbox)
    if (index > -1) {
      this.hitboxes.splice(index, 1)
      this.scene.remove(hitbox)
      if (hitbox.userData.wireframe) {
        this.scene.remove(hitbox.userData.wireframe)
      }
    }
  }

  toggleWireframeVisibility(visible) {
    this.hitboxes.forEach((hitbox) => {
      if (hitbox.userData.wireframe) {
        hitbox.userData.wireframe.visible = visible
      }
    })
  }

  getHitboxes() {
    return this.hitboxes
  }

  clearAll() {
    this.hitboxes.forEach((hitbox) => {
      this.scene.remove(hitbox)
      if (hitbox.userData.wireframe) {
        this.scene.remove(hitbox.userData.wireframe)
      }
    })
    this.hitboxes = []
  }
}
