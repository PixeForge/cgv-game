# Level 2 (Stewie's Room) - Complete Implementation

This folder contains all the code specific to Level 2 of the game, themed after Stewie Griffin's bedroom from Family Guy.

## 📁 File Structure

### Core Files
- **`Level2PlayerController.js`** - Player controller specifically for Level 2
  - Handles player movement, jumping, camera controls
  - Manages collision detection with room objects and interactive blocks
  - This is separate from other levels as each team member implements their own controller

- **`pauseMenu.js`** - Stewie's Room themed pause menu (Press 'O' to toggle)
  - Bright blue and bold red color scheme matching Stewie's room
  - Rocket emojis (🚀) for adventurous/mischievous theme
  - Comic Sans font for playful feel
  - Blue & red striped divider
  - "Mission Control" themed tips section
  - **Only displays in Level 2**

- **`Level2Timer.js`** - Mission timer for Level 2
  - Matches Stewie's room aesthetic (blue and red)
  - Displays elapsed time in MM:SS format
  - Rocket icon (🚀) with bouncing animation
  - **Only displays in Level 2**

### Scene Setup
- **`usingmodels.js`** - Loads and configures the bedroom model (Stewie.glb)
  - Sets up collidables (walls, furniture, etc.)
  - Handles room bounds

- **`terrain.js`** - Creates the floor, lighting, and manages toy blocks
  - Floor with texture
  - Wall near mirror with space texture
  - Interactive toy blocks integration

### Interactive Elements
- **`movingToyBlocks.js`** - Interactive, pushable colored blocks
  - 10 toy blocks scattered around position (27, 0, -24)
  - Press 'P' to push blocks in the direction you're facing
  - Blocks glow when you're nearby
  - Physics simulation with friction

- **`reflectorMirror.js`** - Creates real-time reflective mirrors using THREE.js Reflector
  - Planar reflection that updates every frame
  - Configurable size, position, rotation, resolution
  - Optional decorative frame

### Models & Assets
- **`mirror.js`** - Loads the decorative mirror model (mirror_a.glb)
- **`train.js`** - Loads and positions the toy train model

### Textures
- **`Textures/`** folder contains:
  - `20251015_2213_Blue Solar System Texture...png` - Space/cosmic wall texture
  - `Could be.webp` - Floor texture
  - `room_floor.webp` - Alternative floor texture

## 🎨 Theme

Level 2 uses **Stewie Griffin's Room theme** from Family Guy:
- **Bright blue walls** (#3399ff, #66b3ff, #e6f3ff) - Stewie's signature room color
- **Bold red accents** (#ff3333, #ff6666) - Energetic and adventurous
- Comic Sans MS font for playful, childlike feel
- Space textures with planets on walls (matches Stewie's scientific/inventive nature)
- **Rocket emojis** (🚀) for his adventurous personality
- Toy-like animations with gentle bouncing
- Red and blue striped patterns
- "Mission" themed language (Mission Control, Resume Conquest)

## 🎮 Gameplay Features

1. **Interactive Toy Blocks**
   - Find blocks scattered around the room
   - Press 'P' when near a block to enter push mode
   - Push blocks to solve puzzles or rearrange the room

2. **Reflective Mirror**
   - Real-time reflection showing the entire room
   - Reflects player, blocks, train, and all furniture

3. **Timer**
   - Quest timer appears in top-right corner
   - Tracks how long you spend in Level 2
   - Cosmic theme matching the level aesthetic

## 🎯 Level 2 Objectives

(Add your objectives here as you develop the level)

## 🔧 Integration

To use Level 2 components in your game:

```javascript
import { Level2PlayerController } from './2nd level/Level2PlayerController.js';
import { createReflectorMirror } from './2nd level/reflectorMirror.js';
import { createInteractiveToyBlocks } from './2nd level/movingToyBlocks.js';
import { createPauseMenu } from './2nd level/pauseMenu.js';
import { createAdventureTimer } from './2nd level/Level2Timer.js';
```

## 📝 Notes for Team Members

- This folder is self-contained for Level 2
- Feel free to modify the Level2PlayerController for your needs
- The Stewie's Room theme (bright blue + bold red) should be maintained for consistency
- Performance tip: Mirror resolution is set to 512x512 for balance between quality and speed
- **Pause menu and timer are ONLY for Level 2** - they don't appear in other levels

## 🎨 Stewie's Room Color Palette

**Primary Blue Colors:**
- Bright Blue: `#3399ff`
- Light Blue: `#66b3ff`
- Sky Blue: `#e6f3ff`
- Pale Blue: `#cce7ff`
- Dark Blue: `#0066cc`

**Accent Red Colors:**
- Bold Red: `#ff3333`
- Light Red: `#ff6666`
- Pale Red: `#ffe6e6`

**Backgrounds:**
- Blue gradient: `#e6f3ff` to `#cce7ff`
- Tips section: `#e6f3ff` to `#ffe6e6` (blue to red)

**Text Shadows:**
- Blue outline: `3px 3px 0px #0066cc`
- Red outline: `3px 3px 0px #ff6666`
- Blue glow: `rgba(51, 153, 255, 0.5)`
- Red glow: `rgba(255, 51, 51, 0.5)`

