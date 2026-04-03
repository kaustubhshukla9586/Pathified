// results.js

let resultsData = [];
let currentResult = null;

// ================================
// INIT
// ================================
document.addEventListener('DOMContentLoaded', () => {

  // Initialize EmailJS
  if (typeof EMAILJS_PUBLIC_KEY !== 'undefined') {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }

  const stored = sessionStorage.getItem('pathifiedResults');
  if (!stored) {
    window.location.href = 'index.html';
    return;
  }

  try {
    const parsed = JSON.parse(stored);
    resultsData = parsed.results;
    if (!resultsData || !Array.isArray(resultsData)) throw new Error("Invalid format");
  } catch (e) {
    console.error(e);
    window.location.href = 'index.html';
    return;
  }

  // Sort by rank
  resultsData.sort((a, b) => a.rank - b.rank);

  // Enforce percentage constraints
  const seenPcts = new Set();
  resultsData.forEach(item => {
    let pct = Math.round(item.percentage / 5) * 5;
    if (pct > 95) pct = 95;
    if (pct < 55) pct = 55;
    while (seenPcts.has(pct) && pct > 55) pct -= 5;
    seenPcts.add(pct);
    item.percentage = pct;
  });

  renderCards();
  setupRetake();
  setupEmail();
});

// ================================
// RETAKE
// ================================
function setupRetake() {
  const retakeBtn = document.getElementById('retake-btn');
  if (!retakeBtn) return;
  retakeBtn.addEventListener('click', () => {
    localStorage.removeItem('pathify_progress');
    localStorage.removeItem('pathified_progress');
    sessionStorage.removeItem('pathifyResults');
    sessionStorage.removeItem('pathifiedResults');
    window.location.href = 'quiz.html';
  });
}

// ================================
// EMAIL
// ================================
function setupEmail() {
  const emailBtn = document.getElementById('results-email-btn');
  const emailInput = document.getElementById('results-email');
  const emailConfirm = document.getElementById('email-confirm');

  if (!emailBtn || !emailInput || !emailConfirm) return;

  emailBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
      emailInput.style.borderColor = 'red';
      return;
    }
    emailInput.style.borderColor = '';

    emailBtn.textContent = 'Sending...';
    emailBtn.disabled = true;

    const results = JSON.parse(sessionStorage.getItem('pathifiedResults') || 'null');
    if (!results || !results.results) {
      emailBtn.textContent = 'Error — try again';
      emailBtn.disabled = false;
      return;
    }

    const r = results.results;

    // Check EmailJS is available
    if (typeof emailjs === 'undefined' || typeof EMAILJS_SERVICE_ID === 'undefined') {
      console.error('EmailJS not configured');
      emailBtn.textContent = 'Email not configured';
      emailBtn.disabled = false;
      return;
    }

    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,

        field_1: r[0]?.field || '',
        percentage_1: r[0]?.percentage || '',
        explanation_1: r[0]?.explanation || '',
        strength_1_a: r[0]?.strengths?.[0] || '',
        strength_1_b: r[0]?.strengths?.[1] || '',
        strength_1_c: r[0]?.strengths?.[2] || '',
        consideration_1_a: r[0]?.considerations?.[0] || '',
        consideration_1_b: r[0]?.considerations?.[1] || '',
        role_1_a: r[0]?.roles?.[0] || '',
        role_1_b: r[0]?.roles?.[1] || '',
        role_1_c: r[0]?.roles?.[2] || '',

        field_2: r[1]?.field || '',
        percentage_2: r[1]?.percentage || '',
        explanation_2: r[1]?.explanation || '',
        strength_2_a: r[1]?.strengths?.[0] || '',
        strength_2_b: r[1]?.strengths?.[1] || '',
        strength_2_c: r[1]?.strengths?.[2] || '',
        consideration_2_a: r[1]?.considerations?.[0] || '',
        consideration_2_b: r[1]?.considerations?.[1] || '',
        role_2_a: r[1]?.roles?.[0] || '',
        role_2_b: r[1]?.roles?.[1] || '',
        role_2_c: r[1]?.roles?.[2] || '',

        field_3: r[2]?.field || '',
        percentage_3: r[2]?.percentage || '',
        explanation_3: r[2]?.explanation || '',
        strength_3_a: r[2]?.strengths?.[0] || '',
        strength_3_b: r[2]?.strengths?.[1] || '',
        strength_3_c: r[2]?.strengths?.[2] || '',
        consideration_3_a: r[2]?.considerations?.[0] || '',
        consideration_3_b: r[2]?.considerations?.[1] || '',
        role_3_a: r[2]?.roles?.[0] || '',
        role_3_b: r[2]?.roles?.[1] || '',
        role_3_c: r[2]?.roles?.[2] || '',
      });

      emailConfirm.style.display = 'block';
      document.getElementById('email-results-form').style.display = 'none';
      emailBtn.textContent = '✓ Sent';

    } catch (err) {
      console.error('EmailJS error:', err);
      emailBtn.textContent = 'Failed — try again';
      emailBtn.disabled = false;
    }
  });
}

// ================================
// RENDER CARDS
// ================================
function getRankLabel(rank) {
  if (rank === 1) return "#1 Best Match";
  if (rank === 2) return "#2 Strong Fit";
  return "#3 Worth Exploring";
}

