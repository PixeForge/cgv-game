// 2nd level/quiz.js
export function createLevel2Quizzes({ scene, player, camera }) {
  let active = false;
  let overlay = null;
  let currentQuizIndex = null;
  const zones = [];

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

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Type your answer…';
    input.style.cssText = `
      width: 100%; padding: 10px 12px; font-size: 16px; border-radius: 8px;
      border: 2px solid #66b3ff; outline: none; margin: 6px 0 12px 0;
    `;

    const feedback = document.createElement('div');
    feedback.id = 'quiz-feedback';
    feedback.style.cssText = `min-height: 20px; margin-bottom: 8px; font-weight: bold;`;

    const buttons = document.createElement('div');
    const submit = document.createElement('button');
    submit.textContent = 'Submit';
    submit.style.cssText = `
      background:#4CAF50;color:white;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;margin-right:8px;
    `;
    const close = document.createElement('button');
    close.textContent = 'Close';
    close.style.cssText = `
      background:#999;color:white;border:none;border-radius:8px;padding:10px 16px;cursor:pointer;
    `;
    buttons.appendChild(submit);
    buttons.appendChild(close);

    box.appendChild(title);
    box.appendChild(question);
    box.appendChild(input);
    box.appendChild(feedback);
    box.appendChild(buttons);
    o.appendChild(box);
    document.body.appendChild(o);

    return { root: o, question, input, feedback, submit, close };
  }

  const riddles = [
    {
      id: 'mirror-wall',
      text: "I show you truth without a sound, your world reversed yet always found. What am I?",
      answer: ['mirror', 'a mirror'],
    },
    {
      id: 'second',
      text: "I run but never walk, I murmur but never talk. What am I?",
      answer: ['water', 'a river', 'river'],
    },
    {
      id: 'third',
      text: "The more you take, the more you leave behind. What am I?",
      answer: ['footsteps', 'footstep', 'steps'],
    },
  ];

  function openQuiz(index) {
    if (!overlay) overlay = createOverlay();
    const { root, question, input, feedback, submit, close } = overlay;
    active = true;
    currentQuizIndex = index;
    root.style.display = 'flex';

    // Disable block pushing while quizzes are active
    window.LEVEL2_DISABLE_BLOCK_PUSH = true;

    const r = riddles[index];
    question.textContent = r.text;
    feedback.textContent = '';
    input.value = '';
    input.focus();

    function tryAnswer() {
      const val = (input.value || '').trim().toLowerCase();
      if (r.answer.includes(val)) {
        feedback.style.color = '#2e7d32';
        feedback.textContent = 'Correct!';
        setTimeout(closeQuiz, 600);
      } else {
        feedback.style.color = '#c62828';
        feedback.textContent = 'Try again.';
      }
    }

    submit.onclick = tryAnswer;
    close.onclick = closeQuiz;

    function handleEnter(e) {
      if (e.key === 'Enter') tryAnswer();
      if (e.key === 'Escape') closeQuiz();
    }
    input.addEventListener('keydown', handleEnter);

    function closeQuiz() {
      active = false;
      root.style.display = 'none';
      window.LEVEL2_DISABLE_BLOCK_PUSH = true; // keep disabled if more quizzes ahead; set false if needed
      input.removeEventListener('keydown', handleEnter);
    }
  }

  // Listen for P only when near any zone
  function handleKey(e) {
    if (e.key.toLowerCase() !== 'p' || active) return;
    if (!player) return;
    const p = player.position;
    for (const z of zones) {
      const d = distanceXZ(p, z.position);
      if (d <= z.radius) {
        e.preventDefault();
        openQuiz(z.quizIndex);
        return;
      }
    }
  }

  window.addEventListener('keydown', handleKey);

  function destroy() {
    window.removeEventListener('keydown', handleKey);
    if (overlay && overlay.root && overlay.root.parentNode) {
      overlay.root.parentNode.removeChild(overlay.root);
    }
  }

  // No per-frame work needed now; keep for future
  function update() {}

  return { addZone, update, destroy };
}

export default createLevel2Quizzes;


