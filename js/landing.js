// ============================================================
// FILE: js/landing.js
// PURPOSE: All landing page JS — smooth scroll for nav links,
//          Not from CS modal, contact form submission handler,
//          start quiz button fade transition
// USED BY: index.html
// DEPENDS ON: animations.js (must load first)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── SECTION: Smooth Scroll ─────────────────────────────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // ── SECTION: Not From CS Modal ─────────────────────────────
  const notCsBtn     = document.getElementById('not-cs-btn');
  const notCsModal   = document.getElementById('not-cs-modal');
  const notCsClose   = document.getElementById('not-cs-close');
  const notCsSubmit  = document.getElementById('not-cs-submit');
  const notCsEmail   = document.getElementById('not-cs-email');
  const notCsForm    = document.getElementById('not-cs-form');
  const notCsConfirm = document.getElementById('not-cs-confirm');

  if (notCsBtn && notCsModal) {
    notCsBtn.addEventListener('click', () => {
      notCsModal.style.opacity       = '1';
      notCsModal.style.pointerEvents = 'all';
    });

    const closeModal = () => {
      notCsModal.style.opacity       = '0';
      notCsModal.style.pointerEvents = 'none';
    };

    notCsClose?.addEventListener('click', closeModal);

    notCsModal.addEventListener('click', e => {
      if (e.target === notCsModal) closeModal();
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  }

  if (notCsSubmit && notCsEmail) {
    notCsSubmit.addEventListener('click', () => {
      const email = notCsEmail.value.trim();
      if (!email || !email.includes('@')) return;
      localStorage.setItem('pathified_waitlist_email', email);
      if (notCsForm)    notCsForm.style.display    = 'none';
      if (notCsConfirm) notCsConfirm.style.display = 'block';
    });
  }

  // ── SECTION: Contact Form ──────────────────────────────────
  const contactForm   = document.getElementById('contact-form');
  const contactSubmit = document.getElementById('contact-submit');

  if (contactSubmit) {
    contactSubmit.addEventListener('click', () => {
      const name  = document.getElementById('contact-name')?.value.trim();
      const email = document.getElementById('contact-email')?.value.trim();
      if (!name || !email || !email.includes('@')) return;

      localStorage.setItem('pathified_contact', JSON.stringify({
        name,
        email,
        phone:     document.getElementById('contact-phone')?.value.trim() || '',
        timestamp: new Date().toISOString()
      }));

      contactSubmit.textContent = '✓ Message received!';
      contactSubmit.disabled    = true;
      if (contactForm) {
        contactForm.querySelectorAll('input, textarea').forEach(el => el.disabled = true);
      }
    });
  }

  // ── SECTION: Start Quiz Button ─────────────────────────────
  document.querySelectorAll('.start-quiz-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      document.body.style.opacity    = '0';
      document.body.style.transition = 'opacity 0.3s ease';
      setTimeout(() => { window.location.href = 'quiz.html'; }, 300);
    });
  });

});
