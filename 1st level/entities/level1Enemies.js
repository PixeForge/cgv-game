import * as THREE from "three"
import { Pathfinding } from "../collision/pathfinding.js"
import { Portal } from "../entities/portal.js"

export class Level1Enemies {
  constructor(scene, player, collidables = []) {
    this.scene = scene
    this.player = player
    this.collidables = collidables
    this.pathfinding = new Pathfinding(collidables)
    this.frogs = []
    this.crocodiles = []
    this.book = null
    this.portal = null
    this.gameState = "playing"
    this.quizActive = false
    this.currentQuestion = null
    this.quizAttempts = 0
    this.hintTimer = 0
    this.hintInterval = 15
    this.isPaused = false
    this.portalKeyListener = null
    
    // Multi-stage quiz system
    this.questionsAnsweredCorrectly = 0
    this.totalQuestionsRequired = 3
    this.usedQuestions = [] // Track used questions to avoid repeats
  }

  createFrog() {
    const frogGroup = new THREE.Group()

    const bodyGeo = new THREE.SphereGeometry(0.4, 16, 16)
    bodyGeo.scale(1, 0.6, 1.3)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2d5016,
      roughness: 0.8,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.receiveShadow = true
    frogGroup.add(body)

    const eyeGeo = new THREE.SphereGeometry(0.15, 12, 12)
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xffff00,
      emissive: 0x444400,
    })

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(-0.18, 0.2, 0.3)
    leftEye.castShadow = true
    frogGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(0.18, 0.2, 0.3)
    rightEye.castShadow = true
    frogGroup.add(rightEye)

    const pupilGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const pupilMat = new THREE.MeshStandardMaterial({ color: 0x000000 })

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat)
    leftPupil.position.set(-0.18, 0.2, 0.42)
    frogGroup.add(leftPupil)

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat)
    rightPupil.position.set(0.18, 0.2, 0.42)
    frogGroup.add(rightPupil)

    const glowGeo = new THREE.SphereGeometry(0.6, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    frogGroup.add(glow)
    frogGroup.userData.glow = glow

    return frogGroup
  }

  createCrocodile() {
    const crocGroup = new THREE.Group()

    const bodyGeo = new THREE.BoxGeometry(1.5, 0.4, 0.6)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x2d4a2a,
      roughness: 0.9,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    crocGroup.add(body)

    const headGeo = new THREE.BoxGeometry(0.8, 0.3, 0.5)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(1, 0, 0)
    head.castShadow = true
    crocGroup.add(head)

    const snoutGeo = new THREE.BoxGeometry(0.4, 0.15, 0.4)
    const snout = new THREE.Mesh(snoutGeo, bodyMat)
    snout.position.set(1.5, -0.05, 0)
    snout.castShadow = true
    crocGroup.add(snout)

    const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8)
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0xff0000 })

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
    leftEye.position.set(1.2, 0.15, -0.15)
    crocGroup.add(leftEye)

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
    rightEye.position.set(1.2, 0.15, 0.15)
    crocGroup.add(rightEye)

    const tailGeo = new THREE.BoxGeometry(0.8, 0.2, 0.3)
    const tail = new THREE.Mesh(tailGeo, bodyMat)
    tail.position.set(-1, 0, 0)
    tail.rotation.z = 0.1
    crocGroup.add(tail)
    crocGroup.userData.tail = tail

    const glowGeo = new THREE.BoxGeometry(2, 0.8, 1)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.1,
      side: THREE.BackSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    crocGroup.add(glow)
    crocGroup.userData.glow = glow

    return crocGroup
  }

  spawnFrogs(count = 4) {
    for (let i = 0; i < count; i++) {
      const frog = this.createFrog()

      const angle = (i / count) * Math.PI * 2
      const distance = 15 + Math.random() * 10

      frog.position.set(Math.cos(angle) * distance, 0.4, Math.sin(angle) * distance)

      frog.userData.speed = 0.8 + Math.random() * 0.4
      frog.userData.hopTimer = Math.random() * 2
      frog.userData.isHopping = false
      frog.userData.catchRadius = 1.5

      this.scene.add(frog)
      this.frogs.push(frog)
    }
    console.log(`Spawned ${count} frogs`)
  }

  spawnCrocodiles(count = 3) {
    for (let i = 0; i < count; i++) {
      const croc = this.createCrocodile()

      const angle = ((i + 0.5) / count) * Math.PI * 2
      const distance = 20 + Math.random() * 10

      croc.position.set(Math.cos(angle) * distance, 0.2, Math.sin(angle) * distance)

      croc.userData.speed = 0.5 + Math.random() * 0.3
      croc.userData.crawlPhase = Math.random() * Math.PI * 2
      croc.userData.catchRadius = 2

      this.scene.add(croc)
      this.crocodiles.push(croc)
    }
    console.log(`Spawned ${count} crocodiles`)
  }

  createBook() {
    const bookGroup = new THREE.Group()

    const bookGeo = new THREE.BoxGeometry(0.6, 0.8, 0.1)
    const bookMat = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      roughness: 0.8,
    })
    const bookBody = new THREE.Mesh(bookGeo, bookMat)
    bookBody.castShadow = true
    bookGroup.add(bookBody)

    const pagesGeo = new THREE.BoxGeometry(0.55, 0.75, 0.12)
    const pagesMat = new THREE.MeshStandardMaterial({ color: 0xffffff })
    const pages = new THREE.Mesh(pagesGeo, pagesMat)
    bookGroup.add(pages)

    const glowGeo = new THREE.BoxGeometry(1, 1.2, 0.4)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide,
    })
    const glow = new THREE.Mesh(glowGeo, glowMat)
    bookGroup.add(glow)
    bookGroup.userData.glow = glow

    const randomX = (Math.random() - 0.5) * 80
    const randomZ = (Math.random() - 0.5) * 80
    bookGroup.position.set(randomX, 1.5, randomZ)
    bookGroup.rotation.set(Math.PI / 2, 0, Math.random() * Math.PI)

    bookGroup.userData.startY = 1.5
    bookGroup.userData.floatOffset = Math.random() * Math.PI * 2

    this.scene.add(bookGroup)
    this.book = bookGroup

    console.log(`Book hidden at (${randomX.toFixed(1)}, ${randomZ.toFixed(1)})`)
  }

  createPortal() {
    // Spawn portal near player but not too close
    const spawnDistance = 8
    const angle = Math.random() * Math.PI * 2
    const portalX = this.player.position.x + Math.cos(angle) * spawnDistance
    const portalZ = this.player.position.z + Math.sin(angle) * spawnDistance

    this.portal = new Portal(this.scene, {
      x: portalX,
      y: 0,
      z: portalZ,
    })
    this.portal.create()

    // Setup E key listener for portal interaction
    this.portalKeyListener = (e) => {
      if (e.code === "KeyE" && this.portal && this.portal.isPlayerInRange()) {
        this.enterPortal()
      }
    }
    document.addEventListener("keydown", this.portalKeyListener)

    console.log(`Portal spawned at (${portalX.toFixed(1)}, ${portalZ.toFixed(1)})`)
  }

  enterPortal() {
    console.log("Entering portal to Clocktower...")
    
    // Dispatch event to load Level 3 (Clocktower) - skipping Level 2
    window.dispatchEvent(new CustomEvent("loadLevel", { detail: { level: 2 } }))
  }

  updateFrogs(delta) {
    if (!this.player || this.gameState !== "playing" || this.quizActive) return

    const playerPos = this.player.position

    this.frogs.forEach((frog) => {
      const frogPos = frog.position
      const distance = new THREE.Vector2(frogPos.x - playerPos.x, frogPos.z - playerPos.z).length()

      if (distance < frog.userData.catchRadius) {
        this.onPlayerCaught("frog")
        return
      }

      const glowIntensity = Math.max(0.1, 1 - distance / 20)
      frog.userData.glow.material.opacity = glowIntensity * 0.3

      const direction = this.pathfinding.findPath(frogPos, playerPos, 0.4)

      frog.userData.hopTimer -= delta

      if (frog.userData.hopTimer <= 0) {
        frog.userData.isHopping = true
        frog.userData.hopTimer = 1.2 + Math.random() * 0.8
      }

      if (frog.userData.isHopping) {
        const moveSpeed = frog.userData.speed * delta * 3
        const newPos = frogPos.clone()
        newPos.x += direction.x * moveSpeed
        newPos.z += direction.z * moveSpeed

        frog.position.x = newPos.x
        frog.position.z = newPos.z

        const hopPhase = (frog.userData.hopTimer % 0.5) / 0.5
        frog.position.y = 0.4 + Math.sin(hopPhase * Math.PI) * 0.3

        frog.rotation.y = Math.atan2(direction.x, direction.z)

        if (hopPhase > 0.9) {
          frog.userData.isHopping = false
        }
      } else {
        frog.position.y = THREE.MathUtils.lerp(frog.position.y, 0.4, delta * 5)
      }
    })
  }

  updateCrocodiles(delta) {
    if (!this.player || this.gameState !== "playing" || this.quizActive) return

    const playerPos = this.player.position

    this.crocodiles.forEach((croc) => {
      const crocPos = croc.position
      const distance = new THREE.Vector2(crocPos.x - playerPos.x, crocPos.z - playerPos.z).length()

      if (distance < croc.userData.catchRadius) {
        this.onPlayerCaught("crocodile")
        return
      }

      const glowIntensity = Math.max(0.1, 1 - distance / 25)
      croc.userData.glow.material.opacity = glowIntensity * 0.3

      const direction = this.pathfinding.findPath(crocPos, playerPos, 0.8)

      const moveSpeed = croc.userData.speed * delta * 2
      const newPos = crocPos.clone()
      newPos.x += direction.x * moveSpeed
      newPos.z += direction.z * moveSpeed

      croc.position.x = newPos.x
      croc.position.z = newPos.z

      croc.userData.crawlPhase += delta * 3
      const crawlBob = Math.sin(croc.userData.crawlPhase) * 0.05
      croc.position.y = 0.2 + crawlBob

      croc.rotation.z = Math.sin(croc.userData.crawlPhase) * 0.05

      if (croc.userData.tail) {
        croc.userData.tail.rotation.y = Math.sin(croc.userData.crawlPhase * 2) * 0.3
      }

      croc.rotation.y = Math.atan2(direction.x, direction.z)
    })
  }

  updateBook(delta) {
    if (!this.book || !this.player || this.gameState !== "playing" || this.quizActive) return

    const time = Date.now() * 0.001
    this.book.position.y = this.book.userData.startY + Math.sin(time * 2 + this.book.userData.floatOffset) * 0.2

    this.book.rotation.y += delta * 0.5

    const glowPulse = 0.15 + Math.sin(time * 3) * 0.1
    this.book.userData.glow.material.opacity = glowPulse

    const distance = this.book.position.distanceTo(this.player.position)
    if (distance < 2) {
      this.onBookFound()
    }
  }

  updatePortal(delta) {
    if (!this.portal || !this.player) return

    this.portal.update(delta, this.player.position)
  }

  updateHints(delta) {
    if (this.gameState !== "playing" || !this.book || !this.player) return

    this.hintTimer += delta

    if (this.hintTimer >= this.hintInterval) {
      this.hintTimer = 0
      this.showHint()
    }
  }

  showHint() {
    const distance = this.player.position.distanceTo(this.book.position)
    const direction = new THREE.Vector3().subVectors(this.book.position, this.player.position).normalize()

    let hintText = ""
    let directionText = ""

    if (Math.abs(direction.x) > Math.abs(direction.z)) {
      directionText = direction.x > 0 ? "east" : "west"
    } else {
      directionText = direction.z > 0 ? "south" : "north"
    }

    if (distance > 40) {
      hintText = `The book is very far to the ${directionText}...`
    } else if (distance > 20) {
      hintText = `The book is somewhere ${directionText}...`
    } else if (distance > 10) {
      hintText = `You're getting closer! Look ${directionText}!`
    } else {
      hintText = `The book is very close! It's glowing nearby!`
    }

    this.displayMessage(hintText, 3000)
  }

  displayMessage(text, duration = 3000) {
    const existingMsg = document.getElementById("hint-message")
    if (existingMsg) existingMsg.remove()

    const msg = document.createElement("div")
    msg.id = "hint-message"
    msg.textContent = text
    msg.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px 30px;
      border-radius: 10px;
      font-size: 18px;
      z-index: 999;
      pointer-events: none;
    `

    document.body.appendChild(msg)

    setTimeout(() => {
      if (msg.parentNode) msg.remove()
    }, duration)
  }

  onBookFound() {
    if (this.quizActive) return

    console.log("Book found! Starting quiz...")
    this.quizActive = true
    this.quizAttempts = 0

    this.showQuiz()
  }

  showQuiz() {
    const quizOverlay = document.createElement("div")
    quizOverlay.id = "quiz-overlay"
    quizOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `

    const quizBox = document.createElement("div")
    quizBox.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 15px;
      max-width: 600px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `

    const questions = [
  {
    question: "I speak without a mouth and hear without ears. I have nobody, but I come alive with wind. What am I?",
    answers: ["A shadow", "An echo", "A whistle", "A ghost"],
    correct: 1,
  },
  {
    question: "The more of this there is, the less you see. What is it?",
    answers: ["Light", "Fog", "Darkness", "Silence"],
    correct: 2,
  },
  {
    question: "I have keys but no locks. I have space but no room. You can enter, but you can't go outside. What am I?",
    answers: ["A map", "A piano", "A keyboard", "A riddle book"],
    correct: 2,
  },
  {
    question: "What gets wetter and wetter the more it dries?",
    answers: ["A sponge", "A towel", "A river", "Soap"],
    correct: 1,
  },
  {
    question: "I am taken from a mine and shut up in a wooden case, from which I am never released, and yet I am used by almost every person. What am I?",
    answers: ["Gold", "Coal", "Pencil lead (graphite)", "Iron"],
    correct: 2,
  },
  {
    question: "Two in a corner, one in a room, zero in a house, but one in a shelter. What is it?",
    answers: ["The letter R", "The letter O", "The letter C", "The letter E"],
    correct: 0,
  },
  {
    question: "The person who makes it, sells it. The person who buys it never uses it. The person who uses it never knows they are using it. What is it?",
    answers: ["A coffin", "A bed", "A watch", "A car"],
    correct: 0,
  },
  {
    question: "I’m light as a feather, yet the strongest man can’t hold me for much more than a minute. What am I?",
    answers: ["Breath", "A shadow", "Time", "A secret"],
    correct: 0,
  },
  {
    question: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?",
    answers: ["A painting", "A map", "An island", "A dream"],
    correct: 1,
  },
  {
    question: "What can travel around the world while staying in a corner?",
    answers: ["A stamp", "A satellite", "A shadow", "A rumor"],
    correct: 0,
  },
  {
    question: "Take away my first letter and I still sound the same. Take away my last letter and I still sound the same. Even take away my middle letter and I will still sound the same. What am I?",
    answers: ["Empty", "Queue", "Level", "Sense"],
    correct: 1,
  },
  {
    question: "The more you take, the more you leave behind. What am I?",
    answers: ["Memories", "Footsteps", "Breaths", "Hints"],
    correct: 1,
  },
];


    this.currentQuestion = questions[Math.floor(Math.random() * questions.length)]

    quizBox.innerHTML = `
      <h2 style="color: #8b4513; margin-top: 0; font-size: 28px; text-align: center;">
        Book Quiz! (Attempt ${this.quizAttempts + 1}/2)
      </h2>
      <p style="font-size: 18px; color: #333; margin: 20px 0; line-height: 1.6;">
        ${this.currentQuestion.question}
      </p>
      <div id="quiz-answers"></div>
    `

    const answersDiv = quizBox.querySelector("#quiz-answers")

    this.currentQuestion.answers.forEach((answer, index) => {
      const button = document.createElement("button")
      button.textContent = answer
      button.style.cssText = `
        display: block;
        width: 100%;
        margin: 10px 0;
        padding: 15px;
        font-size: 16px;
        cursor: pointer;
        border: 2px solid #8b4513;
        border-radius: 8px;
        background: white;
        transition: all 0.3s;
      `

      button.addEventListener("mouseenter", () => {
        button.style.background = "#f5e6d3"
        button.style.transform = "scale(1.02)"
      })

      button.addEventListener("mouseleave", () => {
        button.style.background = "white"
        button.style.transform = "scale(1)"
      })

      button.addEventListener("click", () => {
        this.checkAnswer(index, quizOverlay)
      })

      answersDiv.appendChild(button)
    })

    quizOverlay.appendChild(quizBox)
    document.body.appendChild(quizOverlay)
  }

  checkAnswer(selectedIndex, overlay) {
    if (selectedIndex === this.currentQuestion.correct) {
      this.onWin(overlay)
    } else {
      this.quizAttempts++

      if (this.quizAttempts >= 2) {
        overlay.querySelector("div").innerHTML = `
          <h2 style="color: #d32f2f; margin-top: 0; font-size: 28px; text-align: center;">
            Quiz Failed!
          </h2>
          <p style="font-size: 18px; color: #333; margin: 20px 0; text-align: center;">
            You used both attempts. Try again!
          </p>
          <button id="retry-btn" style="
            display: block;
            width: 100%;
            margin: 20px auto 0;
            padding: 15px;
            font-size: 18px;
            cursor: pointer;
            border: none;
            border-radius: 8px;
            background: #d32f2f;
            color: white;
            font-weight: bold;
          ">Restart Level</button>
        `

        document.getElementById("retry-btn").addEventListener("click", () => {
          this.resetGame()
          overlay.remove()
        })
      } else {
        overlay.querySelector("div").innerHTML = `
          <h2 style="color: #ff9800; margin-top: 0; font-size: 28px; text-align: center;">
            Wrong Answer!
          </h2>
          <p style="font-size: 18px; color: #333; margin: 20px 0; text-align: center;">
            You have 1 more attempt. Try again!
          </p>
          <button id="retry-quiz-btn" style="
            display: block;
            width: 100%;
            margin: 20px auto 0;
            padding: 15px;
            font-size: 18px;
            cursor: pointer;
            border: none;
            border-radius: 8px;
            background: #ff9800;
            color: white;
            font-weight: bold;
          ">Try Again</button>
        `

        document.getElementById("retry-quiz-btn").addEventListener("click", () => {
          overlay.remove()
          this.showQuiz()
        })
      }
    }
  }

  onWin(overlay) {
    this.gameState = "won"
    this.quizActive = false
    console.log("Player wins! Spawning portal...")

    // Remove the book
    if (this.book) {
      this.scene.remove(this.book)
      this.book = null
    }

    overlay.remove()

    // Spawn portal
    this.createPortal()

    // Show success message
    this.displayMessage("Portal opened! Press E to enter and go to the Clocktower", 5000)
  }

  onPlayerCaught(enemyType) {
    if (this.gameState !== "playing") return

    this.gameState = "lost"
    console.log(`Player caught by ${enemyType}!`)

    const overlay = document.createElement("div")
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `

    overlay.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #d32f2f 0%, #f44336 100%);
        padding: 40px;
        border-radius: 15px;
        max-width: 500px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        color: white;
        text-align: center;
      ">
        <h2 style="margin-top: 0; font-size: 36px;">
          CAUGHT!
        </h2>
        <p style="font-size: 20px; margin: 20px 0;">
          A ${enemyType} caught you!
        </p>
        <button id="retry-btn" style="
          display: block;
          width: 100%;
          margin: 20px auto 0;
          padding: 15px;
          font-size: 18px;
          cursor: pointer;
          border: none;
          border-radius: 8px;
          background: white;
          color: #d32f2f;
          font-weight: bold;
        ">Restart Level</button>
      </div>
    `

    document.body.appendChild(overlay)

    document.getElementById("retry-btn").addEventListener("click", () => {
      this.resetGame()
      overlay.remove()
    })
  }

  resetGame() {
    console.log("Resetting game...")

    this.gameState = "playing"
    this.quizActive = false
    this.currentQuestion = null
    this.quizAttempts = 0
    this.hintTimer = 0

    if (this.book) {
      this.scene.remove(this.book)
      this.book = null
    }

    if (this.portal) {
      this.portal.remove()
      this.portal = null
      if (this.portalKeyListener) {
        document.removeEventListener("keydown", this.portalKeyListener)
        this.portalKeyListener = null
      }
    }

    this.frogs.forEach((frog) => this.scene.remove(frog))
    this.frogs = []

    this.crocodiles.forEach((croc) => this.scene.remove(croc))
    this.crocodiles = []

    this.createBook()
    this.spawnFrogs(4)
    this.spawnCrocodiles(3)

    if (this.player) {
      this.player.position.set(0, 0, 0)
    }

    console.log("Game reset complete!")
  }

  dispose() {
    this.frogs.forEach((frog) => {
      this.scene.remove(frog)
    })
    this.frogs = []

    this.crocodiles.forEach((croc) => {
      this.scene.remove(croc)
    })
    this.crocodiles = []

    if (this.book) {
      this.scene.remove(this.book)
      this.book = null
    }

    if (this.portal) {
      this.portal.remove()
      this.portal = null
    }

    if (this.portalKeyListener) {
      document.removeEventListener("keydown", this.portalKeyListener)
      this.portalKeyListener = null
    }

    const overlays = document.querySelectorAll("#quiz-overlay, #pause-overlay, #hint-message, #portal-prompt")
    overlays.forEach((o) => o.remove())
  }

  update(delta) {
    if (this.isPaused) return

    if (this.gameState === "playing") {
      this.updateFrogs(delta)
      this.updateCrocodiles(delta)
      this.updateBook(delta)
      this.updateHints(delta)
    } else if (this.gameState === "won") {
      this.updatePortal(delta)
    }
  }

  updateCollidables(collidables) {
    this.collidables = collidables
    this.pathfinding.updateCollidables(collidables)
  }

  getGameState() {
    return this.gameState
  }

  setGameState(state) {
    this.gameState = state
  }

  getAllEnemies() {
    return [...this.frogs, ...this.crocodiles]
  }

  getBook() {
    return this.book
  }

  getPortal() {
    return this.portal
  }

  togglePause() {
    this.isPaused = !this.isPaused
    this.showPauseScreen()
  }

  showPauseScreen() {
    const existingOverlay = document.getElementById("pause-overlay")

    if (!this.isPaused && existingOverlay) {
      existingOverlay.remove()
      return
    }

    if (this.isPaused && !existingOverlay) {
      const overlay = document.createElement("div")
      overlay.id = "pause-overlay"
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 999;
      `

      overlay.innerHTML = `
        <div style="
          background: white;
          padding: 40px;
          border-radius: 15px;
          text-align: center;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        ">
          <h2 style="color: #333; margin-top: 0; font-size: 36px;">PAUSED</h2>
          <p style="color: #666; font-size: 18px; margin: 20px 0;">Press ESC or click Resume to continue</p>
          <button id="resume-btn" style="
            padding: 15px 30px;
            font-size: 18px;
            cursor: pointer;
            border: none;
            border-radius: 8px;
            background: #4CAF50;
            color: white;
            font-weight: bold;
            margin: 10px;
          ">Resume</button>
          <button id="restart-btn" style="
            padding: 15px 30px;
            font-size: 18px;
            cursor: pointer;
            border: none;
            border-radius: 8px;
            background: #2196F3;
            color: white;
            font-weight: bold;
            margin: 10px;
          ">Restart</button>
        </div>
      `

      document.body.appendChild(overlay)

      document.getElementById("resume-btn").addEventListener("click", () => {
        this.togglePause()
      })

      document.getElementById("restart-btn").addEventListener("click", () => {
        this.resetGame()
        this.togglePause()
      })
    }
  }
}