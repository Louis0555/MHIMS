import "./shared/form-select";

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.logout-dialog')) return;

  const dialog = document.createElement('dialog');
  dialog.className = 'logout-dialog';
  dialog.setAttribute('aria-labelledby', 'logoutDialogTitle');
  dialog.innerHTML = `
    <div class="logout-dialog__icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17l5-5-5-5"></path>
        <path d="M15 12H3"></path>
        <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"></path>
      </svg>
    </div>
    <h2 class="logout-dialog__title" id="logoutDialogTitle">Log out</h2>
    <p class="logout-dialog__message">Are you sure you want to logout?</p>
    <div class="logout-dialog__actions">
      <button class="logout-dialog__button logout-dialog__button--cancel" type="button">Cancel</button>
      <button class="logout-dialog__button logout-dialog__button--confirm" type="button">Log out</button>
    </div>
  `;
  document.body.appendChild(dialog);

  const cancelButton = dialog.querySelector('.logout-dialog__button--cancel');
  const confirmButton = dialog.querySelector('.logout-dialog__button--confirm');
  let destination = '';

  document.body.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLAnchorElement>('.btn-logout[href]');
    if (!button) return;

    event.preventDefault();
    destination = button.href;
    dialog.showModal();
    cancelButton?.focus();
  });

  cancelButton?.addEventListener('click', () => dialog.close());
  confirmButton?.addEventListener('click', () => {
    if (destination) window.location.assign(destination);
  });
});
