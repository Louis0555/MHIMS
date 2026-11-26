import { showRecordNotice } from "../../shared/record-save-notice";
import { activateQueueNavigation, consumeResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";
import type { ResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - ResidentCare Patient Profiling Logic
 * Script: js/clinical/residentcare/patient.js
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const searchInput = document.getElementById('patientSearchInput');
  const table = document.getElementById('patientsTable');
  const tbody = table ? table.querySelector('tbody') : null;
  const initialRows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];
  const patientListView = document.getElementById('residentPatientListView');
  const patientProfileView = document.getElementById('residentPatientProfileView');
  const patientProfileVisits = document.getElementById('profileVisitHistoryBody');
  const patientProfileLabs = document.getElementById('profileLabHistoryBody');
  const addVisitModal = document.getElementById('addResidentVisitModal');
  const addVisitForm = document.getElementById('addResidentVisitForm') as HTMLFormElement | null;
  const profileRecords = new WeakMap();
  let selectedProfileRow: HTMLTableRowElement | null = null;
  let queueReturnUrl: string | null = null;
  let editingPatientRow: HTMLTableRowElement | null = null;
  let editingPatientRequiredNames = new Set<string>();
  let editingPatientRequiredGroups = new Set<string>();
  const addPatientModal = document.getElementById('addPatientModal');
  const addPatientForm = document.getElementById('addPatientForm') as HTMLFormElement | null;
  const addPatientModalTitle = document.getElementById('addPatientModalTitle');
  const addPatientModalSubtitle = addPatientModal?.querySelector('.resident-modal-header p');
  const addPatientButton = document.getElementById('btnAddRecord');
  // Filter Toolbar Buttons & Menus
  const btnFilterAll = document.getElementById('btnFilterAll');
  const barangayDropdownWrap = document.getElementById('barangayDropdownWrap');
  const barangayDropdownBtn = document.getElementById('barangayDropdownBtn');
  const barangayDropdownMenu = document.getElementById('barangayDropdownMenu');

  const sexDropdownWrap = document.getElementById('sexDropdownWrap');
  const sexDropdownBtn = document.getElementById('sexDropdownBtn');
  const sexDropdownMenu = document.getElementById('sexDropdownMenu');

  const statusDropdownWrap = document.getElementById('statusDropdownWrap');
  const statusDropdownBtn = document.getElementById('statusDropdownBtn');
  const statusDropdownMenu = document.getElementById('statusDropdownMenu');

  const lastConsultBtn = document.getElementById('lastConsultBtn');

  // Filter State
  const activeFilters = {
    barangay: null,
    sex: null,
    status: null,
    query: ''
  };

  let sortOrder = null; // null | 'asc' | 'desc'

  /**
   * Normalize text for fuzzy matching (removes hyphens, underscores, extra spaces)
   */
  function normalizeText(text) {
    return (text || '').toLowerCase().replace(/[-_\s]/g, '').trim();
  }

  /**
   * Filter the table rows according to activeFilters and search query
   */
  function filterTable() {
    if (!tbody) return;

    let visibleCount = 0;

    initialRows.forEach(row => {
      // 1. Search Query Check
      const rowText = row.textContent.toLowerCase();
      const matchesSearch = !activeFilters.query || rowText.includes(activeFilters.query);

      // 2. Barangay Filter Check
      let matchesBarangay = true;
      if (activeFilters.barangay) {
        const addressEl = row.querySelector('.patient-col-address');
        const address = (addressEl ? addressEl.textContent : rowText).toLowerCase();
        const targetBarangay = activeFilters.barangay.toLowerCase();

        // Support both "Gugon" and "Gogon" spelling
        if (targetBarangay === 'gugon') {
          matchesBarangay = address.includes('gugon') || address.includes('gogon');
        } else {
          matchesBarangay = address.includes(targetBarangay);
        }
      }

      // 3. Sex Filter Check
      let matchesSex = true;
      if (activeFilters.sex) {
        const sexCell = row.querySelector('td:nth-child(3)');
        const sexText = sexCell ? sexCell.textContent.trim().toLowerCase() : '';
        matchesSex = sexText === activeFilters.sex.toLowerCase();
      }

      // 4. Status Filter Check
      let matchesStatus = true;
      if (activeFilters.status) {
        const statusEl = row.querySelector('.status-pill');
        const statusText = statusEl ? statusEl.textContent : '';
        const normStatus = normalizeText(statusText);
        const normTarget = normalizeText(activeFilters.status);

        matchesStatus = normStatus.includes(normTarget);
      }

      // Apply visibility
      if (matchesSearch && matchesBarangay && matchesSex && matchesStatus) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Handle Empty State
    let emptyRow = tbody.querySelector('.empty-table-row');
    if (visibleCount === 0) {
      if (!emptyRow) {
        emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-table-row';
        emptyRow.innerHTML = `<td colspan="7">No patient records found matching the selected filters.</td>`;
        tbody.appendChild(emptyRow);
      }
      emptyRow.style.display = '';
    } else if (emptyRow) {
      emptyRow.style.display = 'none';
    }
  }

  /**
   * Close all filter dropdown menus
   */
  function closeAllDropdowns() {
    [barangayDropdownWrap, sexDropdownWrap, statusDropdownWrap].forEach(wrap => {
      if (wrap) {
        wrap.classList.remove('open');
        const menu = wrap.querySelector('.filter-dropdown-menu');
        const btn = wrap.querySelector('.filter-btn');
        if (menu) menu.classList.remove('show');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /**
   * Setup a dropdown button & menu
   */
  function setupDropdown(wrap, btn, menu, filterKey, defaultLabel) {
    if (!wrap || !btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        wrap.classList.add('open');
        menu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.filter-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.getAttribute('data-value');
        const labelSpan = btn.querySelector('.filter-btn-text');

        // If clicking the already active value -> deselect it
        if (activeFilters[filterKey] === value) {
          activeFilters[filterKey] = null;
          item.classList.remove('selected');
          btn.classList.remove('has-filter');
          if (labelSpan) labelSpan.textContent = defaultLabel;
        } else {
          // Select new value
          activeFilters[filterKey] = value;
          menu.querySelectorAll('.filter-menu-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          btn.classList.add('has-filter');
          if (labelSpan) labelSpan.textContent = value;
        }

        // Update "All" button active state
        updateAllBtnState();

        closeAllDropdowns();
        filterTable();
      });
    });
  }

  /**
   * Check if any dropdown filter is active, update "All" button accordingly
   */
  function updateAllBtnState() {
    const hasAnyFilter = Boolean(activeFilters.barangay || activeFilters.sex || activeFilters.status);
    if (btnFilterAll) {
      if (hasAnyFilter) {
        btnFilterAll.classList.remove('active');
      } else {
        btnFilterAll.classList.add('active');
      }
    }
  }

  // Initialize Dropdowns
  setupDropdown(barangayDropdownWrap, barangayDropdownBtn, barangayDropdownMenu, 'barangay', 'Barangay');
  setupDropdown(sexDropdownWrap, sexDropdownBtn, sexDropdownMenu, 'sex', 'Sex');
  setupDropdown(statusDropdownWrap, statusDropdownBtn, statusDropdownMenu, 'status', 'Status');

  // "All" Reset Button Handler
  if (btnFilterAll) {
    btnFilterAll.addEventListener('click', () => {
      activeFilters.barangay = null;
      activeFilters.sex = null;
      activeFilters.status = null;

      // Reset labels and classes
      if (barangayDropdownBtn) {
        const text = barangayDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Barangay';
        barangayDropdownBtn.classList.remove('has-filter');
      }
      if (sexDropdownBtn) {
        const text = sexDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Sex';
        sexDropdownBtn.classList.remove('has-filter');
      }
      if (statusDropdownBtn) {
        const text = statusDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Status';
        statusDropdownBtn.classList.remove('has-filter');
      }

      document.querySelectorAll('.filter-menu-item').forEach(item => item.classList.remove('selected'));

      btnFilterAll.classList.add('active');
      closeAllDropdowns();
      filterTable();
    });
  }

  // Last Consult Sort Handler
  if (lastConsultBtn) {
    lastConsultBtn.addEventListener('click', () => {
      if (!tbody) return;

      if (!sortOrder || sortOrder === 'desc') {
        sortOrder = 'asc';
        lastConsultBtn.classList.add('active');
      } else {
        sortOrder = 'desc';
      }

      const rowsToSort = Array.from(tbody.querySelectorAll('tr:not(.empty-table-row)'));
      rowsToSort.sort((a, b) => {
        const dateAStr = a.querySelector('td:nth-child(5)')?.textContent.trim() || '';
        const dateBStr = b.querySelector('td:nth-child(5)')?.textContent.trim() || '';
        const timeA = Date.parse(dateAStr) || 0;
        const timeB = Date.parse(dateBStr) || 0;

        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      });

      rowsToSort.forEach(r => tbody.appendChild(r));
    });
  }

  // Live Search Input Handler
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeFilters.query = searchInput.value.toLowerCase().trim();
      filterTable();
    });
  }

  // Add Patient Modal
  const closePatientModalButton = document.getElementById('btnCloseAddPatient');
  const cancelPatientButton = document.getElementById('btnCancelAddPatient');
  const birthDateInput = document.getElementById('patientBirthDate') as HTMLInputElement | null;
  const ageInput = document.getElementById('patientAge') as HTMLInputElement | null;
  const disabilityTypeInput = document.getElementById('disabilityType');
  const pwdIdStatusInput = document.getElementById('pwdIdStatus');
  const pwdIdNumberInput = document.getElementById('pwdIdNumber');
  const medicalConditionInput = document.getElementById('medicalCondition');
  const conditionRequiredMark = document.getElementById('conditionRequiredMark');
  const progressSections = addPatientForm
    ? Array.from(addPatientForm.querySelectorAll('[data-progress-section]'))
    : [];
  const progressTitles = {
    'patient-information': 'I. Patient Information',
    'initial-consultation': 'II. Initial Consultation'
  };
  const customSelectControls = [];
  let openCustomSelect = null;

  function refreshCustomSelect(control) {
    const selectedOption = control.select.options[control.select.selectedIndex];
    control.value.textContent = selectedOption ? selectedOption.textContent : '';
    control.value.classList.toggle('placeholder', Boolean(selectedOption && !selectedOption.value));
    control.trigger.disabled = control.select.disabled;
    control.trigger.setAttribute('aria-disabled', String(control.select.disabled));

    control.options.forEach(optionButton => {
      const selected = optionButton.dataset.value === control.select.value;
      optionButton.setAttribute('aria-selected', String(selected));
    });
  }

  function refreshAllCustomSelects() {
    customSelectControls.forEach(refreshCustomSelect);
  }

  function closeCustomSelect(control, returnFocus) {
    if (!control) return;
    control.menu.classList.remove('is-open');
    control.trigger.setAttribute('aria-expanded', 'false');
    if (openCustomSelect === control) openCustomSelect = null;
    if (returnFocus) control.trigger.focus();
  }

  function positionCustomSelectMenu(control) {
    const triggerRect = control.trigger.getBoundingClientRect();
    const scrollArea = addPatientForm.querySelector('.resident-form-scroll');
    const scrollRect = scrollArea ? scrollArea.getBoundingClientRect() : {
      top: 8,
      bottom: window.innerHeight - 8
    };
    const visibleTop = Math.max(8, scrollRect.top + 4);
    const visibleBottom = Math.min(window.innerHeight - 8, scrollRect.bottom - 4);
    const menuHeight = Math.min(260, control.menu.scrollHeight);
    const spaceBelow = Math.max(0, visibleBottom - triggerRect.bottom - 4);
    const spaceAbove = Math.max(0, triggerRect.top - visibleTop - 4);
    const openAbove = spaceBelow < Math.min(menuHeight, 170) && spaceAbove > spaceBelow;
    const availableSpace = openAbove ? spaceAbove : spaceBelow;
    const height = Math.max(80, Math.min(menuHeight, availableSpace));
    const width = Math.min(triggerRect.width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(triggerRect.left, window.innerWidth - width - 8));

    control.menu.style.width = `${width}px`;
    control.menu.style.left = `${left}px`;
    control.menu.style.maxHeight = `${height}px`;
    control.menu.style.top = openAbove
      ? `${Math.max(8, triggerRect.top - height - 4)}px`
      : `${triggerRect.bottom + 4}px`;
  }

  function openCustomSelectMenu(control, focusOption) {
    if (control.select.disabled) return;
    if (openCustomSelect && openCustomSelect !== control) {
      closeCustomSelect(openCustomSelect, false);
    }

    control.menu.classList.add('is-open');
    control.trigger.setAttribute('aria-expanded', 'true');
    openCustomSelect = control;
    positionCustomSelectMenu(control);

    if (focusOption) {
      const selectedOption = control.options.find(option =>
        option.getAttribute('aria-selected') === 'true' && !option.disabled
      );
      const firstOption = control.options.find(option => !option.disabled);
      (selectedOption || firstOption || control.trigger).focus();
    }
  }

  function moveFocusFromCustomSelect(event, control) {
    const focusableFields = Array.from(addPatientForm.querySelectorAll(
      'input:not([disabled]), button:not([disabled]), textarea:not([disabled])'
    )).filter(field => field.tabIndex >= 0 && field.getClientRects().length);
    const triggerIndex = focusableFields.indexOf(control.trigger);
    const nextIndex = triggerIndex + (event.shiftKey ? -1 : 1);
    const nextField = focusableFields[nextIndex];

    closeCustomSelect(control, false);
    if (nextField) {
      event.preventDefault();
      nextField.focus();
    }
  }

  function initializeCustomSelects() {
    if (!addPatientForm) return;

    addPatientForm.querySelectorAll('select').forEach((select, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'resident-select-control';
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);
      select.classList.add('resident-native-select');
      select.hidden = true;
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');

      const label = addPatientForm.querySelector(`label[for="${select.id}"]`);
      if (label && !label.id) label.id = `${select.id}Label`;

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.id = `${select.id}Trigger`;
      trigger.className = 'resident-select-trigger';
      trigger.setAttribute('role', 'combobox');
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', `${select.id}Options`);
      if (label) trigger.setAttribute('aria-labelledby', label.id);

      const value = document.createElement('span');
      value.className = 'resident-select-value';
      trigger.appendChild(value);
      const chevron = document.createElement('iconify-icon');
      chevron.setAttribute('icon', 'material-symbols:arrow-drop-down-rounded');
      chevron.setAttribute('width', '20');
      chevron.setAttribute('height', '20');
      chevron.className = 'resident-select-chevron';
      trigger.appendChild(chevron);
      wrapper.appendChild(trigger);

      const menu = document.createElement('div');
      menu.id = `${select.id}Options`;
      menu.className = 'resident-select-menu';
      menu.setAttribute('role', 'listbox');
      if (label) menu.setAttribute('aria-labelledby', label.id);

      const options = Array.from(select.options).map((nativeOption, optionIndex) => {
        const optionButton = document.createElement('button');
        optionButton.type = 'button';
        optionButton.className = 'resident-select-option';
        optionButton.setAttribute('role', 'option');
        optionButton.setAttribute('aria-selected', 'false');
        optionButton.tabIndex = -1;
        optionButton.dataset.value = nativeOption.value;
        optionButton.textContent = nativeOption.textContent;
        optionButton.disabled = nativeOption.disabled;
        optionButton.id = `${select.id}Option${optionIndex}`;
        menu.appendChild(optionButton);
        return optionButton;
      });

      document.body.appendChild(menu);
      const control = { select, wrapper, trigger, value, menu, options, label };
      customSelectControls.push(control);
      refreshCustomSelect(control);

      trigger.addEventListener('click', () => {
        if (openCustomSelect === control) {
          closeCustomSelect(control, false);
        } else {
          openCustomSelectMenu(control, false);
        }
      });
      trigger.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openCustomSelectMenu(control, true);
        } else if (event.key === 'Escape' && openCustomSelect === control) {
          event.preventDefault();
          closeCustomSelect(control, false);
        } else if (event.key === 'Tab' && openCustomSelect === control) {
          moveFocusFromCustomSelect(event, control);
        }
      });
      options.forEach(optionButton => {
        optionButton.addEventListener('click', () => {
          if (optionButton.disabled) return;
          select.value = optionButton.dataset.value;
          select.dispatchEvent(new Event('input', { bubbles: true }));
          select.dispatchEvent(new Event('change', { bubbles: true }));
          refreshCustomSelect(control);
          closeCustomSelect(control, true);
        });
      });
      menu.addEventListener('keydown', event => {
        const enabledOptions = options.filter(option => !option.disabled);
        const currentIndex = enabledOptions.indexOf(document.activeElement);
        let nextIndex = currentIndex;

        if (event.key === 'ArrowDown') nextIndex = Math.min(currentIndex + 1, enabledOptions.length - 1);
        else if (event.key === 'ArrowUp') nextIndex = Math.max(currentIndex - 1, 0);
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = enabledOptions.length - 1;
        else if (event.key === 'Escape') {
          event.preventDefault();
          closeCustomSelect(control, true);
          return;
        } else if (event.key === 'Tab') {
          moveFocusFromCustomSelect(event, control);
          return;
        } else {
          return;
        }

        event.preventDefault();
        if (enabledOptions[nextIndex]) enabledOptions[nextIndex].focus();
      });
      const handleFocusOut = event => {
        const nextFocusedElement = event.relatedTarget;
        if (
          openCustomSelect === control &&
          nextFocusedElement !== trigger &&
          !wrapper.contains(nextFocusedElement) &&
          !menu.contains(nextFocusedElement)
        ) {
          closeCustomSelect(control, false);
        }
      };
      trigger.addEventListener('focusout', handleFocusOut);
      menu.addEventListener('focusout', handleFocusOut);
      select.addEventListener('change', () => refreshCustomSelect(control));
      if (label) {
        label.addEventListener('click', event => {
          event.preventDefault();
          trigger.focus();
          openCustomSelectMenu(control, false);
        });
      }
    });

    document.addEventListener('click', event => {
      if (
        openCustomSelect &&
        !openCustomSelect.wrapper.contains(event.target) &&
        !openCustomSelect.menu.contains(event.target) &&
        !(openCustomSelect.label && openCustomSelect.label.contains(event.target))
      ) {
        closeCustomSelect(openCustomSelect, false);
      }
    });

    const scrollArea = addPatientForm.querySelector('.resident-form-scroll');
    if (scrollArea) {
      scrollArea.addEventListener('scroll', () => {
        if (openCustomSelect) closeCustomSelect(openCustomSelect, false);
      });
    }
    window.addEventListener('resize', () => {
      if (openCustomSelect) positionCustomSelectMenu(openCustomSelect);
    });
  }

  initializeCustomSelects();

  function isSectionComplete(section) {
    const requiredControls = Array.from(section.querySelectorAll('[required]'))
      .filter(control => !control.disabled);
    const checkedRadioGroups = new Set();

    for (const control of requiredControls) {
      if (control.type === 'radio') {
        if (checkedRadioGroups.has(control.name)) continue;
        checkedRadioGroups.add(control.name);
        const group = Array.from(section.querySelectorAll('input[type="radio"]'))
          .filter(radio => radio.name === control.name);
        if (!group.some(radio => radio.checked)) return false;
      } else if (!control.value.trim() || !control.validity.valid) {
        return false;
      }
    }

    const requiredCheckboxGroups = Array.from(section.querySelectorAll('[data-required-group]'));
    return requiredCheckboxGroups.every(group =>
      group.querySelector('input[type="checkbox"]:checked')
    );
  }

  function updatePatientProgress() {
    if (!addPatientForm) return;

    const isProgressSectionComplete = section =>
      Boolean(editingPatientRow && section.dataset.progressSection === 'patient-information') ||
      isSectionComplete(section);
    const completedSections = progressSections.filter(isProgressSectionComplete).length;
    const totalSections = progressSections.length;
    const percentage = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;
    const remaining = progressSections
      .filter(section => !isProgressSectionComplete(section))
      .map(section => progressTitles[section.dataset.progressSection] || 'Required section');
    const summary = document.getElementById('patientProgressSummary');
    const percent = document.getElementById('patientProgressPercent');
    const track = document.getElementById('patientProgressTrack');
    const bar = document.getElementById('patientProgressBar');
    const note = document.getElementById('patientProgressNote');
    const draftStatus = document.getElementById('patientDraftStatus');

    if (summary) {
      summary.textContent = `${completedSections} of ${totalSections} required sections complete`;
    }
    if (percent) percent.textContent = `${percentage}%`;
    if (track) track.setAttribute('aria-valuenow', String(percentage));
    if (bar) bar.style.width = `${percentage}%`;
    if (note) {
      note.textContent = remaining.length
        ? `${remaining.length} section${remaining.length === 1 ? '' : 's'} left: ${remaining.join(', ')}`
        : 'All required sections are complete.';
    }
    if (draftStatus) {
      draftStatus.textContent = percentage === 100
        ? 'Ready to save'
        : 'Progress updates as required fields are completed';
    }
  }

  function updatePatientAge() {
    if (!birthDateInput || !ageInput) return;
    if (!birthDateInput.value) {
      ageInput.value = editingPatientRow ? profileForRow(editingPatientRow).age || '' : '';
      return;
    }

    const birthDate = new Date(`${birthDateInput.value}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const birthdayNotReached =
      today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
    if (birthdayNotReached) age--;
    ageInput.value = age >= 0 ? String(age) : '';
  }

  function updatePatientConditionals() {
    const pwdYes = addPatientForm
      ? addPatientForm.querySelector('input[name="isPwd"][value="Yes"]')
      : null;
    const hasConditionYes = addPatientForm
      ? addPatientForm.querySelector('input[name="hasCondition"][value="Yes"]')
      : null;
    const isPwd = Boolean(pwdYes && pwdYes.checked);
    const hasCondition = Boolean(hasConditionYes && hasConditionYes.checked);

    [pwdIdStatusInput, pwdIdNumberInput].forEach(input => {
      if (!input) return;
      input.disabled = !isPwd;
      if (!isPwd) input.value = '';
    });

    if (disabilityTypeInput) {
      disabilityTypeInput.disabled = !isPwd;
      disabilityTypeInput.required = isPwd;
      if (!isPwd) disabilityTypeInput.value = '';
      const requiredMark = disabilityTypeInput.closest('.resident-form-group')
        .querySelector('.required-mark');
      if (requiredMark) requiredMark.hidden = !isPwd;
    }

    if (medicalConditionInput) {
      medicalConditionInput.disabled = !hasCondition;
      medicalConditionInput.required = hasCondition;
      if (!hasCondition) medicalConditionInput.value = '';
    }
    if (conditionRequiredMark) conditionRequiredMark.hidden = !hasCondition;
    refreshAllCustomSelects();
  }

  function capturePatientEditRequirements() {
    editingPatientRequiredNames = new Set();
    editingPatientRequiredGroups = new Set();
    if (!addPatientForm) return;

    addPatientForm.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('[required]').forEach(control => {
      if (control.disabled) return;
      if (control instanceof HTMLInputElement && control.type === 'radio') {
        const group = Array.from(addPatientForm.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
          .filter(radio => radio.name === control.name);
        if (group.some(radio => radio.checked)) editingPatientRequiredNames.add(control.name);
      } else if (control.value.trim()) {
        editingPatientRequiredNames.add(control.name);
      }
    });
    addPatientForm.querySelectorAll<HTMLElement>('[data-required-group]').forEach(group => {
      const groupName = group.dataset.requiredGroup;
      if (groupName && group.querySelector('input[type="checkbox"]:checked')) {
        editingPatientRequiredGroups.add(groupName);
      }
    });
  }

  function clearPatientValidation() {
    if (addPatientForm) {
      addPatientForm.querySelectorAll('.is-invalid').forEach(element => {
        element.classList.remove('is-invalid');
      });
    }
  }

  function getInvalidPatientControls() {
    if (!addPatientForm) return [];
    clearPatientValidation();
    const invalid: Array<HTMLElement | HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> = [];
    const requiredControls = Array.from(addPatientForm.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('[required]'))
      .filter(control => {
        if (control.disabled) return false;
        if (!editingPatientRow) return true;
        if (control instanceof HTMLInputElement && control.type === 'radio') {
          const group = Array.from(addPatientForm.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
            .filter(radio => radio.name === control.name);
          return editingPatientRequiredNames.has(control.name) || group.some(radio => radio.checked);
        }
        return editingPatientRequiredNames.has(control.name) || Boolean(control.value.trim());
      });
    const checkedRadioGroups = new Set<string>();

    requiredControls.forEach(control => {
      if (control instanceof HTMLInputElement && control.type === 'radio') {
        if (checkedRadioGroups.has(control.name)) return;
        checkedRadioGroups.add(control.name);
        const group = Array.from(addPatientForm.querySelectorAll<HTMLInputElement>('input[type="radio"]'))
          .filter(radio => radio.name === control.name);
        if (!group.some(radio => radio.checked) && group[0]) invalid.push(group[0]);
      } else if (!control.value.trim() || !control.validity.valid) {
        invalid.push(control);
      }
    });

    addPatientForm.querySelectorAll<HTMLElement>('[data-required-group]').forEach(group => {
      const groupName = group.dataset.requiredGroup;
      if (editingPatientRow &&
        groupName &&
        !editingPatientRequiredGroups.has(groupName) &&
        !group.querySelector('input[type="checkbox"]:checked')) return;
      if (!group.querySelector('input[type="checkbox"]:checked')) invalid.push(group);
    });

    invalid.forEach(control => {
      const field = control.matches('[data-required-group]')
        ? control
        : control.closest('.resident-form-group, .resident-choice-group');
      if (field) field.classList.add('is-invalid');
    });
    return invalid;
  }

  function collectPatientFormValues() {
    if (!addPatientForm) throw new Error('The patient form is unavailable.');
    const values: Record<string, string | string[]> = {};
    new FormData(addPatientForm).forEach((value, name) => {
      const text = String(value);
      if (values[name] === undefined) {
        values[name] = text;
      } else if (Array.isArray(values[name])) {
        values[name].push(text);
      } else {
        values[name] = [values[name], text];
      }
    });
    return values;
  }

  function dateInputValue(value: string | null | undefined) {
    if (!value) return '';
    const isoDate = String(value).match(/^\d{4}-\d{2}-\d{2}$/);
    if (isoDate) return String(value);
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function setPatientEditForm(row: HTMLTableRowElement) {
    if (!addPatientForm) return;
    const profile = profileForRow(row);
    const values = { ...(profile.formValues || {}) };
    const addressParts = String(profile.address || '').split(',').map(part => part.trim());
    const baseValues = {
      familySerial: profile.familySerial,
      firstName: profile.firstName,
      middleName: profile.middleName,
      lastName: profile.lastName,
      sex: profile.sex,
      birthDate: profile.birthDate,
      age: profile.age,
      contact: profile.contact,
      civilStatus: profile.civilStatus,
      philHealthNumber: profile.philHealthNumber
    };

    Object.entries(baseValues).forEach(([name, value]) => {
      if (value && !values[name]) values[name] = value;
    });
    if (profile.isDemo) {
      if (!profile.formValues?.birthDate) delete values.birthDate;
      if (!profile.formValues?.contact) delete values.contact;
      if (!profile.formValues?.civilStatus) delete values.civilStatus;
      if (!profile.formValues?.philHealthNumber) delete values.philHealthNumber;
    }
    if (!values.barangay) values.barangay = addressParts[0] || '';
    if (!values.municipality) values.municipality = addressParts.slice(1).join(', ');

    const visit = profile.visits?.[0];
    if (visit) {
      values.consultationDate = values.consultationDate || dateInputValue(visit.date);
      values.attendingProvider = values.attendingProvider || visit.provider || '';
      values.chiefComplaints = values.chiefComplaints || visit.complaint || '';
      values.diagnosis = values.diagnosis || visit.diagnosis || '';
      values.medicationTreatment = values.medicationTreatment || visit.treatment || '';

      String(visit.vitals || '').split('|').forEach(entry => {
        const match = entry.trim().match(/^(BP|WT|PR|TEMP|SPO2|HT)\s*(.*)$/i);
        if (!match) return;
        const value = match[2].trim().replace(/\s*(kg|cm|bpm|°?c|%)$/i, '').trim();
        const fieldByVital: Record<string, string> = {
          BP: 'bloodPressure',
          WT: 'weight',
          PR: 'pulse',
          TEMP: 'temperature',
          SPO2: 'spo2',
          HT: 'height'
        };
        const fieldName = fieldByVital[match[1].toUpperCase()];
        if (fieldName && !values[fieldName]) values[fieldName] = value;
      });
    }

    const statusText = row.querySelector('.status-pill span:last-child')?.textContent.trim();
    const statusByLabel: Record<string, string> = {
      'Ongoing Treatment': 'Under Treatment',
      'High Risk': 'High Risk',
      'Completed': 'Resolved',
      'Monitor': 'Monitor'
    };
    const statusValue = statusText ? statusByLabel[statusText] : '';
    if (statusValue && !values.conditionStatus) values.conditionStatus = statusValue;

    addPatientForm.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('[name]').forEach(control => {
      const value = values[control.name];
      if (control instanceof HTMLInputElement && (control.type === 'radio' || control.type === 'checkbox')) {
        const selectedValues = Array.isArray(value) ? value : [value];
        control.checked = selectedValues.includes(control.value);
      } else if (value !== undefined) {
        control.value = Array.isArray(value) ? value[0] || '' : value;
      } else if (control instanceof HTMLSelectElement) {
        control.selectedIndex = -1;
      }
    });
  }

  function openPatientModal(row: HTMLTableRowElement | null = null) {
    if (!addPatientModal || !addPatientForm) return;
    editingPatientRow = row;
    addPatientForm.reset();
    if (editingPatientRow) setPatientEditForm(editingPatientRow);
    refreshAllCustomSelects();
    clearPatientValidation();
    updatePatientAge();
    updatePatientConditionals();
    if (editingPatientRow) capturePatientEditRequirements();
    updatePatientProgress();
    const dialog = addPatientModal.querySelector('.resident-modal-dialog');
    dialog?.classList.toggle('resident-edit-mode', Boolean(editingPatientRow));
    if (addPatientModalTitle) {
      addPatientModalTitle.textContent = editingPatientRow ? 'Edit New Patient' : 'Add New Patient';
    }
    if (addPatientModalSubtitle) {
      addPatientModalSubtitle.textContent = editingPatientRow
        ? 'Update the patient information and consultation details.'
        : 'Fill in the details below to register a new patient';
    }
    addPatientModal.classList.add('is-open');
    addPatientModal.setAttribute('aria-hidden', 'false');
    const scrollArea = addPatientForm.querySelector('.resident-form-scroll');
    if (scrollArea) scrollArea.scrollTop = 0;
    const firstField = addPatientForm.querySelector('input:not([type="radio"]):not([type="checkbox"])');
    if (firstField) firstField.focus();
  }

  function closePatientModal() {
    if (!addPatientModal) return;
    if (openCustomSelect) closeCustomSelect(openCustomSelect, false);
    addPatientModal.classList.remove('is-open');
    addPatientModal.setAttribute('aria-hidden', 'true');
    addPatientModal.querySelector('.resident-modal-dialog')?.classList.remove('resident-edit-mode');
    if (addPatientModalTitle) addPatientModalTitle.textContent = 'Add New Patient';
    if (addPatientModalSubtitle) {
      addPatientModalSubtitle.textContent = 'Fill in the details below to register a new patient';
    }
    const returnFocusTarget = editingPatientRow
      ? document.getElementById('btnEditResidentProfile')
      : addPatientButton;
    editingPatientRow = null;
    editingPatientRequiredNames = new Set();
    editingPatientRequiredGroups = new Set();
    if (returnFocusTarget instanceof HTMLElement) returnFocusTarget.focus();
  }

  function getNextPatientNumber() {
    const currentYear = String(new Date().getFullYear()).slice(-2);
    const numbers = initialRows.map(row => {
      const match = row.cells[0] ? row.cells[0].textContent.trim().match(/^PT-(\d{2})-(\d+)$/) : null;
      return match && match[1] === currentYear ? Number(match[2]) : 0;
    });
    let nextNumber = Math.max(0, ...numbers) + 1;
    let patientNumber = `PT-${currentYear}-${String(nextNumber).padStart(6, '0')}`;
    const existingNumbers = new Set(initialRows.map(row => row.cells[0] && row.cells[0].textContent.trim()));
    while (existingNumbers.has(patientNumber)) {
      nextNumber++;
      patientNumber = `PT-${currentYear}-${String(nextNumber).padStart(6, '0')}`;
    }
    return patientNumber;
  }

  function formatConsultationDate(value) {
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    }).format(date);
  }

  function formatProfileDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: '2-digit'
    }).format(date);
  }

  function getProfileAge(birthDate) {
    if (!birthDate) return '';
    const birth = new Date(`${birthDate}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return '';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
      age--;
    }
    return age >= 0 ? String(age) : '';
  }

  function profileForRow(row: HTMLTableRowElement) {
    if (profileRecords.has(row)) return profileRecords.get(row);

    const patientName = row.querySelector('.patient-col-name')?.textContent.trim() || '';
    const nameParts = patientName.split(/\s+/).filter(Boolean);
    const patientNumber = row.cells[0]?.textContent.trim() || '';
    const age = row.cells[3]?.textContent.trim() || '';
    const ageNumber = Number.parseInt(age, 10);
    const sampleBirthYear = Number.isFinite(ageNumber) ? new Date().getFullYear() - ageNumber : '';
    const profile = {
      patientNumber,
      fullName: row.dataset.fullName || patientName,
      firstName: nameParts[0] || '',
      middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
      lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
      sex: row.cells[2]?.textContent.trim() || '',
      age,
      birthDate: sampleBirthYear ? `${sampleBirthYear}-01-01` : '',
      address: row.querySelector('.patient-col-address')?.textContent.trim() || '',
      familySerial: `FSN-${patientNumber.slice(-6)}`,
      contact: '09XX XXX XXXX',
      civilStatus: 'Single',
      philHealthNumber: 'XX-XXXXXXX-X',
      isPwd: '',
      tbReferredBy: 'Public Facility - San Isidro RHU',
      tbScreeningMode: 'Patient-initiated case finding',
      tbScreeningDate: '2025-01-06',
      isDemo: true,
      visits: [{
        date: row.cells[4]?.textContent.trim() || 'September 22, 2026',
        complaint: 'Cough, mild fever',
        vitals: 'BP 110/70 | WT 57 kg | PR 76 bpm | TEMP 36.6°C | SPO2 99% | HT 160 cm',
        diagnosis: 'Upper respiratory tract infection',
        treatment: 'Paracetamol, increased fluids',
        provider: 'BHW John Caesar Antonio'
      }],
      labs: [
        ['Xpert MTB/RIF', '06 Jan 2025', 'MTB detected', 'Rifampicin resistance not detected'],
        ['Smear microscopy / TB LAMP', '06 Jan 2025', 'Positive (1+)', 'Baseline specimen'],
        ['Chest X-ray', '08 Jan 2025', 'Abnormal', 'Suggestive of pulmonary TB'],
        ['Tuberculin skin test', '—', 'Not done', '—'],
        ['Other tests', '—', '—', '—']
      ]
    };
    profileRecords.set(row, profile);
    return profile;
  }

  function appendProfileTableRow(tableBody, values, emptyMessage, columnCount, verticalVitals) {
    if (!tableBody) return;
    tableBody.replaceChildren();
    if (!values.length) {
      const row = document.createElement('tr');
      row.className = 'profile-empty-row';
      const cell = document.createElement('td');
      cell.colSpan = columnCount;
      cell.textContent = emptyMessage;
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    values.forEach(valuesForRow => {
      const row = document.createElement('tr');
      valuesForRow.forEach((value, index) => {
        const cell = document.createElement('td');
        if (verticalVitals && index === 2) {
          cell.classList.add('vitals-cell');
          const vitalsList = document.createElement('div');
          vitalsList.className = 'profile-vitals-list';
          const vitalEntries = String(value || '').split('|').map(entry => entry.trim()).filter(Boolean);

          vitalEntries.forEach(entry => {
            const match = entry.match(/^([A-Za-z0-9₂]+)\s*(.*)$/);
            const vitalRow = document.createElement('div');
            vitalRow.className = 'profile-vital-row';
            const label = document.createElement('strong');
            const valueText = document.createElement('span');
            label.textContent = match ? match[1] : '';
            valueText.textContent = match ? match[2] : entry;
            vitalRow.append(label, valueText);
            vitalsList.appendChild(vitalRow);
          });

          if (!vitalEntries.length) {
            const emptyValue = document.createElement('span');
            emptyValue.textContent = '—';
            vitalsList.appendChild(emptyValue);
          }
          cell.appendChild(vitalsList);
        } else {
          cell.textContent = value || '—';
        }
        row.appendChild(cell);
      });
      tableBody.appendChild(row);
    });
  }

  function renderPatientProfile(row) {
    const profile = profileForRow(row);
    const values = {
      familySerial: profile.familySerial,
      lastName: profile.lastName,
      middleName: profile.middleName,
      firstName: profile.firstName,
      sex: profile.sex,
      birthDate: formatProfileDate(profile.birthDate),
      age: profile.age ? `${profile.age} years old` : '',
      address: profile.address,
      contact: profile.contact,
      civilStatus: profile.civilStatus,
      philHealthNumber: profile.philHealthNumber,
      tbReferredBy: profile.tbReferredBy,
      tbScreeningMode: profile.tbScreeningMode,
      tbScreeningDate: formatProfileDate(profile.tbScreeningDate)
    };

    document.getElementById('profilePatientNumber').textContent = `Patient No. : ${profile.patientNumber}`;
    document.getElementById('profilePatientName').textContent = profile.fullName || 'Resident';
    document.getElementById('profilePatientSex').textContent = profile.sex || '—';
    document.getElementById('profilePatientAge').textContent = profile.age ? `${profile.age} years old` : 'Age not recorded';
    document.getElementById('profilePatientAddress').textContent = profile.address || 'Address not recorded';

    const statusText = row.querySelector('.status-pill span:last-child')?.textContent.trim() || 'Active resident';
    const isCompleted = statusText.toLowerCase() === 'completed';
    const statusBadge = document.getElementById('profilePatientStatus');
    statusBadge.textContent = isCompleted ? 'Completed' : 'Active resident';
    statusBadge.classList.toggle('is-completed', isCompleted);
    document.getElementById('profileLastUpdated').textContent =
      `Last updated: ${row.cells[4]?.textContent.trim() || 'Not recorded'}`;
    document.getElementById('profilePwdBadge').hidden = profile.isPwd !== 'Yes';

    patientProfileView.querySelectorAll('[data-profile-field]').forEach(field => {
      field.textContent = values[field.dataset.profileField] || '—';
    });

    appendProfileTableRow(
      patientProfileVisits,
      (profile.visits || []).map(visit => [
        formatProfileDate(visit.date),
        visit.complaint,
        visit.vitals,
        visit.diagnosis,
        visit.treatment,
        visit.provider
      ]),
      'No consultation history recorded.',
      6,
      true
    );
    appendProfileTableRow(patientProfileLabs, profile.labs || [], 'No laboratory test records available.', 4);
  }

  function openProfileModal(modal) {
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeProfileModal(modal) {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }

  function showPatientProfile(row) {
    if (!patientListView || !patientProfileView || !row) return;
    selectedProfileRow = row;
    renderPatientProfile(row);
    patientListView.hidden = true;
    patientProfileView.hidden = false;
    document.title = 'MHIMS - ResidentCare | Patient Profile';
  }

  function showQueuePatientProfile(patient: ResidentCareQueuePatientDetail) {
    if (!patientListView || !patientProfileView) {
      throw new Error('The ResidentCare patient profile view is unavailable.');
    }

    const row = document.createElement('tr');
    [patient.id, patient.name, patient.gender, String(patient.age), `Queue #${patient.queueNo}`]
      .forEach(value => {
        row.insertCell().textContent = value;
      });
    const statusCell = row.insertCell();
    const statusPill = document.createElement('span');
    statusPill.className = 'status-pill';
    const statusText = document.createElement('span');
    statusText.textContent = patient.status;
    statusPill.appendChild(statusText);
    statusCell.appendChild(statusPill);

    profileRecords.set(row, {
      patientNumber: patient.id,
      fullName: patient.name,
      firstName: '',
      middleName: '',
      lastName: '',
      sex: patient.gender,
      age: String(patient.age),
      birthDate: '',
      address: patient.address,
      familySerial: '',
      contact: '',
      civilStatus: '',
      philHealthNumber: '',
      isPwd: '',
      tbReferredBy: '',
      tbScreeningMode: '',
      tbScreeningDate: '',
      visits: [],
      labs: []
    });

    showPatientProfile(row);
    activateQueueNavigation('ResidentCare');

    const queueStatus = document.getElementById('profilePatientStatus');
    if (queueStatus) queueStatus.textContent = `Queue: ${patient.status}`;
    const lastUpdated = document.getElementById('profileLastUpdated');
    if (lastUpdated) {
      lastUpdated.textContent = `ResidentCare Queue #${String(patient.queueNo).padStart(2, '0')}`;
    }
    const consultationWrap = document.getElementById('profileQueueConsultationWrap');
    const consultationValue = document.getElementById('profileQueueConsultation');
    if (consultationWrap) consultationWrap.hidden = false;
    if (consultationValue) consultationValue.textContent = patient.consultation;
    const editButton = document.getElementById('btnEditResidentProfile');
    if (editButton instanceof HTMLButtonElement) {
      editButton.disabled = true;
      editButton.title = 'This queue profile is view-only until it is linked to a ResidentCare record.';
    }
    const addVisitButton = document.getElementById('btnAddResidentVisit');
    if (addVisitButton instanceof HTMLButtonElement) {
      addVisitButton.disabled = true;
      addVisitButton.title = 'This queue profile is view-only until it is linked to a ResidentCare record.';
    }
  }

  function showPatientList() {
    if (queueReturnUrl) {
      window.location.assign(queueReturnUrl);
      return;
    }
    if (!patientListView || !patientProfileView) return;
    patientProfileView.hidden = true;
    patientListView.hidden = false;
    document.title = 'MHIMS - ResidentCare | General Health & Profiling';
  }

  function saveEditedPatient() {
    const row = editingPatientRow;
    if (!row) return;
    if (!ageInput) throw new Error('The patient age field is unavailable.');
    const profile = profileForRow(row);
    const formValues = collectPatientFormValues();
    const value = (name: string) => String(formValues[name] || '').trim();
    const firstName = value('firstName');
    const middleName = value('middleName');
    const lastName = value('lastName');
    const suffix = value('suffix');
    const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ');
    const displayName = [
      firstName,
      middleName ? `${middleName.charAt(0).toUpperCase()}.` : '',
      lastName,
      suffix
    ].filter(Boolean).join(' ');
    const address = [value('zone'), value('barangay'), value('municipality')].filter(Boolean).join(', ');

    profile.formValues = formValues;
    profile.firstName = firstName;
    profile.middleName = middleName;
    profile.lastName = lastName;
    profile.fullName = fullName;
    profile.sex = value('sex');
    profile.birthDate = value('birthDate');
    profile.age = ageInput.value;
    profile.address = address;
    profile.familySerial = value('familySerial');
    profile.contact = value('contact');
    profile.civilStatus = value('civilStatus');
    profile.philHealthNumber = value('philHealthNumber');
    profile.isPwd = value('isPwd');

    row.dataset.fullName = fullName;
    const nameElement = row.querySelector('.patient-col-name');
    const addressElement = row.querySelector('.patient-col-address');
    if (nameElement) nameElement.textContent = displayName;
    if (addressElement) addressElement.textContent = address;
    if (row.cells[2]) row.cells[2].textContent = profile.sex;
    if (row.cells[3]) row.cells[3].textContent = profile.age;
    if (value('consultationDate') && row.cells[4]) {
      row.cells[4].textContent = formatConsultationDate(value('consultationDate'));
    }

    const statuses: Record<string, { className: string; label: string }> = {
      Monitor: { className: 'monitor', label: 'Monitor' },
      'Under Treatment': { className: 'ongoing-treatment', label: 'Ongoing Treatment' },
      'High Risk': { className: 'high-risk', label: 'High Risk' },
      Resolved: { className: 'completed', label: 'Completed' }
    };
    const status = statuses[value('conditionStatus')];
    if (status && row.cells[5]) {
      const pill = row.cells[5].querySelector('.status-pill');
      if (pill) {
        pill.className = `status-pill ${status.className}`;
        const label = pill.querySelector('span:last-child');
        if (label) label.textContent = status.label;
      }
    }

    const previousVisit = profile.visits?.[0] || {};
    const vitals = [
      value('bloodPressure') ? `BP ${value('bloodPressure')}` : '',
      value('weight') ? `WT ${value('weight')} kg` : '',
      value('pulse') ? `PR ${value('pulse')} bpm` : '',
      value('temperature') ? `TEMP ${value('temperature')} °C` : '',
      value('spo2') ? `SPO2 ${value('spo2')}%` : '',
      value('height') ? `HT ${value('height')} cm` : ''
    ].filter(Boolean).join(' | ');
    profile.visits = [{
      date: value('consultationDate') || previousVisit.date || '',
      complaint: value('chiefComplaints') || previousVisit.complaint || '',
      vitals: vitals || previousVisit.vitals || '',
      diagnosis: value('diagnosis') || previousVisit.diagnosis || '',
      treatment: value('medicationTreatment') || previousVisit.treatment || '',
      provider: value('attendingProvider') || previousVisit.provider || ''
    }, ...(profile.visits || []).slice(1)];

    renderPatientProfile(row);
    filterTable();
    closePatientModal();
    showRecordNotice("updated", "Patient Record is updated");
  }

  function addPatientVisit(form) {
    if (!selectedProfileRow) return;
    const profile = profileForRow(selectedProfileRow);
    const data = new FormData(form);
    const visit = {
      date: String(data.get('date') || ''),
      complaint: String(data.get('complaint') || '').trim(),
      vitals: [
        data.get('weight') ? `WT ${data.get('weight')} kg` : '',
        data.get('height') ? `HT ${data.get('height')} cm` : '',
        data.get('bloodPressure') ? `BP ${data.get('bloodPressure')}` : '',
        data.get('pulse') ? `PR ${data.get('pulse')} bpm` : '',
        data.get('spo2') ? `SPO2 ${data.get('spo2')}%` : '',
        data.get('temperature') ? `TEMP ${data.get('temperature')} °C` : ''
      ].filter(Boolean).join(' | '),
      diagnosis: String(data.get('diagnosis') || '').trim(),
      treatment: String(data.get('treatment') || '').trim(),
      provider: String(data.get('provider') || '').trim()
    };
    profile.visits = profile.visits || [];
    profile.visits.unshift(visit);
    if (selectedProfileRow.cells[4] && visit.date) {
      selectedProfileRow.cells[4].textContent = formatProfileDate(visit.date);
    }
    renderPatientProfile(selectedProfileRow);
    form.reset();
    closeProfileModal(addVisitModal);
    showRecordNotice("created", "A new patient visit has been added.");
  }

  function exportPatientProfile() {
    if (!selectedProfileRow) return;
    const profile = profileForRow(selectedProfileRow);
    const rows = [
      ['Patient No.', profile.patientNumber],
      ['Full Name', profile.fullName],
      ['Gender', profile.sex],
      ['Age', profile.age],
      ['Birthdate', profile.birthDate],
      ['Address', profile.address],
      ['Family Serial Number', profile.familySerial],
      ['Contact Number', profile.contact],
      ['Civil Status', profile.civilStatus],
      ['PhilHealth No.', profile.philHealthNumber],
      ['Data Type', profile.isDemo ? 'Sample data for interface preview only' : 'Resident record']
    ];
    const csv = rows.map(row => row.map(value => `"${String(value || '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(profile.patientNumber || 'resident-profile').replace(/[^a-z0-9_-]/gi, '_')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function createPatientRow() {
    const formData = new FormData(addPatientForm);
    const row = document.createElement('tr');
    const patientNumber = getNextPatientNumber();
    const firstName = String(formData.get('firstName') || '').trim();
    const middleName = String(formData.get('middleName') || '').trim();
    const lastName = String(formData.get('lastName') || '').trim();
    const suffix = String(formData.get('suffix') || '').trim();
    const patientName = [
      firstName,
      middleName,
      lastName,
      suffix
    ].filter(value => String(value || '').trim()).join(' ');
    const patientDisplayName = [
      firstName,
      middleName ? `${middleName.charAt(0).toUpperCase()}.` : '',
      lastName,
      suffix
    ].filter(Boolean).join(' ');
    row.dataset.fullName = patientName;
    const address = `${formData.get('barangay')}, ${formData.get('municipality')}`;
    const initialVisit = {
      date: String(formData.get('consultationDate') || ''),
      complaint: String(formData.get('chiefComplaints') || '').trim(),
      vitals: [
        formData.get('bloodPressure') ? `BP ${formData.get('bloodPressure')}` : '',
        formData.get('weight') ? `WT ${formData.get('weight')} kg` : '',
        formData.get('pulse') ? `PR ${formData.get('pulse')} bpm` : '',
        formData.get('temperature') ? `TEMP ${formData.get('temperature')} °C` : '',
        formData.get('spo2') ? `SPO2 ${formData.get('spo2')}%` : '',
        formData.get('height') ? `HT ${formData.get('height')} cm` : ''
      ].filter(Boolean).join(' | '),
      diagnosis: String(formData.get('diagnosis') || '').trim(),
      treatment: String(formData.get('medicationTreatment') || '').trim(),
      provider: String(formData.get('attendingProvider') || '').trim()
    };
    const newProfile = {
      patientNumber,
      fullName: patientName,
      firstName,
      middleName,
      lastName,
      sex: String(formData.get('sex') || ''),
      age: ageInput.value,
      birthDate: String(formData.get('birthDate') || ''),
      address,
      familySerial: String(formData.get('familySerial') || ''),
      contact: String(formData.get('contact') || ''),
      civilStatus: String(formData.get('civilStatus') || ''),
      philHealthNumber: String(formData.get('philHealthNumber') || ''),
      isPwd: String(formData.get('isPwd') || ''),
      tbReferredBy: '',
      tbScreeningMode: '',
      tbScreeningDate: '',
      isDemo: false,
      labs: [],
      visits: [initialVisit],
      formValues: collectPatientFormValues()
    };
    profileRecords.set(row, newProfile);
    const conditionStatus = formData.get('conditionStatus');
    const statuses = {
      'Monitor': { className: 'monitor', label: 'Monitor' },
      'Under Treatment': { className: 'ongoing-treatment', label: 'Ongoing Treatment' },
      'High Risk': { className: 'high-risk', label: 'High Risk' },
      'Resolved': { className: 'completed', label: 'Completed' }
    };
    const status = statuses[conditionStatus] || statuses.Monitor;

    const patientNumberCell = document.createElement('td');
    patientNumberCell.textContent = patientNumber;
    row.appendChild(patientNumberCell);

    const patientNameCell = document.createElement('td');
    const patientInfo = document.createElement('div');
    patientInfo.className = 'patient-info-col';
    const nameElement = document.createElement('span');
    nameElement.className = 'patient-col-name';
    nameElement.textContent = patientDisplayName;
    const addressElement = document.createElement('span');
    addressElement.className = 'patient-col-address';
    addressElement.textContent = address;
    patientInfo.append(nameElement, addressElement);
    patientNameCell.appendChild(patientInfo);
    row.appendChild(patientNameCell);

    [formData.get('sex'), ageInput.value, formatConsultationDate(formData.get('consultationDate'))]
      .forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.appendChild(cell);
      });

    const statusCell = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = `status-pill ${status.className}`;
    const statusDot = document.createElement('span');
    statusDot.className = 'status-dot';
    const statusText = document.createElement('span');
    statusText.textContent = status.label;
    statusPill.append(statusDot, statusText);
    statusCell.appendChild(statusPill);
    row.appendChild(statusCell);

    const actionCell = document.createElement('td');
    const actionWrapper = document.createElement('div');
    actionWrapper.className = 'view-action-cell';
    const divider = document.createElement('span');
    divider.className = 'view-action-divider';
    divider.textContent = '|';
    const viewLink = document.createElement('a');
    viewLink.href = '#view';
    viewLink.className = 'view-link';
    viewLink.textContent = 'View';
    actionWrapper.append(divider, viewLink);
    actionCell.appendChild(actionWrapper);
    row.appendChild(actionCell);
    return row;
  }

  if (tbody) {
    tbody.addEventListener('click', event => {
      const viewLink = event.target.closest('.view-link');
      if (!viewLink) return;
      event.preventDefault();
      const row = viewLink.closest('tr');
      if (row && !row.classList.contains('empty-table-row')) showPatientProfile(row);
    });
  }

  const backToPatientsButton = document.getElementById('btnBackToPatients');
  if (backToPatientsButton) backToPatientsButton.addEventListener('click', showPatientList);

  const editProfileButton = document.getElementById('btnEditResidentProfile');
  if (editProfileButton) {
    editProfileButton.addEventListener('click', () => {
      if (!selectedProfileRow) return;
      openPatientModal(selectedProfileRow);
    });
  }

  const exportProfileButton = document.getElementById('btnExportResidentProfile');
  if (exportProfileButton) exportProfileButton.addEventListener('click', exportPatientProfile);

  const addVisitButton = document.getElementById('btnAddResidentVisit');
  if (addVisitButton) {
    addVisitButton.addEventListener('click', () => {
      const dateInput = document.getElementById('visitDate');
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      openProfileModal(addVisitModal);
    });
  }

  document.querySelectorAll('[data-close-visit-modal]').forEach(button => {
    button.addEventListener('click', () => closeProfileModal(addVisitModal));
  });
  [addVisitModal].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', event => {
      if (event.target === modal) closeProfileModal(modal);
    });
  });
  if (addVisitForm) {
    addVisitForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!addVisitForm.reportValidity()) return;
      addPatientVisit(addVisitForm);
    });
  }

  if (addPatientButton) {
    addPatientButton.addEventListener('click', () => openPatientModal());
  }
  if (closePatientModalButton) {
    closePatientModalButton.addEventListener('click', closePatientModal);
  }
  if (cancelPatientButton) {
    cancelPatientButton.addEventListener('click', closePatientModal);
  }
  if (addPatientModal) {
    addPatientModal.addEventListener('click', event => {
      if (event.target === addPatientModal) closePatientModal();
    });
  }
  if (addPatientForm) {
    addPatientForm.addEventListener('input', event => {
      const field = event.target.closest('.resident-form-group, .resident-choice-group');
      if (field) field.classList.remove('is-invalid');
      updatePatientAge();
      updatePatientConditionals();
      updatePatientProgress();
    });
    addPatientForm.addEventListener('change', event => {
      const field = event.target.closest('.resident-form-group, .resident-choice-group');
      if (field) field.classList.remove('is-invalid');
      updatePatientAge();
      updatePatientConditionals();
      updatePatientProgress();
    });
    addPatientForm.addEventListener('submit', event => {
      event.preventDefault();
      const invalidControls = getInvalidPatientControls();
      updatePatientProgress();

      if (invalidControls.length) {
        const firstInvalid = invalidControls[0];
        const customSelect = firstInvalid.matches('select')
          ? customSelectControls.find(control => control.select === firstInvalid)
          : null;
        const target = firstInvalid.matches('[data-required-group]')
          ? firstInvalid.querySelector('input')
          : customSelect
            ? customSelect.trigger
            : firstInvalid;
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          target.focus();
        }
        return;
      }

      if (editingPatientRow) {
        saveEditedPatient();
        return;
      }

      if (!tbody) {
        alert('Unable to add this patient because the patient table is unavailable.');
        return;
      }

      const newRow = createPatientRow();
      tbody.appendChild(newRow);
      initialRows.push(newRow);
      filterTable();
      closePatientModal();
      showRecordNotice("created", "New Patient Record is Added to the System");
    });
  }
  if (birthDateInput) {
    birthDateInput.max = new Date().toISOString().slice(0, 10);
  }
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && addPatientModal && addPatientModal.classList.contains('is-open')) {
      closePatientModal();
    }
    if (event.key === 'Escape') {
      closeProfileModal(addVisitModal);
    }
  });

  // Close dropdowns on document click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.filter-dropdown-wrap')) {
      closeAllDropdowns();
    }
  });

  // Notification Bell
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      alert('You have no new clinical notifications at this time.');
    });
  }
  const profileNotifBtn = document.getElementById('profileNotifBtn');
  if (profileNotifBtn) {
    profileNotifBtn.addEventListener('click', () => {
      alert('You have no new clinical notifications at this time.');
    });
  }

  const queuedPatient = consumeResidentCareQueuePatientDetail('ResidentCare');
  if (queuedPatient) {
    queueReturnUrl = queuedPatient.returnUrl;
    showQueuePatientProfile(queuedPatient);
  }

});
