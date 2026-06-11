'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
let currentSection = 'home';
let practiceIndex = 0;
let practiceFlipped = false;
let quizQuestions = [];
let quizIndex = 0;
let quizScore = 0;
let quizType = 'letter-to-name'; // or 'name-to-letter'

// ─── Navigation ──────────────────────────────────────────────────────────────
function navigateTo(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('[data-section]').forEach(b => b.classList.remove('active'));

  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.querySelectorAll(`[data-section="${sectionId}"]`).forEach(b => b.classList.add('active'));
  currentSection = sectionId;

  if (sectionId === 'alphabet') renderAlphabet();
  if (sectionId === 'fili') renderFili();
  if (sectionId === 'practice') renderPractice();
  if (sectionId === 'quiz') renderQuizStart();
}

// ─── Alphabet Section ─────────────────────────────────────────────────────────
function renderAlphabet() {
  const grid = document.getElementById('alphabetGrid');
  grid.innerHTML = ALPHABET.map(item => `
    <div class="letter-card" data-id="${item.id}" tabindex="0" role="button" aria-label="${item.nameEn}">
      <div class="letter-card-num">${item.id}</div>
      <div class="letter-char">${item.letter}</div>
      <div class="letter-name">${item.name}</div>
      <div class="letter-sound">[${item.sound}]</div>
    </div>
  `).join('');

  grid.querySelectorAll('.letter-card').forEach(card => {
    card.addEventListener('click', () => openModal(parseInt(card.dataset.id)));
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') openModal(parseInt(card.dataset.id)); });
  });
}

