/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Navigation & Sidebar Dropdown Controller
 * Script: js/clinical/sidebar.js
 * ==============================================================================
 */

function initSidebarDropdowns() {
  const dropdownToggles = document.querySelectorAll('.nav-dropdown-toggle');

  dropdownToggles.forEach(toggleBtn => {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const currentDropdown = toggleBtn.closest('.nav-dropdown');
      if (!currentDropdown) return;

      const isOpen = currentDropdown.classList.contains('open');

      // Accordion behavior: close other open dropdowns
      document.querySelectorAll('.nav-dropdown').forEach(dd => {
        if (dd !== currentDropdown) {
          dd.classList.remove('open');
          const toggle = dd.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle current dropdown
      if (isOpen) {
        currentDropdown.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      } else {
        currentDropdown.classList.add('open');
        toggleBtn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Automatically keep parent dropdown open if it contains an active submenu item
  document.querySelectorAll('.nav-dropdown').forEach(dd => {
    if (dd.querySelector('.submenu-item.active')) {
      dd.classList.add('open');
      const toggle = dd.querySelector('.nav-dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
  });

  // Handle standard non-dropdown nav buttons
  const navButtons = document.querySelectorAll('.sidebar-nav > .nav-item-btn:not(.nav-dropdown-toggle)');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const href = btn.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#')) {
        e.preventDefault();
        // Remove active from other top-level buttons
        navButtons.forEach(b => b.classList.remove('active'));
        // Close dropdowns
        document.querySelectorAll('.nav-dropdown').forEach(dd => {
          dd.classList.remove('open');
          const toggle = dd.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
        btn.classList.add('active');
      }
    });
  });
}

// Auto-run when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSidebarDropdowns);
} else {
  initSidebarDropdowns();
}
