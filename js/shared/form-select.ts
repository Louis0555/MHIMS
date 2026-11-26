interface EnhancedSelect {
  select: HTMLSelectElement;
  wrapper: HTMLDivElement;
  trigger: HTMLButtonElement;
  value: HTMLSpanElement;
  menu: HTMLDivElement;
  options: HTMLButtonElement[];
}

const enhancedSelects = new WeakMap<HTMLSelectElement, EnhancedSelect>();
let openSelectControl: EnhancedSelect | null = null;
let generatedSelectId = 0;
const maxMenuHeight = 236;
const addDocumentListener = document.addEventListener.bind(document);
const addWindowListener = window.addEventListener.bind(window);

function syncSelect(control: EnhancedSelect): void {
  const { select, trigger, value, wrapper } = control;
  const selectedOption = select.selectedOptions.item(0);

  value.textContent = selectedOption?.textContent?.trim() ?? "";
  value.classList.toggle("placeholder", !selectedOption || selectedOption.value === "");
  trigger.disabled = select.disabled;
  trigger.setAttribute("aria-required", String(select.required));
  trigger.setAttribute("aria-invalid", String(wrapper.classList.contains("is-invalid")));

  control.options.forEach((optionButton, index) => {
    const option = select.options.item(index);
    if (!option) return;

    const optionGroup = option.parentElement;
    optionButton.disabled = option.disabled
      || (optionGroup instanceof HTMLOptGroupElement && optionGroup.disabled)
      || select.disabled;
    optionButton.setAttribute("aria-selected", String(index === select.selectedIndex));
    optionButton.classList.toggle("selected", index === select.selectedIndex);
  });
}

function rebuildOptions(control: EnhancedSelect): void {
  control.menu.replaceChildren();
  control.options = Array.from(control.select.options, (option, index) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "mhims-select-option";
    optionButton.setAttribute("role", "option");
    optionButton.textContent = option.textContent?.trim() ?? "";

    if (option.id) optionButton.id = `${option.id}-custom`;
    optionButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (optionButton.disabled) return;

      control.select.selectedIndex = index;
      control.select.dispatchEvent(new Event("input", { bubbles: true }));
      control.select.dispatchEvent(new Event("change", { bubbles: true }));
      control.wrapper.classList.remove("is-invalid");
      closeSelect(control, true);
    });

    optionButton.addEventListener("keydown", (event) => {
      const enabledOptions = control.options.filter((item) => !item.disabled);
      const currentIndex = enabledOptions.indexOf(optionButton);
      let nextIndex = currentIndex;

      if (event.key === "ArrowDown") nextIndex = Math.min(currentIndex + 1, enabledOptions.length - 1);
      else if (event.key === "ArrowUp") nextIndex = Math.max(currentIndex - 1, 0);
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = enabledOptions.length - 1;
      else if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeSelect(control, true);
        return;
      } else if (event.key === "Tab") {
        closeSelect(control, false);
        control.trigger.focus();
        return;
      } else {
        return;
      }

      event.preventDefault();
      enabledOptions[nextIndex]?.focus();
    });

    control.menu.append(optionButton);
    return optionButton;
  });

  syncSelect(control);
}

function positionMenu(control: EnhancedSelect): void {
  const rect = control.trigger.getBoundingClientRect();
  const viewportPadding = 8;
  const gap = 4;
  const dialog = control.select.closest("dialog[open]");
  const dialogRect = dialog?.getBoundingClientRect();
  const bounds = dialog && dialogRect
    ? {
      left: Math.max(viewportPadding, dialogRect.left + dialog.clientLeft),
      right: Math.min(window.innerWidth - viewportPadding, dialogRect.right - dialog.clientLeft),
      top: Math.max(viewportPadding, dialogRect.top + dialog.clientTop),
      bottom: Math.min(window.innerHeight - viewportPadding, dialogRect.bottom - dialog.clientTop),
    }
    : {
      left: viewportPadding,
      right: window.innerWidth - viewportPadding,
      top: viewportPadding,
      bottom: window.innerHeight - viewportPadding,
    };
  const spaceBelow = bounds.bottom - rect.bottom - gap;
  const spaceAbove = rect.top - bounds.top - gap;
  const shouldOpenAbove = spaceBelow < Math.min(control.menu.scrollHeight, maxMenuHeight)
    && spaceAbove > spaceBelow;
  const availableSpace = Math.max(0, shouldOpenAbove ? spaceAbove : spaceBelow);
  const menuHeight = Math.min(control.menu.scrollHeight, maxMenuHeight, availableSpace);
  const menuWidth = Math.min(rect.width, bounds.right - bounds.left);
  const left = Math.max(bounds.left, Math.min(rect.left, bounds.right - menuWidth));
  const top = shouldOpenAbove
    ? Math.max(bounds.top, rect.top - gap - menuHeight)
    : Math.min(bounds.bottom, rect.bottom + gap);

  control.menu.style.left = `${dialog && dialogRect ? left - dialogRect.left - dialog.clientLeft : left}px`;
  control.menu.style.width = `${menuWidth}px`;
  control.menu.style.maxHeight = `${menuHeight}px`;
  control.menu.style.top = `${dialog && dialogRect ? top - dialogRect.top - dialog.clientTop : top}px`;
}

