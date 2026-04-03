// ================================
// DARK MODE
// ================================
(function() {
  const saved = localStorage.getItem('pathified_theme');
  if (saved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  const updateIcon = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.querySelector('.theme-icon-light').style.display = isDark ? 'none' : 'block';
    btn.querySelector('.theme-icon-dark').style.display = isDark ? 'block' : 'none';
  };

  updateIcon();

  btn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('pathified_theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('pathified_theme', 'dark');
    }
    updateIcon();
  });
});

// ================================
// CUSTOM CURSOR
// ================================
const cursor = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');

document.addEventListener('mousemove', (e) => {
  if (!cursor || !cursorDot) return;
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top = e.clientY + 'px';
});

document.addEventListener('mousedown', () => {
  if (!cursor) return;
  cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
});

document.addEventListener('mouseup', () => {
  if (!cursor) return;
  cursor.style.transform = 'translate(-50%, -50%) scale(1)';
});

// ================================
// SCROLL REVEAL
// ================================
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
      const index = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = (index * 0.1) + 's';
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -40px 0px'
});

revealEls.forEach(el => revealObserver.observe(el));

// ================================
// ANIMATED PROGRESS BARS
// ================================
const bars = document.querySelectorAll('.animated-bar');

const barObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bar = entry.target;
      const targetWidth = bar.getAttribute('data-width');
      setTimeout(() => {
        bar.style.width = targetWidth + '%';
      }, 400);
      barObserver.unobserve(bar);
    }
  });
}, { threshold: 0.5 });

bars.forEach(bar => barObserver.observe(bar));

// ================================
// PAGE FADE IN/OUT
// ================================
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity = '1';
  });

  document.querySelectorAll('.start-quiz-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.body.style.opacity = '0';
      document.body.style.transition = 'opacity 0.3s ease';
      setTimeout(() => {
        window.location.href = 'quiz.html';
      }, 300);
    });
  });
});

// ================================
// SUPABASE HELPER
// ================================
async function saveToDatabase(type, data) {
  try {
    const response = await fetch('/api/supabase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data })
    });
    return response.ok;
  } catch (err) {
    console.error('DB save failed:', err);
    return false;
  }
}

// ================================
// NOT FROM CS MODAL
// ================================
document.addEventListener('DOMContentLoaded', () => {
  const notCsBtn = document.getElementById('not-cs-btn');
  const notCsModal = document.getElementById('not-cs-modal');
  const notCsClose = document.getElementById('not-cs-close');
  const notCsBackdrop = document.getElementById('not-cs-backdrop');
  const notCsSubmit = document.getElementById('not-cs-submit');
  const notCsEmail = document.getElementById('not-cs-email');
  const notCsForm = document.getElementById('not-cs-form');
  const notCsConfirm = document.getElementById('not-cs-confirm');

  function openNotCsModal() {
    notCsModal.style.display = 'block';
    requestAnimationFrame(() => {
      notCsModal.style.opacity = '1';
      notCsModal.style.pointerEvents = 'all';
    });
  }

  function closeNotCsModal() {
    notCsModal.style.opacity = '0';
    notCsModal.style.pointerEvents = 'none';
    setTimeout(() => { notCsModal.style.display = 'none'; }, 250);
  }

  if (notCsBtn) notCsBtn.addEventListener('click', openNotCsModal);
  if (notCsClose) notCsClose.addEventListener('click', closeNotCsModal);
  if (notCsBackdrop) notCsBackdrop.addEventListener('click', closeNotCsModal);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotCsModal(); });

  if (notCsSubmit && notCsEmail) {
    notCsEmail.addEventListener('keydown', e => {
      if (e.key === 'Enter') notCsSubmit.click();
    });

    notCsSubmit.addEventListener('click', async () => {
      const email = notCsEmail.value.trim();
      if (!email || !email.includes('@')) {
        notCsEmail.style.borderColor = 'red';
        return;
      }
      notCsEmail.style.borderColor = '';
      notCsSubmit.textContent = 'Saving...';
      notCsSubmit.disabled = true;

      await saveToDatabase('waitlist', { email });

      if (notCsForm) notCsForm.style.display = 'none';
      if (notCsConfirm) notCsConfirm.classList.remove('hidden');
    });
  }

  // ================================
  // CONTACT FORM
  // ================================
  const contactSubmit = document.getElementById('contact-submit');
  const contactSuccess = document.getElementById('contact-success');

  if (contactSubmit) {
    contactSubmit.addEventListener('click', async () => {
      const name = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      const phone = document.getElementById('contact-phone')?.value.trim();

      if (!email || !email.includes('@')) return;

      contactSubmit.textContent = 'Sending...';
      contactSubmit.disabled = true;

      await saveToDatabase('contact', { name, email, phone });

      contactSubmit.style.display = 'none';
      if (contactSuccess) contactSuccess.classList.remove('hidden');
    });
  }
});
