// 2nd level/pathfinder.js
import * as THREE from "three";

export class Pathfinder {
    constructor(environment, cellSize = 1.0) {
        this.environment = environment;
        this.cellSize = cellSize;
        this.grid = null;
        this.gridBounds = null;
    }

    initGrid(roomBounds) {
        const width = Math.ceil((roomBounds.max.x - roomBounds.min.x) / this.cellSize);
        const depth = Math.ceil((roomBounds.max.z - roomBounds.min.z) / this.cellSize);
        
        this.grid = Array(depth).fill().map(() => Array(width).fill(0));
        this.gridBounds = {
            min: { x: roomBounds.min.x, z: roomBounds.min.z },
            max: { x: roomBounds.max.x, z: roomBounds.max.z }
        };

        this.updateGrid();
    }

    updateGrid() {
        if (!this.grid || !this.environment) return;

        const collidables = this.environment.getCollidables ? this.environment.getCollidables() : [];
        
        // Reset grid
        for (let z = 0; z < this.grid.length; z++) {
            for (let x = 0; x < this.grid[0].length; x++) {
                this.grid[z][x] = 0; // 0 = walkable
            }
        }

        // Mark obstacles
        for (const obj of collidables) {
            if (obj.userData?.collidable === false) continue;
            
            const objBox = new THREE.Box3().setFromObject(obj);
            this.markObstacleInGrid(objBox);
        }
    }

    markObstacleInGrid(objBox) {
        const startX = Math.floor((objBox.min.x - this.gridBounds.min.x) / this.cellSize);
        const endX = Math.floor((objBox.max.x - this.gridBounds.min.x) / this.cellSize);
        const startZ = Math.floor((objBox.min.z - this.gridBounds.min.z) / this.cellSize);
        const endZ = Math.floor((objBox.max.z - this.gridBounds.min.z) / this.cellSize);

        for (let z = Math.max(0, startZ); z <= Math.min(this.grid.length - 1, endZ); z++) {
            for (let x = Math.max(0, startX); x <= Math.min(this.grid[0].length - 1, endX); x++) {
                this.grid[z][x] = 1; // 1 = obstacle
            }
        }
    }

    worldToGrid(pos) {
        const x = Math.floor((pos.x - this.gridBounds.min.x) / this.cellSize);
        const z = Math.floor((pos.z - this.gridBounds.min.z) / this.cellSize);
        return { x, z };
    }

    gridToWorld(gridPos) {
        const x = this.gridBounds.min.x + (gridPos.x + 0.5) * this.cellSize;
        const z = this.gridBounds.min.z + (gridPos.z + 0.5) * this.cellSize;
        return new THREE.Vector3(x, 0, z);
    }

    isValidGridPos(pos) {
        return pos.x >= 0 && pos.x < this.grid[0].length && 
               pos.z >= 0 && pos.z < this.grid.length &&
               this.grid[pos.z][pos.x] === 0;
    }

    findPath(startPos, targetPos) {
        if (!this.grid) return null;

        const start = this.worldToGrid(startPos);
        const target = this.worldToGrid(targetPos);

        if (!this.isValidGridPos(start) || !this.isValidGridPos(target)) {
            return null;
        }

        // BFS implementation
        const queue = [{ pos: start, path: [start] }];
        const visited = new Set();
        visited.add(`${start.x},${start.z}`);

        const directions = [
            { x: 1, z: 0 },   // right
            { x: -1, z: 0 },  // left
            { x: 0, z: 1 },   // down
            { x: 0, z: -1 },  // up
            { x: 1, z: 1 },   // diagonal
            { x: 1, z: -1 },  // diagonal
            { x: -1, z: 1 },  // diagonal
            { x: -1, z: -1 }  // diagonal
        ];

        while (queue.length > 0) {
            const current = queue.shift();

            // Check if we reached target
            if (current.pos.x === target.x && current.pos.z === target.z) {
                return current.path.map(gridPos => this.gridToWorld(gridPos));
            }

            // Explore neighbors
            for (const dir of directions) {
                const neighbor = {
                    x: current.pos.x + dir.x,
                    z: current.pos.z + dir.z
                };

                const key = `${neighbor.x},${neighbor.z}`;
                
                if (!visited.has(key) && this.isValidGridPos(neighbor)) {
                    visited.add(key);
                    queue.push({
                        pos: neighbor,
                        path: [...current.path, neighbor]
                    });
                }
            }
        }

        return null; // No path found
    }

    getNextMoveDirection(currentPos, targetPos) {
        const path = this.findPath(currentPos, targetPos);
        if (!path || path.length < 2) return null;
      
        // Get the next position in the path
        const nextPos = path[1];
        const direction = new THREE.Vector3()
          .subVectors(nextPos, currentPos)
          .normalize();
        
        // Only return direction if it's meaningful (not too small)
        if (direction.length() < 0.1) {
          if (path.length > 2) {
            // Try the next point in path
            const nextNextPos = path[2];
            return new THREE.Vector3()
              .subVectors(nextNextPos, currentPos)
              .normalize();
          }
          return null;
        }
        
        return direction;
    }
}