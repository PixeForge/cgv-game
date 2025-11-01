// 1st level/modelPlacer.js
// Helper functions for placing models in Level 1

export async function placeModels(gardenScene) {
  // Place all models for the garden scene
  
  try {
    // Add tree model - adjust position, rotation, and scale as needed
    await gardenScene.addModel({
      url: './models/garden.glb',
      position: { x: -10, y: 42, z: 10 },
      rotation: { x: 0, y: Math.PI / 4, z: 0 },
      scale: 1.5,
      makeCollidable: false,
      name: 'tree_1'
    });

    // // Add more trees in different positions
    // await gardenScene.addModel({
    //   url: './models/tree.glb',
    //   position: { x: -8, y: 0, z: 5 },
    //   rotation: { x: 0, y: -Math.PI / 3, z: 0 },
    //   scale: 1.2,
    //   makeCollidable: false,
    //   name: 'tree_2'
    // });

    // await gardenScene.addModel({
    //   url: './models/tree.glb',
    //   position: { x: 12, y: 0, z: -7 },
    //   rotation: { x: 0, y: Math.PI / 2, z: 0 },
    //   scale: 1.8,
    //   makeCollidable: false,
    //   name: 'tree_3'
    // });

    // await gardenScene.addModel({
    //   url: './models/cartoon_fallen_tree.glb',
    //   position: { x: 0, y: -1, z: 0 },
    //   rotation: { x: 0, y: Math.PI / 4, z: 0 },
    //   scale: 0.2,
    //   makeCollidable: false,
    //   name: 'log'
    // });

    // You can add more models here as you create them
    // Example for other models:
    // await gardenScene.addModel({
    //   url: './models/bush.glb',
    //   position: { x: 0, y: 0, z: 0 },
    //   scale: 1,
    //   makeCollidable: false,
    //   name: 'bush_1'
    // });

    console.log('All models placed in garden scene');
  } catch (error) {
    console.error('Error placing models:', error);
  }
}

// Preset positions for common layout patterns
export const presetPositions = {
  // Circle arrangement
  circle: (radius, count) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      positions.push({
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius
      });
    }
    return positions;
  },

  // Grid arrangement
  grid: (rows, cols, spacing) => {
    const positions = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        positions.push({
          x: (col - cols / 2) * spacing,
          y: 0,
          z: (row - rows / 2) * spacing
        });
      }
    }
    return positions;
  },

  // Path arrangement
  path: (startX, startZ, endX, endZ, count) => {
    const positions = [];
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      positions.push({
        x: startX + (endX - startX) * t,
        y: 0,
        z: startZ + (endZ - startZ) * t
      });
    }
    return positions;
  }
};

// Quick placement helpers
export class ModelPlacer {
  constructor(gardenScene) {
    this.scene = gardenScene;
    this.placedModels = [];
  }

  async placeAt(url, position, options = {}) {
    const model = await this.scene.addModel({
      url,
      position,
      rotation: options.rotation || { x: 0, y: 0, z: 0 },
      scale: options.scale || 1,
      makeCollidable: options.makeCollidable !== false,
      name: options.name || `model_${this.placedModels.length}`
    });
    
    this.placedModels.push(model);
    return model;
  }

  async placeMultiple(url, positions, options = {}) {
    const models = [];
    for (let i = 0; i < positions.length; i++) {
      const model = await this.placeAt(url, positions[i], {
        ...options,
        name: options.name ? `${options.name}_${i}` : undefined
      });
      models.push(model);
    }
    return models;
  }

  clearAll() {
    this.placedModels.forEach(model => {
      this.scene.removeModel(model.model);
    });
    this.placedModels = [];
  }
}