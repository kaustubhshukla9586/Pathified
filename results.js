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
    card.className = `r-card ${item.rank === 1 ? 'rank-1' : ''}`;
    card.style.opacity = 0;
    card.style.transform = 'translateY(20px)';

    card.innerHTML = `
      <div class="r-rank">${getRankLabel(item.rank)}</div>
      <div class="r-field">${item.field}</div>
      <div class="r-pct">${item.percentage}%</div>
      <div class="r-desc">${item.type || 'Recommended specialization'}</div>
      <div class="r-bar-wrap">
        <div class="r-bar-fill" style="width:0%" data-target="${item.percentage}"></div>
      </div>
      <a href="#" class="r-link">See full breakdown &rarr;</a>
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

  document.getElementById('m-rank').textContent = item.rank === 1 ? 'Top match' : `Rank #${item.rank}`;
  document.getElementById('m-field').textContent = item.field;
  document.getElementById('m-pct').textContent = `${item.percentage}%`;
  document.getElementById('m-desc').textContent = item.explanation;

  // Strengths
  const strengthsRow = document.getElementById('m-strengths');
  strengthsRow.innerHTML = '';
  (item.strengths || []).forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = s;
    strengthsRow.appendChild(tag);
  });
  if (!item.strengths?.length) strengthsRow.innerHTML = '<span class="tag">Not specified</span>';

  // Considerations
  const considerationsRow = document.getElementById('m-considerations');
  considerationsRow.innerHTML = '';
  (item.considerations || []).forEach(c => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.textContent = c;
    considerationsRow.appendChild(tag);
  });
  if (!item.considerations?.length) considerationsRow.innerHTML = '<span class="tag">Not specified</span>';

  // Roles
  const existing = document.querySelector('.modal-roles');
  if (existing) existing.remove();

  if (item.roles?.length) {
    const rolesContainer = document.createElement('div');
    rolesContainer.className = 'modal-roles';
    rolesContainer.innerHTML = `
      <div class="modal-section-title">Roles you could grow into</div>
      <div class="tags-row roles">
        ${item.roles.map(r => `<span class="role-tag">${r}</span>`).join('')}
      </div>
    `;
    const footer = document.querySelector('.modal-footer');
    if (footer) footer.before(rolesContainer);
    else document.querySelector('.modal-content').appendChild(rolesContainer);
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