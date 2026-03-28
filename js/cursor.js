// ============================================================
// FILE: js/cursor.js
// PURPOSE: Custom cursor — large amber ring + small dot,
//          follows mouse position, scales on click, hidden on
//          touch devices via CSS (hover: none) media query
// USED BY: index.html, quiz.html, results.html
// ============================================================

// ── SECTION: Cursor Elements ─────────────────────────────────
const cursor    = document.querySelector('.cursor');
const cursorDot = document.querySelector('.cursor-dot');

// ── SECTION: Mouse Move Tracking ─────────────────────────────
document.addEventListener('mousemove', (e) => {
  if (!cursor || !cursorDot) return;
  cursor.style.left    = e.clientX + 'px';
  cursor.style.top     = e.clientY + 'px';
  cursorDot.style.left = e.clientX + 'px';
  cursorDot.style.top  = e.clientY + 'px';
});

// ── SECTION: Click Scale Effect ──────────────────────────────
document.addEventListener('mousedown', () => {
  if (!cursor) return;
  cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
});

document.addEventListener('mouseup', () => {
  if (!cursor) return;
  cursor.style.transform = 'translate(-50%, -50%) scale(1)';
});
