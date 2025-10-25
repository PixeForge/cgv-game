
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
    this.extendedRoomSize = this.roomSize + 100;
    this.init();
  }

  init() {
    this.scene.background = new THREE.Color(0x87CEEB);
    this.scene.fog = new THREE.Fog(0x87CEEB, 150, 300);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    this.createClocktowerWorkshop();
  }

  createClocktowerWorkshop() {
    const wallMat = new THREE.MeshPhongMaterial({ color: 0x4B2E1F, shininess: 10 });
    this.createWallsWithArchway(this.roomSize, this.extendedRoomSize, 25, 1, wallMat);

    const floorMat = new THREE.MeshPhongMaterial({ color: 0x808080, shininess: 10 });
    const floorGeo = new THREE.PlaneGeometry(this.roomSize, this.extendedRoomSize);
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    this.scene.add(floor);
    this.collidables.push(floor);
    this.playerStartPosition = new THREE.Vector3(0, 0, this.roomSize / 2 - 4);

    this.createPathway();
    this.createGearObstacle();
    this.createPendulumObstacle();
    this.createRisingPlatforms();
    this.createRotatingPlatforms();
    this.createSlidingBridge();
    this.createDecorations();
    this.addAnimatedClockFaces();
  }

  createWallsWithArchway(roomSize, extendedRoomSize, wallHeight, wallThickness, wallMat) {
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(roomSize, wallHeight, wallThickness), wallMat);
    northWall.position.set(0, wallHeight / 2, -extendedRoomSize / 2);
    this.scene.add(northWall); this.collidables.push(northWall);

    const invisibleGate = new THREE.Mesh(new THREE.BoxGeometry(4, 8, 1), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
    invisibleGate.position.set(0, 4, extendedRoomSize / 2 - 0.5); this.scene.add(invisibleGate); this.collidables.push(invisibleGate);

    const eastWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, extendedRoomSize), wallMat);
    eastWall.position.set(roomSize / 2, wallHeight / 2, 0); this.scene.add(eastWall); this.collidables.push(eastWall);

    const westWall = new THREE.Mesh(new THREE.BoxGeometry(wallThickness, wallHeight, extendedRoomSize), wallMat);
    westWall.position.set(-roomSize / 2, wallHeight / 2, 0); this.scene.add(westWall); this.collidables.push(westWall);
  }

  createPathway() {
    const mat = new THREE.MeshPhongMaterial({ color: 0x654321, shininess: 4 });
    const segments = [
      [[0, 0.05, 120],[0, 0.05, 110]],[[0, 0.05, 110],[0, 0.05, 100]],[[0, 0.05, 100],[0, 0.05, 48]],
      [[0, 0.05, 48],[0, 0.05, 42]],[[0, 0.05, 42],[-5,0.05,35]],[[-5,0.05,35],[-15,0.05,25]],
      [[-15,0.05,25],[-25,0.05,15]],[[-25,0.05,15],[-35,0.05,5]],[[-35,0.05,5],[-40,0.05,-10]],
      [[-40,0.05,-10],[-25,0.05,-25]],[[-25,0.05,-25],[-10,0.05,-40]],[[-10,0.05,-40],[10,0.05,-55]],
      [[10,0.05,-55],[25,0.05,-70]],[[25,0.05,-70],[15,0.05,-85]],[[15,0.05,-85],[0,0.05,-95]]
    ];
    segments.forEach(seg => {
      const start = new THREE.Vector3(...seg[0]), end = new THREE.Vector3(...seg[1]);
      const dir = new THREE.Vector3().subVectors(end,start); const mid = new THREE.Vector3().addVectors(start,end).multiplyScalar(0.5);
      const geo = new THREE.BoxGeometry(10, 0.1, dir.length()); const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(mid); mesh.rotation.y = Math.atan2(dir.x, dir.z);
      this.scene.add(mesh);
      this.collidables.push(mesh);
    });
  }

  createGearObstacle() {
    const mat = new THREE.MeshPhongMaterial({ color: 0xFFD700, shininess: 100 });
    const shape = new THREE.Shape(); const teeth=24, outerR=4, innerR=3;
    for(let i=0;i<teeth;i++){
      const a=i/teeth*Math.PI*2, na=(i+1)/teeth*Math.PI*2;
      const x1=Math.cos(a)*outerR, y1=Math.sin(a)*outerR, x2=Math.cos((a+na)/2)*innerR, y2=Math.sin((a+na)/2)*innerR;
      if(i===0) shape.moveTo(x1,y1); else shape.lineTo(x1,y1); shape.lineTo(x2,y2);
    } shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape,{ depth:0.8, bevelEnabled:false });
    const mesh = new THREE.Mesh(geo, mat); mesh.rotation.y=Math.PI/4; mesh.position.set(-20.5, -2.45, 20);
    this.scene.add(mesh); this.collidables.push(mesh); this.gear=mesh;
  }

  createPendulumObstacle() {
    const g=new THREE.Group(); const rod=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,8,8), new THREE.MeshStandardMaterial({ color:0x444444, metalness:0.8 }));
    rod.position.y=-4; g.add(rod);
    const bob=new THREE.Mesh(new THREE.SphereGeometry(1.5,16,16), new THREE.MeshStandardMaterial({ color:0x222222, metalness:0.9 }));
    bob.position.y=-8; g.add(bob); g.position.set(-10,10,30); this.scene.add(g);
    this.pendulums=this.pendulums||[]; this.pendulums.push(g); this.collidables.push(g);
  }
