// ============================================================
// FILE: js/theme.js
// PURPOSE: Dark mode toggle — switches html class between
//          'light' and 'dark', saves preference to localStorage,
//          applies saved preference on page load
// USED BY: index.html, quiz.html, results.html
// ============================================================

// ── SECTION: Apply Saved Theme on Load ──────────────────────
const savedTheme = localStorage.getItem('pathified-theme') || 'light';
document.documentElement.className = savedTheme;

// ── SECTION: Toggle Button ───────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle');
  if (!toggleBtn) return;

  const lightIcon = toggleBtn.querySelector('.theme-icon-light');
  const darkIcon  = toggleBtn.querySelector('.theme-icon-dark');

  const updateIcon = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (lightIcon) lightIcon.style.display = isDark ? 'none'  : 'block';
    if (darkIcon)  darkIcon.style.display  = isDark ? 'block' : 'none';
  };

  updateIcon();

  toggleBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.className = isDark ? 'light' : 'dark';
    localStorage.setItem('pathified-theme', isDark ? 'light' : 'dark');
    updateIcon();
  });
});
