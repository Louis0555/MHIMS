/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Dashboard JavaScript Logic
 * Script: js/clinical/dashboard.js
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation active state handling for regular buttons
  const navButtons = document.querySelectorAll('.sidebar-nav > .nav-item-btn:not(.nav-dropdown-toggle)');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#')) {
        e.preventDefault();
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Close dropdowns
        document.querySelectorAll('.nav-dropdown').forEach(dd => {
          dd.classList.remove('open');
          const toggle = dd.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });
  });

  // Notification button alert interaction
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      alert('You have 3 active AI clinical reminders and alerts.');
    });
  }

});