createRisingPlatforms() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
    this.platforms = [];
    const positions = [
        new THREE.Vector3(-5, 0.5, 35),
        new THREE.Vector3(-15, 0.5, 25),
        new THREE.Vector3(-25, 0.5, 15)
    ];
    positions.forEach(pos => {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(4, 0.3, 4), mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.collidables.push(mesh);
        this.platforms.push(mesh);
    });
}

createRotatingPlatforms() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xb8860b, metalness: 1 });
    this.rotatingPlatforms = [];
    const positions = [
        new THREE.Vector3(-35, 0.3, 5),
        new THREE.Vector3(-40, 0.3, -10),
        new THREE.Vector3(-25, 0.3, -25)
    ];
    positions.forEach(pos => {
        const mesh = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 0.3, 24), mat);
        mesh.rotation.x = Math.PI / 2;
        mesh.position.copy(pos);
        this.scene.add(mesh);
        this.collidables.push(mesh);
        this.rotatingPlatforms.push(mesh);
    });
}

createSlidingBridge() {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(10, 0.4, 3),
        new THREE.MeshStandardMaterial({ color: 0x555555 })
    );
    mesh.position.set(0, 1, -55); // along the path where player moves next
    this.scene.add(mesh);
    this.collidables.push(mesh);
    this.slidingBridge = mesh;
}


  createDecorations() {
    const bulbMat=new THREE.MeshStandardMaterial({ color:0xffffaa, emissive:0xffff88, emissiveIntensity:2 });
    const bulbGeo=new THREE.SphereGeometry(0.5,16,16);
    for(let i=-40;i<=40;i+=20){
      let n=new THREE.Mesh(bulbGeo,bulbMat); n.position.set(i,10,-this.extendedRoomSize/2+0.5); this.scene.add(n);
      let s=new THREE.Mesh(bulbGeo,bulbMat); s.position.set(i,10,this.extendedRoomSize/2-0.5); this.scene.add(s);
      let e=new THREE.Mesh(bulbGeo,bulbMat); e.position.set(this.roomSize/2-0.5,10,i); this.scene.add(e);
      let w=new THREE.Mesh(bulbGeo,bulbMat); w.position.set(-this.roomSize/2+0.5,10,i); this.scene.add(w);
    }
  }

  addAnimatedClockFaces() {
    const createClock=()=>{
      const c=new THREE.Group(); const radius=3;
      const face=new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape().absarc(0,0,radius,0,Math.PI*2)), new THREE.MeshBasicMaterial({ color:0xffffff })); c.add(face);
      c.userData={hourHand:new THREE.Mesh(new THREE.BoxGeometry(0.2,radius*0.5,0.05), new THREE.MeshBasicMaterial({ color:0 })), minuteHand:new THREE.Mesh(new THREE.BoxGeometry(0.1,radius*0.8,0.05), new THREE.MeshBasicMaterial({ color:0 }))};
      c.userData.hourHand.position.set(0,radius*0.25,0.05); c.userData.minuteHand.position.set(0,radius*0.4,0.05); c.add(c.userData.hourHand,c.userData.minuteHand);
      return c;
    };
    this.clocks=[createClock(),createClock(),createClock(),createClock()];
    this.clocks[0].position.set(-30,8,-this.extendedRoomSize/2+0.6); this.scene.add(this.clocks[0]);
    this.clocks[1].position.set(30,8,this.extendedRoomSize/2-0.6); this.clocks[1].rotation.y=Math.PI; this.scene.add(this.clocks[1]);
    this.clocks[2].position.set(this.roomSize/2-0.6,8,0); this.clocks[2].rotation.y=-Math.PI/2; this.scene.add(this.clocks[2]);
    this.clocks[3].position.set(-this.roomSize/2+0.6,8,0); this.clocks[3].rotation.y=Math.PI/2; this.scene.add(this.clocks[3]);
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
    this.updateGearRotation(delta); this.updateGearCollision();
    this.updateClockHands(delta);

    if(this.pendulums) this.pendulums.forEach((p,i)=>{ p.rotation.z=Math.sin(Date.now()*0.001+i)*0.6 });
    if(this.platforms) this.platforms.forEach((p,i)=>{ p.position.y=0.5+Math.sin(Date.now()*0.001+i*1.5)*2 });
    if(this.rotatingPlatforms) this.rotatingPlatforms.forEach(r=>r.rotation.z+=delta);
    if(this.slidingBridge) this.slidingBridge.position.x=Math.sin(Date.now()*0.001)*10;
  }

  updateGearRotation(delta){ if(this.gear) this.gear.rotation.z+=delta; }

  updateGearCollision(){
    if(!this.player||!this.gear) return;
    const pb=new THREE.Box3().setFromCenterAndSize(this.player.position.clone().add(new THREE.Vector3(0,1,0)), new THREE.Vector3(1,2,1));
    const gb=new THREE.Box3().setFromCenterAndSize(this.gear.position.clone(), new THREE.Vector3(4,0.8,4));
    if(pb.intersectsBox(gb)){ this.player.position.add(new THREE.Vector3().subVectors(this.player.position,this.gear.position).setY(0).normalize().multiplyScalar(2)); this.player.position.y+=0.3; }
  }

  updateClockHands(delta){ if(!this.clocks) return; this.clocks.forEach(c=>{ c.userData.minuteHand.rotation.z-=delta*2*Math.PI/60; c.userData.hourHand.rotation.z-=delta*2*Math.PI/720; }) }

  getCollidables(){ return this.collidables; }
  getScene(){ return this.scene; }
  getPlayer(){ return this.player; }
  getMixer(){ return this.mixer; }
  getPlayerStartPosition(){ return this.playerStartPosition||new THREE.Vector3(0,0,10); }
}

