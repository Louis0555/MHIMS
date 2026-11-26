export type RecordSaveKind = "created" | "updated";

let dismissTimeout: number | undefined;

function getNotice(kind: RecordSaveKind): HTMLElement {
  let notice = document.getElementById("mhims-record-save-notice");
  if (!notice) {
    notice = document.querySelector<HTMLElement>(".save-notice");
  }
  if (!notice) {
    notice = document.createElement("div");
    document.body.append(notice);
  }

  notice.id = "mhims-record-save-notice";
  notice.className = `mhims-record-notice mhims-record-notice--${kind}`;
  notice.setAttribute("role", "status");
  notice.setAttribute("aria-live", "polite");
  notice.setAttribute("aria-atomic", "true");
  return notice;
}

export function showRecordNotice(kind: RecordSaveKind, message: string): void {
  const notice = getNotice(kind);
  const icon = document.createElement("span");
  icon.className = "mhims-record-notice__icon";
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = kind === "created"
    ? '<svg viewBox="0 0 40 40" focusable="false"><circle cx="20" cy="20" r="20"/><path d="m11 20 6 6 12-13"/></svg>'
    : '<svg viewBox="0 0 40 40" focusable="false"><circle cx="16" cy="10" r="7"/><path d="M3 33c1-8 6-12 13-12 4 0 7 1 9 4"/><circle cx="29" cy="28" r="9"/><path d="m25 28 3 3 5-6"/></svg>';

  const content = document.createElement("div");
  content.className = "mhims-record-notice__content";

  const title = document.createElement("span");
  title.className = "mhims-record-notice__title";
  title.textContent = kind === "created" ? "Record saved" : "Changes Saved";

  const description = document.createElement("span");
  description.className = "mhims-record-notice__message";
  description.textContent = message;
  content.append(title, description);

  const closeButton = document.createElement("button");
  closeButton.className = "mhims-record-notice__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Dismiss notification");
  closeButton.textContent = "×";
  closeButton.addEventListener("click", () => {
    notice.classList.remove("is-visible");
    notice.hidden = true;
    notice.setAttribute("aria-hidden", "true");
    window.clearTimeout(dismissTimeout);
  });

  notice.replaceChildren(icon, content, closeButton);
  notice.hidden = false;
  notice.setAttribute("aria-hidden", "false");
  notice.classList.add("is-visible");
  window.clearTimeout(dismissTimeout);
  dismissTimeout = window.setTimeout(() => {
    notice.classList.remove("is-visible");
    notice.hidden = true;
    notice.setAttribute("aria-hidden", "true");
  }, 6000);
}