// ─── Letter Modal ─────────────────────────────────────────────────────────────
function openModal(id) {
  const item = ALPHABET.find(a => a.id === id);
  if (!item) return;

  document.getElementById('modalLetter').textContent = item.letter;
  document.getElementById('modalName').innerHTML =
    `<span class="thaana">${item.name}</span> <span class="romanized">(${item.nameEn})</span>`;
  document.getElementById('modalSound').innerHTML =
    `<span class="label">ރާގު:</span> <span class="value">[${item.sound}]</span>`;

  document.getElementById('modalExample').innerHTML =
    `<span class="label">މިސާލު:</span> <span class="thaana example-word">${item.example}</span>
     <span class="example-meaning">${item.exampleMeaning}</span>`;

  const combos = FILI.map(f => {
    const combined = item.letter + f.mark;
    const label = f.sound === '·' ? '(sukun)' : f.romanized;
    return `<div class="combo-pill"><span class="thaana combo-char">${combined}</span><span class="combo-label">${label}</span></div>`;
  }).join('');
  document.getElementById('modalCombinations').innerHTML =
    `<div class="combos-label">ފިލި ބޭނުން ކުރި ގޮތް:</div><div class="combos-grid">${combos}</div>`;

  const overlay = document.getElementById('letterModal');
  overlay.classList.add('open');
  overlay.querySelector('.modal-content').focus();
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('letterModal').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── Fili Section ─────────────────────────────────────────────────────────────
function renderFili() {
  const grid = document.getElementById('filiGrid');
  const BASE = 'ކ';
  grid.innerHTML = FILI.map(f => {
    const display = f.sound === '·' ? BASE + f.mark : BASE + f.mark;
    return `
    <div class="fili-card">
      <div class="fili-mark thaana">${display}</div>
      <div class="fili-sound">${f.sound}</div>
      <div class="fili-name thaana">${f.name}</div>
      <div class="fili-name-en">${f.nameEn}</div>
    </div>`;
  }).join('');

  // Demo selector
  const select = document.getElementById('demoLetter');
  if (select.options.length === 0) {
    ALPHABET.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.letter} — ${a.nameEn}`;
      select.appendChild(opt);
    });
    select.addEventListener('change', updateFiliDemo);
  }
  updateFiliDemo();
}

function updateFiliDemo() {
  const id = parseInt(document.getElementById('demoLetter').value);
  const item = ALPHABET.find(a => a.id === id);
  if (!item) return;

  const container = document.getElementById('demoCombinations');
  container.innerHTML = FILI.map(f => `
    <div class="demo-pill">
      <span class="thaana demo-combo">${item.letter + f.mark}</span>
      <span class="demo-sound">${f.sound}</span>
    </div>
  `).join('');
}

// ─── Practice Section ─────────────────────────────────────────────────────────
function renderPractice() {
  practiceIndex = 0;
  practiceFlipped = false;
  const area = document.getElementById('practiceArea');
  area.innerHTML = `
    <div class="flashcard-wrapper">
      <div class="progress-bar"><div class="progress-fill" id="practiceProgress"></div></div>
      <div class="progress-text" id="practiceProgressText"></div>
      <div class="flashcard" id="flashcard" role="button" tabindex="0" aria-label="ކާޑު ひっくり返す">
        <div class="flashcard-inner" id="flashcardInner">
          <div class="flashcard-front">
            <div class="fc-letter thaana" id="fcLetter"></div>
            <div class="fc-hint">누click ކޮށްލާ</div>
          </div>
          <div class="flashcard-back">
            <div class="fc-name thaana" id="fcName"></div>
            <div class="fc-sound" id="fcSound"></div>
            <div class="fc-example thaana" id="fcExample"></div>
          </div>
        </div>
      </div>
      <div class="flashcard-controls">
        <button class="btn-outline" id="fcPrev">◀ ކުރިން</button>
        <button class="btn-primary" id="fcNext">ދެން ▶</button>
      </div>
    </div>
  `;
  updateFlashcard();

  document.getElementById('flashcard').addEventListener('click', flipCard);
  document.getElementById('flashcard').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') flipCard(); });
  document.getElementById('fcPrev').addEventListener('click', prevCard);
  document.getElementById('fcNext').addEventListener('click', nextCard);
}

function updateFlashcard() {
  const total = ALPHABET.length;
  const item = ALPHABET[practiceIndex];
  practiceFlipped = false;

  const inner = document.getElementById('flashcardInner');
  if (inner) inner.classList.remove('flipped');

  const pct = ((practiceIndex + 1) / total) * 100;
  const prog = document.getElementById('practiceProgress');
  if (prog) prog.style.width = pct + '%';

  const progText = document.getElementById('practiceProgressText');
  if (progText) progText.textContent = `${practiceIndex + 1} / ${total}`;

  const fcLetter = document.getElementById('fcLetter');
  if (fcLetter) fcLetter.textContent = item.letter;

  const fcName = document.getElementById('fcName');
  if (fcName) fcName.textContent = item.name;

  const fcSound = document.getElementById('fcSound');
  if (fcSound) fcSound.textContent = `[${item.sound}]  •  ${item.nameEn}`;

  const fcExample = document.getElementById('fcExample');
  if (fcExample) fcExample.textContent = item.example + (item.exampleMeaning !== item.nameEn ? ` — ${item.exampleMeaning}` : '');
}

function flipCard() {
  const inner = document.getElementById('flashcardInner');
  if (!inner) return;
  practiceFlipped = !practiceFlipped;
  inner.classList.toggle('flipped', practiceFlipped);
}

function nextCard() {
  practiceIndex = (practiceIndex + 1) % ALPHABET.length;
  updateFlashcard();
}

function prevCard() {
  practiceIndex = (practiceIndex - 1 + ALPHABET.length) % ALPHABET.length;
  updateFlashcard();
}

// ─── Quiz Section ─────────────────────────────────────────────────────────────
function renderQuizStart() {
  const content = document.getElementById('quizContent');
  content.innerHTML = `
    <div class="quiz-start">
      <div class="quiz-icon">🏆</div>
      <h3 class="thaana">ދެ ވައްތަރެއް</h3>
      <div class="quiz-type-btns">
        <button class="quiz-type-btn active" data-type="letter-to-name">
          <span class="thaana big">ކ</span>
          <span class="thaana">→ ނަން ހޯދާ</span>
        </button>
        <button class="quiz-type-btn" data-type="name-to-letter">
          <span class="quiz-name-preview">Kaafu</span>
          <span class="thaana">→ ލިޔުން ހޯދާ</span>
        </button>
      </div>
      <button class="btn-primary btn-large" id="startQuizBtn">ފަށާ!</button>
    </div>
  `;

  document.querySelectorAll('.quiz-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quiz-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      quizType = btn.dataset.type;
    });
  });

  document.getElementById('startQuizBtn').addEventListener('click', startQuiz);
}

function startQuiz() {
  const pool = [...ALPHABET].sort(() => Math.random() - 0.5).slice(0, 10);
  quizQuestions = pool;
  quizIndex = 0;
  quizScore = 0;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  if (quizIndex >= quizQuestions.length) {
    renderQuizResult();
    return;
  }

  const correct = quizQuestions[quizIndex];
  const others = ALPHABET.filter(a => a.id !== correct.id).sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...others, correct].sort(() => Math.random() - 0.5);

  const content = document.getElementById('quizContent');
  const pct = (quizIndex / quizQuestions.length) * 100;

  if (quizType === 'letter-to-name') {
    content.innerHTML = `
      <div class="quiz-question">
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-counter">${quizIndex + 1} / ${quizQuestions.length}</div>
        <div class="quiz-prompt thaana">މި ލިޔުން ކިޔަނީ؟</div>
        <div class="quiz-letter thaana">${correct.letter}</div>
        <div class="quiz-choices">
          ${choices.map(c => `
            <button class="choice-btn" data-id="${c.id}">
              <span class="thaana">${c.name}</span>
              <span class="choice-en">${c.nameEn}</span>
            </button>
          `).join('')}
        </div>
      </div>`;
  } else {
    content.innerHTML = `
      <div class="quiz-question">
        <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
        <div class="quiz-counter">${quizIndex + 1} / ${quizQuestions.length}</div>
        <div class="quiz-prompt thaana">މި ނަން ލިޔެވިފައިވާ ލިޔުމަކީ؟</div>
        <div class="quiz-letter">${correct.nameEn}</div>
        <div class="quiz-choices">
          ${choices.map(c => `
            <button class="choice-btn choice-thaana" data-id="${c.id}">
              <span class="thaana choice-big">${c.letter}</span>
            </button>
          `).join('')}
        </div>
      </div>`;
  }

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => handleAnswer(parseInt(btn.dataset.id), correct.id));
  });
}

function handleAnswer(selectedId, correctId) {
  const isCorrect = selectedId === correctId;
  if (isCorrect) quizScore++;

  document.querySelectorAll('.choice-btn').forEach(btn => {
    btn.disabled = true;
    if (parseInt(btn.dataset.id) === correctId) btn.classList.add('correct');
    if (parseInt(btn.dataset.id) === selectedId && !isCorrect) btn.classList.add('wrong');
  });

  setTimeout(() => {
    quizIndex++;
    renderQuizQuestion();
  }, 1000);
}

function renderQuizResult() {
  const pct = Math.round((quizScore / quizQuestions.length) * 100);
  let emoji = '😊', feedback;
  if (pct === 100) { emoji = '🏆'; feedback = 'ހަމަ ފުރިހަމަ! ހަދިޔާ ލިބިއްޖެ!'; }
  else if (pct >= 80) { emoji = '⭐'; feedback = 'ވަރަށް ރަނގަޅު! ކޮންމެހެން ބަލާ!'; }
  else if (pct >= 60) { emoji = '👍'; feedback = 'ތި ދިމާ! ދެންވެސް ފަރިތަ ކުރޭ!'; }
  else { emoji = '📚'; feedback = 'ދިމާ ދިމާ! ކިޔަވާ ދަސްކޮށްލާ!'; }

  const content = document.getElementById('quizContent');
  content.innerHTML = `
    <div class="quiz-result">
      <div class="result-emoji">${emoji}</div>
      <div class="result-score">${quizScore} / ${quizQuestions.length}</div>
      <div class="result-pct">${pct}%</div>
      <div class="result-feedback thaana">${feedback}</div>
      <div class="result-btns">
        <button class="btn-primary" id="retryQuizBtn">އަލުން ކުރޭ</button>
        <button class="btn-outline" id="backToHomeBtn">ހޯމަށް</button>
      </div>
    </div>
  `;
  document.getElementById('retryQuizBtn').addEventListener('click', renderQuizStart);
  document.getElementById('backToHomeBtn').addEventListener('click', () => navigateTo('home'));
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Nav buttons
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.section));
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('letterModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // Scroll header shrink
  const header = document.querySelector('.app-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  });

  navigateTo('home');
});
