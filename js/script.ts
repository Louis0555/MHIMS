/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * JavaScript Interactions & Responsive Web API: js/script.js
 * ==============================================================================
 */

/* --------------------------------------------------------------------------
   Responsive Web API Module (MatchMedia + ResizeObserver + Screen Matrix)
   -------------------------------------------------------------------------- */
class ResponsiveEngine {
  constructor() {
    this.tiers = [
      { id: 'ultrawide', label: '4K / Ultrawide Desktop', query: '(min-width: 1921px)' },
      { id: 'desktop-large', label: 'Large Desktop (1080p FHD)', query: '(min-width: 1441px) and (max-width: 1920px)' },
      { id: 'laptop-standard', label: 'Standard Laptop / 14-15" (1366p - 1440p)', query: '(min-width: 1201px) and (max-width: 1440px)' },
      { id: 'laptop-compact', label: 'Compact Laptop / 14" HD (1025p - 1200p)', query: '(min-width: 993px) and (max-width: 1200px)' },
      { id: 'tablet-landscape', label: 'Tablet / Small Display', query: '(min-width: 769px) and (max-width: 992px)' },
      { id: 'tablet', label: 'Tablet Portrait', query: '(min-width: 481px) and (max-width: 768px)' },
      { id: 'mobile', label: 'Mobile Device', query: '(max-width: 480px)' },
    ];

    this.currentTier = this.detectTier();
    this.listeners = new Set();
    this.hudElement = null;

    this.initMatchMedia();
    this.initResizeObserver();
    this.updateDomAttributes();
    this.renderHud();
  }

  detectTier() {
    const w = window.innerWidth;
    if (w > 1920) return this.tiers[0];
    if (w > 1440) return this.tiers[1];
    if (w > 1200) return this.tiers[2];
    if (w > 992)  return this.tiers[3];
    if (w > 768)  return this.tiers[4];
    if (w > 480)  return this.tiers[5];
    return this.tiers[6];
  }

  initMatchMedia() {
    // Native window.matchMedia API integration
    this.tiers.forEach(tier => {
      const mql = window.matchMedia(tier.query);
      const handler = (e) => {
        if (e.matches) {
          this.currentTier = tier;
          this.onTierChange();
        }
      };

      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handler);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(handler);
      }
    });

    // Height constraint monitor (e.g. 768p or 828p laptop screen with taskbar)
    const heightMql = window.matchMedia('(max-height: 850px)');
    const heightHandler = () => this.updateDomAttributes();
    if (typeof heightMql.addEventListener === 'function') {
      heightMql.addEventListener('change', heightHandler);
    }
  }

  initResizeObserver() {
    // Native ResizeObserver API for fine-grained element measurement
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          this.notifySubscribers({ width: Math.round(width), height: Math.round(height), tier: this.currentTier });
          this.updateHudMetrics();
        }
      });

      const container = document.querySelector('.page-container') || document.body;
      observer.observe(container);
    } else {
      // Fallback for older browsers
      window.addEventListener('resize', () => {
        this.notifySubscribers({ width: window.innerWidth, height: window.innerHeight, tier: this.currentTier });
        this.updateHudMetrics();
      });
    }
  }

  updateDomAttributes() {
    const docEl = document.documentElement;
    const isCompactHeight = window.innerHeight <= 850;
    const orientation = window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait';

    docEl.setAttribute('data-device-tier', this.currentTier.id);
    docEl.setAttribute('data-height-mode', isCompactHeight ? 'compact' : 'normal');
    docEl.setAttribute('data-orientation', orientation);
  }

  onTierChange() {
    this.updateDomAttributes();
    this.updateHudMetrics();
    this.notifySubscribers({
      width: window.innerWidth,
      height: window.innerHeight,
      tier: this.currentTier
    });

    // Dispatch global custom event
    window.dispatchEvent(new CustomEvent('mhims:breakpoint-change', {
      detail: {
        tier: this.currentTier,
        width: window.innerWidth,
        height: window.innerHeight
      }
    }));
  }

  renderHud() {
    // Only render live HUD if element explicitly exists in DOM
    const hud = document.getElementById('responsiveHud');
    if (!hud) return;
    this.hudElement = hud;
    this.updateHudMetrics();
  }

  updateHudMetrics() {
    if (!this.hudElement) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.hudElement.innerHTML = `
      <span class="responsive-hud-dot"></span>
      <span>${this.currentTier.label}</span>
      <span class="responsive-hud-dim">(${w} × ${h}px)</span>
    `;
  }

  subscribe(callback) {
    if (typeof callback === 'function') {
      this.listeners.add(callback);
    }
  }

  unsubscribe(callback) {
    this.listeners.delete(callback);
  }

  notifySubscribers(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (err) { console.error('Responsive subscriber error:', err); }
    });
  }

  getMetrics() {
    return {
      tier: this.currentTier,
      width: window.innerWidth,
      height: window.innerHeight,
      pixelRatio: window.devicePixelRatio || 1,
      isCompactHeight: window.innerHeight <= 850,
      orientation: window.innerWidth >= window.innerHeight ? 'landscape' : 'portrait'
    };
  }
}

