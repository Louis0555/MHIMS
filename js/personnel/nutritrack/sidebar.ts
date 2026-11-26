/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - MaternaTrack Shared Sidebar Logic
 * Script: js/clinical/maternatrack/sidebar.js
 * ==============================================================================
 * Handles:
 *  - Sidebar dropdown accordion (open/close with animation)
 *  - Auto-open the dropdown whose submenu item is active on page load
 *  - Notification bell alert
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Sidebar Accordion ──────────────────────────────────────────────────────
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');

  dropdownToggles.forEach(toggleBtn => {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const parentDropdown = toggleBtn.closest('.nav-dropdown');
      if (!parentDropdown) return;

      const isOpen = parentDropdown.classList.contains('open');

      // Accordion: close other open dropdowns
      document.querySelectorAll('.nav-dropdown').forEach(dd => {
        if (dd !== parentDropdown) {
          dd.classList.remove('open');
          const toggle = dd.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle this one
      if (isOpen) {
        parentDropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        parentDropdown.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ─── Auto-open dropdown with active submenu item ─────────────────────────
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    if (dd.querySelector('.submenu-item.active')) {
      dd.classList.add('open');
      const toggle = dd.querySelector('.nav-dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
  });

  // ─── Notification Bell ───────────────────────────────────────────────────
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      alert('You have 3 active AI clinical reminders and alerts.');
    });
  }

});
