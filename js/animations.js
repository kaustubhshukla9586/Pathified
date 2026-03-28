// ============================================================
// FILE: js/animations.js
// PURPOSE: Scroll-triggered reveal animations using
//          IntersectionObserver, page fade in/out transitions
//          on navigation, animated progress bars
// USED BY: index.html, quiz.html, results.html
// ============================================================

// ── SECTION: Page Fade In ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.opacity = '0';
  requestAnimationFrame(() => {
    document.body.style.transition = 'opacity 0.4s ease';
    document.body.style.opacity    = '1';
  });
});

// ── SECTION: Scroll Reveal ───────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const siblings = [...entry.target.parentElement.querySelectorAll('.reveal')];
      const index    = siblings.indexOf(entry.target);
      entry.target.style.transitionDelay = `${index * 0.08}s`;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── SECTION: Page Exit Transition ────────────────────────────
document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto') || href.startsWith('http')) return;
  link.addEventListener('click', e => {
    e.preventDefault();
    document.body.style.transition = 'opacity 0.25s ease';
    document.body.style.opacity    = '0';
    setTimeout(() => { window.location.href = href; }, 250);
  });
});

// ── SECTION: Animated Progress Bars ──────────────────────────
const barObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bar    = entry.target;
      const target = bar.getAttribute('data-width');
      if (target) {
        setTimeout(() => { bar.style.width = target + '%'; }, 300);
      }
      barObserver.unobserve(bar);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.animated-bar').forEach(bar => barObserver.observe(bar));