// Instantiate and expose the Responsive Web API globally
window.MHIMSResponsive = null;

/* --------------------------------------------------------------------------
   Main Application Logic
   -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Responsive Engine
  window.MHIMSResponsive = new ResponsiveEngine();

  // DOM Elements
  const loginForm = document.getElementById('loginForm');
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const usernameError = document.getElementById('usernameError');
  const passwordError = document.getElementById('passwordError');
  const roleButtons = document.querySelectorAll('.role-tab-btn');
  const roleBadgeText = document.getElementById('roleBadgeText');
  const togglePasswordBtn = document.getElementById('togglePassword');
  const submitBtn = document.getElementById('submitBtn');
  const authCard = document.getElementById('authCard');

  // Modal Elements
  const adminModal = document.getElementById('adminModal');
  const openModalBtn = document.getElementById('openAdminModal');
  const closeModalBtn = document.getElementById('closeAdminModal');
  const dismissModalBtn = document.getElementById('dismissModalBtn');

  // Toast Elements
  const toastNotification = document.getElementById('toastNotification');
  const toastTitle = document.getElementById('toastTitle');
  const toastMsg = document.getElementById('toastMessage');

  // State
  let currentRole = 'Health Office Personnel';
  let toastTimeout = null;

  /* --------------------------------------------------------------------------
     1. Role Switcher Interaction
     -------------------------------------------------------------------------- */
  roleButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Avoid re-triggering if already active
      if (button.classList.contains('active')) return;

      // Remove active from all
      roleButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });

      // Set active on clicked
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Update state
      currentRole = button.getAttribute('data-role');

      // Update placeholder and badge feedback
      if (currentRole === 'Clinical Personnel') {
        usernameInput.placeholder = 'Enter your Clinical ID or Username';
        if (roleBadgeText) {
          roleBadgeText.textContent = 'Portal: Clinical Personnel (Doctors, Nurses, Midwives)';
        }
      } else {
        usernameInput.placeholder = 'Enter your Username';
        if (roleBadgeText) {
          roleBadgeText.textContent = 'Portal: Health Office Personnel (Admin & Records)';
        }
      }

      // Clear any errors
      clearFieldError(usernameInput, usernameError);
      clearFieldError(passwordInput, passwordError);
    });
  });

  /* --------------------------------------------------------------------------
     2. Password Show / Hide Toggle
     -------------------------------------------------------------------------- */
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');

      // Toggle SVG Eye Icon
      if (isPassword) {
        togglePasswordBtn.setAttribute('aria-label', 'Hide password');
        togglePasswordBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
          </svg>
        `;
      } else {
        togglePasswordBtn.setAttribute('aria-label', 'Show password');
        togglePasswordBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        `;
      }
    });
  }

  /* --------------------------------------------------------------------------
     3. Inline Real-time Input Validation Cleaners
     -------------------------------------------------------------------------- */
  usernameInput.addEventListener('input', () => {
    clearFieldError(usernameInput, usernameError);
  });

  passwordInput.addEventListener('input', () => {
    clearFieldError(passwordInput, passwordError);
  });

  function showFieldError(input, errorElement, message) {
    input.classList.add('has-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }
  }

  function clearFieldError(input, errorElement) {
    input.classList.remove('has-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }
  }

  /* --------------------------------------------------------------------------
     4. Button Ripple Micro-interaction
     -------------------------------------------------------------------------- */
  if (submitBtn) {
    submitBtn.addEventListener('click', function (e) {
      const circle = document.createElement('span');
      const diameter = Math.max(this.clientWidth, this.clientHeight);
      const radius = diameter / 2;

      const rect = this.getBoundingClientRect();
      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add('ripple');

      const existingRipple = this.querySelector('.ripple');
      if (existingRipple) {
        existingRipple.remove();
      }

      this.appendChild(circle);
    });
  }

  /* --------------------------------------------------------------------------
     5. Form Submission Handling
     -------------------------------------------------------------------------- */
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    let hasError = false;

    // Validate Username
    if (!username) {
      showFieldError(usernameInput, usernameError, 'Please enter your username or ID.');
      hasError = true;
    }

    // Validate Password
    if (!password) {
      showFieldError(passwordInput, passwordError, 'Please enter your password.');
      hasError = true;
    }

    // Shake animation on error
    if (hasError) {
      triggerShakeAnimation(authCard);
      if (!username) {
        usernameInput.focus();
      } else {
        passwordInput.focus();
      }
      return;
    }

    // Begin Simulated Authentication State
    setLoadingState(true);

    setTimeout(() => {
      setLoadingState(false);

      // Show Success Toast
      showToast(
        'Authentication Successful',
        `Welcome, ${username}! Redirecting to ${currentRole} portal...`,
        'success'
      );

      // Redirect to the respective role dashboard
      setTimeout(() => {
        if (currentRole === 'Clinical Personnel') {
          window.location.href = 'clinical/maindashboard/dashboard.html';
        } else {
          window.location.href = 'personnel/residentcare/dashboard.html';
        }
      }, 900);
    }, 1200);
  });

  function triggerShakeAnimation(element) {
    element.classList.remove('shake');
    // Force browser reflow to restart animation
    void element.offsetWidth;
    element.classList.add('shake');
  }

  function setLoadingState(isLoading) {
    if (isLoading) {
      submitBtn.classList.add('loading');
      submitBtn.setAttribute('disabled', 'true');
      usernameInput.setAttribute('disabled', 'true');
      passwordInput.setAttribute('disabled', 'true');
    } else {
      submitBtn.classList.remove('loading');
      submitBtn.removeAttribute('disabled');
      usernameInput.removeAttribute('disabled');
      passwordInput.removeAttribute('disabled');
    }
  }

  /* --------------------------------------------------------------------------
     6. Administrator Contact Modal Handlers
     -------------------------------------------------------------------------- */
  function openModal() {
    if (!adminModal) return;
    adminModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!adminModal) return;
    adminModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (openModalBtn) openModalBtn.addEventListener('click', openModal);
  if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
  if (dismissModalBtn) dismissModalBtn.addEventListener('click', closeModal);

  if (adminModal) {
    // Close when clicking modal backdrop
    adminModal.addEventListener('click', (e) => {
      if (e.target === adminModal) {
        closeModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && adminModal.classList.contains('active')) {
        closeModal();
      }
    });
  }

  /* --------------------------------------------------------------------------
     7. Toast Notification Handler
     -------------------------------------------------------------------------- */
  function showToast(title, message, type = 'success') {
    if (!toastNotification) return;

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTitle.textContent = title;
    toastMsg.textContent = message;

    toastNotification.className = `toast-notification show ${type}`;

    toastTimeout = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 4000);
  }
});