function closeSelect(control: EnhancedSelect, restoreFocus: boolean): void {
  control.menu.classList.remove("is-open");
  control.trigger.setAttribute("aria-expanded", "false");
  if (openSelectControl === control) openSelectControl = null;
  if (restoreFocus) control.trigger.focus();
}

function openSelect(control: EnhancedSelect, focusOption: boolean, lastOption = false): void {
  if (control.trigger.disabled) return;
  if (openSelectControl && openSelectControl !== control) {
    closeSelect(openSelectControl, false);
  }

  control.menu.classList.add("is-open");
  control.trigger.setAttribute("aria-expanded", "true");
  openSelectControl = control;
  positionMenu(control);

  if (focusOption) {
    const selected = control.options[control.select.selectedIndex];
    const enabledOptions = control.options.filter((item) => !item.disabled);
    (selected && !selected.disabled
      ? selected
      : lastOption
        ? enabledOptions[enabledOptions.length - 1]
        : enabledOptions[0]
    )?.focus();
  }
}

function enhanceSelect(select: HTMLSelectElement): void {
  if (
    enhancedSelects.has(select)
    || select.multiple
    || select.size > 1
    || select.hidden
    || select.classList.contains("resident-native-select")
    || select.closest(".resident-patient-form")
    || select.closest(".resident-select-control, .mhims-select-wrap, .cust-select-wrap")
  ) {
    return;
  }

  const parent = select.parentElement;
  if (!parent) return;

  const wrapper = document.createElement("div");
  wrapper.className = "mhims-select-wrap";
  parent.insertBefore(wrapper, select);
  wrapper.append(select);

  select.classList.add("mhims-select-source");
  select.tabIndex = -1;
  select.setAttribute("aria-hidden", "true");

  if (!select.id) {
    generatedSelectId += 1;
    select.id = `mhims-select-${generatedSelectId}`;
  }

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "mhims-select-trigger";
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", `${select.id}-menu`);

  const label = select.labels?.item(0);
  if (select.getAttribute("aria-label")) {
    trigger.setAttribute("aria-label", select.getAttribute("aria-label") ?? "");
  } else if (label) {
    if (!label.id) {
      generatedSelectId += 1;
      label.id = `mhims-select-label-${generatedSelectId}`;
    }
    trigger.setAttribute("aria-labelledby", label.id);
  }

  const value = document.createElement("span");
  value.className = "mhims-select-value";
  trigger.append(value);
  wrapper.append(trigger);

  const menu = document.createElement("div");
  menu.id = `${select.id}-menu`;
  menu.className = "mhims-select-menu";
  menu.setAttribute("role", "listbox");
  (select.closest("dialog") ?? document.body).append(menu);

  const control: EnhancedSelect = {
    select,
    wrapper,
    trigger,
    value,
    menu,
    options: [],
  };
  enhancedSelects.set(select, control);
  rebuildOptions(control);

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (control.menu.classList.contains("is-open")) closeSelect(control, false);
    else openSelect(control, false);
  });

  trigger.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      openSelect(control, true, event.key === "ArrowUp");
    } else if (event.key === "Tab" && control.menu.classList.contains("is-open")) {
      closeSelect(control, false);
    } else if (event.key === "Escape" && control.menu.classList.contains("is-open")) {
      event.preventDefault();
      event.stopPropagation();
      closeSelect(control, true);
    }
  });

  select.addEventListener("input", () => syncSelect(control));
  select.addEventListener("change", () => {
    wrapper.classList.remove("is-invalid");
    syncSelect(control);
  });
  select.addEventListener("mhims:select-sync", () => syncSelect(control));
  select.addEventListener("focus", () => trigger.focus());
  select.addEventListener("invalid", (event) => {
    event.preventDefault();
    wrapper.classList.add("is-invalid");
    syncSelect(control);
    trigger.focus();
  });

  label?.addEventListener("click", (event) => {
    event.preventDefault();
    trigger.focus();
  });

  select.form?.addEventListener("reset", () => {
    window.setTimeout(() => {
      wrapper.classList.remove("is-invalid");
      syncSelect(control);
    }, 0);
  });

  const optionsObserver = new MutationObserver(() => rebuildOptions(control));
  optionsObserver.observe(select, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeFilter: ["disabled", "label", "selected"],
  });
}

function enhanceSelectsWithin(node: ParentNode): void {
  if (node instanceof HTMLSelectElement) enhanceSelect(node);
  node.querySelectorAll("select").forEach(enhanceSelect);
}

function initializeFormSelects(): void {
  if (!document.body) return;

  enhanceSelectsWithin(document.body);

  const pageObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) enhanceSelectsWithin(node);
      });
    });
  });
  pageObserver.observe(document.body, { childList: true, subtree: true });

  addDocumentListener("click", (event) => {
    if (!openSelectControl) return;
    const target = event.target;
    if (
      target instanceof Node
      && !openSelectControl.trigger.contains(target)
      && !openSelectControl.menu.contains(target)
    ) {
      closeSelect(openSelectControl, false);
    }
  });

  addWindowListener("resize", () => {
    if (openSelectControl) positionMenu(openSelectControl);
  });
  addWindowListener("scroll", (event) => {
    if (openSelectControl && event.target !== openSelectControl.menu) {
      positionMenu(openSelectControl);
    }
  }, true);
}

if (document.readyState === "complete") {
  initializeFormSelects();
} else {
  addDocumentListener("DOMContentLoaded", initializeFormSelects, { once: true });
}
