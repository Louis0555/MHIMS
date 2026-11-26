import { showRecordNotice } from "../../shared/record-save-notice";
import { activateQueueNavigation, consumeResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";
import type { ResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - MaternaTrack Patient Records Logic
 * Script: js/clinical/maternatrack/patientrecords.js
 * ==============================================================================
 * Handles:
 *  - Live search / filter on the patient records table
 *  - Filter button active state toggling
 *  - Switch between Patient Records Table View and Full Patient Record View
 *  - Back button navigation
 *  - Edit New Patient Modal with:
 *     - Auto-calculated Age from Birth Date
 *     - Auto-computed BMI from Height & Weight
 *     - Auto-computed EDC, EDD, and AOG from LMP
 *     - Dynamic Previous Pregnancy History based on First Pregnancy = Yes and Gravida
 *     - Strict validation requiring all fields before saving
 *     - Real-time update of patient record view
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // View Containers
  const recordsTableView = document.getElementById('recordsTableView');
  const patientFullView  = document.getElementById('patientFullView');
  const btnBackToRecords = document.getElementById('btnBackToRecords');

  // Full View Display Elements
  const viewPatientId      = document.getElementById('viewPatientId');
  const viewPatientName    = document.getElementById('viewPatientName');
  const viewDetailFullName = document.getElementById('viewDetailFullName');
  const viewAge            = document.getElementById('viewAge');
  const viewDetailAge      = document.getElementById('viewDetailAge');
  const viewGender         = document.getElementById('viewGender');
  const viewZone           = document.getElementById('viewZone');
  const viewDetailAddress  = document.getElementById('viewDetailAddress');
  const viewLmpValue       = document.getElementById('viewLmpValue');
  const viewEddValue       = document.getElementById('viewEddValue');
  const fullviewNotifBtn   = document.getElementById('fullviewNotifBtn');
  const btnExportProfile   = document.getElementById('btnExportProfile');
  const btnEditProfile     = document.getElementById('btnEditProfile');
  // Edit Modal Elements
  const editModal       = document.getElementById('editPatientModal');
  const btnCloseModal   = document.getElementById('btnCloseModal');
  const btnCancelEdit   = document.getElementById('btnCancelEdit');
  const editPatientForm = document.getElementById('editPatientForm');
  const modalProgressSummary = document.getElementById('modalProgressSummary');
  const modalProgressPercent = document.getElementById('modalProgressPercent');
  const modalProgressTrack = document.getElementById('modalProgressTrack');
  const modalProgressBar = document.getElementById('modalProgressBar');
  const modalProgressNote = document.getElementById('modalProgressNote');

  // Edit Form Field Elements
  const editBirthDate = document.getElementById('editBirthDate');
  const editAge       = document.getElementById('editAge');
  const editHeight    = document.getElementById('editHeight');
  const editWeight    = document.getElementById('editWeight');
  const editBMI       = document.getElementById('editBMI');
  const editLMP       = document.getElementById('editLMP');
  const editEDC       = document.getElementById('editEDC');
  const editEDD       = document.getElementById('editEDD');
  const editAOG       = document.getElementById('editAOG');
  const editGravida   = document.getElementById('editGravida');
  const firstPregYes  = document.getElementById('firstPregYes');
  const firstPregNo   = document.getElementById('firstPregNo');

  // Previous Pregnancy Section
  const previousPregnancySection  = document.getElementById('previousPregnancySection');
  const pregnancyCardsContainer   = document.getElementById('pregnancyCardsContainer');

  // State Variables
  let currentViewingName = 'Yoshika Solo Boncodin';
  let currentViewingId   = 'PNT-1021';
  let queueReturnUrl: string | null = null;
  let currentViewingNameParts = {
    firstName: 'Yoshika',
    middleName: 'Solo',
    lastName: 'Boncodin'
  };

  const patientNamePartsByDisplayName = {
    'Chynna T. Flores': { firstName: 'Chynna', middleName: 'Tacmo', lastName: 'Flores' },
    'Cessi R. Antonio': { firstName: 'Cessi', middleName: 'Rosales', lastName: 'Antonio' },
    'Louis L. San Juan': { firstName: 'Louis', middleName: 'Lacuesta', lastName: 'San Juan' },
    'Kristina C. David': { firstName: 'Kristina', middleName: 'Castillo', lastName: 'David' },
    'Shiki S. Rodriguez': { firstName: 'Shiki', middleName: 'Salcedo', lastName: 'Rodriguez' },
    'Kyla R. Bom': { firstName: 'Kyla', middleName: 'Reyes', lastName: 'Bom' },
    'Alexis D. San Juan': { firstName: 'Alexis', middleName: 'Dela Cruz', lastName: 'San Juan' },
    'Kristine C. San Pablo': { firstName: 'Kristine', middleName: 'Cruz', lastName: 'San Pablo' },
    'Maria K. Kanto': { firstName: 'Maria', middleName: 'Katigbak', lastName: 'Kanto' },
    'Tara C. Inom': { firstName: 'Tara', middleName: 'Cabrera', lastName: 'Inom' },
    'Angelica Del Rosario': { firstName: 'Angelica', middleName: '', lastName: 'Del Rosario' },
    'Yoshika S. Boncodin': { firstName: 'Yoshika', middleName: 'Solo', lastName: 'Boncodin' }
  };

  function getFullPatientName(displayName) {
    const nameParts = patientNamePartsByDisplayName[displayName];
    return nameParts
      ? [nameParts.firstName, nameParts.middleName, nameParts.lastName].filter(Boolean).join(' ')
      : displayName;
  }

  function updateModalProgress() {
    if (!editPatientForm) return;

    const groups = [
      { id: 'patient-info', label: 'Patient Information' },
      { id: 'history', label: 'History' },
      { id: 'previous-pregnancy', label: 'Previous Pregnancy History' }
    ];
    const sectionStatuses = groups.map(group => {
      const section = editPatientForm.querySelector(`.modal-form-section[data-progress-group="${group.id}"]`);
      if (!section) return { ...group, complete: false };

      if (group.id === 'previous-pregnancy') {
        if (firstPregYes && firstPregYes.checked) return { ...group, complete: true };
        if (!firstPregNo || !firstPregNo.checked || !editGravida || !editGravida.value.trim()) {
          return { ...group, complete: false };
        }

        const gravida = Number(editGravida.value);
        if (!Number.isFinite(gravida)) return { ...group, complete: false };
        if (gravida <= 0) return { ...group, complete: true };
        if (!previousPregnancySection || previousPregnancySection.style.display === 'none') {
          return { ...group, complete: false };
        }

        const pregnancyRequirements = new Map();
        previousPregnancySection.querySelectorAll('input[required], select[required], textarea[required]').forEach(control => {
          const key = control.type === 'radio' ? `radio:${control.name}` : control;
          if (!pregnancyRequirements.has(key)) pregnancyRequirements.set(key, control);
        });

        const requirements = [...pregnancyRequirements.values()];
        const complete = requirements.length > 0 && requirements.every(control => {
          if (control.type === 'radio') {
            return [...previousPregnancySection.querySelectorAll('input[type="radio"]')]
              .some(radio => radio.name === control.name && radio.checked);
          }
          return Boolean(control.value && control.value.trim());
        });
        return { ...group, complete };
      }

      const requiredByKey = new Map();
      section.querySelectorAll('input[required], select[required], textarea[required]').forEach(control => {
        if (control.closest('[style*="display: none"]')) return;

        const key = control.type === 'radio' ? `radio:${control.name}` : control;
        if (!requiredByKey.has(key)) requiredByKey.set(key, control);
      });

      const requirements = [...requiredByKey.values()];
      const complete = requirements.every(control => {
        if (control.type === 'radio') {
          return [...section.querySelectorAll('input[type="radio"]')]
            .some(radio => radio.name === control.name && radio.checked);
        }
        return Boolean(control.value && control.value.trim());
      });

      return { ...group, complete };
    });

    const completedSections = sectionStatuses.filter(section => section.complete).length;
    const remainingGroups = sectionStatuses.filter(section => !section.complete).map(section => section.label);
    const percent = Math.round((completedSections / groups.length) * 100);
    const remainingCount = remainingGroups.length;

    if (modalProgressSummary) {
      modalProgressSummary.textContent = `${completedSections} of ${groups.length} sections complete`;
    }
    if (modalProgressPercent) modalProgressPercent.textContent = `${percent}%`;
    if (modalProgressTrack) modalProgressTrack.setAttribute('aria-valuenow', String(percent));
    if (modalProgressBar) modalProgressBar.style.width = `${percent}%`;
    if (modalProgressNote) {
      modalProgressNote.textContent = remainingCount
        ? `${remainingCount} ${remainingCount === 1 ? 'section' : 'sections'} left: ${remainingGroups.join(', ')}`
        : 'All sections complete';
    }
  }

  // ─── Custom Select Dropdown Logic (filter-button style) ─────────────────────

  const custSelectWraps = document.querySelectorAll('.cust-select-wrap');

  /**
   * Close all custom select menus
   */
  function closeAllCustSelects(except) {
    custSelectWraps.forEach(wrap => {
      if (wrap !== except) {
        wrap.classList.remove('open');
        const menu = wrap.querySelector('.cust-select-menu');
        const btn  = wrap.querySelector('.cust-select-btn');
        if (menu) menu.classList.remove('show');
        if (btn)  btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /**
   * Set a custom select value by wrap ID and value string
   * @param {string} wrapId - e.g. 'bloodTypeWrap'
   * @param {string} value  - the data-value to select
   */
  function setCustSelect(wrapId, value) {
    const wrap = document.getElementById(wrapId);
    if (!wrap) return;
    const txtEl   = wrap.querySelector('.cust-select-text');
    const hidden  = wrap.querySelector('input[type="hidden"]');
    const items   = wrap.querySelectorAll('.cust-select-item');

    items.forEach(item => item.classList.remove('selected'));

    if (!value) {
      if (txtEl) { txtEl.textContent = 'Auto-Filled'; txtEl.classList.add('placeholder'); }
      if (hidden) hidden.value = '';
      return;
    }

    const match = [...items].find(i => i.getAttribute('data-value') === value);
    if (match) {
      match.classList.add('selected');
      if (txtEl)  { txtEl.textContent = value; txtEl.classList.remove('placeholder'); }
      if (hidden) hidden.value = value;
    }
  }

  /**
   * Initialize each custom select wrap
   */
  custSelectWraps.forEach(wrap => {
    const btn  = wrap.querySelector('.cust-select-btn');
    const menu = wrap.querySelector('.cust-select-menu');
    if (!btn || !menu) return;

    // Initialize placeholder styling
    const txtEl = wrap.querySelector('.cust-select-text');
    if (txtEl && (!txtEl.textContent.trim() || txtEl.textContent.trim() === 'Auto-Filled')) {
      txtEl.classList.add('placeholder');
    }

    // Toggle open on button click
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('open');
      closeAllCustSelects(wrap);
      if (!isOpen) {
        wrap.classList.add('open');
        menu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        wrap.classList.remove('open');
        menu.classList.remove('show');
        btn.setAttribute('aria-expanded', 'false');
      }
    });

    // Select item on click
    menu.querySelectorAll('.cust-select-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value  = item.getAttribute('data-value');
        const txtEl  = wrap.querySelector('.cust-select-text');
        const hidden = wrap.querySelector('input[type="hidden"]');

        // Mark selected
        menu.querySelectorAll('.cust-select-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');

        // Update button text
        if (txtEl) { txtEl.textContent = value; txtEl.classList.remove('placeholder'); }
        if (hidden) { hidden.value = value; hidden.dispatchEvent(new Event('change')); }
        updateModalProgress();

        // Remove invalid state
        wrap.classList.remove('is-invalid');

        closeAllCustSelects();
      });
    });
  });

  // Close all custom selects on outside click
  document.addEventListener('click', () => closeAllCustSelects());

  // Search & Filter Elements
  // Search & Filter Elements (ResidentCare-Style)
  const searchInput          = document.getElementById('patientSearchInput');
  const table                = document.getElementById('patientsTable');
  const tbody                = table ? table.querySelector('tbody') : null;
  const rows                 = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
  const btnFilterAll         = document.getElementById('btnFilterAll');

  const trimesterDropdownWrap = document.getElementById('trimesterDropdownWrap');
  const trimesterDropdownBtn  = document.getElementById('trimesterDropdownBtn');
  const trimesterDropdownMenu = document.getElementById('trimesterDropdownMenu');

  const riskDropdownWrap      = document.getElementById('riskDropdownWrap');
  const riskDropdownBtn       = document.getElementById('riskDropdownBtn');
  const riskDropdownMenu      = document.getElementById('riskDropdownMenu');

  const barangayDropdownWrap  = document.getElementById('barangayDropdownWrap');
  const barangayDropdownBtn   = document.getElementById('barangayDropdownBtn');
  const barangayDropdownMenu  = document.getElementById('barangayDropdownMenu');

  // Filter State
  const activeFilters = {
    trimester: null,
    riskLevel: null,
    barangay: null,
    query: ''
  };

  /**
   * Filter the table rows according to activeFilters and search query
   */
  function applyFilters() {
    activeFilters.query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    rows.forEach(row => {
      const rowText = row.textContent.toLowerCase();
      const matchesSearch = !activeFilters.query || rowText.includes(activeFilters.query);

      // 1. Trimester Filter Check
      let matchesTrimester = true;
      if (activeFilters.trimester) {
        const trimesterCell = row.cells[3] ? row.cells[3].textContent.trim().toLowerCase() : '';
        matchesTrimester = trimesterCell.includes(activeFilters.trimester.toLowerCase());
      }

      // 2. Risk Level Filter Check
      let matchesRisk = true;
      if (activeFilters.riskLevel) {
        const riskPill = row.querySelector('.risk-pill');
        const riskText = riskPill ? riskPill.textContent.trim().toLowerCase() : '';
        matchesRisk = riskText.includes(activeFilters.riskLevel.toLowerCase());
      }

      // 3. Barangay Filter Check
      let matchesBarangay = true;
      if (activeFilters.barangay) {
        const addressEl = row.querySelector('.patient-col-address');
        const address = (addressEl ? addressEl.textContent : rowText).toLowerCase();
        const targetBarangay = activeFilters.barangay.toLowerCase();
        if (targetBarangay === 'gugon') {
          matchesBarangay = address.includes('gugon') || address.includes('gogon');
        } else {
          matchesBarangay = address.includes(targetBarangay);
        }
      }

      if (matchesSearch && matchesTrimester && matchesRisk && matchesBarangay) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Empty state
    if (tbody) {
      let emptyRow = tbody.querySelector('.empty-table-row');
      if (visibleCount === 0) {
        if (!emptyRow) {
          emptyRow = document.createElement('tr');
          emptyRow.className = 'empty-table-row';
          emptyRow.innerHTML = `<td colspan="6" style="text-align: center; padding: 24px; color: #64748b;">No patient records found matching the selected filters.</td>`;
          tbody.appendChild(emptyRow);
        }
        emptyRow.style.display = '';
      } else if (emptyRow) {
        emptyRow.style.display = 'none';
      }
    }
  }

  function closeAllDropdowns() {
    [trimesterDropdownWrap, riskDropdownWrap, barangayDropdownWrap].forEach(wrap => {
      if (wrap) {
        wrap.classList.remove('open');
        const menu = wrap.querySelector('.filter-dropdown-menu');
        const btn = wrap.querySelector('.filter-btn');
        if (menu) menu.classList.remove('show');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function updateAllBtnState() {
    const hasAnyFilter = Boolean(activeFilters.trimester || activeFilters.riskLevel || activeFilters.barangay);
    if (btnFilterAll) {
      if (hasAnyFilter) {
        btnFilterAll.classList.remove('active');
      } else {
        btnFilterAll.classList.add('active');
      }
    }
  }

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

        if (activeFilters[filterKey] === value) {
          activeFilters[filterKey] = null;
          item.classList.remove('selected');
          btn.classList.remove('has-filter');
          if (labelSpan) labelSpan.textContent = defaultLabel;
        } else {
          activeFilters[filterKey] = value;
          menu.querySelectorAll('.filter-menu-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          btn.classList.add('has-filter');
          if (labelSpan) labelSpan.textContent = value;
        }

        updateAllBtnState();
        closeAllDropdowns();
        applyFilters();
      });
    });
  }

  setupDropdown(trimesterDropdownWrap, trimesterDropdownBtn, trimesterDropdownMenu, 'trimester', 'Trimester');
  setupDropdown(riskDropdownWrap, riskDropdownBtn, riskDropdownMenu, 'riskLevel', 'Risk Level');
  setupDropdown(barangayDropdownWrap, barangayDropdownBtn, barangayDropdownMenu, 'barangay', 'Barangay');

  if (btnFilterAll) {
    btnFilterAll.addEventListener('click', () => {
      activeFilters.trimester = null;
      activeFilters.riskLevel = null;
      activeFilters.barangay = null;

      if (trimesterDropdownBtn) {
        const text = trimesterDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Trimester';
        trimesterDropdownBtn.classList.remove('has-filter');
      }
      if (riskDropdownBtn) {
        const text = riskDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Risk Level';
        riskDropdownBtn.classList.remove('has-filter');
      }
      if (barangayDropdownBtn) {
        const text = barangayDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Barangay';
        barangayDropdownBtn.classList.remove('has-filter');
      }

      document.querySelectorAll('.filter-dropdown-menu .filter-menu-item').forEach(item => item.classList.remove('selected'));
      updateAllBtnState();
      applyFilters();
    });
  }

  document.addEventListener('click', closeAllDropdowns);

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // ─── Switch to Full Patient Record View ───────────────────────────────────
  function openPatientFullView(patientData) {
    const fullName = patientData.fullName || patientData.name;
    currentViewingName = fullName;
    currentViewingNameParts = patientData.nameParts || null;
    currentViewingId = patientData.id || 'PNT-1021';

    const riskPill = patientFullView?.querySelector<HTMLElement>('.patient-badges-row .risk-pill');
    if (riskPill) {
      const riskClasses = ['low-risk', 'medium-risk', 'high-risk'];
      const riskLabel = riskPill.querySelector<HTMLElement>('span:last-child');
      riskPill.classList.remove(...riskClasses);
      if (riskClasses.includes(patientData.riskClass)) {
        riskPill.classList.add(patientData.riskClass);
      }
      if (riskLabel) riskLabel.textContent = patientData.riskLevel || 'Risk unavailable';
    }

    if (viewPatientId) {
      viewPatientId.textContent = `Patient No. : ${currentViewingId}`;
    }
    if (viewPatientName) {
      viewPatientName.textContent = fullName;
    }
    if (viewDetailFullName) {
      viewDetailFullName.textContent = fullName;
    }
    if (viewAge && patientData.age) {
      viewAge.textContent = `${patientData.age} years old`;
    }
    if (viewDetailAge && patientData.age) {
      viewDetailAge.textContent = `${patientData.age} years old`;
    }
    if (viewZone && patientData.address) {
      viewZone.textContent = patientData.address.includes('Zone')
        ? patientData.address
        : `Zone 2, ${patientData.address}`;
    }
    if (viewDetailAddress && patientData.address) {
      viewDetailAddress.textContent = patientData.address.includes('Camarines Sur')
        ? patientData.address
        : `Zone 2, ${patientData.address}, Camarines Sur`;
    }

    const mainContent = document.querySelector('.main-content');
    if (recordsTableView) recordsTableView.style.display = 'none';
    if (patientFullView) {
      patientFullView.style.display = 'flex';
    }
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }

  function showQueuePatientDetails(patient: ResidentCareQueuePatientDetail) {
    openPatientFullView({
      id: patient.id,
      name: patient.name,
      fullName: patient.name,
      age: patient.age,
      address: patient.address
    });

    if (viewGender) viewGender.textContent = patient.gender;
    const root = patientFullView;
    if (!root) throw new Error('The MaternaTrack patient detail view is unavailable.');

    const providedFields = new Set(['viewDetailFullName', 'viewDetailGender', 'viewDetailAge', 'viewDetailAddress']);
    root.querySelectorAll<HTMLElement>('.field-value-box').forEach(field => {
      if (providedFields.has(field.id)) return;
      const nestedDate = field.querySelector<HTMLElement>('#viewLmpValue, #viewEddValue');
      if (nestedDate) {
        nestedDate.textContent = '—';
        return;
      }
      const labelledValue = field.querySelector<HTMLElement>('strong');
      if (field.querySelector('span') && labelledValue) {
        labelledValue.textContent = '—';
        return;
      }
      field.textContent = '—';
    });
    root.querySelectorAll<HTMLElement>('.gtpal-value').forEach(field => {
      field.textContent = '—';
    });
    const pregnancyCount = root.querySelector<HTMLElement>('#viewPregnancyCount');
    if (pregnancyCount) pregnancyCount.textContent = '—';
    const riskLabel = root.querySelector<HTMLElement>('.risk-pill span:last-child');
    if (riskLabel) riskLabel.textContent = '—';
    const trimesterLabel = root.querySelector<HTMLElement>('.trimester-pill');
    if (trimesterLabel) trimesterLabel.textContent = '—';
    const riskFactors = root.querySelector<HTMLElement>('.risk-factors-banner span');
    if (riskFactors) riskFactors.textContent = '—';
    const personalHistory = root.querySelector<HTMLElement>('.history-empty');
    if (personalHistory) personalHistory.textContent = '—';
    const familyHistory = root.querySelector<HTMLElement>('.history-cards-wrap');
    if (familyHistory) familyHistory.textContent = '—';
    const queueStatus = root.querySelector<HTMLElement>('.resident-active-pill span');
    if (queueStatus) queueStatus.textContent = `Queue: ${patient.status}`;
    const lastUpdated = root.querySelector<HTMLElement>('.last-updated-text');
    if (lastUpdated) {
      lastUpdated.textContent = `Queue #${String(patient.queueNo).padStart(2, '0')} · ${patient.consultation}`;
    }
    if (btnEditProfile instanceof HTMLButtonElement) {
      btnEditProfile.disabled = true;
      btnEditProfile.title = 'This queue profile is view-only until it is linked to a MaternaTrack record.';
    }
    activateQueueNavigation('Materna');
  }

  // ─── Switch back to Table View ────────────────────────────────────────────
  function backToTableView() {
    if (queueReturnUrl) {
      window.location.assign(queueReturnUrl);
      return;
    }

    const mainContent = document.querySelector('.main-content');
    if (patientFullView) patientFullView.style.display = 'none';
    if (recordsTableView) {
      recordsTableView.style.display = '';
    }
    if (mainContent) {
      mainContent.scrollTop = 0;
    }
  }

  // Bind View links on all table rows
  document.querySelectorAll('.view-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tr = link.closest('tr');
      if (!tr) return;

      const pId = tr.cells[0]?.textContent.trim() || 'PNT-1021';
      const nameEl = tr.querySelector('.patient-col-name');
      const addressEl = tr.querySelector('.patient-col-address');
      const pName = nameEl ? nameEl.textContent.trim() : 'Yoshika Solo Boncodin';
      const pAddress = addressEl ? addressEl.textContent.trim() : 'San Mateo, Camaligan';
      const pAge = tr.cells[2]?.textContent.trim() || '20';
      const nameParts = patientNamePartsByDisplayName[pName] || null;
      const riskPill = tr.querySelector<HTMLElement>('.risk-pill');
      const riskClass = riskPill && ['low-risk', 'medium-risk', 'high-risk']
        .find(className => riskPill.classList.contains(className));

      openPatientFullView({
        id: pId.replace('PT-26-', 'PNT-') || 'PNT-1021',
        name: pName,
        fullName: getFullPatientName(pName),
        nameParts,
        address: pAddress,
        age: pAge,
        riskLevel: riskPill?.textContent.trim(),
        riskClass
      });
    });
  });

  // Bind Back button
  if (btnBackToRecords) {
    btnBackToRecords.addEventListener('click', backToTableView);
  }

  const queuedPatient = consumeResidentCareQueuePatientDetail('Materna');
  if (queuedPatient) {
    queueReturnUrl = queuedPatient.returnUrl;
    showQueuePatientDetails(queuedPatient);
  }

  // Bind Export button
  if (btnExportProfile) {
    btnExportProfile.addEventListener('click', () => {
      window.print();
    });
  }

  // Bind Full View Notification Bell
  if (fullviewNotifBtn) {
    fullviewNotifBtn.addEventListener('click', () => {
      alert('You have no new clinical notifications at this time.');
    });
  }

  // ==========================================================================
  // EDIT PROFILE MODAL LOGIC & AUTO-CALCULATIONS
  // ==========================================================================

  /**
   * 1. Calculate Age from Birth Date
   */
  function updateCalculatedAge() {
    if (!editBirthDate || !editAge) return;
    const bDateVal = editBirthDate.value;
    if (!bDateVal) {
      editAge.value = '';
      return;
    }

    const birthDate = new Date(bDateVal);
    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      years--;
    }

    if (years >= 0 && !isNaN(years)) {
      editAge.value = `${years} years old`;
      editAge.classList.remove('is-invalid');
    } else {
      editAge.value = '';
    }
  }

  if (editBirthDate) {
    editBirthDate.addEventListener('input', updateCalculatedAge);
    editBirthDate.addEventListener('change', updateCalculatedAge);
  }

  /**
   * 2. Calculate BMI from Height (cm) & Weight (kg)
   */
  function updateCalculatedBMI() {
    if (!editHeight || !editWeight || !editBMI) return;
    const h = parseFloat(editHeight.value);
    const w = parseFloat(editWeight.value);

    if (h > 0 && w > 0) {
      const heightM = h / 100;
      const bmi = w / (heightM * heightM);
      let category = 'Normal';
      if (bmi < 18.5) category = 'Underweight';
      else if (bmi < 25) category = 'Normal';
      else if (bmi < 30) category = 'Overweight';
      else category = 'Obese';

      editBMI.value = category; // As shown in Screenshot ("Normal")
      editBMI.classList.remove('is-invalid');
    } else {
      editBMI.value = '';
    }
  }

  if (editHeight) {
    editHeight.addEventListener('input', updateCalculatedBMI);
  }
  if (editWeight) {
    editWeight.addEventListener('input', updateCalculatedBMI);
  }

  /**
   * 3 & 4. Calculate EDC, EDD, and AOG from LMP
   */
  function updateCalculatedPregnancyDates() {
    if (!editLMP) return;
    const lmpVal = editLMP.value;
    if (!lmpVal) {
      if (editEDC) editEDC.value = '';
      if (editEDD) editEDD.value = '';
      if (editAOG) editAOG.value = '';
      return;
    }

    const lmpDate = new Date(lmpVal);
    if (isNaN(lmpDate.getTime())) return;

    // EDC & EDD: Naegele's rule (LMP + 280 days)
    const eddDate = new Date(lmpDate);
    eddDate.setDate(eddDate.getDate() + 280);

    const mm = String(eddDate.getMonth() + 1).padStart(2, '0');
    const dd = String(eddDate.getDate()).padStart(2, '0');
    const yyyy = eddDate.getFullYear();
    const formattedDate = `${mm}/${dd}/${yyyy}`;

    if (editEDC) editEDC.value = formattedDate;
    if (editEDD) editEDD.value = formattedDate;

    // AOG / Gestational Age: Elapsed time from LMP
    const today = new Date();
    const diffTime = today - lmpDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 0) {
      const weeks = Math.floor(diffDays / 7);
      const days = diffDays % 7;
      if (editAOG) editAOG.value = `${weeks} weeks and ${days} day${days === 1 ? '' : 's'}`;
    } else {
      if (editAOG) editAOG.value = '0 weeks and 0 days';
    }
  }

  if (editLMP) {
    editLMP.addEventListener('input', updateCalculatedPregnancyDates);
    editLMP.addEventListener('change', updateCalculatedPregnancyDates);
  }

  /**
   * 5. First Pregnancy & Dynamic Previous Pregnancy Cards
   * - If First Pregnancy = "yes": it IS their first pregnancy -> previous pregnancy history WILL NOT appear.
   * - If First Pregnancy = "no": it is NOT their first pregnancy -> previous pregnancy history WILL appear,
   *   with cards generated based on the Gravida input value. If Gravida is 0, none will appear.
   */
  function updatePregnancyHistorySection() {
    if (!previousPregnancySection || !pregnancyCardsContainer) return;

    const isFirstPregNo = firstPregNo && firstPregNo.checked;

    if (!isFirstPregNo) {
      // If "Yes" is selected or neither is selected -> Hide previous pregnancy history
      previousPregnancySection.style.display = 'none';
      pregnancyCardsContainer.innerHTML = '';
      return;
    }

    // When "No" is selected: check Gravida count
    let count = parseInt(editGravida ? editGravida.value : 0, 10);
    if (isNaN(count) || count <= 0) {
      previousPregnancySection.style.display = 'none';
      pregnancyCardsContainer.innerHTML = '';
      return;
    }

    // Show section and generate count cards
    previousPregnancySection.style.display = 'flex';
    pregnancyCardsContainer.innerHTML = '';

    for (let i = 1; i <= count; i++) {
      const card = document.createElement('div');
      card.className = 'pregnancy-history-card-item';
      card.innerHTML = `
        <div class="pregnancy-divider-banner">PREGNANCY #${i}</div>

        <div class="form-row col-3">
          <div class="form-group">
            <label class="form-label">Date of Delivery <span class="req-star">*</span></label>
            <input type="date" name="preg_${i}_delivery_date" class="form-input" required>
          </div>
        </div>

        <div class="form-row col-3">
          <div class="form-group">
            <label class="form-label">Type of Delivery <span class="req-star">*</span></label>
            <select name="preg_${i}_delivery_type" class="form-select" required>
              <option value="" disabled selected>Normal / Caesarean Delivery</option>
              <option value="Normal Delivery">Normal Delivery</option>
              <option value="Caesarean Delivery">Caesarean Delivery</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Birth Outcome <span class="req-star">*</span></label>
            <select name="preg_${i}_birth_outcome" class="form-select" required>
              <option value="" disabled selected>Alive / Miscarriage / Stillbirth</option>
              <option value="Alive">Alive</option>
              <option value="Miscarriage">Miscarriage</option>
              <option value="Stillbirth">Stillbirth</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Number of Children Delivered <span class="req-star">*</span></label>
            <select name="preg_${i}_children_count" class="form-select" required>
              <option value="" disabled selected>Single / Twins / Multiple Birth</option>
              <option value="Single Birth">Single Birth</option>
              <option value="Twins">Twins</option>
              <option value="Multiple Birth">Multiple Birth</option>
            </select>
          </div>
        </div>

        <div class="preg-complications-group">
          <label class="form-label">PREGNANCY-RELATED CONDITIONS/COMPLICATIONS</label>

          <div class="preg-complication-item">
            <span>Pregnancy Induced Hypertension <span class="req-star">*</span></span>
            <div class="radio-inline-group">
              <label class="radio-option"><input type="radio" name="preg_${i}_pih" value="yes" required> Yes</label>
              <label class="radio-option"><input type="radio" name="preg_${i}_pih" value="no" required checked> No</label>
            </div>
          </div>

          <div class="preg-complication-item">
            <span>Pre-eclampsia / Eclampsia <span class="req-star">*</span></span>
            <div class="radio-inline-group">
              <label class="radio-option"><input type="radio" name="preg_${i}_preeclampsia" value="yes" required> Yes</label>
              <label class="radio-option"><input type="radio" name="preg_${i}_preeclampsia" value="no" required checked> No</label>
            </div>
          </div>

          <div class="preg-complication-item">
            <span>Bleeding during pregnancy or after delivery <span class="req-star">*</span></span>
            <div class="radio-inline-group">
              <label class="radio-option"><input type="radio" name="preg_${i}_bleeding" value="yes" required> Yes</label>
              <label class="radio-option"><input type="radio" name="preg_${i}_bleeding" value="no" required checked> No</label>
            </div>
          </div>
        </div>
      `;
      pregnancyCardsContainer.appendChild(card);
    }
  }

  if (firstPregYes) {
    firstPregYes.addEventListener('change', updatePregnancyHistorySection);
  }
  if (firstPregNo) {
    firstPregNo.addEventListener('change', updatePregnancyHistorySection);
  }
  if (editGravida) {
    editGravida.addEventListener('input', () => {
      if (firstPregNo && firstPregNo.checked) {
        updatePregnancyHistorySection();
      }
    });
  }

  /**
   * Pre-fill modal with current patient's data
   */
  function populateModalData() {
    const editPatientNo    = document.getElementById('editPatientNo');
    const editFamilySerial = document.getElementById('editFamilySerial');
    const editLastName     = document.getElementById('editLastName');
    const editFirstName    = document.getElementById('editFirstName');
    const editMiddleName   = document.getElementById('editMiddleName');
    const editContact      = document.getElementById('editContact');
    const editZone         = document.getElementById('editZone');

    if (editPatientNo)    editPatientNo.value    = currentViewingId || 'PNT-1021';
    if (editFamilySerial) editFamilySerial.value = 'FSN-0000';

    if (currentViewingName === 'Yoshika Solo Boncodin') {
      if (editLastName)   editLastName.value   = 'Boncodin';
      if (editFirstName)  editFirstName.value  = 'Yoshika';
      if (editMiddleName) editMiddleName.value = 'Solo';
      if (editBirthDate)  editBirthDate.value  = '2006-10-25';
      if (editHeight)     editHeight.value     = '180';
      if (editWeight)     editWeight.value     = '70';
      if (editContact)    editContact.value    = '09123456788';
      if (editZone)       editZone.value       = 'Zone 2';
      if (editLMP)        editLMP.value        = '2026-09-04';
      if (editGravida)    editGravida.value    = '1';
      if (firstPregNo)    firstPregNo.checked  = true;
      // Custom selects
      setCustSelect('bloodTypeWrap',   'AB +');
      setCustSelect('civilStatusWrap', 'Married');
      setCustSelect('barangayWrap',    'San Mateo');
    } else {
      const parts = currentViewingNameParts || (() => {
        const nameParts = currentViewingName.split(' ');
        return {
          firstName: nameParts[0] || '',
          middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
          lastName: nameParts[nameParts.length - 1] || ''
        };
      })();
      if (editFirstName)  editFirstName.value  = parts.firstName;
      if (editLastName)   editLastName.value   = parts.lastName;
      if (editMiddleName) editMiddleName.value = parts.middleName;
      if (editBirthDate)  editBirthDate.value  = '2004-05-14';
      if (editHeight)     editHeight.value     = '162';
      if (editWeight)     editWeight.value     = '58';
      if (editContact)    editContact.value    = '09987654321';
      if (editZone)       editZone.value       = 'Zone 1';
      if (editLMP)        editLMP.value        = '2026-08-10';
      if (editGravida)    editGravida.value    = '0';
      if (firstPregYes)   firstPregYes.checked = true;
      // Custom selects
      setCustSelect('bloodTypeWrap',   'O +');
      setCustSelect('civilStatusWrap', 'Single');
      setCustSelect('barangayWrap',    'San Marcos');
    }

    // Trigger auto-calculations
    updateCalculatedAge();
    updateCalculatedBMI();
    updateCalculatedPregnancyDates();
    updatePregnancyHistorySection();
  }

  // Open Edit Modal
  if (btnEditProfile) {
    btnEditProfile.addEventListener('click', () => {
      populateModalData();
      if (editModal) {
        editModal.style.display = 'flex';
        updateModalProgress();
      }
    });
  }

  // Close Edit Modal
  function closeModal() {
    if (editModal) editModal.style.display = 'none';
    // Clear validation error highlights
    if (editPatientForm) {
      editPatientForm.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }
  }

  if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
  if (btnCancelEdit) btnCancelEdit.addEventListener('click', closeModal);

  // Close on outside backdrop click
  if (editModal) {
    editModal.addEventListener('click', (e) => {
      if (e.target === editModal) {
        closeModal();
      }
    });
  }

  // Remove invalid state when user inputs
  if (editPatientForm) {
    editPatientForm.addEventListener('input', (e) => {
      if (e.target.classList.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
      }
      updateModalProgress();
    });
    editPatientForm.addEventListener('change', (e) => {
      if (e.target.classList.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
      }
      updateModalProgress();
    });
  }

  /**
   * 6. Form Submission & Validation (All visible fields required)
   */
  if (editPatientForm) {
    editPatientForm.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      let firstInvalidEl = null;

      // Validate all required inputs inside visible sections
      const requiredInputs = editPatientForm.querySelectorAll('input[required], select[required]');

      requiredInputs.forEach(input => {
        // Skip inputs that are inside a hidden parent
        if (input.closest('[style*="display: none"]')) {
          return;
        }

        if (input.type === 'radio') {
          const groupName = input.name;
          const checkedRadio = editPatientForm.querySelector(`input[name="${groupName}"]:checked`);
          if (!checkedRadio) {
            isValid = false;
            input.classList.add('is-invalid');
            if (!firstInvalidEl) firstInvalidEl = input;
          }
        } else if (!input.value || input.value.trim() === '') {
          isValid = false;
          input.classList.add('is-invalid');
          if (!firstInvalidEl) firstInvalidEl = input;
        } else {
          input.classList.remove('is-invalid');
        }
      });

      if (!isValid) {
        if (firstInvalidEl) {
          firstInvalidEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalidEl.focus();
        }
        alert('Please fill out all required fields before saving the record.');
        return;
      }

      // Successful update
      const editFirstNameVal = document.getElementById('editFirstName')?.value || '';
      const editMiddleNameVal = document.getElementById('editMiddleName')?.value || '';
      const editLastNameVal = document.getElementById('editLastName')?.value || '';
      const updatedFullName = `${editFirstNameVal} ${editMiddleNameVal ? editMiddleNameVal + ' ' : ''}${editLastNameVal}`.trim();
      currentViewingNameParts = {
        firstName: editFirstNameVal,
        middleName: editMiddleNameVal,
        lastName: editLastNameVal
      };

      const updatedAge = editAge ? editAge.value : '';
      const editZoneVal = document.getElementById('editZone')?.value || 'Zone 2';
      const editBarangayVal = document.getElementById('editBarangay')?.value || 'San Mateo';

      // Update Full View Banner
      if (viewPatientName) viewPatientName.textContent = updatedFullName;
      if (viewDetailFullName) viewDetailFullName.textContent = updatedFullName;
      if (viewAge && updatedAge) viewAge.textContent = updatedAge;
      if (viewDetailAge && updatedAge) viewDetailAge.textContent = updatedAge;
      if (viewZone) viewZone.textContent = `${editZoneVal}, ${editBarangayVal} Camaligan`;
      if (viewDetailAddress) viewDetailAddress.textContent = `${editZoneVal}, ${editBarangayVal}, Camaligan, Camarines Sur`;
      if (editLMP && viewLmpValue) {
        const [year, month, day] = editLMP.value.split('-');
        viewLmpValue.textContent = `${month}/${day}/${year}`;
      }
      if (editEDD && viewEddValue) viewEddValue.textContent = editEDD.value;

      currentViewingName = updatedFullName;

      closeModal();
      showRecordNotice('updated', 'Patient Record is updated');
    });
  }

});
