import { showRecordNotice } from "../../shared/record-save-notice";
import { activateQueueNavigation, consumeResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";
import type { ResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - NutriTrack Child Records Logic
 * Script: js/clinical/nutritrack/childrecords.js
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // View Containers
  const recordsTableView = document.getElementById('recordsTableView');
  const patientFullView  = document.getElementById('patientFullView');
  const btnBackToRecords = document.getElementById('btnBackToRecords');

  // Table Elements
  const table = document.getElementById('patientsTable');
  const tbody = table ? table.querySelector('tbody') : null;
  const rows  = tbody ? Array.from(tbody.querySelectorAll('tr:not(.empty-table-row)')) : [];

  // Toolbar & Search Elements
  const searchInput = document.getElementById('patientSearchInput');
  const btnAll      = document.getElementById('btnFilterAll');
  const addChildButton = document.getElementById('btnAddRecord');
  const editProfileButton = document.getElementById('btnEditProfile');
  const addChildModal = document.getElementById('addChildModal');
  const addChildForm = document.getElementById('addChildForm');
  const addChildModalTitle = document.getElementById('addChildModalTitle');
  const childBirthDate = document.getElementById('childBirthDate') as HTMLInputElement | null;
  const childAgeMonths = document.getElementById('childAgeMonths') as HTMLInputElement | null;
  const childAgeDays = document.getElementById('childAgeDays') as HTMLInputElement | null;
  const childProgressSections = Array.from(document.querySelectorAll<HTMLElement>('[data-child-progress-section]'));
  const childProgressSummary = document.getElementById('childProgressSummary');
  const childProgressPercent = document.getElementById('childProgressPercent');
  const childProgressTrack = document.getElementById('childProgressTrack');
  const childProgressFill = document.getElementById('childProgressFill') as HTMLElement | null;
  const childProgressNote = document.getElementById('childProgressNote');
  const closeAddChildButton = document.getElementById('btnCloseAddChild');
  const cancelAddChildButton = document.getElementById('btnCancelAddChild');

  // Full View Display Elements
  const viewPatientId     = document.getElementById('viewPatientId');
  const viewPatientName   = document.getElementById('viewPatientName');
  const viewDetailFullName = document.getElementById('viewDetailFullName');
  const viewGender        = document.getElementById('viewGender');
  const viewAge           = document.getElementById('viewAge');
  const viewNutritionStatus = document.getElementById('viewNutritionStatus');
  const viewZone          = document.getElementById('viewZone');
  const viewDetailAddress = document.getElementById('viewDetailAddress');
  const viewDetailGender  = document.getElementById('viewDetailGender');
  const viewMeasuredDate  = document.getElementById('viewMeasuredDate');
  const viewChildBirthday = document.getElementById('viewChildBirthday');
  const viewGuardianName = document.getElementById('viewGuardianName');
  const viewGuardianContact = document.getElementById('viewGuardianContact');
  const viewGuardianRelationship = document.getElementById('viewGuardianRelationship');
  const viewGuardianType = document.getElementById('viewGuardianType');
  const viewGuardianAddress = document.getElementById('viewGuardianAddress');
  const viewChildWeight = document.getElementById('viewChildWeight');
  const viewChildHeight = document.getElementById('viewChildHeight');
  const viewChildMuac = document.getElementById('viewChildMuac');
  const viewEdemaStatus = document.getElementById('viewEdemaStatus');
  const viewVitaminAStatus = document.getElementById('viewVitaminAStatus');
  const viewDewormingStatus = document.getElementById('viewDewormingStatus');
  const viewImmunizationStatus = document.getElementById('viewImmunizationStatus');
  const mainContent       = document.querySelector<HTMLElement>('.main-content');
  let selectedChildRow: HTMLTableRowElement | null = null;
  let editingChildRow: HTMLTableRowElement | null = null;
  let queueReturnUrl: string | null = null;

  // Active filter state
  const activeFilters = {
    barangay: null,
    gender: null,
    status: null,
    query: ''
  };
  const fullPatientNamesByDisplayName = {
    'Yoongi S. Min': 'Yoongi Suga Min',
    'Joonie R. Antonio': 'Joonie Rivera Antonio',
    'Louis L. San Juan': 'Louis Lacuesta San Juan',
    'Kristina C. David': 'Kristina Castillo David',
    'Shiki S. Rodriguez': 'Shiki Salcedo Rodriguez',
    'Kyla R. Bom': 'Kyla Reyes Bom',
    'Alexis D. San Juan': 'Alexis Dela Cruz San Juan',
    'Kristine C. San Pablo': 'Kristine Cruz San Pablo',
    'Maria K. Kanto': 'Maria Katigbak Kanto',
    'Tara C. Inom': 'Tara Cabrera Inom',
    'Angelica Del Rosario': 'Angelica Del Rosario',
    'Christian J. Gomez': 'Christian Javier Gomez',
    'Joshua P. Alcantara': 'Joshua Perez Alcantara',
    'Beatrice M. Reyes': 'Beatrice Manalo Reyes',
    'Daniel K. Tan': 'Daniel Kim Tan',
    'Sophia L. Castro': 'Sophia Lim Castro',
    'Liam V. Mendoza': 'Liam Villanueva Mendoza',
    'Ethan R. Ramos': 'Ethan Rafael Ramos'
  };

  /**
   * Close all filter dropdown menus
   */
  function closeAllDropdowns() {
    document.querySelectorAll('.filter-dropdown-wrap').forEach(wrap => {
      wrap.classList.remove('open');
      const menu = wrap.querySelector('.filter-dropdown-menu');
      const btn  = wrap.querySelector('.dropdown-toggle');
      if (menu) menu.classList.remove('show');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  /**
   * Clear all filter dropdown button labels back to defaults
   */
  function clearDropdownLabels() {
    const barangayBtn = document.getElementById('barangayDropdownBtn');
    const genderBtn   = document.getElementById('genderDropdownBtn');
    const statusBtn   = document.getElementById('statusDropdownBtn');

    if (barangayBtn) {
      const txt = barangayBtn.querySelector('.filter-btn-text');
      if (txt) txt.textContent = 'Barangay';
      barangayBtn.classList.remove('has-filter', 'active');
    }
    if (genderBtn) {
      const txt = genderBtn.querySelector('.filter-btn-text');
      if (txt) txt.textContent = 'Gender';
      genderBtn.classList.remove('has-filter', 'active');
    }
    if (statusBtn) {
      const txt = statusBtn.querySelector('.filter-btn-text');
      if (txt) txt.textContent = 'Status';
      statusBtn.classList.remove('has-filter', 'active');
    }

    document.querySelectorAll('.filter-menu-item').forEach(item => item.classList.remove('selected'));
  }

  /**
   * Setup a dropdown button with toggle, select, and deselect behavior
   */
  function setupDropdown(wrapId, menuId, filterKey, defaultLabel) {
    const wrap = document.getElementById(wrapId);
    const menu = document.getElementById(menuId);
    const btn  = wrap ? wrap.querySelector('.dropdown-toggle') : null;

    if (!wrap || !menu || !btn) return;

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = wrap.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        wrap.classList.add('open');
        menu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.filter-menu-item').forEach(item => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        const value = item.dataset.value;
        const textSpan = btn.querySelector('.filter-btn-text');

        // Toggle deselect if same item clicked again
        if (activeFilters[filterKey] === value) {
          activeFilters[filterKey] = null;
          item.classList.remove('selected');
          btn.classList.remove('has-filter', 'active');
          if (textSpan) textSpan.textContent = defaultLabel;
        } else {
          activeFilters[filterKey] = value;
          menu.querySelectorAll('.filter-menu-item').forEach(opt => opt.classList.remove('selected'));
          item.classList.add('selected');
          btn.classList.add('has-filter', 'active');
          if (textSpan) textSpan.textContent = value;
        }

        updateAllButtonState();
        closeAllDropdowns();
        applyFilters();
      });
    });
  }

  /**
   * Update the "All" filter button state
   */
  function updateAllButtonState() {
    if (!btnAll) return;
    const hasAnyFilter = Boolean(activeFilters.barangay || activeFilters.gender || activeFilters.status || activeFilters.query);
    btnAll.classList.toggle('active', !hasAnyFilter);
  }

  /**
   * Filter the table rows according to activeFilters and search query
   */
  function applyFilters() {
    if (!tbody) return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    activeFilters.query = query;

    let visibleCount = 0;

    rows.forEach(row => {
      const patientNo = (row.dataset.patientNo || row.cells[0]?.textContent || '').trim().toLowerCase();
      const name = (row.dataset.name || row.querySelector('.patient-col-name')?.textContent || '').trim().toLowerCase();
      const address = (row.dataset.barangay || row.querySelector('.patient-col-address')?.textContent || '').trim().toLowerCase();
      const gender = (row.dataset.gender || row.cells[2]?.textContent || '').trim().toLowerCase();
      const status = (row.dataset.status || row.cells[3]?.textContent || '').trim().toLowerCase();

      // Search matching: checks name, patient no, address/barangay, status
      const matchesSearch = !query ||
        name.includes(query) ||
        patientNo.includes(query) ||
        address.includes(query) ||
        status.includes(query);

      // Barangay filter (supports Gogon / Gugon)
      let matchesBarangay = true;
      if (activeFilters.barangay) {
        const targetBgy = activeFilters.barangay.toLowerCase();
        if (targetBgy === 'gogon' || targetBgy === 'gugon') {
          matchesBarangay = address.includes('gogon') || address.includes('gugon');
        } else {
          matchesBarangay = address.includes(targetBgy);
        }
      }

      // Gender filter
      let matchesGender = true;
      if (activeFilters.gender) {
        matchesGender = gender === activeFilters.gender.toLowerCase();
      }

      // Status filter (Normal, Underweight, Overweight)
      let matchesStatus = true;
      if (activeFilters.status) {
        matchesStatus = status === activeFilters.status.toLowerCase();
      }

      const shouldShow = matchesSearch && matchesBarangay && matchesGender && matchesStatus;
      row.style.display = shouldShow ? '' : 'none';
      if (shouldShow) visibleCount++;
    });

    // Handle Empty State Row
    let emptyRow = tbody.querySelector('.empty-table-row');
    if (visibleCount === 0) {
      if (!emptyRow) {
        emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-table-row';
        emptyRow.innerHTML = `<td colspan="6" style="text-align: center; padding: 28px; color: #64748b; font-weight: 600;">No child health records found matching your filter criteria.</td>`;
        tbody.appendChild(emptyRow);
      }
      emptyRow.style.display = '';
    } else if (emptyRow) {
      emptyRow.style.display = 'none';
    }

    updateAllButtonState();
  }

  function getStatusPillClass(status) {
    const normalizedStatus = status.trim().toLowerCase();
    if (normalizedStatus === 'normal') return 'status-normal';
    if (normalizedStatus === 'pending assessment') return 'status-pending';
    if (['overweight', 'obese', 'severely stunted', 'severely underweight', 'severely wasted', 'severely acute malnutrition (sam)'].includes(normalizedStatus)) {
      return 'status-alert';
    }
    return 'status-warning';
  }

  function decorateStatusCell(row) {
    const statusCell = row.cells[3];
    if (!statusCell || statusCell.querySelector('.status-pill')) return;
    const status = statusCell.textContent?.trim() ?? '';
    const statusPill = document.createElement('span');
    statusPill.className = `status-pill ${getStatusPillClass(status)}`;
    statusPill.title = status;
    const statusLabel = document.createElement('span');
    statusLabel.className = 'status-pill-label';
    statusLabel.textContent = status;
    statusPill.append(statusLabel);
    statusCell.replaceChildren(statusPill);
  }

  rows.forEach(decorateStatusCell);

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  // "All" button reset handler
  if (btnAll) {
    btnAll.addEventListener('click', () => {
      activeFilters.barangay = null;
      activeFilters.gender = null;
      activeFilters.status = null;
      activeFilters.query = '';

      if (searchInput) searchInput.value = '';

      clearDropdownLabels();
      btnAll.classList.add('active');
      closeAllDropdowns();
      applyFilters();
    });
  }

  // Initialize Dropdown Menus
  setupDropdown('barangayDropdownWrap', 'barangayDropdownMenu', 'barangay', 'Barangay');
  setupDropdown('genderDropdownWrap', 'genderDropdownMenu', 'gender', 'Gender');
  setupDropdown('statusDropdownWrap', 'statusDropdownMenu', 'status', 'Status');

  // Close dropdowns when clicking outside
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.filter-dropdown-wrap')) {
      closeAllDropdowns();
    }
  });

  // Handle "View" Click to show patient details
  function toDateInputValue(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parts = value.split(/[/-]/).map(part => part.trim());
    if (parts.length !== 3) return '';
    const [month, day, year] = parts;
    if (!month || !day || !year || year.length !== 4) return '';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  function toLongDate(value: string) {
    const dateValue = toDateInputValue(value);
    if (!dateValue) return value;
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  function setViewText(element: HTMLElement | null, value: string | undefined, fallback = '--') {
    if (!element || value === undefined) return;
    element.textContent = value || fallback;
  }

  function showPatientDetails(row) {
    if (!row || !patientFullView || !recordsTableView) return;
    selectedChildRow = row;

    const patientNo = row.dataset.patientNo || row.cells[0]?.textContent?.trim() || 'PT-26-000000';
    const name = row.dataset.name || row.querySelector('.patient-col-name')?.textContent?.trim() || 'Patient Name';
    const fullName = row.dataset.fullName || fullPatientNamesByDisplayName[name] || name;
    const address = row.dataset.address || row.dataset.barangay || row.querySelector('.patient-col-address')?.textContent?.trim() || 'Camaligan';
    const gender = row.dataset.gender || row.cells[2]?.textContent?.trim() || 'Male';
    const status = row.dataset.status || row.cells[3]?.textContent?.trim() || 'Normal';

    if (viewPatientId) viewPatientId.textContent = `Patient No. : ${patientNo}`;
    if (viewPatientName) viewPatientName.textContent = name;
    if (viewDetailFullName) viewDetailFullName.textContent = fullName;
    if (viewGender) viewGender.textContent = gender;
    if (viewDetailGender) viewDetailGender.textContent = gender;
    if (viewNutritionStatus) {
      viewNutritionStatus.textContent = status;
      viewNutritionStatus.dataset.status = status.toLowerCase();
    }
    if (viewZone) viewZone.textContent = address;
    if (viewDetailAddress) viewDetailAddress.textContent = address;
    if (viewMeasuredDate && row.dataset.date) viewMeasuredDate.textContent = row.dataset.date;
    if (row.dataset.birthDate) {
      setViewText(viewChildBirthday, toLongDate(row.dataset.birthDate));
      viewChildBirthday?.setAttribute('data-date-value', toDateInputValue(row.dataset.birthDate));
    }
    if (row.dataset.weight !== undefined) setViewText(viewChildWeight, row.dataset.weight ? `${row.dataset.weight} kg` : '');
    if (row.dataset.height !== undefined) setViewText(viewChildHeight, row.dataset.height ? `${row.dataset.height} cm` : '');
    if (row.dataset.muac !== undefined) setViewText(viewChildMuac, row.dataset.muac ? `${row.dataset.muac} cm` : '');
    setViewText(viewGuardianName, row.dataset.guardianFullName);
    setViewText(viewGuardianContact, row.dataset.guardianContact);
    setViewText(viewGuardianRelationship, row.dataset.guardianRelationship);
    setViewText(viewGuardianType, row.dataset.guardianType);
    setViewText(viewGuardianAddress, row.dataset.guardianAddress);
    setViewText(viewEdemaStatus, row.dataset.edema);
    setViewText(viewVitaminAStatus, row.dataset.vitaminA);
    setViewText(viewDewormingStatus, row.dataset.deworming);
    setViewText(viewImmunizationStatus, row.dataset.immunizationStatus);

    recordsTableView.style.display = 'none';
    patientFullView.style.display = 'flex';
    mainContent?.classList.add('patient-full-view-active');
    const profileSections = patientFullView.querySelector<HTMLElement>('.patient-detail-sections');
    if (profileSections) profileSections.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showQueuePatientDetails(patient: ResidentCareQueuePatientDetail) {
    if (!patientFullView || !recordsTableView) {
      throw new Error('The NutriTrack patient detail view is unavailable.');
    }

    selectedChildRow = null;
    setViewText(viewPatientId, `Patient No. : ${patient.id}`);
    setViewText(viewPatientName, patient.name);
    setViewText(viewDetailFullName, patient.name);
    setViewText(viewGender, patient.gender);
    setViewText(viewDetailGender, patient.gender);
    setViewText(viewAge, `${patient.age} years old`);
    setViewText(viewZone, patient.address);
    setViewText(viewDetailAddress, patient.address);

    const providedFields = new Set(['viewDetailFullName', 'viewDetailGender', 'viewDetailAddress']);
    patientFullView.querySelectorAll<HTMLElement>('.field-value-box').forEach(field => {
      if (!providedFields.has(field.id)) field.textContent = '—';
    });
    viewChildBirthday?.removeAttribute('data-date-value');
    if (viewNutritionStatus) {
      viewNutritionStatus.textContent = '—';
      delete viewNutritionStatus.dataset.status;
    }
    patientFullView.querySelectorAll<HTMLElement>('.health-indicator-card .indicator-result').forEach(field => {
      field.textContent = '—';
    });
    const interventions = patientFullView.querySelector<HTMLElement>('.intervention-record-list');
    if (interventions) interventions.textContent = '—';
    const consultationHistory = patientFullView.querySelector<HTMLElement>('.consultation-history-group');
    if (consultationHistory) consultationHistory.textContent = '—';
    const lastUpdated = patientFullView.querySelector<HTMLElement>('.last-updated-text');
    if (lastUpdated) {
      lastUpdated.textContent = `Queue #${String(patient.queueNo).padStart(2, '0')} · ${patient.consultation}`;
    }
    if (editProfileButton instanceof HTMLButtonElement) {
      editProfileButton.disabled = true;
      editProfileButton.title = 'This queue profile is view-only until it is linked to a NutriTrack record.';
    }

    recordsTableView.style.display = 'none';
    patientFullView.style.display = 'flex';
    mainContent?.classList.add('patient-full-view-active');
    activateQueueNavigation('Nutri');
    const profileSections = patientFullView.querySelector<HTMLElement>('.patient-detail-sections');
    if (profileSections) profileSections.scrollTop = 0;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateChildAge() {
    if (!childBirthDate || !childAgeMonths || !childAgeDays) return;
    if (!childBirthDate.value) {
      childAgeMonths.value = '';
      childAgeDays.value = '';
      return;
    }

    const [year, month, day] = childBirthDate.value.split('-').map(Number);
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(birthDate.getTime()) || birthDate > today) {
      childAgeMonths.value = '';
      childAgeDays.value = '';
      return;
    }

    let months = (today.getFullYear() - year) * 12 + today.getMonth() - (month - 1);
    if (today.getDate() < day) months -= 1;
    childAgeMonths.value = String(Math.max(0, months));
    childAgeDays.value = String(Math.floor((today.getTime() - birthDate.getTime()) / 86400000));
  }

  function updateChildProgress() {
    const progressSections = editingChildRow
      ? childProgressSections.filter(section => section.dataset.childProgressSection !== 'parent-guardian')
      : childProgressSections;
    const completeSections = progressSections.filter(section => {
      const requiredControls = Array.from(
        section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]')
      );
      return requiredControls.length > 0 && requiredControls.every(control => control.checkValidity());
    });
    const total = progressSections.length;
    const completed = completeSections.length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    const sectionNames = editingChildRow
      ? ['I. Child’s Information', 'II. Initial Consultation']
      : [
        'I. Child’s Information',
        'II. Health Measurements',
        'III. Parent-Guardian Information'
      ];
    const remaining = progressSections
      .filter(section => !completeSections.includes(section))
      .map(section => sectionNames[progressSections.indexOf(section)]);

    if (childProgressSummary) {
      const sectionLabel = editingChildRow && completed === 1 ? 'section' : 'sections';
      childProgressSummary.textContent = `${completed} of ${total} required ${sectionLabel} complete`;
    }
    if (childProgressPercent) childProgressPercent.textContent = `${percent}%`;
    if (childProgressTrack) childProgressTrack.setAttribute('aria-valuenow', String(percent));
    if (childProgressFill) childProgressFill.style.width = `${percent}%`;
    if (childProgressNote) {
      childProgressNote.textContent = remaining.length
        ? `${remaining.length} section${remaining.length === 1 ? '' : 's'} left: ${remaining.join(', ')}`
        : 'All required sections complete';
    }
  }

  function closeAddChildModal() {
    if (!addChildModal || !addChildForm) return;
    const rowToRestore = editingChildRow;
    addChildModal.style.display = 'none';
    addChildForm.reset();
    editingChildRow = null;
    if (addChildModalTitle) addChildModalTitle.textContent = 'Add New Patient';
    updateChildAge();
    updateChildProgress();
    if (rowToRestore) {
      showPatientDetails(rowToRestore);
      if (editProfileButton instanceof HTMLButtonElement) editProfileButton.focus();
    } else {
      (addChildButton as HTMLButtonElement | null)?.focus();
    }
  }

  function setFormValue(name: string, value: string) {
    if (!addChildForm) return;
    const control = addChildForm.elements.namedItem(name);
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) {
      control.value = value;
      if (control instanceof HTMLSelectElement) {
        control.dispatchEvent(new Event("mhims:select-sync"));
      }
    }
  }

  function setRadioValue(name: string, value: string) {
    if (!addChildForm || !value) return;
    addChildForm.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(radio => {
      if (radio.name === name) {
        radio.checked = radio.value.toLowerCase() === value.toLowerCase();
      }
    });
  }

  function splitFullName(value: string) {
    const parts = value.trim().split(/\s+/).filter(Boolean);
    const suffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV'];
    const suffix = parts.length > 1 && suffixes.includes(parts[parts.length - 1]) ? parts.pop() || '' : '';
    const firstName = parts.shift() || '';
    const lastName = parts.pop() || '';
    return { firstName, middleName: parts.join(' '), lastName, suffix };
  }

  function readMeasurement(element: HTMLElement | null) {
    return element?.textContent?.match(/\d+(?:\.\d+)?/)?.[0] || '';
  }

  function fillEditChildForm(row: HTMLTableRowElement) {
    if (!addChildForm) return;
    const displayName = row.dataset.fullName || fullPatientNamesByDisplayName[row.dataset.name || ''] || row.dataset.name || '';
    const childName = splitFullName(displayName);
    const guardianName = splitFullName(row.dataset.guardianFullName || viewGuardianName?.textContent || '');

    setFormValue('lastName', row.dataset.lastName || childName.lastName);
    setFormValue('firstName', row.dataset.firstName || childName.firstName);
    setFormValue('middleName', row.dataset.middleName || childName.middleName);
    setFormValue('suffix', row.dataset.suffix || childName.suffix);
    setFormValue('gender', row.dataset.gender || viewDetailGender?.textContent || '');
    setFormValue('birthDate', row.dataset.birthDate || viewChildBirthday?.dataset.dateValue || '');
    setFormValue('address', row.dataset.address || viewDetailAddress?.textContent || '');
    setFormValue('dateMeasured', toDateInputValue(row.dataset.date || viewMeasuredDate?.textContent || ''));
    setFormValue('weight', row.dataset.weight ?? readMeasurement(viewChildWeight));
    setFormValue('height', row.dataset.height ?? readMeasurement(viewChildHeight));
    setFormValue('muac', row.dataset.muac ?? readMeasurement(viewChildMuac));
    setFormValue('guardianLastName', row.dataset.guardianLastName || guardianName.lastName);
    setFormValue('guardianFirstName', row.dataset.guardianFirstName || guardianName.firstName);
    setFormValue('guardianMiddleName', row.dataset.guardianMiddleName || guardianName.middleName);
    setFormValue('guardianContact', row.dataset.guardianContact || viewGuardianContact?.textContent || '');
    setFormValue('guardianRelationship', row.dataset.guardianRelationship || viewGuardianRelationship?.textContent || '');
    setFormValue('guardianType', row.dataset.guardianType || viewGuardianType?.textContent || '');
    setFormValue('guardianAddress', row.dataset.guardianAddress || viewGuardianAddress?.textContent || '');
    setRadioValue('edema', row.dataset.edema || viewEdemaStatus?.textContent?.trim() || '');
    setRadioValue('vitaminA', row.dataset.vitaminA || viewVitaminAStatus?.textContent?.trim() || '');
    setRadioValue('deworming', row.dataset.deworming || viewDewormingStatus?.textContent?.trim() || '');
    setRadioValue(
      'immunizationStatus',
      row.dataset.immunizationStatus || viewImmunizationStatus?.textContent?.trim() || ''
    );
    updateChildAge();
  }

  function openEditChildModal() {
    if (!selectedChildRow || !addChildModal || !addChildForm) return;
    editingChildRow = selectedChildRow;
    addChildForm.reset();
    fillEditChildForm(editingChildRow);
    if (childBirthDate) childBirthDate.max = new Date().toISOString().slice(0, 10);
    if (addChildModalTitle) addChildModalTitle.textContent = 'Edit New Patient';
    patientFullView && (patientFullView.style.display = 'none');
    if (recordsTableView) recordsTableView.style.display = 'block';
    mainContent?.classList.remove('patient-full-view-active');
    updateChildProgress();
    addChildModal.style.display = 'flex';
    (document.getElementById('childLastName') as HTMLInputElement | null)?.focus();
  }

  function formatMeasuredDate(value: string) {
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }

  function getNextChildPatientNumber() {
    const highestNumber = rows.reduce((highest, row) => {
      const patientNumber = row.dataset.patientNo || '';
      const match = patientNumber.match(/^PT-\d{2}-(\d+)$/i);
      return match ? Math.max(highest, Number(match[1])) : highest;
    }, 0);
    const year = String(new Date().getFullYear()).slice(-2);
    return `PT-${year}-${String(highestNumber + 1).padStart(6, '0')}`;
  }

  function appendChildRecord(formData: FormData) {
    if (!tbody) return;

    const getValue = (name: string) => String(formData.get(name) ?? '').trim();
    const lastName = getValue('lastName');
    const firstName = getValue('firstName');
    const middleName = getValue('middleName');
    const suffix = getValue('suffix');
    const middleInitial = middleName ? `${middleName.charAt(0).toUpperCase()}.` : '';
    const displayName = [firstName, middleInitial, lastName, suffix].filter(Boolean).join(' ');
    const address = getValue('address');
    const gender = getValue('gender');
    const dateMeasured = formatMeasuredDate(getValue('dateMeasured'));
    const guardianFullName = [
      getValue('guardianFirstName'),
      getValue('guardianMiddleName'),
      getValue('guardianLastName')
    ].filter(Boolean).join(' ');
    const patientNumber = getNextChildPatientNumber();
    const row = document.createElement('tr');
    row.dataset.patientNo = patientNumber;
    row.dataset.name = displayName;
    row.dataset.fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ');
    row.dataset.firstName = firstName;
    row.dataset.middleName = middleName;
    row.dataset.lastName = lastName;
    row.dataset.suffix = suffix;
    row.dataset.birthDate = getValue('birthDate');
    row.dataset.ageMonths = getValue('ageMonths');
    row.dataset.ageDays = getValue('ageDays');
    row.dataset.address = address;
    row.dataset.barangay = address;
    row.dataset.gender = gender;
    row.dataset.status = 'Pending Assessment';
    row.dataset.date = dateMeasured;
    row.dataset.weight = getValue('weight');
    row.dataset.height = getValue('height');
    row.dataset.muac = getValue('muac');
    row.dataset.edema = getValue('edema');
    row.dataset.vitaminA = getValue('vitaminA');
    row.dataset.deworming = getValue('deworming');
    row.dataset.immunizationStatus = getValue('immunizationStatus');
    row.dataset.guardianFullName = guardianFullName;
    row.dataset.guardianFirstName = getValue('guardianFirstName');
    row.dataset.guardianMiddleName = getValue('guardianMiddleName');
    row.dataset.guardianLastName = getValue('guardianLastName');
    row.dataset.guardianContact = getValue('guardianContact');
    row.dataset.guardianRelationship = getValue('guardianRelationship');
    row.dataset.guardianType = getValue('guardianType');
    row.dataset.guardianAddress = getValue('guardianAddress');

    const patientNumberCell = row.insertCell();
    patientNumberCell.textContent = patientNumber;

    const nameCell = row.insertCell();
    const nameWrap = document.createElement('div');
    nameWrap.className = 'patient-info-col';
    const nameText = document.createElement('span');
    nameText.className = 'patient-col-name';
    nameText.textContent = displayName;
    const addressText = document.createElement('span');
    addressText.className = 'patient-col-address';
    addressText.textContent = address;
    nameWrap.append(nameText, addressText);
    nameCell.append(nameWrap);

    const genderCell = row.insertCell();
    genderCell.textContent = gender;
    const statusCell = row.insertCell();
    statusCell.textContent = 'Pending Assessment';
    decorateStatusCell(row);
    const dateCell = row.insertCell();
    dateCell.textContent = dateMeasured;
    const actionCell = row.insertCell();
    const actionWrap = document.createElement('div');
    actionWrap.className = 'view-action-cell';
    const divider = document.createElement('span');
    divider.className = 'view-action-divider';
    divider.textContent = '|';
    const viewLink = document.createElement('a');
    viewLink.className = 'view-link';
    viewLink.href = '#view';
    viewLink.textContent = 'View';
    actionWrap.append(divider, viewLink);
    actionCell.append(actionWrap);

    rows.unshift(row);
    tbody.insertBefore(row, tbody.firstChild);
    bindViewButton(row);
    applyFilters();
  }

  function updateChildRecord(formData: FormData, row: HTMLTableRowElement) {
    const getValue = (name: string) => String(formData.get(name) ?? '').trim();
    const firstName = getValue('firstName');
    const middleName = getValue('middleName');
    const lastName = getValue('lastName');
    const suffix = getValue('suffix');
    const displayName = [
      firstName,
      middleName ? `${middleName.charAt(0).toUpperCase()}.` : '',
      lastName,
      suffix
    ].filter(Boolean).join(' ');
    const fullName = [firstName, middleName, lastName, suffix].filter(Boolean).join(' ');
    const address = getValue('address');
    const gender = getValue('gender');
    const measuredDate = getValue('dateMeasured');

    row.dataset.name = displayName;
    row.dataset.fullName = fullName;
    row.dataset.firstName = firstName;
    row.dataset.middleName = middleName;
    row.dataset.lastName = lastName;
    row.dataset.suffix = suffix;
    row.dataset.gender = gender;
    row.dataset.birthDate = getValue('birthDate');
    row.dataset.ageMonths = getValue('ageMonths');
    row.dataset.ageDays = getValue('ageDays');
    row.dataset.address = address;
    row.dataset.barangay = address;
    row.dataset.date = measuredDate ? formatMeasuredDate(measuredDate) : '';
    row.dataset.weight = getValue('weight');
    row.dataset.height = getValue('height');
    row.dataset.muac = getValue('muac');
    row.dataset.edema = getValue('edema');
    row.dataset.vitaminA = getValue('vitaminA');
    row.dataset.deworming = getValue('deworming');
    row.dataset.immunizationStatus = getValue('immunizationStatus');
    row.dataset.guardianFirstName = getValue('guardianFirstName');
    row.dataset.guardianMiddleName = getValue('guardianMiddleName');
    row.dataset.guardianLastName = getValue('guardianLastName');
    row.dataset.guardianFullName = [
      row.dataset.guardianFirstName,
      row.dataset.guardianMiddleName,
      row.dataset.guardianLastName
    ].filter(Boolean).join(' ');
    row.dataset.guardianContact = getValue('guardianContact');
    row.dataset.guardianRelationship = getValue('guardianRelationship');
    row.dataset.guardianType = getValue('guardianType');
    row.dataset.guardianAddress = getValue('guardianAddress');

    const nameCell = row.querySelector('.patient-col-name');
    const addressCell = row.querySelector('.patient-col-address');
    if (nameCell) nameCell.textContent = displayName;
    if (addressCell) addressCell.textContent = address;
    if (row.cells[2]) row.cells[2].textContent = gender;
    if (row.cells[4]) row.cells[4].textContent = row.dataset.date;
    applyFilters();
  }

  function openAddChildModal() {
    if (!addChildModal || !addChildForm) return;
    editingChildRow = null;
    addChildForm.reset();
    if (addChildModalTitle) addChildModalTitle.textContent = 'Add New Patient';
    if (childBirthDate) childBirthDate.max = new Date().toISOString().slice(0, 10);
    updateChildAge();
    updateChildProgress();
    addChildModal.style.display = 'flex';
    (document.getElementById('childLastName') as HTMLInputElement | null)?.focus();
  }

  childBirthDate?.addEventListener('input', updateChildAge);
  childProgressSections.forEach(section => {
    section.addEventListener('input', updateChildProgress);
    section.addEventListener('change', updateChildProgress);
  });
  addChildButton?.addEventListener('click', openAddChildModal);
  editProfileButton?.addEventListener('click', openEditChildModal);
  closeAddChildButton?.addEventListener('click', closeAddChildModal);
  cancelAddChildButton?.addEventListener('click', closeAddChildModal);
  addChildModal?.addEventListener('click', event => {
    if (event.target === addChildModal) closeAddChildModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && addChildModal instanceof HTMLElement && addChildModal.style.display === 'flex') {
      closeAddChildModal();
    }
  });
  addChildForm?.addEventListener('submit', event => {
    event.preventDefault();
    if (!(addChildForm instanceof HTMLFormElement)) return;
    if (!tbody) return;
    if (!addChildForm.checkValidity()) {
      addChildForm.reportValidity();
      updateChildProgress();
      return;
    }

    const formData = new FormData(addChildForm);
    const isEditing = Boolean(editingChildRow);
    if (editingChildRow) {
      updateChildRecord(formData, editingChildRow);
      showPatientDetails(editingChildRow);
    } else {
      appendChildRecord(formData);
    }
    closeAddChildModal();
    showRecordNotice(
      isEditing ? 'updated' : 'created',
      isEditing ? 'Child record has been updated.' : 'A new child record has been added.',
    );
  });

  // Back button from Full View to Table
  if (btnBackToRecords) {
    btnBackToRecords.addEventListener('click', () => {
      if (queueReturnUrl) {
        window.location.assign(queueReturnUrl);
        return;
      }

      if (patientFullView && recordsTableView) {
        patientFullView.style.display = 'none';
        recordsTableView.style.display = 'block';
        mainContent?.classList.remove('patient-full-view-active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  // Attach View button event listeners
  function bindViewButton(row) {
    const viewBtn = row.querySelector('.view-link');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPatientDetails(row);
      });
    }
  }
  rows.forEach(bindViewButton);

  // Notification Button Toast/Alert
  const notifBtn = document.getElementById('notifBtn');
  const fullviewNotifBtn = document.getElementById('fullviewNotifBtn');
  [notifBtn, fullviewNotifBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        alert('You have 3 scheduled nutrition check-ups this week.');
      });
    }
  });

  // Initial Filter Run
  applyFilters();

  const queuedPatient = consumeResidentCareQueuePatientDetail('Nutri');
  if (queuedPatient) {
    queueReturnUrl = queuedPatient.returnUrl;
    showQueuePatientDetails(queuedPatient);
  }
});

