// 2nd level/quiz.js
export function createLevel2Quizzes({ scene, player, camera, onAttempt = null }) {
  let active = false;
  let overlay = null;
  let currentQuizIndex = null;
  const zones = [];
  let hintEl = null;
  const completed = new Set();
  const attempted = new Set();

  // Public: add proximity zone that triggers on 'P'
  function addZone({ id, position, radius = 3, quizIndex }) {
    zones.push({ id, position, radius, quizIndex });
  }

  // Helper: distance 2D in XZ plane
  function distanceXZ(a, b) {
    const dx = a.x - b.x;
    const dz = a.z - b.z;
    return Math.hypot(dx, dz);
  }

  function createOverlay() {
    const o = document.createElement('div');
    o.id = 'level2-quiz-overlay';
    o.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    `;

    const box = document.createElement('div');
    box.style.cssText = `
      background: linear-gradient(145deg, #e6f3ff 0%, #cce7ff 100%);
      border: 5px solid #3399ff;
      border-radius: 18px;
      padding: 28px 32px;
      max-width: 520px;
      width: 92%;
      box-shadow: 0 15px 40px rgba(51,153,255,0.5), 0 0 0 3px #66b3ff inset;
      font-family: 'Comic Sans MS', 'Arial Rounded MT Bold', cursive;
      color: #0066cc;
      text-align: left;
    `;

    const title = document.createElement('h2');
    title.style.cssText = `
      margin: 0 0 10px 0;
      color: #ff3333;
      text-shadow: 2px 2px 0 #0066cc;
    `;
    title.textContent = 'Riddle';

    const question = document.createElement('div');
    question.id = 'quiz-question';
    question.style.cssText = `
      font-size: 18px;
      line-height: 1.4;
      margin-bottom: 14px;
    `;

    const optionsWrap = document.createElement('div');
    optionsWrap.id = 'quiz-options';
    optionsWrap.style.cssText = `
      display: grid; grid-template-columns: 1fr; gap: 8px; margin: 10px 0 14px 0;
    `;

    const feedback = document.createElement('div');
    feedback.id = 'quiz-feedback';
    feedback.style.cssText = `min-height: 20px; margin-bottom: 8px; font-weight: bold;`;

    const buttons = document.createElement('div');
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.style.cssText = `
      background:#999;color:white;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;
    `;
    buttons.appendChild(close);

    box.appendChild(title);
    box.appendChild(question);
    box.appendChild(optionsWrap);
    box.appendChild(feedback);
    box.appendChild(buttons);
    o.appendChild(box);
    document.body.appendChild(o);

    return { root: o, question, optionsWrap, feedback, close };
  }

  const riddles = [
    {
      id: 'mirror-wall',
      text: "I show you truth without a sound, your world reversed yet always found. What am I?",
      correct: 'Mirror',
      options: ['Mirror', 'Window', 'Picture'],
    },
    {
      id: 'train-riddle',
      text: "To achieve flat shading the normal vectors associated with the vertices of a primitive should\n\nQuestion 4 Select one:",
      correct: 'b. be normal to the primitive.',
      options: [
        'a. point towards the light source.',
        'b. be normal to the primitive.',
        'c. point towards the camera.',
        'd. be normal to the actual surface being modelled.'
      ],
    },
    {
      id: 'third',
      text: "The more you take, the more you leave behind. What am I?",
      correct: 'Footsteps',
      options: ['Memories', 'Footsteps', 'Breath'],
    },
  ];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function openQuiz(index) {
    if (completed.has(index)) return; // already answered, ignore
    if (!overlay) overlay = createOverlay();
    const { root, question, optionsWrap, feedback, close } = overlay;
    active = true;
    currentQuizIndex = index;
    root.style.display = 'flex';

    // Disable gameplay movement updates while quiz is active
    window.LEVEL2_QUIZ_ACTIVE = true;

    if (!attempted.has(index) && typeof onAttempt === 'function') {
      attempted.add(index);
      try { onAttempt(index); } catch (_) {}
    }

    const r = riddles[index];
    question.textContent = r.text;
    feedback.textContent = '';
    optionsWrap.innerHTML = '';
    const shuffled = shuffle(r.options);
    shuffled.forEach((opt) => {
      const btn = document.createElement('button');
      btn.textContent = opt;
      btn.style.cssText = `
        text-align:left; width:100%; background:#ffffff; color:#0066cc; border:2px solid #66b3ff;
        border-radius:8px; padding:10px 12px; cursor:pointer;
      `;
      btn.onclick = () => {
        if (opt.toLowerCase() === r.correct.toLowerCase()) {
          feedback.style.color = '#2e7d32';
          feedback.textContent = 'Correct!';
          completed.add(index);
          setTimeout(closeQuiz, 600);
        } else {
          feedback.style.color = '#c62828';
          feedback.textContent = 'Not quite. Try another option.';
        }
      };
      optionsWrap.appendChild(btn);
    });

    close.onclick = closeQuiz;

    function closeQuiz() {
      active = false;
      root.style.display = 'none';
      window.LEVEL2_QUIZ_ACTIVE = false;
    }
  }

  function ensureHint() {
    if (hintEl) return;
    const el = document.createElement('div');
    el.id = 'quiz-hint';
    el.textContent = 'Press I to interact';
    el.style.cssText = `
      position: fixed;
      top: 50%; left: 50%; transform: translate(-50%, -50%);
      padding: 10px 18px; background: rgba(255,255,255,0.85);
      color: #003d80; border-radius: 10px; font-family: Arial, sans-serif;
      font-size: 18px; z-index: 1500; display: none; pointer-events: none;
      box-shadow: 0 6px 18px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(el);
    hintEl = el;
  }

  function nearestZoneDistance() {
    if (!player || zones.length === 0) return { d: Infinity, zone: null };
    const p = player.position;
    let min = Infinity; let best = null;
    for (const z of zones) {
      if (completed.has(z.quizIndex)) continue; // skip completed zones
      const d = distanceXZ(p, z.position);
      if (d < min) { min = d; best = z; }
    }
    return { d: min, zone: best };
  }

  // Listen for P only when near any zone
  function handleKey(e) {
    if (e.key.toLowerCase() !== 'i' || active) return;
    if (!player) return;
    const { d, zone } = nearestZoneDistance();
    if (zone && d <= zone.radius) {
      e.preventDefault();
      openQuiz(zone.quizIndex);
      return;
    }
  }

  window.addEventListener('keydown', handleKey);

  function destroy() {
    window.removeEventListener('keydown', handleKey);
    if (overlay && overlay.root && overlay.root.parentNode) {
      overlay.root.parentNode.removeChild(overlay.root);
    }
    if (hintEl && hintEl.parentNode) hintEl.parentNode.removeChild(hintEl);
  }

  function update() {
    ensureHint();
    if (!hintEl) return;
    if (active || window.LEVEL2_QUIZ_ACTIVE) {
      hintEl.style.display = 'none';
      return;
    }
    const { d, zone } = nearestZoneDistance();
    if (zone && d <= zone.radius) {
      hintEl.style.display = 'block';
    } else {
      hintEl.style.display = 'none';
    }
  }

  return { addZone, update, destroy };
}

export default createLevel2Quizzes;


