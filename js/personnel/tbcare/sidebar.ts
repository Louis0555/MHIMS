document.addEventListener('DOMContentLoaded', () => {
  const dropdowns = document.querySelectorAll('.nav-dropdown');
  document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
    toggle.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();

      const currentDropdown = toggle.closest('.nav-dropdown');
      if (!currentDropdown) return;
      const willOpen = !currentDropdown.classList.contains('open');

      dropdowns.forEach(dropdown => {
        if (dropdown !== currentDropdown) {
          dropdown.classList.remove('open');
          const button = dropdown.querySelector('.nav-dropdown-toggle');
          if (button) button.setAttribute('aria-expanded', 'false');
        }
      });

      if (willOpen) {
        currentDropdown.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
      } else {
        currentDropdown.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    if (dropdown.querySelector('.submenu-item.active')) {
      dropdown.classList.add('open');
      const toggle = dropdown.querySelector('.nav-dropdown-toggle');
      if (toggle) toggle.setAttribute('aria-expanded', 'true');
    }
  });

  const navButtons = document.querySelectorAll('.sidebar-nav > .nav-item-btn');
  navButtons.forEach(button => {
    button.addEventListener('click', event => {
      const href = button.getAttribute('href');
      if (!href || href === '#' || href.startsWith('#')) {
        event.preventDefault();
        navButtons.forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        dropdowns.forEach(dropdown => {
          dropdown.classList.remove('open');
          const toggle = dropdown.querySelector('.nav-dropdown-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
        });
      }
    });
  });

  const notificationButton = document.getElementById('notifBtn');
  if (notificationButton) {
    notificationButton.addEventListener('click', () => {
      window.alert('You have 3 active TBCare reminders and follow-up alerts.');
    });
  }
});
