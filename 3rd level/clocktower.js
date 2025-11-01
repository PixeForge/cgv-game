
import { QuizUISystem } from './public/quiz-ui.js';

import { QUIZZES } from './public/quizzes.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


export class Environment {
  constructor() {
    this.scene = new THREE.Scene();
    this.collidables = [];
    this.player = null;
    this.mixer = null;
    this.playerStartPosition = new THREE.Vector3(0, 0, 10);
    this.roomSize = 100;
    this.onQuizTrigger = null;
    this.onCorrectAnswer = null;
    this.onWrongAnswer = null;
    this.onGameWon = null;
    this.onGameLost = null;
    
    // Game state
    this.gameState = {
      attemptsRemaining: 2,
      currentStage: 0,
      hasAnsweredCurrentStage: false,
      gameOver: false,
      gameWon: false
    };
    
    // Quizzes: randomly sample 5 from a directory of 15 each play
    this.allQuizzes = Array.isArray(QUIZZES) ? QUIZZES : [];
    this.quizzes = this.sampleQuizzes(this.allQuizzes, 5);
  this.quizUI = new QuizUISystem(this);

    // --- Wire quiz callbacks ---
    this.setOnQuizTrigger((quiz, state) => {
      // Player reached the bolt: hide the current clue and show the quiz
      if (this.quizUI && typeof this.quizUI.clearClue === 'function') {
        this.quizUI.clearClue();
      }
      this.quizUI.showQuiz(quiz, state);
    });

    this.setOnCorrectAnswer((clue) => {
      // Close the quiz and update the persistent clue for the next bolt
      if (this.quizUI) {
        if (typeof this.quizUI.closeQuiz === 'function') this.quizUI.closeQuiz();
        if (typeof this.quizUI.setClue === 'function') this.quizUI.setClue(clue);
      }
    });

    this.setOnWrongAnswer((remaining) => {
      this.quizUI.showMessage(`⚠️ Try again! ${remaining} attempts remaining.`);
    });

    this.setOnGameWon(() => {
      if (this.quizUI && typeof this.quizUI.clearClue === 'function') this.quizUI.clearClue();
      if (this.quizUI && typeof this.quizUI.showGameWon === 'function') this.quizUI.showGameWon();
      else this.quizUI.closeQuiz(3000);
    });

    this.setOnGameLost(() => {
      if (this.quizUI && typeof this.quizUI.clearClue === 'function') this.quizUI.clearClue();
      if (this.quizUI && typeof this.quizUI.showGameLost === 'function') this.quizUI.showGameLost();
      else this.quizUI.closeQuiz(3000);
    });
    // Platform triggers
    this.platformTriggers = [];
    this.specialBolt = null;
    this.checkPlatformTrigger = false;
    
    // Smooth bump + ragdoll support
    this.playerVelocity = new THREE.Vector3();
    this.bumpDamping = 6;
    this.bumpMaxSpeed = 12;
    this._bumpCooldown = 0;
    this._gravity = new THREE.Vector3(0, -9.81, 0);
    // Optional physics for ragdoll via cannon-es (loaded dynamically)
    this.cannon = { CANNON: null, world: null };
    this.ragdoll = null; // { bodies: CANNON.Body[], visuals: THREE.Mesh[] }

    // Track extra colliders
    this.poles = [];
    this.bolts = [];
    this.beams = [];
    this.pipes = [];
    this.nuts = [];

    // Grounding/stepping
    this.playerVelY = 0;
    this.grounded = false;
    this.groundObject = null; // null = floor, or a platform mesh
    this.stepHeight = 0.7;    // max height we auto-step up
    this.playerRadius = 0.5;  // used for horizontal bounds checks
    // Audio system
this.audioContext = null;
this.soundtrack = null;
this.soundtrackSource = null;
this.soundtrackGain = null;
this.isSoundtrackLoaded = false;
this.isSoundtrackPlaying = false;
    this.init();
    // Attempt to load cannon-es in the background for ragdoll support
    this.initPhysics().catch(() => {/* optional */});
  }
  // --- Setter methods ---
  setOnQuizTrigger(cb) { this.onQuizTrigger = cb; }
  setOnCorrectAnswer(cb) { this.onCorrectAnswer = cb; }
  setOnWrongAnswer(cb) { this.onWrongAnswer = cb; }
  setOnGameWon(cb) { this.onGameWon = cb; }
  setOnGameLost(cb) { this.onGameLost = cb; }
 async initAudio() {
    if (this.audioContext) return; // Already initialized
    
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create gain node for volume control
      this.soundtrackGain = this.audioContext.createGain();
      this.soundtrackGain.gain.value = 0.3; // 30% volume
      this.soundtrackGain.connect(this.audioContext.destination);
      
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  async loadSoundtrack(url = './public/clocktower_soundtrack.mp3') {
    if (!this.audioContext) {
      await this.initAudio();
    }
    
    try {
      console.log('Loading soundtrack...');
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      this.soundtrack = await this.audioContext.decodeAudioData(arrayBuffer);
      this.isSoundtrackLoaded = true;
      console.log('Soundtrack loaded successfully');
      return true;
    } catch (error) {
      console.error('Failed to load soundtrack:', error);
      return false;
    }
  }

  playSoundtrack() {
    if (!this.isSoundtrackLoaded || !this.soundtrack) {
      console.warn('Soundtrack not loaded yet');
      return;
    }
    
    // Stop any existing playback
    this.stopSoundtrack();
    
    // Create new source
    this.soundtrackSource = this.audioContext.createBufferSource();
    this.soundtrackSource.buffer = this.soundtrack;
    this.soundtrackSource.loop = true; // This makes it loop automatically!
    this.soundtrackSource.connect(this.soundtrackGain);
    
    // Start playing
    this.soundtrackSource.start(0);
    this.isSoundtrackPlaying = true;
    console.log('Soundtrack playing (looping enabled)');
  }

  stopSoundtrack() {
    if (this.soundtrackSource) {
      try {
        this.soundtrackSource.stop();
      } catch (e) {
        // Already stopped
      }
      this.soundtrackSource = null;
      this.isSoundtrackPlaying = false;
    }
  }

  pauseSoundtrack() {
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
    }
  }

  resumeSoundtrack() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  setSoundtrackVolume(volume) {
    if (this.soundtrackGain) {
      // Clamp volume between 0 and 1
      this.soundtrackGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }
  // Utility: sample n unique quizzes from a larger directory
  sampleQuizzes(source, n) {
    const arr = Array.isArray(source) ? source.slice() : [];
    // Fisher-Yates shuffle first n positions
    for (let i = 0; i < Math.min(n, arr.length); i++) {
      const j = i + Math.floor(Math.random() * (arr.length - i));
      const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr.slice(0, Math.min(n, arr.length));
  }

  // --- Trigger methods ---
  triggerQuiz() { if(this.onQuizTrigger) this.onQuizTrigger(this.quizzes[this.gameState.currentStage], this.gameState); }
  triggerCorrectAnswer(clue) { if(this.onCorrectAnswer) this.onCorrectAnswer(clue); }
  triggerWrongAnswer(rem) { if(this.onWrongAnswer) this.onWrongAnswer(rem); }
  triggerGameWon() { if(this.onGameWon) this.onGameWon(); }
  triggerGameLost() { if(this.onGameLost) this.onGameLost(); }

  // --- Quiz answer handler ---
  handleQuizAnswer(isCorrect) {
    const state = this.gameState;
    if (state.hasAnsweredCurrentStage) return;
    state.hasAnsweredCurrentStage = true;

    if (isCorrect) {
      state.currentStage++;
      if (state.currentStage >= this.quizzes.length) {
        state.gameWon = true;
        this.quizUI.showMessage("🏆 You solved all riddles!");
      } else {
        this.quizUI.showMessage("✅ Correct! Proceed to the next mechanism.");
      }
    } else {
      state.attemptsRemaining--;
      if (state.attemptsRemaining <= 0) {
        state.gameOver = true;
        this.quizUI.showMessage("💀 No attempts left. Game Over.");
      } else {
        this.quizUI.showMessage(`❌ Wrong! ${state.attemptsRemaining} attempts remaining.`);
      }
    }
  }

  init() {
    this.scene.background = new THREE.Color(0x8B7355);
    this.scene.fog = new THREE.Fog(0x8B7355, 80, 200);
    
    // Bright ambient light
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    
    // Strong directional light from clock face
    const clockLight = new THREE.DirectionalLight(0xfff5e1, 1.2);
    clockLight.position.set(0, 30, -45);
    clockLight.castShadow = true;
    this.scene.add(clockLight);
    
    // Bright spotlight on central mechanism
    const mechanismLight = new THREE.SpotLight(0xffd700, 1.5, 60, Math.PI / 5);
    mechanismLight.position.set(0, 40, 0);
    mechanismLight.target.position.set(0, 0, 0);
    this.scene.add(mechanismLight);
    this.scene.add(mechanismLight.target);
    
    // Warm point lights on the corners
    const cornerLight1 = new THREE.PointLight(0xffcc99, 1.2, 50);
    cornerLight1.position.set(-40, 20, -40);
    this.scene.add(cornerLight1);
    
    const cornerLight2 = new THREE.PointLight(0xffcc99, 1.2, 50);
    cornerLight2.position.set(40, 20, -40);
    this.scene.add(cornerLight2);
    
    const cornerLight3 = new THREE.PointLight(0xffcc99, 1.2, 50);
    cornerLight3.position.set(-40, 20, 40);
    this.scene.add(cornerLight3);
    
    const cornerLight4 = new THREE.PointLight(0xffcc99, 1.2, 50);
    cornerLight4.position.set(40, 20, 40);
    this.scene.add(cornerLight4);
    
    // Additional overhead lights
    const overheadLight1 = new THREE.PointLight(0xffffcc, 1, 40);
    overheadLight1.position.set(0, 35, 0);
    this.scene.add(overheadLight1);
    
    const overheadLight2 = new THREE.PointLight(0xffffcc, 0.8, 35);
    overheadLight2.position.set(20, 30, 20);
    this.scene.add(overheadLight2);
    
    const overheadLight3 = new THREE.PointLight(0xffffcc, 0.8, 35);
    overheadLight3.position.set(-20, 30, -20);
    this.scene.add(overheadLight3);
    
    this.createClocktowerWorkshop();
  }

  createClocktowerWorkshop() {
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x3d3d3d, shininess: 10 });
    this.createClocktowerWalls(this.roomSize, 40, 2, wallMat);

    const floorMat = new THREE.MeshPhongMaterial({ color: 0x9B7653, shininess: 15 });
    const floorGeo = new THREE.PlaneGeometry(this.roomSize, this.roomSize);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    this.collidables.push(floor);
    this.playerStartPosition = new THREE.Vector3(0, 0, 35);

  this.createMassiveBoltObstacle();
    this.createRisingPlatforms();
    this.createCentralMechanism();
    this.createHangingChains();
    this.createLargeClockFace();
    this.createMetalBeams();
    this.createInterlinkedGears();
    this.createScatteredNutsAndBolts();
    this.createAdditionalClockMachinery();
    this.createSideRooms();
    // Prepare bolt spawn locations after environment pieces are created
    this.computeBoltSpawns();
    // Randomize the starting position of the special bolt as well
    if (this.specialBolt && this.boltSpawns && this.boltSpawns.length) {
      const idx = Math.floor(Math.random() * this.boltSpawns.length);
      this.currentBoltSpawnIndex = idx;
      const spawn = this.boltSpawns[idx];
      this.moveSpecialBoltTo(spawn.pos);
      // Show an initial persistent clue for the starting bolt location
      if (this.quizUI && spawn.clue && typeof this.quizUI.setClue === 'function') {
        this.quizUI.setClue(spawn.clue);
      }
    }
  }