function renderCards() {
  const grid = document.getElementById('results-grid');
  if (!grid) return;
  grid.innerHTML = '';

  resultsData.forEach((item, idx) => {
    const card = document.createElement('div');
    const isFirst = item.rank === 1;
    card.className = `bg-surface-container-lowest p-12 flex flex-col justify-between min-h-[400px] cursor-pointer transition-all duration-300 hover:-translate-y-1 ${isFirst ? 'border-t-2 border-primary-container' : 'border-l border-outline-variant/15'}`;
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';

    card.innerHTML = `
      <div>
        <span class="font-sans text-xs tracking-widest uppercase font-bold ${isFirst ? 'text-primary-container' : 'text-on-surface/40'} mb-8 block">${getRankLabel(item.rank)}</span>
        <h3 class="font-serif text-3xl font-bold mb-4 text-on-surface">${item.field}</h3>
        <p class="font-sans text-sm opacity-70 leading-relaxed mb-8 text-on-surface-variant">${item.type || 'Recommended specialization'}</p>
      </div>
      <div>
        <div class="flex items-baseline gap-1 mb-2">
          <span class="font-serif text-6xl font-black text-primary-container">${item.percentage}</span>
          <span class="font-serif text-2xl text-primary-container">%</span>
        </div>
        <div class="w-full h-0.5 bg-surface-variant">
          <div class="h-full bg-primary-container r-bar-fill" data-target="${item.percentage}" style="width:0%;transition:width 1.5s cubic-bezier(0.2,0.8,0.2,1)"></div>
        </div>
        <a href="#" class="r-link mt-6 inline-flex items-center gap-2 font-sans font-bold text-xs tracking-widest uppercase text-primary hover:text-primary-container transition-colors">
          See full breakdown →
        </a>
      </div>
    `;

    card.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(item);
    });

    grid.appendChild(card);

    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      card.style.opacity = 1;
      card.style.transform = 'translateY(0)';
      setTimeout(() => {
        const bar = card.querySelector('.r-bar-fill');
        if (bar) bar.style.width = `${item.percentage}%`;
      }, 300);
    }, 100 + (idx * 150));
  });
}

// ================================
// MODAL
// ================================
const modal = document.getElementById('modal');
const backdrop = document.getElementById('modal-backdrop');
const modalClose = document.getElementById('modal-close');

function openModal(item) {
  currentResult = item;

  document.getElementById('m-rank').textContent = item.rank === 1 ? '#1 Best Match' : `Rank #${item.rank}`;
  document.getElementById('m-field').textContent = item.field;
  document.getElementById('m-pct').textContent = `${item.percentage}%`;
  document.getElementById('m-desc').textContent = item.explanation;

  // Strengths
  const strengthsRow = document.getElementById('m-strengths');
  strengthsRow.innerHTML = '';
  (item.strengths || []).forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'px-3 py-1.5 bg-secondary-container/20 text-on-secondary-container text-xs font-medium rounded-full border border-secondary-container/30';
    tag.textContent = s;
    strengthsRow.appendChild(tag);
  });
  if (!item.strengths?.length) strengthsRow.innerHTML = '<span class="px-3 py-1.5 text-xs opacity-50">Not specified</span>';

  // Considerations
  const considerationsRow = document.getElementById('m-considerations');
  considerationsRow.innerHTML = '';
  (item.considerations || []).forEach(c => {
    const tag = document.createElement('span');
    tag.className = 'px-3 py-1.5 bg-surface-container text-on-surface-variant text-xs font-medium rounded-full border border-outline-variant/30';
    tag.textContent = c;
    considerationsRow.appendChild(tag);
  });
  if (!item.considerations?.length) considerationsRow.innerHTML = '<span class="px-3 py-1.5 text-xs opacity-50">Not specified</span>';

  // Roles — use the m-growth-roles container in the HTML
  const rolesRow = document.getElementById('m-growth-roles');
  if (rolesRow) {
    rolesRow.innerHTML = '';
    (item.roles || []).forEach(r => {
      const tag = document.createElement('span');
      tag.className = 'px-3 py-1.5 border border-outline-variant text-on-surface-variant text-xs font-medium rounded-full';
      tag.textContent = r;
      rolesRow.appendChild(tag);
    });
    if (!item.roles?.length) rolesRow.innerHTML = '<span class="px-3 py-1.5 text-xs opacity-50">Not specified</span>';
  }

  modal.classList.add('active');
  backdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  backdrop.classList.remove('active');
  document.body.style.overflow = '';
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (backdrop) backdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

// ================================
// SHARE
// ================================
const shareBtn = document.getElementById('share-btn');
const shareConfirm = document.getElementById('share-confirm');

if (shareBtn && shareConfirm) {
  shareBtn.addEventListener('click', () => {
    if (!currentResult) return;
    const shareText = `I got ${currentResult.field} on Pathified — find your CS path at pathified.com`;
    navigator.clipboard.writeText(shareText).then(() => {
      shareConfirm.style.opacity = '1';
      setTimeout(() => { shareConfirm.style.opacity = '0'; }, 2500);
    });
  });
}