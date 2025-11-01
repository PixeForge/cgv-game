import * as THREE from "three"

export class Pathfinding {
  constructor(collidables) {
    this.collidables = collidables
    this.gridSize = 2
  }

  findPath(start, target, entityRadius = 0.5) {
    const direction = new THREE.Vector3().subVectors(target, start).normalize()

    // Check if direct path is clear
    if (!this.isPathBlocked(start, target, entityRadius)) {
      return direction
    }

    // Try alternative directions (left and right)
    const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x)

    const leftDir = direction.clone().add(perpendicular.clone().multiplyScalar(0.5)).normalize()
    const rightDir = direction.clone().add(perpendicular.clone().multiplyScalar(-0.5)).normalize()

    const testDistance = 2
    const leftTarget = start.clone().add(leftDir.multiplyScalar(testDistance))
    const rightTarget = start.clone().add(rightDir.multiplyScalar(testDistance))

    const leftBlocked = this.isPathBlocked(start, leftTarget, entityRadius)
    const rightBlocked = this.isPathBlocked(start, rightTarget, entityRadius)

    if (!leftBlocked) {
      return leftDir
    } else if (!rightBlocked) {
      return rightDir
    }

    // If both blocked, try moving perpendicular
    return perpendicular
  }

  isPathBlocked(start, end, entityRadius) {
    const direction = new THREE.Vector3().subVectors(end, start)
    const distance = direction.length()
    direction.normalize()

    const steps = Math.ceil(distance / 0.5)

    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const checkPos = start.clone().lerp(end, t)

      if (this.checkCollision(checkPos, entityRadius)) {
        return true
      }
    }

    return false
  }

  checkCollision(position, radius) {
    for (const collidable of this.collidables) {
      if (!collidable || !collidable.geometry) continue

      const hitboxType = collidable.userData.hitboxType || "box"

      if (hitboxType === "box" || hitboxType === "wedge") {
        const box = new THREE.Box3().setFromObject(collidable)
        const closestPoint = new THREE.Vector3(
          Math.max(box.min.x, Math.min(position.x, box.max.x)),
          Math.max(box.min.y, Math.min(position.y, box.max.y)),
          Math.max(box.min.z, Math.min(position.z, box.max.z)),
        )
        const distance = position.distanceTo(closestPoint)
        if (distance < radius) return true
      } else if (hitboxType === "circular") {
        const cylinderRadius = collidable.userData.radius || 1
        const cylinderPos = collidable.position
        const cylinderHeight = collidable.userData.height || 2
        const distance2D = Math.sqrt(Math.pow(position.x - cylinderPos.x, 2) + Math.pow(position.z - cylinderPos.z, 2))
        const withinHeight =
          position.y >= cylinderPos.y - cylinderHeight / 2 && position.y <= cylinderPos.y + cylinderHeight / 2
        if (distance2D < cylinderRadius + radius && withinHeight) return true
      }
    }
    return false
  }

  updateCollidables(collidables) {
    this.collidables = collidables
  }
}