  createClocktowerWalls(roomSize, wallHeight, wallThickness, wallMat) {
    // Warm brown brick walls
    const brickMat = new THREE.MeshPhongMaterial({ 
      color: 0x8B6914, 
      shininess: 20
    });
    
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), brickMat);
    northWall.position.set(0, wallHeight / 2, -roomSize / 2);
    this.scene.add(northWall); this.collidables.push(northWall);

    const southWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), brickMat);
    southWall.position.set(0, wallHeight / 2, roomSize / 2);
    this.scene.add(southWall); this.collidables.push(southWall);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), brickMat);
    eastWall.position.set(roomSize / 2, wallHeight / 2, 0); this.scene.add(eastWall); this.collidables.push(eastWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, roomSize), brickMat);
    westWall.position.set(-roomSize / 2, wallHeight / 2, 0); this.scene.add(westWall); this.collidables.push(westWall);
    
    // Lighter brown pillars in corners
    const pillarMat = new THREE.MeshPhongMaterial({ color: 0xA0826D, shininess: 25 });
    const corners = [
      [-roomSize/2 + 2, 0, -roomSize/2 + 2],
      [roomSize/2 - 2, 0, -roomSize/2 + 2],
      [-roomSize/2 + 2, 0, roomSize/2 - 2],
      [roomSize/2 - 2, 0, roomSize/2 - 2]
    ];
    
    corners.forEach(pos => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(3, wallHeight, 3), pillarMat);
      pillar.position.set(pos[0], wallHeight / 2, pos[2]);
      this.scene.add(pillar);
      this.collidables.push(pillar);
      this.poles.push(pillar);
    });
  }

  createMassiveBoltObstacle() {
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xB87333, metalness: 0.8, roughness: 0.35 });
    const shaftRadius = 1.2;
    const shaftLen = 6;
    const headRadius = shaftRadius * 2.0;
    const headHeight = 0.8;

    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftLen, 24), boltMat);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(headRadius, headRadius, headHeight, 24), boltMat);
    const massiveBolt = new THREE.Group();
    shaft.position.y = shaftLen / 2;
    head.position.y = shaftLen + headHeight / 2;
    massiveBolt.add(shaft, head);
    // Place near center, slightly tilted, resting on ground
    massiveBolt.position.set(0, 0, 0);
    massiveBolt.rotation.z = Math.PI / 10;
    massiveBolt.rotation.x = Math.PI / 16;
    this.scene.add(massiveBolt);
    this.massiveBolt = massiveBolt;
  }

  createRisingPlatforms() {
    // Replace moving box platforms with static huge bolts and nuts
    const boltMat = new THREE.MeshStandardMaterial({ color: 0x9C5F2C, metalness: 0.85, roughness: 0.35 });
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.7, roughness: 0.45 });

    const makeHugeBolt = (scale = 1) => {
      const shaftR = 1.4 * scale;
      const shaftH = 3.2 * scale;
      const headR = shaftR * 1.8;
      const headH = 1.0 * scale;
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, shaftH, 24), boltMat);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(headR, headR, headH, 24), boltMat);
      const g = new THREE.Group();
      shaft.position.y = shaftH / 2;
      head.position.y = shaftH + headH / 2;
      g.add(shaft, head);
      return g;
    };

    const makeHugeNut = (scale = 1) => {
      const outer = 2.2 * scale;
      const height = 1.2 * scale;
      const shape = new THREE.Shape();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * outer;
        const y = Math.sin(a) * outer;
        if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      shape.closePath();
      const hole = new THREE.Path();
      const inner = outer * 0.45;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * inner;
        const y = Math.sin(a) * inner;
        if (i === 0) hole.moveTo(x, y); else hole.lineTo(x, y);
      }
      hole.closePath();
      shape.holes.push(hole);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: true, bevelThickness: 0.06 * scale, bevelSize: 0.06 * scale });
      const mesh = new THREE.Mesh(geo, nutMat);
      mesh.rotation.x = -Math.PI / 2; // lie flat on the floor
      mesh.position.y = height * 0.5;
      return mesh;
    };

    this.platforms = [];
    const positions = [
      new THREE.Vector3(-15, 0, -15),
      new THREE.Vector3(15, 0, -15),
      new THREE.Vector3(-15, 0, 15),
      new THREE.Vector3(15, 0, 15)
    ];

    positions.forEach((pos, i) => {
      // Alternate: bolt, nut, bolt, nut
      const isBolt = i % 2 === 0;
      const g = isBolt ? makeHugeBolt(1.0 + (i * 0.05)) : makeHugeNut(1.1 + (i * 0.05));
      g.position.set(pos.x, 0, pos.z);
      g.userData.triggerIndex = i;
      g.userData.isQuizPlatform = i === 0; // first platform is quiz platform
      // Tag with a disc-shaped collision footprint smaller than visuals to feel fair
      const boxFull = new THREE.Box3().setFromObject(g);
      const maxXZ = Math.max(boxFull.max.x - boxFull.min.x, boxFull.max.z - boxFull.min.z);
      g.userData.collisionType = 'disc';
      g.userData.collisionRadius = (maxXZ * 0.5) * 0.65; // 65% of visual half-extent
      this.scene.add(g);
      this.collidables.push(g);
      this.platforms.push(g);
    });
  }

  createCentralMechanism() {
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.7, roughness: 0.3 });
    
    // Central vertical shaft
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 38, 16), metalMat);
    shaft.position.set(0, 19, 0);
    this.scene.add(shaft);
    
    // Add rotating drum/cylinder in the middle
    const drum = new THREE.Mesh(
      new THREE.CylinderGeometry(2, 2, 6, 24),
      new THREE.MeshStandardMaterial({ color: 0xA0826D, metalness: 0.4, roughness: 0.6 })
    );
    drum.position.set(0, 10, 0);
    this.scene.add(drum);
    this.rotatingDrum = drum;
    
    // Spinning gears on the shaft at different heights
    this.mechanismGears = [];
    const gearHeights = [8, 16, 24, 32];
    
    gearHeights.forEach((height, index) => {
      const gearMat = new THREE.MeshPhongMaterial({ 
        color: index % 2 === 0 ? 0xDAA520 : 0xB8860B, 
        shininess: 100 
      });
      const shape = new THREE.Shape();
      const teeth = 20, outerR = 3.5 + index * 0.3, innerR = outerR - 0.7;
      
      for(let j = 0; j < teeth; j++) {
        const a = j/teeth * Math.PI * 2, na = (j+1)/teeth * Math.PI * 2;
        const x1 = Math.cos(a) * outerR, y1 = Math.sin(a) * outerR;
        const x2 = Math.cos((a+na)/2) * innerR, y2 = Math.sin((a+na)/2) * innerR;
        if(j === 0) shape.moveTo(x1, y1); else shape.lineTo(x1, y1);
        shape.lineTo(x2, y2);
      }
      shape.closePath();
      
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.8, bevelEnabled: false });
      const gear = new THREE.Mesh(geo, gearMat);
      gear.rotation.x = Math.PI / 2;
      gear.position.set(0, height, 0);
      this.scene.add(gear);
      this.mechanismGears.push(gear);
    });
    
    // Add connecting rods/pistons
    for(let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const x = Math.cos(angle) * 8;
      const z = Math.sin(angle) * 8;
      
      const rod = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 15, 8),
        new THREE.MeshStandardMaterial({ color: 0xA0826D, metalness: 0.6 })
      );
      rod.position.set(x, 12, z);
      
      const angleRad = Math.atan2(x, z);
      rod.rotation.z = Math.PI / 2;
      rod.rotation.y = angleRad;
      
      this.scene.add(rod);
    }
    
    // Add some smaller decorative gears on the walls
    this.wallGears = [];
    const wallGearPositions = [
      { pos: [35, 12, 0], rot: [0, Math.PI/2, 0] },
      { pos: [-35, 12, 0], rot: [0, -Math.PI/2, 0] },
      { pos: [0, 12, 35], rot: [0, Math.PI, 0] }
    ];
    
    wallGearPositions.forEach(config => {
      const shape = new THREE.Shape();
      const teeth = 16, outerR = 2.5, innerR = 2;
      
      for(let j = 0; j < teeth; j++) {
        const a = j/teeth * Math.PI * 2, na = (j+1)/teeth * Math.PI * 2;
        const x1 = Math.cos(a) * outerR, y1 = Math.sin(a) * outerR;
        const x2 = Math.cos((a+na)/2) * innerR, y2 = Math.sin((a+na)/2) * innerR;
        if(j === 0) shape.moveTo(x1, y1); else shape.lineTo(x1, y1);
        shape.lineTo(x2, y2);
      }
      shape.closePath();
      
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: false });
      const gear = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: 0xCD853F, shininess: 80 }));
      gear.position.set(...config.pos);
      gear.rotation.set(...config.rot);
      this.scene.add(gear);
      this.wallGears.push(gear);
    });
  }

  createHangingChains() {
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.8, roughness: 0.3 });
    this.chains = [];
    
    const positions = [
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(25, 0, -25),
      new THREE.Vector3(-25, 0, 25),
      new THREE.Vector3(25, 0, 25)
    ];
    
    positions.forEach(pos => {
      const chain = new THREE.Group();
      
      // Create chain links
      for(let i = 0; i < 20; i++) {
        const link = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.12, 8, 16), chainMat);
        link.rotation.x = i % 2 === 0 ? 0 : Math.PI / 2;
        link.position.y = 40 - i * 1.8;
        chain.add(link);
      }
      
      // Add weight at the bottom
      const weight = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 3, 16), 
        new THREE.MeshStandardMaterial({ color: 0xA0826D, metalness: 0.7 })
      );
      weight.position.y = 4;
      chain.add(weight);
      
      // Add hook at top
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.6, 0.15, 8, 16, Math.PI),
        chainMat
      );
      hook.rotation.z = Math.PI;
      hook.position.y = 40;
      chain.add(hook);
      
      chain.position.set(pos.x, 0, pos.z);
      this.scene.add(chain);
      this.chains.push(chain);
    });
  }

  createLargeClockFace() {
    const clockGroup = new THREE.Group();
    const radius = 15;
    
    // Clock face background
    const faceShape = new THREE.Shape().absarc(0, 0, radius, 0, Math.PI * 2);
    const faceMat = new THREE.MeshBasicMaterial({ color: 0xfff5dc, side: THREE.DoubleSide });
    const face = new THREE.Mesh(new THREE.ShapeGeometry(faceShape), faceMat);
    clockGroup.add(face);
    
    // Clock frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x8B6914, metalness: 0.8 });
    const frame = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.8, 16, 32), frameMat);
    clockGroup.add(frame);
    
    // Roman numerals positions (simplified as small boxes)
    const numeralMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    for(let i = 0; i < 12; i++) {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const x = Math.cos(angle) * (radius - 2);
      const y = Math.sin(angle) * (radius - 2);
      const numeral = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.5, 0.1), numeralMat);
      numeral.position.set(x, y, 0.1);
      clockGroup.add(numeral);
    }
    
    // Clock hands
    const hourHandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const minuteHandMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    this.hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.5, radius * 0.5, 0.2), hourHandMat);
    this.minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.3, radius * 0.7, 0.2), minuteHandMat);
    this.hourHand.position.set(0, radius * 0.25, 0.2);
    this.minuteHand.position.set(0, radius * 0.35, 0.3);
    clockGroup.add(this.hourHand, this.minuteHand);
    
    clockGroup.position.set(0, 25, -this.roomSize / 2 + 1);
    this.scene.add(clockGroup);
    this.largeClock = clockGroup;
  }

  createMetalBeams() {
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.6, roughness: 0.4 });
    
    // Main horizontal support beams creating a cross pattern
    const beam1 = new THREE.Mesh(new THREE.BoxGeometry(this.roomSize - 10, 1, 1), beamMat);
    beam1.position.set(0, 25, 0);
    this.scene.add(beam1);
    this.beams.push(beam1);
    
    const beam2 = new THREE.Mesh(new THREE.BoxGeometry(1, 1, this.roomSize - 10), beamMat);
    beam2.position.set(0, 25, 0);
    this.scene.add(beam2);
    this.beams.push(beam2);
    
    // Lower level beams
    const beam3 = new THREE.Mesh(new THREE.BoxGeometry(this.roomSize - 20, 0.8, 0.8), beamMat);
    beam3.position.set(0, 15, 0);
    this.scene.add(beam3);
    this.beams.push(beam3);
    
    const beam4 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, this.roomSize - 20), beamMat);
    beam4.position.set(0, 15, 0);
    this.scene.add(beam4);
    this.beams.push(beam4);
    
    // Diagonal support beams from corners to center
    const createDiagonalBeam = (x, z) => {
      const length = Math.sqrt(x * x + 20 * 20 + z * z);
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, length), beamMat);
      beam.position.set(x / 2, 10, z / 2);
      
      const angleY = Math.atan2(x, z);
      const angleX = Math.atan2(20, Math.sqrt(x * x + z * z));
      beam.rotation.y = angleY;
      beam.rotation.x = angleX;
      
      this.scene.add(beam);
      this.beams.push(beam);
    };
    
    createDiagonalBeam(30, 30);
    createDiagonalBeam(-30, 30);
    createDiagonalBeam(30, -30);
    createDiagonalBeam(-30, -30);
    
    // Vertical support beams
    const verticalPositions = [
      [20, 0, 20], [-20, 0, 20], [20, 0, -20], [-20, 0, -20]
    ];
    
    verticalPositions.forEach(pos => {
      const vBeam = new THREE.Mesh(new THREE.BoxGeometry(0.8, 30, 0.8), beamMat);
      vBeam.position.set(pos[0], 15, pos[2]);
      this.scene.add(vBeam);
      this.poles.push(vBeam);
    });
    
    // Add catwalks/platforms around the upper area
    const catwalkMat = new THREE.MeshStandardMaterial({ 
      color: 0xA0826D, 
      metalness: 0.5, 
      roughness: 0.5,
      side: THREE.DoubleSide 
    });
    
    // North catwalk
    const northCatwalk = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomSize - 20, 3), 
      catwalkMat
    );
    northCatwalk.rotation.x = -Math.PI / 2;
    northCatwalk.position.set(0, 20, -35);
    this.scene.add(northCatwalk);
    
    // South catwalk
    const southCatwalk = new THREE.Mesh(
      new THREE.PlaneGeometry(this.roomSize - 20, 3), 
      catwalkMat
    );
    southCatwalk.rotation.x = -Math.PI / 2;
    southCatwalk.position.set(0, 20, 35);
    this.scene.add(southCatwalk);
  }

  createInterlinkedGears() {
    // Create a system of interlinked gears on different walls
    this.interlinkedGears = [];
    
    // East wall gear system
    const eastGearSystem = new THREE.Group();
    const gearSizes = [
      { radius: 3, teeth: 24, pos: [0, 0, 0], color: 0xDAA520 },
      { radius: 2, teeth: 16, pos: [4.5, 0, 0], color: 0xB8860B },
      { radius: 1.5, teeth: 12, pos: [7, 0, 0], color: 0xCD853F },
      { radius: 2.5, teeth: 20, pos: [0, 4.5, 0], color: 0xDEB887 },
      { radius: 1.8, teeth: 14, pos: [3.5, 6, 0], color: 0xDAA520 }
    ];
    
    gearSizes.forEach(gearData => {
      const shape = new THREE.Shape();
      const teeth = gearData.teeth;
      const outerR = gearData.radius;
      const innerR = outerR * 0.85;
      
      for(let i = 0; i < teeth; i++) {
        const a = i / teeth * Math.PI * 2;
        const na = (i + 1) / teeth * Math.PI * 2;
        const x1 = Math.cos(a) * outerR, y1 = Math.sin(a) * outerR;
        const x2 = Math.cos((a + na) / 2) * innerR, y2 = Math.sin((a + na) / 2) * innerR;
        if(i === 0) shape.moveTo(x1, y1); else shape.lineTo(x1, y1);
        shape.lineTo(x2, y2);
      }
      shape.closePath();
      
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false });
      const gear = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: gearData.color, shininess: 90 }));
      gear.position.set(gearData.pos[0], gearData.pos[1], gearData.pos[2]);
      gear.userData.radius = gearData.radius;
      gear.userData.rotationSpeed = 1 / gearData.radius;
      eastGearSystem.add(gear);
      this.interlinkedGears.push(gear);
    });
    
    eastGearSystem.position.set(this.roomSize / 2 - 1, 15, 0);
    eastGearSystem.rotation.y = -Math.PI / 2;
    this.scene.add(eastGearSystem);
    
    // West wall gear system
    const westGearSystem = new THREE.Group();
    const westGearSizes = [
      { radius: 2.5, teeth: 20, pos: [0, 0, 0], color: 0xB8860B },
      { radius: 2, teeth: 16, pos: [4, 0, 0], color: 0xDAA520 },
      { radius: 1.5, teeth: 12, pos: [6.5, 0, 0], color: 0xDEB887 },
      { radius: 3, teeth: 24, pos: [1.5, 4, 0], color: 0xCD853F }
    ];
    
    westGearSizes.forEach(gearData => {
      const shape = new THREE.Shape();
      const teeth = gearData.teeth;
      const outerR = gearData.radius;
      const innerR = outerR * 0.85;
      
      for(let i = 0; i < teeth; i++) {
        const a = i / teeth * Math.PI * 2;
        const na = (i + 1) / teeth * Math.PI * 2;
        const x1 = Math.cos(a) * outerR, y1 = Math.sin(a) * outerR;
        const x2 = Math.cos((a + na) / 2) * innerR, y2 = Math.sin((a + na) / 2) * innerR;
        if(i === 0) shape.moveTo(x1, y1); else shape.lineTo(x1, y1);
        shape.lineTo(x2, y2);
      }
      shape.closePath();
      
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false });
      const gear = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: gearData.color, shininess: 90 }));
      gear.position.set(gearData.pos[0], gearData.pos[1], gearData.pos[2]);
      gear.userData.radius = gearData.radius;
      gear.userData.rotationSpeed = 1 / gearData.radius;
      westGearSystem.add(gear);
      this.interlinkedGears.push(gear);
    });
    
    westGearSystem.position.set(-this.roomSize / 2 + 1, 15, 0);
    westGearSystem.rotation.y = Math.PI / 2;
    this.scene.add(westGearSystem);
    
    // South wall gear system
    const southGearSystem = new THREE.Group();
    const southGearSizes = [
      { radius: 3.5, teeth: 28, pos: [0, 0, 0], color: 0xDAA520 },
      { radius: 2.2, teeth: 18, pos: [5, 0, 0], color: 0xB8860B },
      { radius: 1.8, teeth: 14, pos: [-4.5, 0, 0], color: 0xCD853F },
      { radius: 2.5, teeth: 20, pos: [0, 5, 0], color: 0xDEB887 }
    ];
    
    southGearSizes.forEach(gearData => {
      const shape = new THREE.Shape();
      const teeth = gearData.teeth;
      const outerR = gearData.radius;
      const innerR = outerR * 0.85;
      
      for(let i = 0; i < teeth; i++) {
        const a = i / teeth * Math.PI * 2;
        const na = (i + 1) / teeth * Math.PI * 2;
        const x1 = Math.cos(a) * outerR, y1 = Math.sin(a) * outerR;
        const x2 = Math.cos((a + na) / 2) * innerR, y2 = Math.sin((a + na) / 2) * innerR;
        if(i === 0) shape.moveTo(x1, y1); else shape.lineTo(x1, y1);
        shape.lineTo(x2, y2);
      }
      shape.closePath();
      
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.6, bevelEnabled: false });
      const gear = new THREE.Mesh(geo, new THREE.MeshPhongMaterial({ color: gearData.color, shininess: 90 }));
      gear.position.set(gearData.pos[0], gearData.pos[1], gearData.pos[2]);
      gear.userData.radius = gearData.radius;
      gear.userData.rotationSpeed = 1 / gearData.radius;
      southGearSystem.add(gear);
      this.interlinkedGears.push(gear);
    });
    
    southGearSystem.position.set(0, 12, this.roomSize / 2 - 1);
    southGearSystem.rotation.y = Math.PI;
    this.scene.add(southGearSystem);
  }

  createScatteredNutsAndBolts() {
    const nutMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.8, roughness: 0.3 });
    const boltMat = new THREE.MeshStandardMaterial({ color: 0xA0826D, metalness: 0.7, roughness: 0.4 });
    const specialBoltMat = new THREE.MeshStandardMaterial({ 
      color: 0xFF4500, 
      metalness: 0.9, 
      roughness: 0.2,
      emissive: 0xFF4500,
      emissiveIntensity: 0.5
    });
    
    // Create nut geometry (hexagonal)
    const createNut = (size) => {
      const hexShape = new THREE.Shape();
      for(let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * size;
        const y = Math.sin(angle) * size;
        if(i === 0) hexShape.moveTo(x, y);
        else hexShape.lineTo(x, y);
      }
      hexShape.closePath();
      
      const holeShape = new THREE.Path();
      for(let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * size * 0.4;
        const y = Math.sin(angle) * size * 0.4;
        if(i === 0) holeShape.moveTo(x, y);
        else holeShape.lineTo(x, y);
      }
      holeShape.closePath();
      hexShape.holes.push(holeShape);
      
      return new THREE.ExtrudeGeometry(hexShape, { depth: size * 0.5, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02 });
    };
    
  // Create THE SPECIAL BOLT that initially points to the first platform
    const firstPlatformPos = new THREE.Vector3(-15, 0.5, -15);
    const radius = 0.3;
    const length = 2;
    
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), specialBoltMat);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.8, radius * 1.8, radius * 0.8, 8), specialBoltMat);
    
    const specialBolt = new THREE.Group();
    shaft.position.y = -length / 2;
    head.position.y = radius * 0.4;
    specialBolt.add(shaft, head);
    
  //Position the bolt to point toward the first platform
    const boltPosition = new THREE.Vector3(-8, 0.3, -8);
    specialBolt.position.copy(boltPosition);
    
    // Calculate direction to platform
    const direction = new THREE.Vector3().subVectors(firstPlatformPos, boltPosition);
    const angle = Math.atan2(direction.x, direction.z);
    
    specialBolt.rotation.x = Math.PI / 2.5; // Tilt it up a bit
    specialBolt.rotation.y = angle;
    this.scene.add(specialBolt);
    this.specialBolt = specialBolt;
    this.bolts.push(specialBolt);
    
    // Add a glowing particle effect above the special bolt
    const glowGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xFF4500,
      transparent: true,
      opacity: 0.6
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(boltPosition.x, 1.5, boltPosition.z);
    this.scene.add(glow);
    this.specialBoltGlow = glow;
  this.currentBoltSpawnIndex = -1; // will be chosen after first correct answer
    
    // Scatter regular nuts on the floor
    for(let i = 0; i < 40; i++) {
      const size = 0.15 + Math.random() * 0.25;
      const nut = new THREE.Mesh(createNut(size), nutMat);
      nut.position.set(
        (Math.random() - 0.5) * (this.roomSize - 20),
        0.1,
        (Math.random() - 0.5) * (this.roomSize - 20)
      );
      nut.rotation.x = -Math.PI / 2;
      nut.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(nut);
      this.nuts.push(nut);
    }
    
    // Create regular bolts
    for(let i = 0; i < 35; i++) {
      const radius = 0.08 + Math.random() * 0.12;
      const length = 0.5 + Math.random() * 1;
      
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 8), boltMat);
      const head = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.8, radius * 1.8, radius * 0.8, 8), boltMat);
      
      const bolt = new THREE.Group();
      shaft.position.y = -length / 2;
      head.position.y = radius * 0.4;
      bolt.add(shaft, head);
      
      bolt.position.set(
        (Math.random() - 0.5) * (this.roomSize - 20),
        0.1,
        (Math.random() - 0.5) * (this.roomSize - 20)
      );
      bolt.rotation.x = Math.PI / 2;
      bolt.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(bolt);
      this.bolts.push(bolt);
    }
    
    // Add some nuts and bolts on catwalks
    for(let i = 0; i < 15; i++) {
      const size = 0.12 + Math.random() * 0.2;
      const nut = new THREE.Mesh(createNut(size), nutMat);
      nut.position.set(
        (Math.random() - 0.5) * (this.roomSize - 30),
        20.1,
        -35 + (Math.random() - 0.5) * 3
      );
      nut.rotation.x = -Math.PI / 2;
      nut.rotation.z = Math.random() * Math.PI * 2;
      this.scene.add(nut);
    }
  }

  createAdditionalClockMachinery() {
    // Add pulleys
    const pulleyMat = new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.6, roughness: 0.4 });
    
    const pulleyPositions = [
      { pos: [30, 22, 30], size: 1.5 },
      { pos: [-30, 22, 30], size: 1.2 },
      { pos: [30, 22, -30], size: 1.8 },
      { pos: [-30, 22, -30], size: 1.3 }
    ];
    
    this.pulleys = [];
    pulleyPositions.forEach(data => {
      const pulley = new THREE.Mesh(
        new THREE.TorusGeometry(data.size, 0.3, 16, 32),
        pulleyMat
      );
      pulley.position.set(...data.pos);
      pulley.rotation.x = Math.PI / 2;
      this.scene.add(pulley);
      this.pulleys.push(pulley);
    });
    
    // Add connecting belts/ropes between pulleys
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.8 });
    for(let i = 0; i < pulleyPositions.length - 1; i++) {
      const start = new THREE.Vector3(...pulleyPositions[i].pos);
      const end = new THREE.Vector3(...pulleyPositions[i + 1].pos);
      const distance = start.distanceTo(end);
      
      const rope = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.15, distance, 8),
        ropeMat
      );
      rope.position.copy(start).add(end).multiplyScalar(0.5);
      rope.lookAt(end);
      rope.rotation.x += Math.PI / 2;
      this.scene.add(rope);
    }
    
    // Add pressure gauges
    const gaugePositions = [
      [40, 10, 15],
      [-40, 10, -15],
      [15, 10, 40]
    ];
    
    gaugePositions.forEach(pos => {
      const gauge = new THREE.Group();
      
      // Gauge face
      const face = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.8, 0.2, 32),
        new THREE.MeshBasicMaterial({ color: 0xf5f5dc })
      );
      face.rotation.x = Math.PI / 2;
      gauge.add(face);
      
      // Gauge rim
      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.1, 16, 32),
        new THREE.MeshStandardMaterial({ color: 0x8B7355, metalness: 0.8 })
      );
      gauge.add(rim);
      
      // Gauge needle
      const needle = new THREE.Mesh(
        new THREE.BoxGeometry(0.05, 0.6, 0.05),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
      );
      needle.position.y = 0.3;
      needle.position.z = 0.15;
      gauge.add(needle);
      
      gauge.position.set(...pos);
      gauge.lookAt(new THREE.Vector3(0, 10, 0));
      this.scene.add(gauge);
    });
    
    // Add pipes
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0xA0826D, metalness: 0.7, roughness: 0.3 });
    
    // Vertical pipes
    for(let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 35;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const pipe = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.3, 25, 16),
        pipeMat
      );
      pipe.position.set(x, 12.5, z);
      this.scene.add(pipe);
      this.pipes.push(pipe);
    }
  }

  // Optional: dynamically load cannon-es for ragdoll
  async initPhysics() {
    if (this.cannon.world) return;
    try {
      const mod = await import('cannon-es');
      const CANNON = mod.default || mod;
      const world = new CANNON.World({
        gravity: new CANNON.Vec3(0, -9.82, 0),
        allowSleep: true
      });
      // Ground plane at y=0 (matches your floor plane)
      const groundMat = new CANNON.Material('ground');
      const groundShape = new CANNON.Plane();
      const groundBody = new CANNON.Body({ mass: 0, material: groundMat });
      groundBody.addShape(groundShape);
      groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
      world.addBody(groundBody);
      this.cannon = { CANNON, world };
    } catch (e) {
      // cannon-es not available; ragdoll will be skipped
    }
  }

  loadPlayerModel() {
    return new Promise((res,rej)=>{
      new GLTFLoader().load('./models/AJ.glb',g=>{
        this.player=g.scene; this.player.scale.set(1,1,1); this.player.position.copy(this.playerStartPosition); this.player.name='player'; this.scene.add(this.player);
        this.mixer=new THREE.AnimationMixer(this.player); this.player.rotation.y=Math.PI; res(g);
      },undefined,err=>rej(err));
    });
  }

  update(delta){
    if(!this.player) return;
    if(this.mixer) this.mixer.update(delta);
    // If ragdoll active, step its physics and sync only visuals
    if (this.ragdoll) {
      this.stepCannon(delta);
    } else {
      // Vertical integration first (gravity)
      this.playerVelY += -9.81 * delta;
      this.player.position.y += this.playerVelY * delta;
      this.resolveGroundingAndPlatforms();

      // Apply smooth bump movement
      if (this.playerVelocity.lengthSq() > 0) {
        const max = this.bumpMaxSpeed;
        if (this.playerVelocity.length() > max) this.playerVelocity.setLength(max);
        this.player.position.addScaledVector(this.playerVelocity, delta);
        // Damping
        const damp = Math.max(0, 1 - this.bumpDamping * delta);
        this.playerVelocity.multiplyScalar(damp);
      }
      // Cooldown timer for bumps
      if (this._bumpCooldown > 0) this._bumpCooldown -= delta;
      // Collision checks -> bumps (gear, platforms, walls/floor)
      this.checkCollisionsAndBumps();
    }

    this.updateGearRotation(delta); 
    // Gear bump now handled inside checkCollisionsAndBumps

    this.updateClockHands(delta);

    
    // Animate special bolt glow
    if(this.specialBoltGlow && this.gameState.currentStage === 0) {
      this.specialBoltGlow.position.y = 1.5 + Math.sin(Date.now() * 0.003) * 0.3;
      this.specialBoltGlow.material.opacity = 0.4 + Math.sin(Date.now() * 0.004) * 0.2;
    }
    
    // Platforms are now static (huge bolts and nuts); no y-animation needed
    
    // Animate central mechanism gears
    if(this.mechanismGears) {
      this.mechanismGears.forEach((g, i) => { 
        g.rotation.z += delta * (i % 2 === 0 ? 0.8 : -0.8);
      });
    }
    
    // Animate rotating drum
    if(this.rotatingDrum) {
      this.rotatingDrum.rotation.y += delta * 0.5;
    }
    
    // Animate wall gears
    if(this.wallGears) {
      this.wallGears.forEach((g, i) => {
        if(i === 0 || i === 1) {
          g.rotation.y += delta * 0.6 * (i % 2 === 0 ? 1 : -1);
        } else {
          g.rotation.z += delta * 0.6;
        }
      });
    }
    
    // Animate hanging chains with subtle movement
    if(this.chains) {
      this.chains.forEach((c, i) => { 
        c.position.y = Math.sin(Date.now() * 0.0003 + i) * 1.5;
        c.rotation.z = Math.sin(Date.now() * 0.0004 + i * 0.5) * 0.05;
      });
    }
    
    // Animate interlinked gears
    if(this.interlinkedGears) {
      this.interlinkedGears.forEach((g, i) => {
        g.rotation.z += delta * g.userData.rotationSpeed * (i % 2 === 0 ? 1 : -1);
      });
    }
    
    // Animate pulleys
    if(this.pulleys) {
      this.pulleys.forEach((p, i) => {
        p.rotation.z += delta * 0.8;
      });
    }
    // Animate steam clouds (local visibility effects)
    if (this.steamClouds && this.steamClouds.length) {
      const t = Date.now() * 0.0003;
      this.steamClouds.forEach((c, i) => {
        // gentle bobbing and very slow drift
        c.position.y = c.userData.baseY + Math.sin(t + i) * 0.3;
        c.position.x = c.userData.baseX + Math.sin(t * 0.5 + i * 0.3) * 0.2;
        c.position.z = c.userData.baseZ + Math.cos(t * 0.5 + i * 0.3) * 0.2;
        if (c.material) {
          c.material.opacity = c.userData.baseOpacity * (0.85 + 0.15 * Math.sin(t * 0.7 + i));
        }
      });
    }
    // Animate dust planes subtle fade
    if (this.dustPlanes && this.dustPlanes.length) {
      const t2 = Date.now() * 0.0005;
      this.dustPlanes.forEach((p, i) => {
        if (p.material) {
          p.material.opacity = p.userData.baseOpacity * (0.7 + 0.3 * (0.5 + 0.5 * Math.sin(t2 + i)));
        }
      });
    }
    this.checkPlayerNearBolt();
  }
  

  updateGearRotation(delta){ if(this.gear) this.gear.rotation.z+=delta; }

  // Snap to floor or platforms if within step height, zero vertical velocity when grounded
  resolveGroundingAndPlatforms() {
    this.grounded = false;
    let bestTop = -Infinity;
    let bestGround = null; // null = floor

    // Floor at y=0
    const feetY = this.player.position.y;
    if (feetY <= 0.05 && this.playerVelY <= 0) {
      bestTop = 0;
      bestGround = null;
    }

    // Platforms: pick the highest valid top (AABB-based) under/near the player
    if (this.platforms && this.platforms.length) {
      for (const p of this.platforms) {
        const boxFull = new THREE.Box3().setFromObject(p);
        // Horizontal in-bounds using disc radius if present, otherwise shrunken AABB
        let inHoriz = false;
        if (p.userData && p.userData.collisionType === 'disc' && p.userData.collisionRadius) {
          const dx = this.player.position.x - p.position.x;
          const dz = this.player.position.z - p.position.z;
          const dist = Math.hypot(dx, dz);
          inHoriz = dist <= (p.userData.collisionRadius + this.playerRadius);
        } else {
          const box = this._shrinkAABB(boxFull, 0.5, 0.5);
          inHoriz = this.player.position.x >= (box.min.x - this.playerRadius) && this.player.position.x <= (box.max.x + this.playerRadius)
                 && this.player.position.z >= (box.min.z - this.playerRadius) && this.player.position.z <= (box.max.z + this.playerRadius);
        }
        if (!inHoriz) continue;
        const topY = boxFull.max.y; // use full height for top contact
        // If feet are within stepHeight below top or slightly above it, allow stepping/snap
        if (feetY >= topY - this.stepHeight && feetY <= topY + 0.08) {
          if (topY > bestTop) {
            bestTop = topY;
            bestGround = p;
          }
        }
      }
    }

    if (bestTop > -Infinity) {
      this.player.position.y = bestTop;
      this.playerVelY = 0;
      this.grounded = true;
      this.groundObject = bestGround; // null = floor, otherwise a platform mesh
    } else {
      this.groundObject = null;
    }
  }

  // Helpers: build player AABB and compute minimal translation to resolve AABB overlap
  _getPlayerAABB() {
    const center = this.player.position.clone().add(new THREE.Vector3(0, 1, 0));
    const half = new THREE.Vector3(0.5, 1.0, 0.5);
    return new THREE.Box3().setFromCenterAndSize(center, half.clone().multiplyScalar(2));
  }
  _aabbSeparation(a, b) {
    // Returns minimal translation vector to separate AABB a from b (assuming they intersect)
    const aCenter = a.getCenter(new THREE.Vector3());
    const bCenter = b.getCenter(new THREE.Vector3());
    const overlapX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
    const overlapY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
    const overlapZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
    if (overlapX <= 0 || overlapY <= 0 || overlapZ <= 0) return new THREE.Vector3(); // no overlap
    // Choose smallest axis to resolve
    if (overlapX < overlapY && overlapX < overlapZ) {
      return new THREE.Vector3(aCenter.x > bCenter.x ? overlapX : -overlapX, 0, 0);
    } else if (overlapY < overlapZ) {
      return new THREE.Vector3(0, aCenter.y > bCenter.y ? overlapY : -overlapY, 0);
    } else {
      return new THREE.Vector3(0, 0, aCenter.z > bCenter.z ? overlapZ : -overlapZ);
    }
  }

  // Slightly shrink an AABB in X/Z to better match visual footprint (avoid over-large collision area)
  _shrinkAABB(box, marginX = 0.5, marginZ = 0.5) {
    const b = box.clone();
    const halfX = (b.max.x - b.min.x) / 2;
    const halfZ = (b.max.z - b.min.z) / 2;
    // Ensure we never invert min/max; keep at least a tiny width
    const dx = Math.min(Math.max(marginX, 0), Math.max(halfX - 0.01, 0));
    const dz = Math.min(Math.max(marginZ, 0), Math.max(halfZ - 0.01, 0));
    b.min.x += dx; b.max.x -= dx;
    b.min.z += dz; b.max.z -= dz;
    return b;
  }

  // Build an axis-aligned box from a horizontal disc footprint and vertical bounds
  _discAABB(center, radius, minY, maxY) {
    return new THREE.Box3(
      new THREE.Vector3(center.x - radius, minY, center.z - radius),
      new THREE.Vector3(center.x + radius, maxY, center.z + radius)
    );
  }

  // Unified collision + bump handling
  checkCollisionsAndBumps() {
    if (!this.player) return;
    const playerHalf = new THREE.Vector3(0.5, 1.0, 0.5); // approx capsule AABB
    const pb = this._getPlayerAABB();

    // Massive bolt obstacle: solid block, no rebound (AABB separation only)
    if (this.massiveBolt) {
      const bx = new THREE.Box3().setFromObject(this.massiveBolt);
      if (pb.intersectsBox(bx) && this._bumpCooldown <= 0) {
        const sep = this._aabbSeparation(pb, bx);
        this.player.position.add(sep);
        this._bumpCooldown = 0.12;
        pb.copy(this._getPlayerAABB());
      }
    }

    // Platforms: separation only (no impulses) and no cooldown to prevent tunneling
    if (this.platforms && this.platforms.length) {
      for (const p of this.platforms) {
        const pbxFull = new THREE.Box3().setFromObject(p);
        // Build a tighter AABB from disc radius when available
        const pbx = (p.userData && p.userData.collisionType === 'disc' && p.userData.collisionRadius)
          ? this._discAABB(p.position, p.userData.collisionRadius, pbxFull.min.y, pbxFull.max.y)
          : this._shrinkAABB(pbxFull, 0.5, 0.5);
        if (pb.intersectsBox(pbx)) {
          const platformTop = pbxFull.max.y;
          // If currently grounded on this platform, let grounding keep us attached
          if (this.grounded && this.groundObject === p) {
            continue;
          }
          // If horizontally within bounds and player is at/above top, treat as top contact (no lateral separation)
          const inTopHoriz = (p.userData && p.userData.collisionType === 'disc' && p.userData.collisionRadius)
            ? (Math.hypot(this.player.position.x - p.position.x, this.player.position.z - p.position.z) <= (p.userData.collisionRadius + this.playerRadius))
            : (this.player.position.x >= (pbx.min.x - this.playerRadius) && this.player.position.x <= (pbx.max.x + this.playerRadius)
            && this.player.position.z >= (pbx.min.z - this.playerRadius) && this.player.position.z <= (pbx.max.z + this.playerRadius));
          if (inTopHoriz && this.player.position.y >= platformTop - 0.04) {
            // Let resolveGroundingAndPlatforms handle snapping; skip separation
            continue;
          }

          // Minimal separation without impulses; avoid pushing player downward if above the top
          const sep = this._aabbSeparation(pb, pbx);
          if (sep.y < 0 && this.player.position.y >= platformTop - 0.04) {
            sep.y = 0; // prevent downward shove when near/above top surface
          }
          this.player.position.add(sep);
          // No cooldown here: resolve every frame so platforms can't pass through the player
          pb.copy(this._getPlayerAABB());
        }
      }
    }

    // Poles
    if (this.poles && this.poles.length) {
      for (const pole of this.poles) {
        const bx = new THREE.Box3().setFromObject(pole);
        if (pb.intersectsBox(bx) && this._bumpCooldown <= 0) {
          const sep = this._aabbSeparation(pb, bx);
          this.player.position.add(sep);
          if (sep.lengthSq() > 0.0001) this.applyBumpImpulse(sep.clone().setLength(4).add(new THREE.Vector3(0, 0.4, 0)));
          this._bumpCooldown = 0.1;
          pb.copy(this._getPlayerAABB());
        }
      }
    }

    // Beams
    if (this.beams && this.beams.length) {
      for (const b of this.beams) {
        const bx = new THREE.Box3().setFromObject(b);
        if (pb.intersectsBox(bx) && this._bumpCooldown <= 0) {
          const sep = this._aabbSeparation(pb, bx);
          this.player.position.add(sep);
          if (sep.lengthSq() > 0.0001) this.applyBumpImpulse(sep.clone().setLength(3.5));
          this._bumpCooldown = 0.08;
          pb.copy(this._getPlayerAABB());
        }
      }
    }

    // Pipes (cylindrical vertical poles)
    if (this.pipes && this.pipes.length) {
      for (const p of this.pipes) {
        const bx = new THREE.Box3().setFromObject(p);
        if (pb.intersectsBox(bx) && this._bumpCooldown <= 0) {
          const sep = this._aabbSeparation(pb, bx);
          this.player.position.add(sep);
          if (sep.lengthSq() > 0.0001) this.applyBumpImpulse(sep.clone().setLength(3.5).add(new THREE.Vector3(0, 0.3, 0)));
          this._bumpCooldown = 0.08;
          pb.copy(this._getPlayerAABB());
        }
      }
    }

    // Bolts
    if (this.bolts && this.bolts.length) {
      for (const b of this.bolts) {
        const bx = new THREE.Box3().setFromObject(b);
        if (pb.intersectsBox(bx) && this._bumpCooldown <= 0) {
          const sep = this._aabbSeparation(pb, bx);
          this.player.position.add(sep);
          if (sep.lengthSq() > 0.0001) this.applyBumpImpulse(sep.clone().setLength(2).add(new THREE.Vector3(0, 0.25, 0)));
          this._bumpCooldown = 0.06;
          pb.copy(this._getPlayerAABB());
        }
      }
    }

    // Nuts (tiny floor items), separation-only (no bump/impulse)
    if (this.nuts && this.nuts.length) {
      for (const n of this.nuts) {
        const bx = new THREE.Box3().setFromObject(n);
        if (pb.intersectsBox(bx)) {
          const sep = this._aabbSeparation(pb, bx);
          this.player.position.add(sep);
          // No impulse and no cooldown for nuts; just resolve overlap
          pb.copy(this._getPlayerAABB());
        }
      }
    }

    // Walls
    const half = this.roomSize / 2 - 1.5;
    if (Math.abs(this.player.position.x) > half || Math.abs(this.player.position.z) > half) {
      const dir = new THREE.Vector3(
        this.player.position.x > 0 ? -1 : 1,
        0,
        this.player.position.z > 0 ? -1 : 1
      ).normalize();
      this.applyBumpImpulse(dir.multiplyScalar(5));
      // Keep player inside bounds softly
      this.player.position.x = THREE.MathUtils.clamp(this.player.position.x, -half, half);
      this.player.position.z = THREE.MathUtils.clamp(this.player.position.z, -half, half);
      this._bumpCooldown = 0.1;
    }
  }

  applyBumpImpulse(impulse) {
    // Split bump impulse: horizontal adds to playerVelocity, vertical to playerVelY
    const horiz = impulse.clone();
    horiz.y = 0;
    this.playerVelocity.add(horiz);
    this.playerVelY += impulse.y;
    // Optional: callback for camera shake/sfx
    if (this.onBump) {
      const strength = THREE.MathUtils.clamp(impulse.length(), 0, 10);
      this.onBump(strength);
    }
    // If impact is strong, switch to ragdoll
    if (impulse.length() > 7) {
      this.enableRagdoll(impulse);
    }
  }

  updateClockHands(delta){ 
    if(this.hourHand && this.minuteHand) {
      this.minuteHand.rotation.z -= delta * 2 * Math.PI / 60;
      this.hourHand.rotation.z -= delta * 2 * Math.PI / 720;
    }
  }
  // --- Player-bolt proximity check ---
  checkPlayerNearBolt() {
    if(!this.player || !this.specialBolt || this.hasTriggeredQuiz || this.gameState.gameOver) return;
    const distance = this.player.position.distanceTo(this.specialBolt.position);
    if(distance < 3) {
      this.hasTriggeredQuiz = true;
      this.triggerQuiz();
    }
  }

  // --- Submit answer (called by UI) ---
  submitAnswer(answerIndex) {
    if(this.gameState.gameOver || this.gameState.hasAnsweredCurrentStage) return;
    
    const currentQuiz = this.quizzes[this.gameState.currentStage];
    const isCorrect = answerIndex === currentQuiz.correctAnswer;

    if(isCorrect) {
      this.gameState.currentStage++;
      if(this.gameState.currentStage >= this.quizzes.length) {
        this.gameState.gameWon = true;
        this.gameState.gameOver = true;
        this.triggerGameWon();
      } else {
        // Move the special bolt to a new random spawn and present a clue for its new location
        const clue = this.selectNextBoltSpawn();
        this.triggerCorrectAnswer(clue);
        this.hasTriggeredQuiz = false;
        this.gameState.hasAnsweredCurrentStage = false;
      }
    } else {
      this.gameState.attemptsRemaining--;
      if(this.gameState.attemptsRemaining <= 0) {
        this.gameState.gameOver = true;
        this.triggerGameLost();
      } else {
        this.triggerWrongAnswer(this.gameState.attemptsRemaining);
      }
    }

    return { isCorrect, attemptsRemaining: this.gameState.attemptsRemaining };
  }

  // --- Reset game ---
  resetGame() {
    this.gameState = {
      attemptsRemaining: 2,
      currentStage: 0,
      hasAnsweredCurrentStage: false,
      gameOver: false,
      gameWon: false
    };
    this.hasTriggeredQuiz = false;
    if(this.player) {
      this.player.position.copy(this.playerStartPosition);
      this.playerVelocity.set(0,0,0);
      this.playerVelY = 0;
    }
  }

  
  getGameState() { return this.gameState; }



  // Enable a simple ragdoll using cannon-es (if available); otherwise no-op
  enableRagdoll(initialImpulse = new THREE.Vector3()) {
    if (!this.cannon.world || this.ragdoll) return;
    if (!this.player) return;
    const { CANNON, world } = this.cannon;

    // Hide the main player mesh while ragdoll is active
    this.player.visible = false;

    const origin = this.player.position.clone().add(new THREE.Vector3(0, 1.1, 0));
    const bodies = [];
    const visuals = [];
    const addBody = (shape, pos, mass, color = 0x8B7355) => {
      const body = new CANNON.Body({ mass, shape });
      body.position.set(pos.x, pos.y, pos.z);
      world.addBody(body);
      const vis = new THREE.Mesh(
        shape instanceof CANNON.Sphere ? new THREE.SphereGeometry(shape.radius, 16, 16)
          : new THREE.BoxGeometry(shape.halfExtents.x*2, shape.halfExtents.y*2, shape.halfExtents.z*2),
        new THREE.MeshStandardMaterial({ color, metalness: 0.1, roughness: 0.8 })
      );
      this.scene.add(vis);
      bodies.push(body); visuals.push(vis);
      return body;
    };

    // Torso (box), head (sphere), legs (boxes); very simple constraints
    const torso = addBody(new CANNON.Box(new CANNON.Vec3(0.25, 0.5, 0.18)), origin, 5, 0x8B7355);
    const head = addBody(new CANNON.Sphere(0.22), origin.clone().add(new THREE.Vector3(0, 0.9, 0)), 1, 0xA0826D);
    const legL = addBody(new CANNON.Box(new CANNON.Vec3(0.15, 0.45, 0.15)), origin.clone().add(new THREE.Vector3(-0.18, -0.9, 0)), 2);
    const legR = addBody(new CANNON.Box(new CANNON.Vec3(0.15, 0.45, 0.15)), origin.clone().add(new THREE.Vector3(0.18, -0.9, 0)), 2);

    // Constraints (distance constraints for simplicity)
    world.addConstraint(new CANNON.DistanceConstraint(torso, head, 0.7));
    world.addConstraint(new CANNON.DistanceConstraint(torso, legL, 1.0));
    world.addConstraint(new CANNON.DistanceConstraint(torso, legR, 1.0));

    // Apply initial impulse to the torso to reflect the hit
    torso.velocity.set(initialImpulse.x, Math.max(initialImpulse.y, 0), initialImpulse.z);

    this.ragdoll = { bodies, visuals };
    if (this.onRagdollStart) this.onRagdollStart();
  }

  stepCannon(delta) {
    if (!this.cannon.world || !this.ragdoll) return;
    const { world } = this.cannon;
    // Fixed-timestep stepping for stability
    const fixed = 1 / 60;
    world.step(fixed, delta, 3);
    // Sync visuals
    for (let i = 0; i < this.ragdoll.bodies.length; i++) {
      const b = this.ragdoll.bodies[i];
      const v = this.ragdoll.visuals[i];
      v.position.set(b.position.x, b.position.y, b.position.z);
      v.quaternion.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w);
    }
  }

  // Optional callbacks
  setOnBump(cb) { this.onBump = cb; }
  setOnRagdollStart(cb) { this.onRagdollStart = cb; }

  getCollidables(){ return this.collidables; }
  getScene(){ return this.scene; }
  getPlayer(){ return this.player; }
  getMixer(){ return this.mixer; }
  getPlayerStartPosition(){ return this.playerStartPosition||new THREE.Vector3(0,0,10); }

  // ---- Bolt spawn management ----
  computeBoltSpawns() {
    // Define named spawn points with flavorful clues
    const near = (v, dx = 0, dz = 0) => new THREE.Vector3(v.x + dx, 0.3, v.z + dz);
    const room = this.roomSize;

    // Base references
    const platformRefs = (this.platforms || []).map(p => p.position.clone());
    const chainRefs = [
      new THREE.Vector3(-25, 0, -25),
      new THREE.Vector3(25, 0, -25),
      new THREE.Vector3(-25, 0, 25),
      new THREE.Vector3(25, 0, 25)
    ];
    const pipeRing = (r, a) => new THREE.Vector3(Math.cos(a) * r, 0.3, Math.sin(a) * r);

    const spawns = [];

    // Around platforms
    if (platformRefs[0]) spawns.push({
      name: 'northwest platform',
      pos: near(platformRefs[0], 3.5, -1.5),
      clue: 'Where the first platform rises and falls in the northwest.'
    });
    if (platformRefs[1]) spawns.push({
      name: 'northeast platform',
      pos: near(platformRefs[1], -3.5, -1.5),
      clue: 'By the platform that watches the northeast corner.'
    });
    if (platformRefs[2]) spawns.push({
      name: 'southwest platform',
      pos: near(platformRefs[2], 2.0, 3.5),
      clue: 'Close to the platform that waits in the southwest.'
    });
    if (platformRefs[3]) spawns.push({
      name: 'southeast platform',
      pos: near(platformRefs[3], -2.0, 3.5),
      clue: 'Near the platform where sunrise would strike: southeast.'
    });

    // Near big clock face (north wall)
    spawns.push({
      name: 'clock face',
      pos: new THREE.Vector3(0, 0.3, -room / 2 + 5),
      clue: 'Where the great face watches from the north wall.'
    });

    // East / West / South gear walls
    spawns.push({
      name: 'east gears',
      pos: new THREE.Vector3(room / 2 - 5, 0.3, 0),
      clue: 'Where the eastern gears chatter in golden teeth.'
    });
    spawns.push({
      name: 'west gears',
      pos: new THREE.Vector3(-room / 2 + 5, 0.3, 0),
      clue: 'Where the western cogs grind in steady time.'
    });
    spawns.push({
      name: 'south gears',
      pos: new THREE.Vector3(0, 0.3, room / 2 - 5),
      clue: 'In the south, where wheels within wheels quietly turn.'
    });

    // Beneath the north and south catwalks (on the floor)
    spawns.push({
      name: 'under north catwalk',
      pos: new THREE.Vector3(0, 0.3, -35),
      clue: 'under the narrow walkway where cold northern drafts creep.'
    });
    spawns.push({
      name: 'under south catwalk',
      pos: new THREE.Vector3(0, 0.3, 35),
      clue: 'beneath the southern catwalk, where footsteps echo softly.'
    });

    // Near hanging chains (choose the first for a stable hint location)
    chainRefs.forEach((c, idx) => {
      spawns.push({
        name: `hanging chain ${idx + 1}`,
        pos: new THREE.Vector3(c.x, 0.3, c.z),
        clue: 'Where iron links sway ever so slightly from above.'
      });
    });

    // By the pipe ring positions (at radius ~35)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 8;
      spawns.push({
        name: `pipe ring ${i + 1}`,
        pos: pipeRing(35, a),
        clue: 'Near the bronze pipes that stand like sentries in a ring.'
      });
    }

    // Near central mechanism base
    spawns.push({
      name: 'central mechanism',
      pos: new THREE.Vector3(0, 0.3, 0),
      clue: 'by the humming heart of the tower, at the very center.'
    });

    // Rooms: doorway and interior positions
    const boltsRoomCenter = new THREE.Vector3(-28, 0, 0);
    const boltsRoomHalfD = 12 / 2;
    const storageRoomCenter = new THREE.Vector3(28, 0, 8);
    const storageRoomHalfD = 14 / 2;

    spawns.push({
      name: 'bolts room doorway',
      pos: new THREE.Vector3(boltsRoomCenter.x, 0.3, boltsRoomCenter.z + boltsRoomHalfD + 0.8),
      clue: 'at the doorway of the Bolts Room—two wall bolts watch within.'
    });
    spawns.push({
      name: 'bolts room interior',
      pos: new THREE.Vector3(boltsRoomCenter.x + 2, 0.3, boltsRoomCenter.z + 1),
      clue: 'inside the Bolts Room, beneath the two wall-mounted bolts and crates.'
    });
    spawns.push({
      name: 'storage room doorway',
      pos: new THREE.Vector3(storageRoomCenter.x, 0.3, storageRoomCenter.z + storageRoomHalfD + 0.8),
      clue: 'by the Storage Room entrance, where crates stack like walls.'
    });
    spawns.push({
      name: 'storage room interior',
      pos: new THREE.Vector3(storageRoomCenter.x - 2, 0.3, storageRoomCenter.z - 1),
      clue: 'within the Storage Room, between the dusty crates.'
    });

    this.boltSpawns = spawns;
  }

  moveSpecialBoltTo(pos) {
    if (!this.specialBolt) return;
    this.specialBolt.position.copy(pos);
    if (this.specialBoltGlow) this.specialBoltGlow.position.set(pos.x, 1.5, pos.z);
    // Give it a slight fun tilt and random yaw so it feels freshly placed
    this.specialBolt.rotation.x = Math.PI / 2.5;
    this.specialBolt.rotation.y = Math.random() * Math.PI * 2;
  }

  selectNextBoltSpawn() {
    // Choose a random spawn different from the previous one
    if (!this.boltSpawns || this.boltSpawns.length === 0) return 'Listen for a faint metallic whisper...';
    let next = Math.floor(Math.random() * this.boltSpawns.length);
    if (this.currentBoltSpawnIndex >= 0 && this.boltSpawns.length > 1) {
      // Avoid repeating the same spawn back-to-back
      let safety = 0;
      while (next === this.currentBoltSpawnIndex && safety++ < 10) {
        next = Math.floor(Math.random() * this.boltSpawns.length);
      }
    }
    this.currentBoltSpawnIndex = next;
    const spawn = this.boltSpawns[next];
    this.moveSpecialBoltTo(spawn.pos);
    return `The next bolt will appear ${spawn.clue}`;
  }

  // ---- Side rooms with doors and reduced visibility/obstacles ----
  createSideRooms() {
    this.steamClouds = [];
    this.dustPlanes = [];

    // Helper to build a simple rectangular room with a doorway gap on the front side
    const buildRoom = ({ center, width, depth, height = 10, name, style }) => {
      const group = new THREE.Group();
      group.position.copy(center);
      const halfW = width / 2;
      const halfD = depth / 2;
      const doorW = 3;
      const wallThick = 0.5;
      const wallMat = new THREE.MeshPhongMaterial({ color: 0x6d5a4b, shininess: 8 });

      // Floor
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), new THREE.MeshPhongMaterial({ color: 0x5e4d3f }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(0, 0, 0);
      group.add(floor);
      this.scene.add(group);

      // Back wall (full)
      const back = new THREE.Mesh(new THREE.BoxGeometry(width, height, wallThick), wallMat);
      back.position.set(0, height / 2, -halfD);
      group.add(back); this.beams.push(back); this.collidables.push(back);

      // Left wall (full)
      const left = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, depth), wallMat);
      left.position.set(-halfW, height / 2, 0);
      group.add(left); this.beams.push(left); this.collidables.push(left);

      // Right wall (full)
      const right = new THREE.Mesh(new THREE.BoxGeometry(wallThick, height, depth), wallMat);
      right.position.set(halfW, height / 2, 0);
      group.add(right); this.beams.push(right); this.collidables.push(right);

      // Front wall: split to leave a doorway gap at center
      const sideW = (width - doorW) / 2;
      const frontLeft = new THREE.Mesh(new THREE.BoxGeometry(sideW, height, wallThick), wallMat);
      frontLeft.position.set(-halfW + sideW / 2, height / 2, halfD);
      group.add(frontLeft); this.beams.push(frontLeft); this.collidables.push(frontLeft);

      const frontRight = new THREE.Mesh(new THREE.BoxGeometry(sideW, height, wallThick), wallMat);
      frontRight.position.set(halfW - sideW / 2, height / 2, halfD);
      group.add(frontRight); this.beams.push(frontRight); this.collidables.push(frontRight);

      // Simple door frame decoration (non-collidable)
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x9b7a57, metalness: 0.4, roughness: 0.6 });
      const topFrame = new THREE.Mesh(new THREE.BoxGeometry(doorW, 0.3, 0.3), frameMat);
      topFrame.position.set(0, 2.2, halfD + 0.2);
      const sideFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), frameMat);
      sideFrameL.position.set(-doorW / 2 + 0.15, 1.1, halfD + 0.2);
      const sideFrameR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), frameMat);
      sideFrameR.position.set(doorW / 2 - 0.15, 1.1, halfD + 0.2);
      group.add(topFrame, sideFrameL, sideFrameR);

      // Lighting inside room (dim)
      const lamp = new THREE.PointLight(0xffe0b3, 0.6, Math.max(width, depth));
      lamp.position.set(0, height - 2, 0);
      group.add(lamp);

      // Style-specific interior to reduce visibility
  if (style === 'bolts') {
        // Large bolts scattered as obstacles and sight blockers
        const boltMat = new THREE.MeshStandardMaterial({ color: 0x9C5F2C, metalness: 0.85, roughness: 0.35 });
        const makeBolt = (scale = 1.0) => {
          const shaftR = 0.35 * scale;
          const shaftH = 1.4 * scale;
          const headR = shaftR * 2.2;
          const headH = 0.35 * scale;
          const shaft = new THREE.Mesh(new THREE.CylinderGeometry(shaftR, shaftR, shaftH, 16), boltMat);
          const head = new THREE.Mesh(new THREE.CylinderGeometry(headR, headR, headH, 16), boltMat);
          const g = new THREE.Group();
          shaft.position.y = shaftH / 2;
          head.position.y = shaftH + headH / 2;
          g.add(shaft, head);
          return g;
        };
        // Two wall-mounted bolts
        const boltLeft = makeBolt(1.1);
        boltLeft.rotation.z = -Math.PI / 2; // point into room from left wall
        boltLeft.position.set(-halfW + wallThick * 0.6, 2.2, 0);
        group.add(boltLeft);
        this.collidables.push(boltLeft);
        this.bolts.push(boltLeft);

        const boltRight = makeBolt(1.1);
        boltRight.rotation.z = Math.PI / 2; // point into room from right wall
        boltRight.position.set(halfW - wallThick * 0.6, 2.2, 0);
        group.add(boltRight);
        this.collidables.push(boltRight);
        this.bolts.push(boltRight);

        // Add some boxes (crates) on the floor as obstacles
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6b47, roughness: 0.8, metalness: 0.1 });
        for (let i = 0; i < 6; i++) {
          const w = 1 + Math.random() * 1.5;
          const h = 0.8 + Math.random() * 1.8;
          const d = 1 + Math.random() * 1.5;
          const crate = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat);
          crate.position.set(
            (Math.random() - 0.5) * (width - 3),
            h / 2,
            (Math.random() - 0.5) * (depth - 3)
          );
          group.add(crate);
          this.beams.push(crate);
          this.collidables.push(crate);
        }
      } else if (style === 'storage') {
        // Crates to block sight (collidable)
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x8a6b47, roughness: 0.8, metalness: 0.1 });
        for (let i = 0; i < 14; i++) {
          const w = 1 + Math.random() * 1.2;
          const h = 0.8 + Math.random() * 1.5;
          const d = 1 + Math.random() * 1.2;
          const crate = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), crateMat);
          crate.position.set(
            (Math.random() - 0.5) * (width - 3),
            h / 2,
            (Math.random() - 0.5) * (depth - 3)
          );
          group.add(crate);
          this.beams.push(crate);
          this.collidables.push(crate);
        }
        // Dusty haze planes (non-collidable)
        for (let i = 0; i < 8; i++) {
          const plane = new THREE.Mesh(new THREE.PlaneGeometry(4 + Math.random() * 3, 2 + Math.random() * 2), new THREE.MeshBasicMaterial({ color: 0xcbbba0, transparent: true, opacity: 0.25 + Math.random() * 0.2, side: THREE.DoubleSide }));
          plane.position.set(
            (Math.random() - 0.5) * (width - 2),
            1.2 + Math.random() * 2,
            (Math.random() - 0.5) * (depth - 2)
          );
          plane.rotation.y = Math.random() * Math.PI;
          plane.userData.baseOpacity = plane.material.opacity;
          group.add(plane);
          this.dustPlanes.push(plane);
        }
      }

      // Save reference
      if (!this.rooms) this.rooms = [];
      this.rooms.push({ name, group, bounds: { width, depth, height } });
    };

    // Place two rooms inside the hall
    buildRoom({ center: new THREE.Vector3(-28, 0, 0), width: 16, depth: 12, name: 'Bolts Room', style: 'bolts' });
    buildRoom({ center: new THREE.Vector3(28, 0, 8), width: 18, depth: 14, name: 'Storage Room', style: 'storage' });
  }
}