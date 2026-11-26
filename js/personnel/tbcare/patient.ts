import { showRecordNotice } from "../../shared/record-save-notice";
import { activateQueueNavigation, consumeResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'mhims-tbcare-patient-records-v1';
  const tbody = document.getElementById('patientsTableBody');
  const searchInput = document.getElementById('patientSearchInput');
  const form = document.getElementById('addPatientForm') as HTMLFormElement | null;
  const addModal = document.getElementById('addPatientModal');
  const detailsModal = document.getElementById('patientDetailsModal');
  const detailsSummary = document.getElementById('patientProfileSummary');
  const detailsContent = document.getElementById('patientDetailsContent');
  const toast = document.getElementById('patientSaveToast');
  const today = new Date();
  const activeFilters = { barangay: null, sex: null, status: null, lastConsult: null, query: '' };
  let toastTimer;
  let queueReturnUrl: string | null = null;

  const seedRecords = [
    { id: 'PT-26-438917', name: 'Maria Theresa Almonte', address: 'San Mateo, Camaligan', barangay: 'San Mateo', sex: 'Female', age: 21, lastConsult: '2026-05-26', status: 'Ongoing Treatment' },
    { id: 'PT-26-762304', name: 'Angelica Mae Ramos', address: 'San Juan, Camaligan', barangay: 'San Juan', sex: 'Female', age: 20, lastConsult: '2026-09-20', status: 'High Risk' },
    { id: 'PT-26-185629', name: 'Rhea Mae Villafuerte', address: 'San Ramon, Camaligan', barangay: 'San Ramon', sex: 'Female', age: 16, lastConsult: '2026-08-29', status: 'Monitor' },
    { id: 'PT-26-904371', name: 'Mark Anthony F. Dela Cruz', fullName: 'Mark Anthony Felipe Dela Cruz', address: 'Gogon, Camaligan', barangay: 'Gogon', sex: 'Male', age: 40, lastConsult: '2025-01-17', status: 'Treatment Completed' },
    { id: 'PT-26-521846', name: 'Christine Joy M. Manalo', fullName: 'Christine Joy Mae Manalo', address: 'San Jose, Camaligan', barangay: 'San Jose', sex: 'Female', age: 30, lastConsult: '2026-11-17', status: 'Missed Follow-up' },
    { id: 'PT-26-347205', name: 'John Patrick G. Mendoza', fullName: 'John Patrick Gabriel Mendoza', address: 'San Pablo, Camaligan', barangay: 'San Pablo', sex: 'Male', age: 30, lastConsult: '2026-06-27', status: 'Monitor' },
    { id: 'PT-26-816493', name: 'Karen Mae B. Salazar', fullName: 'Karen Mae Bautista Salazar', address: 'San Mateo, Camaligan', barangay: 'San Mateo', sex: 'Female', age: 22, lastConsult: '2026-04-23', status: 'Missed Follow-up' },
    { id: 'PT-26-670158', name: 'Daniel Joseph R. Marcos', fullName: 'Daniel Joseph Rafael Marcos', address: 'Santo Domingo, Camaligan', barangay: 'Santo Domingo', sex: 'Male', age: 25, lastConsult: '2026-05-18', status: 'Ongoing Treatment' },
    { id: 'PT-26-293784', name: 'Joshua Miguel Belen', address: 'San Marcos, Camaligan', barangay: 'San Marcos', sex: 'Male', age: 10, lastConsult: '2026-02-14', status: 'High Risk' },
    { id: 'PT-26-745612', name: 'Mark Anthony Dela Cruz', address: 'San Ramon, Camaligan', barangay: 'San Ramon', sex: 'Male', age: 15, lastConsult: '2026-11-14', status: 'Treatment Completed' },
    { id: 'PT-26-738214', name: 'Alexie Mae Santos', address: 'San Mateo, Camaligan', barangay: 'San Mateo', sex: 'Female', age: 28, lastConsult: '2026-10-12', status: 'Ongoing Treatment' },
    { id: 'PT-26-406283', name: 'Julius A. Agbayani', address: 'San Jose, Camaligan', barangay: 'San Jose', sex: 'Male', age: 35, lastConsult: '2026-08-03', status: 'Monitor' },
    { id: 'PT-26-572931', name: 'Mariel T. Flores', address: 'Santo Domingo, Camaligan', barangay: 'Santo Domingo', sex: 'Female', age: 52, lastConsult: '2026-11-18', status: 'High Risk' },
    { id: 'PT-26-865207', name: 'Kyle Gabriel M. Reyes', address: 'San Lucas, Camaligan', barangay: 'San Lucas', sex: 'Male', age: 14, lastConsult: '2026-09-11', status: 'Monitor' },
    { id: 'PT-26-193650', name: 'Lara C. Mendoza', address: 'San Pablo, Camaligan', barangay: 'San Pablo', sex: 'Female', age: 31, lastConsult: '2026-10-21', status: 'Missed Follow-up' },
    { id: 'PT-26-284719', name: 'Joel M. Garcia', address: 'San Ramon, Camaligan', barangay: 'San Ramon', sex: 'Male', age: 61, lastConsult: '2026-11-22', status: 'Ongoing Treatment' },
    { id: 'PT-26-617438', name: 'Hazel Anne A. Cruz', address: 'Tarosanan, Camaligan', barangay: 'Tarosanan', sex: 'Female', age: 7, lastConsult: '2026-07-14', status: 'High Risk' },
    { id: 'PT-26-395126', name: 'Rommel D. Navarro', address: 'Marupit, Camaligan', barangay: 'Marupit', sex: 'Male', age: 48, lastConsult: '2026-09-05', status: 'Monitor' },
    { id: 'PT-26-740862', name: 'Denice R. Salcedo', address: 'Sua, Camaligan', barangay: 'Sua', sex: 'Female', age: 39, lastConsult: '2026-11-05', status: 'Treatment Completed' },
    { id: 'PT-26-503718', name: 'Carlito C. Araneta', address: 'San Francisco, Camaligan', barangay: 'San Francisco', sex: 'Male', age: 22, lastConsult: '2026-08-28', status: 'Ongoing Treatment' }
  ].map((record, index) => {
    const screeningDay = String(6 + index).padStart(2, '0');
    const diagnosisDay = String(8 + index).padStart(2, '0');
    const nextFollowupDay = String(4 + index).padStart(2, '0');
    const contactNumber = `0917 ${String(123 + index * 11).padStart(3, '0')} ${String(4567 + index * 13).padStart(4, '0')}`;
    const fullName = record.fullName || record.name;
    const nameParts = fullName.split(/\s+/).filter(Boolean);
    return {
      ...record,
      fullName,
      displayName: record.name,
      firstName: nameParts[0] || '',
      middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
      lastName: nameParts.length > 1 ? nameParts[nameParts.length - 1] : '',
      diagnosingFacility: 'Camaligan Rural Health Unit',
      ntpCode: 'REG-V-CAM-014',
      provinceHuc: 'Camarines Sur',
      region: 'Region V',
      birthdate: `${today.getFullYear() - record.age}-04-${String(5 + index).padStart(2, '0')}`,
      civilStatus: record.age < 18 ? 'Single' : index % 3 === 0 ? 'Married' : 'Single',
      permanentAddress: record.address,
      currentAddress: record.address,
      contactNumber,
      otherContact: '—',
      philhealthNumber: `12-${String(345678 + index * 127).padStart(9, '0')}-1`,
      nationality: 'Filipino',
      referredBy: 'Camaligan Rural Health Unit',
      modeScreening: index % 2 === 0 ? 'Active Case Finding' : 'Contact Investigation',
      referralLocationType: 'Health Facility',
      dateScreening: `2025-01-${screeningDay}`,
      tbCaseNumber: `TB-2025-${String(987 - index).padStart(4, '0')}`,
      dateDiagnosis: `2025-01-${diagnosisDay}`,
      dateNotification: `2025-01-${String(9 + index).padStart(2, '0')}`,
      diagnosis: ['TB Disease'],
      attendingPhysician: 'Marilou Reyes, RN',
      xpertDate: `2025-01-${screeningDay}`,
      xpertAssay: 'Standard Xpert',
      xpertResult: index % 3 === 0 ? 'MTB detected' : 'MTB detected; rifampicin resistance not detected',
      smearDate: `2025-01-${screeningDay}`,
      testType: ['Smear Microscopy'],
      smearResult: index % 2 === 0 ? 'Positive (1+)' : 'Positive (2+)',
      xrayDate: `2025-01-${diagnosisDay}`,
      xrayResult: 'Abnormal, suggestive of pulmonary TB',
      skinTestDate: '',
      skinTestResult: 'Not done',
      otherTestName: 'Complete blood count',
      otherTestDate: `2025-01-${diagnosisDay}`,
      otherTestResult: 'Within reference range',
      bacteriologicalStatus: 'Bacteriologically Confirmed',
      anatomicalSite: 'Pulmonary',
      drugResistanceStatus: 'Drug-susceptible',
      registrationGroup: index % 4 === 0 ? 'Relapse' : 'New',
      treatmentHistory: index % 4 === 0 ? 'Previously treated' : 'None',
      height: String(150 + index * 2),
      weight: String(48 + index * 1.7),
      hivStatus: 'Negative',
      hivExamDate: `2025-01-${diagnosisDay}`,
      onArt: 'Not Applicable',
      onCpt: 'Not Applicable',
      diabetesScreening: index % 4 === 1 ? 'Positive' : 'Negative',
      fbsResults: String(index % 4 === 1 ? 121 + index : 88 + index * 2),
      comorbidities: index % 4 === 1 ? ['Diabetes Mellitus'] : [],
      emergencyName: ['Elena Almonte', 'Ramon Ramos', 'Liza Villafuerte', 'Ana Dela Cruz', 'Jose Manalo', 'Mila Mendoza', 'Rogelio Salazar', 'Celia Marcos', 'Rosa Belen', 'Tomas Dela Cruz'][index],
      emergencyAge: String(27 + index * 2),
      emergencySex: index % 2 === 0 ? 'Female' : 'Male',
      emergencyRelationship: index % 2 === 0 ? 'Spouse' : 'Parent',
      emergencyContact: contactNumber,
      emergencyScreening: 'No TB symptoms reported',
      emergencyFollowup: 'Not required',
      treatmentStart: `2025-01-${String(10 + index).padStart(2, '0')}`,
      regimenType: index % 2 === 0 ? 'Regimen 1' : 'Regimen 2',
      regimen: '2HRZE / 4HR',
      treatmentLocation: index % 2 === 0 ? 'Facility-based' : 'Community-based',
      intensiveStart: `2025-01-${String(10 + index).padStart(2, '0')}`,
      expectedIpEnd: `2025-03-${String(10 + index).padStart(2, '0')}`,
      continuationStart: `2025-03-${String(11 + index).padStart(2, '0')}`,
      expectedCpEnd: `2025-07-${String(10 + index).padStart(2, '0')}`,
      dose4fdc: '3 tablets',
      dose2fdc: '1 tablet',
      doseH: String(75 + index * 5),
      doseR: String(150 + index * 10),
      doseZ: String(400 + index * 25),
      doseE: String(275 + index * 25),
      treatmentSupport: 'Family-Member',
      supporterName: ['Elena Almonte', 'Ramon Ramos', 'Liza Villafuerte', 'Ana Dela Cruz', 'Jose Manalo', 'Mila Mendoza', 'Rogelio Salazar', 'Celia Marcos', 'Rosa Belen', 'Tomas Dela Cruz'][index],
      supporterContact: contactNumber,
      scheduleTreatment: 'Daily - 8:00 am',
      datSupported: index % 2 === 0 ? 'Yes' : 'No',
      datUsed: index % 2 === 0 ? 'Video observed therapy' : 'Facility-based observation',
      nextSputum: `2026-12-${nextFollowupDay}`,
      plannedSputumTest: index % 2 === 0 ? 'Smear Microscopy / TB LAMP' : 'Xpert MTB / RIF',
      nextXray: `2026-12-${String(12 + index).padStart(2, '0')}`,
      nextClinicalReview: `2026-12-${String(18 + index).padStart(2, '0')}`,
      postTreatmentFollowup: record.status === 'Treatment Completed' ? 'Scheduled' : 'Not yet Schedule',
      postTreatmentSixMonthDate: record.status === 'Treatment Completed' ? `2026-01-${String(12 + index).padStart(2, '0')}` : 'Not Due',
      postTreatmentSixMonthCxr: record.status === 'Treatment Completed' ? 'No active infiltrates' : '—',
      postTreatmentSixMonthSputum: record.status === 'Treatment Completed' ? 'Negative' : '—',
      postTreatmentSixMonthDst: record.status === 'Treatment Completed' ? 'Drug-susceptible' : '—',
      postTreatmentTwelveMonthDate: record.status === 'Treatment Completed' ? `2026-07-${String(12 + index).padStart(2, '0')}` : 'Not Due',
      postTreatmentTwelveMonthCxr: record.status === 'Treatment Completed' ? 'No active infiltrates' : '—',
      postTreatmentTwelveMonthSputum: record.status === 'Treatment Completed' ? 'Negative' : '—',
      postTreatmentTwelveMonthDst: record.status === 'Treatment Completed' ? 'Drug-susceptible' : '—',
      preferredAppointment: '9:00 AM',
      currentPhase: record.status === 'Treatment Completed' ? 'Treatment Completed' : index % 2 === 0 ? 'Intensive Phase' : 'Continuation Phase',
      updatedAt: record.lastConsult
    };
  });

  function showToast(message, isError) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('is-error', Boolean(isError));
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3400);
  }

  function loadRecords() {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const migrationKey = `${storageKey}-scrollable-demo-rows-v2`;
      if (stored === null) {
        window.localStorage.setItem(migrationKey, 'complete');
        return seedRecords.slice();
      }
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) throw new TypeError('Stored TBCare records are not a list.');
      const savedRecords = parsed.filter(record => record && typeof record === 'object');
      if (window.localStorage.getItem(migrationKey) === 'complete') return savedRecords;

      const savedIds = new Set(savedRecords.map(record => record.id));
      const migratedRecords = [
        ...savedRecords,
        ...seedRecords.filter(record => !savedIds.has(record.id)),
      ];
      window.localStorage.setItem(storageKey, JSON.stringify(migratedRecords));
      window.localStorage.setItem(migrationKey, 'complete');
      return migratedRecords;
    } catch (error) {
      console.error('Unable to load saved TBCare patient records.', error);
      showToast('Saved records could not be loaded. Showing the available patient list.', true);
      return seedRecords.slice();
    }
  }

  let records = loadRecords();
  let editingRecordId = null;

  function saveRecords(nextRecords) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextRecords));
      records = nextRecords;
      return true;
    } catch (error) {
      console.error('Unable to save TBCare patient records.', error);
      showToast('The record could not be saved in this browser. Check storage access and try again.', true);
      return false;
    }
  }

  function formatDate(value) {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
  }

  function getStatusClass(status) {
    const classes = {
      'Ongoing Treatment': 'status-ongoing',
      'High Risk': 'status-high-risk',
      'Monitor': 'status-monitor',
      'Treatment Completed': 'status-completed',
      'Missed Follow-up': 'status-missed'
    };
    return classes[status] || 'status-monitor';
  }

  function createCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value == null ? '' : String(value);
    row.appendChild(cell);
    return cell;
  }

  function createPatientRow(record) {
    const row = document.createElement('tr');
    row.dataset.recordId = record.id;
    row.dataset.fullName = record.fullName || record.name || '';
    createCell(row, record.id);

    const nameCell = document.createElement('td');
    const info = document.createElement('div');
    info.className = 'patient-info-col';
    const name = document.createElement('span');
    name.className = 'patient-col-name';
    const storedNameParts = [record.firstName, record.middleName, record.lastName, record.suffix]
      .map(value => String(value || '').trim());
    const displayName = record.displayName || (storedNameParts[1]
      ? [
          storedNameParts[0],
          `${storedNameParts[1].charAt(0).toUpperCase()}.`,
          storedNameParts[2],
          storedNameParts[3]
        ].filter(Boolean).join(' ')
      : record.name);
    name.textContent = displayName || 'Patient';
    const address = document.createElement('span');
    address.className = 'patient-col-address';
    address.textContent = record.address || 'Address not provided';
    info.append(name, address);
    nameCell.appendChild(info);
    row.appendChild(nameCell);

    createCell(row, record.sex || '—');
    createCell(row, record.age == null ? '—' : record.age);
    createCell(row, formatDate(record.lastConsult));

    const statusCell = document.createElement('td');
    const statusPill = document.createElement('span');
    statusPill.className = `status-pill ${getStatusClass(record.status)}`;
    statusPill.textContent = record.status || 'Monitor';
    statusCell.appendChild(statusPill);
    row.appendChild(statusCell);

    const actionCell = document.createElement('td');
    const action = document.createElement('div');
    action.className = 'view-action-cell';
    const divider = document.createElement('span');
    divider.className = 'view-action-divider';
    divider.textContent = '|';
    const viewButton = document.createElement('button');
    viewButton.type = 'button';
    viewButton.className = 'view-link';
    viewButton.dataset.action = 'view';
    viewButton.dataset.recordId = record.id;
    viewButton.textContent = 'View';
    action.append(divider, viewButton);
    actionCell.appendChild(action);
    row.appendChild(actionCell);
    return row;
  }

  function matchesLastConsult(record) {
    if (!activeFilters.lastConsult) return true;
    const date = new Date(`${record.lastConsult}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const daysAgo = (today - date) / 86400000;
    if (activeFilters.lastConsult === 'Last 30 days') return daysAgo >= 0 && daysAgo <= 30;
    if (activeFilters.lastConsult === 'Last 90 days') return daysAgo >= 0 && daysAgo <= 90;
    return daysAgo > 90;
  }

  function renderTable() {
    if (!tbody) return;
    const query = String(activeFilters.query || '').toLowerCase();
    const filteredRecords = records.filter(record => {
      const searchText = `${record.id || ''} ${record.name || ''} ${record.fullName || ''} ${record.address || ''} ${record.status || ''}`.toLowerCase();
      const matchesQuery = !query || searchText.includes(query);
      const barangayText = String(record.barangay || record.address || '').toLowerCase();
      const matchesBarangay = !activeFilters.barangay || barangayText.includes(activeFilters.barangay.toLowerCase());
      const matchesSex = !activeFilters.sex || record.sex === activeFilters.sex;
      const matchesStatus = !activeFilters.status || record.status === activeFilters.status;
      return matchesQuery && matchesBarangay && matchesSex && matchesStatus && matchesLastConsult(record);
    });

    tbody.replaceChildren();
    if (filteredRecords.length === 0) {
      const emptyRow = document.createElement('tr');
      const emptyCell = document.createElement('td');
      emptyCell.className = 'empty-table-cell';
      emptyCell.colSpan = 7;
      emptyCell.textContent = 'No patient records found matching the selected filters.';
      emptyRow.appendChild(emptyCell);
      tbody.appendChild(emptyRow);
      return;
    }
    filteredRecords.forEach(record => tbody.appendChild(createPatientRow(record)));
  }

  function closeDropdowns() {
    document.querySelectorAll('.filter-dropdown-wrap').forEach(wrap => {
      wrap.classList.remove('open');
      const button = wrap.querySelector('.filter-btn');
      const menu = wrap.querySelector('.filter-dropdown-menu');
      if (button) button.setAttribute('aria-expanded', 'false');
      if (menu) menu.classList.remove('show');
    });
  }

  document.querySelectorAll('.filter-dropdown-wrap').forEach(wrap => {
    const button = wrap.querySelector('.dropdown-toggle');
    const menu = wrap.querySelector('.filter-dropdown-menu');
    if (!button || !menu) return;

    button.addEventListener('click', event => {
      event.stopPropagation();
      const shouldOpen = !wrap.classList.contains('open');
      closeDropdowns();
      if (shouldOpen) {
        wrap.classList.add('open');
        menu.classList.add('show');
        button.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.filter-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const key = item.dataset.filter;
        if (key in activeFilters) {
          activeFilters[key] = activeFilters[key] === item.dataset.value ? null : item.dataset.value;
          const label = button.querySelector('.filter-btn-text');
          const defaultLabel = key === 'barangay' ? 'Barangay' : key === 'sex' ? 'Sex' : key === 'lastConsult' ? 'Last Consult' : 'Status';
          if (label) label.textContent = activeFilters[key] || defaultLabel;
          button.classList.toggle('has-filter', Boolean(activeFilters[key]));
          if (allButton) allButton.classList.remove('active');
          renderTable();
        }
        closeDropdowns();
      });
    });
  });

  const lastConsultButton = document.getElementById('lastConsultBtn');
  const allButton = document.getElementById('btnFilterAll');
  if (allButton) {
    allButton.addEventListener('click', () => {
      Object.keys(activeFilters).forEach(key => { activeFilters[key] = null; });
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('.dropdown-toggle').forEach(button => {
        button.classList.remove('has-filter');
        const label = button.querySelector('.filter-btn-text');
        if (label) label.textContent = button.id === 'barangayDropdownBtn' ? 'Barangay' : button.id === 'sexDropdownBtn' ? 'Sex' : button.id === 'statusDropdownBtn' ? 'Status' : 'Last Consult';
      });
      if (lastConsultButton) lastConsultButton.classList.remove('has-filter');
      allButton.classList.add('active');
      renderTable();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeFilters.query = searchInput.value.trim();
      if (allButton) allButton.classList.remove('active');
      renderTable();
    });
  }

  document.addEventListener('click', closeDropdowns);

  function openModal(record = null) {
    if (!addModal || !form) return;
    form.reset();
    editingRecordId = record ? record.id : null;
    if (record) {
      Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input[name], select[name], textarea[name]')).forEach(control => {
        const value = record[control.name];
        if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
          control.checked = Array.isArray(value) ? value.includes(control.value) : value === control.value;
        } else {
          control.value = value == null ? '' : String(value);
          if (control instanceof HTMLSelectElement) {
            control.dispatchEvent(new Event('mhims:select-sync'));
          }
        }
      });
    }
    const ageInput = document.getElementById('patientAge');
    if (ageInput) ageInput.value = record && record.age != null ? String(record.age) : '';
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = addModal.querySelector('.patient-modal-header p');
    const saveButton = addModal.querySelector('.btn-save-record');
    if (modalTitle) modalTitle.textContent = record ? 'Edit Patient Record' : 'Add New Patient';
    if (modalDescription) modalDescription.textContent = record ? 'Update the patient details below' : 'Fill in the details below to register a new patient';
    if (saveButton) saveButton.textContent = record ? 'Save Changes' : 'Save Record';
    progressSections.forEach(section => delete section.dataset.progressTouched);
    updateDiagnosisValidity();
    updatePatientProgress();
    addModal.classList.add('is-open');
    addModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    const scrollArea = addModal.querySelector('.patient-form-scroll');
    if (scrollArea) scrollArea.scrollTop = 0;
    window.setTimeout(() => {
      const firstField = form.querySelector('input:not([type="radio"]):not([type="checkbox"])');
      if (firstField) firstField.focus();
    }, 0);
  }

  function closeModal() {
    if (!addModal) return;
    addModal.classList.remove('is-open');
    addModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  const addButton = document.getElementById('btnAddRecord');
  const closeButton = document.getElementById('closePatientModal');
  const cancelButton = document.getElementById('cancelPatientModal');
  if (addButton) addButton.addEventListener('click', openModal);
  if (closeButton) closeButton.addEventListener('click', closeModal);
  if (cancelButton) cancelButton.addEventListener('click', closeModal);
  if (addModal) {
    addModal.addEventListener('click', event => {
      if (event.target === addModal) closeModal();
    });
  }

  const birthdateInput = document.getElementById('birthdate');
  const ageInput = document.getElementById('patientAge');
  if (birthdateInput && ageInput) {
    birthdateInput.addEventListener('change', () => {
      if (!birthdateInput.value) {
        ageInput.value = '';
        return;
      }
      const birthdate = new Date(`${birthdateInput.value}T00:00:00`);
      let age = today.getFullYear() - birthdate.getFullYear();
      const monthDifference = today.getMonth() - birthdate.getMonth();
      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthdate.getDate())) age--;
      ageInput.value = String(Math.max(0, age));
    });
  }

  const diagnosisChecks = form ? Array.from(form.querySelectorAll('input[name="diagnosis"]')) : [];
  function updateDiagnosisValidity() {
    if (diagnosisChecks.length === 0) return;
    diagnosisChecks[0].setCustomValidity(diagnosisChecks.some(input => input.checked) ? '' : 'Select TB Disease or TB Infection.');
  }
  diagnosisChecks.forEach(input => input.addEventListener('change', updateDiagnosisValidity));

  const progressSections = form
    ? Array.from(form.querySelectorAll('[data-progress-section]'))
    : [];
  const progressTitles = {
    'facility-registration': 'I. Facility Registration',
    'case-finding': 'II. Case Finding / Notification',
    'treatment-history': 'III. Treatment History & Vital Sign',
    'screening': 'IV. HIV and Diabetes Screening',
    'emergency-contact': 'V. Emergency Contact',
    'treatment-plan': 'VI. Treatment Plan',
    'monitoring-schedule': 'VII. Monitoring Schedule'
  };

  function isSectionComplete(section) {
    const requiredControls = Array.from(section.querySelectorAll('[required]'))
      .filter(control => !control.disabled);
    const requiredCheckboxGroups = Array.from(section.querySelectorAll('[data-required-group]'));
    const hasRequirements = requiredControls.length > 0 || requiredCheckboxGroups.length > 0;
    if (!hasRequirements && section.dataset.progressTouched !== 'true') return false;
    const checkedRadioGroups = new Set();

    for (const control of requiredControls) {
      if (control.type === 'radio') {
        if (checkedRadioGroups.has(control.name)) continue;
        checkedRadioGroups.add(control.name);
        const group = Array.from(section.querySelectorAll('input[type="radio"]'))
          .filter(radio => radio.name === control.name);
        if (!group.some(radio => radio.checked)) return false;
      } else if (control.type === 'checkbox') {
        if (!control.checked) return false;
      } else if (!control.value.trim() || !control.validity.valid) {
        return false;
      }
    }

    if (!requiredCheckboxGroups.every(group =>
      group.querySelector('input[type="checkbox"]:checked')
    )) return false;

    return !Array.from(section.querySelectorAll('input, select, textarea'))
      .some(control => !control.disabled && !control.validity.valid);
  }

  function markProgressSectionTouched(event) {
    if (event.target instanceof Element) {
      const section = event.target.closest('[data-progress-section]');
      if (section) section.dataset.progressTouched = 'true';
    }
    updatePatientProgress();
  }

  function updatePatientProgress() {
    if (!form) return;

    const completedSections = progressSections.filter(isSectionComplete).length;
    const totalSections = progressSections.length;
    const percentage = totalSections ? Math.round((completedSections / totalSections) * 100) : 0;
    const remaining = progressSections
      .filter(section => !isSectionComplete(section))
      .map(section => progressTitles[section.dataset.progressSection] || 'Required section');
    const summary = document.getElementById('patientProgressSummary');
    const percent = document.getElementById('patientProgressPercent');
    const track = document.getElementById('patientProgressTrack');
    const bar = document.getElementById('patientProgressBar');
    const note = document.getElementById('patientProgressNote');
    const draftStatus = document.getElementById('patientDraftStatus');

    if (summary) {
      summary.textContent = `${completedSections} of ${totalSections} sections complete`;
    }
    if (percent) percent.textContent = `${percentage}%`;
    if (track) {
      track.setAttribute('aria-valuenow', String(percentage));
      track.setAttribute('aria-valuetext', `${completedSections} of ${totalSections} sections complete`);
    }
    if (bar) bar.style.width = `${percentage}%`;
    if (note) {
      note.textContent = remaining.length
        ? `${remaining.length} section${remaining.length === 1 ? '' : 's'} left: ${remaining.join(', ')}`
        : 'All required sections are complete.';
    }
    if (draftStatus) {
      draftStatus.textContent = percentage === 100
        ? 'Ready to save'
        : 'Progress updates as you complete each section';
    }
  }

  if (form) {
    form.addEventListener('input', markProgressSectionTouched);
    form.addEventListener('change', event => {
      updateDiagnosisValidity();
      markProgressSectionTouched(event);
    });
  }

  function getAddressBarangay(address) {
    address = String(address || '');
    const knownBarangays = ['San Mateo', 'San Juan', 'San Ramon', 'Gogon', 'Gugon', 'San Jose', 'San Pablo', 'Santo Domingo', 'San Marcos', 'Sua', 'Marupit', 'San Roque'];
    const match = knownBarangays.find(name => address.toLowerCase().includes(name.toLowerCase()));
    return match || address.split(',')[0].trim();
  }

  function makeRecordId() {
    const year = String(today.getFullYear()).slice(-2);
    let id;
    do {
      id = `PT-${year}-${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
    } while (records.some(record => record.id === id));
    return id;
  }

  function getLocalDateValue(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function collectFormData() {
    const data = Object.fromEntries(new FormData(form).entries());
    data.diagnosis = new FormData(form).getAll('diagnosis');
    data.testType = new FormData(form).getAll('testType');
    data.comorbidities = new FormData(form).getAll('comorbidities');
    return data;
  }

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      updateDiagnosisValidity();
      if (!form.reportValidity()) return;

      const data = collectFormData();
      const fullName = [data.firstName, data.middleName, data.lastName, data.suffix].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
      const middleName = String(data.middleName || '').trim();
      const displayName = [
        data.firstName,
        middleName ? `${middleName.charAt(0).toUpperCase()}.` : '',
        data.lastName,
        data.suffix
      ].filter(Boolean).join(' ');
      const address = data.currentAddress.trim();
      const existingRecord = editingRecordId
        ? records.find(item => item.id === editingRecordId)
        : null;
      const record = {
        ...(existingRecord || {}),
        ...data,
        id: editingRecordId || makeRecordId(),
        name: fullName,
        fullName,
        displayName,
        address,
        barangay: getAddressBarangay(address),
        sex: data.sex,
        age: data.age ? Number(data.age) : null,
        lastConsult: existingRecord ? existingRecord.lastConsult : getLocalDateValue(today),
        status: existingRecord ? existingRecord.status : 'Ongoing Treatment',
        updatedAt: getLocalDateValue(today)
      };
      const nextRecords = editingRecordId
        ? records.map(item => item.id === editingRecordId ? record : item)
        : [...records, record];
      if (!saveRecords(nextRecords)) return;

      renderTable();
      closeModal();
      editingRecordId = null;
      showRecordNotice(
        existingRecord ? 'updated' : 'created',
        existingRecord ? 'Patient Record is updated' : 'New Patient Record is Added to the System',
      );
    });
  }

  function profileValue(record, key) {
    const value = record[key];
    if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
    if (value == null || value === '') return '—';
    const text = String(value);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? formatDate(text) : text;
  }

  function createProfileSection(title) {
    const section = document.createElement('section');
    section.className = 'patient-profile-section';
    const heading = document.createElement('h3');
    heading.textContent = title;
    section.appendChild(heading);
    return section;
  }

  function addProfileFields(section, fields) {
    const grid = document.createElement('div');
    grid.className = 'patient-profile-grid';
    fields.forEach(([label, key, wide]) => {
      const item = document.createElement('div');
      item.className = `patient-profile-field${wide ? ' wide' : ''}`;
      const title = document.createElement('strong');
      title.textContent = label;
      const value = document.createElement('span');
      value.textContent = profileValue(currentProfileRecord, key);
      item.append(title, value);
      grid.appendChild(item);
    });
    section.appendChild(grid);
  }

  function addProfileTable(section, title, headers, rows) {
    const subheading = document.createElement('h4');
    subheading.textContent = title;
    section.appendChild(subheading);
    const wrap = document.createElement('div');
    wrap.className = 'patient-profile-table-wrap';
    const table = document.createElement('table');
    table.className = 'patient-profile-table';
    const head = document.createElement('thead');
    const headingRow = document.createElement('tr');
    headers.forEach(label => {
      const cell = document.createElement('th');
      cell.textContent = label;
      headingRow.appendChild(cell);
    });
    head.appendChild(headingRow);
    table.appendChild(head);
    const body = document.createElement('tbody');
    rows.forEach(row => {
      const tableRow = document.createElement('tr');
      row.forEach(value => {
        const cell = document.createElement('td');
        cell.textContent = value == null || value === '' ? '—' : String(value);
        tableRow.appendChild(cell);
      });
      body.appendChild(tableRow);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    section.appendChild(wrap);
  }

  let currentProfileRecord = null;

  function showPatientDetails(record) {
    if (!detailsModal || !detailsSummary || !detailsContent) return;
    currentProfileRecord = record;
    detailsSummary.replaceChildren();
    detailsContent.replaceChildren();
    const summary = document.createElement('header');
    summary.className = 'patient-profile-summary';
    const avatar = document.createElement('iconify-icon');
    avatar.className = 'patient-profile-avatar';
    avatar.setAttribute('icon', 'mdi:account-circle');
    const identity = document.createElement('div');
    identity.className = 'patient-profile-identity';
    const caseNumber = document.createElement('div');
    caseNumber.className = 'patient-profile-case';
    caseNumber.textContent = `Case No.: ${profileValue(record, 'tbCaseNumber')}`;
    const name = document.createElement('h2');
    name.className = 'patient-profile-name';
    name.textContent = record.displayName || record.fullName || record.name || 'Patient';
    const meta = document.createElement('div');
    meta.className = 'patient-profile-meta';
    [
      ['mdi:account-group', record.sex || '—'],
      ['mdi:cake-variant', record.age == null ? 'Age not provided' : `${record.age} years old`],
      ['mdi:map-marker', record.address || 'Address not provided']
    ].forEach(([iconName, text]) => {
      const item = document.createElement('span');
      item.className = 'patient-profile-meta-item';
      const icon = document.createElement('iconify-icon');
      icon.setAttribute('icon', iconName);
      const label = document.createElement('span');
      label.textContent = text;
      item.append(icon, label);
      meta.appendChild(item);
    });
    const tags = document.createElement('div');
    tags.className = 'patient-profile-tags';
    const statusTag = record.status === 'Ongoing Treatment' ? 'On-Track' : record.status || 'Status unavailable';
    [statusTag, record.currentPhase || record.regimenType || 'Treatment phase unavailable'].forEach((text, index) => {
      const tag = document.createElement('span');
      tag.className = `patient-profile-tag${index === 1 ? ' phase' : ''}`;
      tag.textContent = text;
      tags.appendChild(tag);
    });
    identity.append(caseNumber, name, meta, tags);
    const status = document.createElement('div');
    status.className = 'patient-profile-status';
    const statusLabel = document.createElement('strong');
    statusLabel.textContent = record.status || 'Status unavailable';
    const updated = document.createElement('span');
    updated.textContent = `Last updated: ${profileValue(record, 'updatedAt')}`;
    status.append(statusLabel, updated);
    summary.append(avatar, identity, status);
    detailsSummary.appendChild(summary);

    const demographics = createProfileSection('I. Case Finding & Core Demographics');
    addProfileFields(demographics, [
      ['Diagnosing Facility', 'diagnosingFacility'], ['NPT Facility Code', 'ntpCode'],
      ['Province / HUC', 'provinceHuc'], ['Region', 'region'],
      ['Full Name', 'fullName', true], ['Birthdate', 'birthdate'],
      ['Age', 'age'], ['Sex', 'sex'], ['Civil Status', 'civilStatus'],
      ['Permanent Address', 'permanentAddress', true], ['Current Address', 'currentAddress', true],
      ['Contact Number', 'contactNumber'], ['Nationality', 'nationality']
    ]);
    detailsContent.appendChild(demographics);

    const screening = createProfileSection('II. Screening Information');
    addProfileFields(screening, [
      ['Referred By', 'referredBy'], ['Mode of Screening', 'modeScreening'],
      ['Referral Location Type', 'referralLocationType'], ['Date of Screening', 'dateScreening']
    ]);
    detailsContent.appendChild(screening);

    const laboratory = createProfileSection('III. Laboratory Test');
    addProfileTable(laboratory, 'Laboratory Results', ['Test Conducted', 'Collection / Examination', 'Results', 'Remarks'], [
      ['Xpert MTB/RIF', profileValue(record, 'xpertDate'), profileValue(record, 'xpertResult'), profileValue(record, 'xpertAssay')],
      [profileValue(record, 'testType') === '—' ? 'Smear Microscopy / TB LAMP' : profileValue(record, 'testType'), profileValue(record, 'smearDate'), profileValue(record, 'smearResult'), '—'],
      ['Chest X-ray', profileValue(record, 'xrayDate'), profileValue(record, 'xrayResult'), '—'],
      ['Tuberculin skin test', profileValue(record, 'skinTestDate'), profileValue(record, 'skinTestResult'), '—'],
      [profileValue(record, 'otherTestName'), profileValue(record, 'otherTestDate'), profileValue(record, 'otherTestResult'), '—']
    ]);
    detailsContent.appendChild(laboratory);

    const diagnosis = createProfileSection('IV. Diagnosis & TB Disease Classification');
    addProfileFields(diagnosis, [
      ['TB Case Number', 'tbCaseNumber'], ['Date of Diagnosis', 'dateDiagnosis'],
      ['Date of Notification', 'dateNotification'], ['Diagnosis', 'diagnosis'],
      ['Bacteriological Status', 'bacteriologicalStatus'], ['Anatomical Site', 'anatomicalSite'],
      ['Drug Resistance', 'drugResistanceStatus'], ['Registration Group', 'registrationGroup'],
      ['History of TB Treatment', 'treatmentHistory'], ['Height', 'height'],
      ['Weight', 'weight'], ['Attending Physician', 'attendingPhysician', true],
      ['HIV Status', 'hivStatus'], ['HIV Test Date', 'hivExamDate'],
      ['On ART', 'onArt'], ['On CPT', 'onCpt'],
      ['Diabetes Screening', 'diabetesScreening'], ['FBS (mg/dL)', 'fbsResults'],
      ['Known Co-Morbidities', 'comorbidities', true]
    ]);
    detailsContent.appendChild(diagnosis);

    const treatment = createProfileSection('V. Treatment Regimen & Administration of Drugs');
    addProfileFields(treatment, [
      ['Regimen Type', 'regimenType'], ['Treatment Start Date', 'treatmentStart'],
      ['Regimen', 'regimen'], ['Treatment Location', 'treatmentLocation'],
      ['Intensive Phase Start', 'intensiveStart'], ['Expected Intensive Phase End', 'expectedIpEnd'],
      ['Continuation Phase Start', 'continuationStart'], ['Expected Continuation Phase End', 'expectedCpEnd'],
      ['Treatment Support', 'treatmentSupport'], ['Supporter Name', 'supporterName'],
      ['Support Contact No.', 'supporterContact'], ['Schedule', 'scheduleTreatment'],
      ['DAT Supported', 'datSupported']
    ]);
    addProfileTable(treatment, 'Drug Administration', ['Drug', 'Strength / Dose', 'Unit', 'Daily Dose', 'Status'], [
      ['4FDC', '—', 'Tablets', profileValue(record, 'dose4fdc'), profileValue(record, 'status')],
      ['2FDC', '—', 'Tablets', profileValue(record, 'dose2fdc'), '—'],
      ['H / R / Z / E', '—', 'mg', [record.doseH, record.doseR, record.doseZ, record.doseE].filter(Boolean).join(' / ') || '—', '—']
    ]);
    detailsContent.appendChild(treatment);

    const contacts = createProfileSection('VI. Close Contact');
    addProfileTable(contacts, 'Household / Emergency Contact', ['Name', 'Age', 'Sex', 'Relationship', 'Initial Screening', 'Follow-up'], [
      [profileValue(record, 'emergencyName'), profileValue(record, 'emergencyAge'), profileValue(record, 'emergencySex'), profileValue(record, 'emergencyRelationship'), profileValue(record, 'emergencyScreening'), profileValue(record, 'emergencyFollowup')]
    ]);
    detailsContent.appendChild(contacts);

    const monitoring = createProfileSection('VII. Pre & Post-Treatment Monitoring');
    addProfileTable(monitoring, 'Sputum Monitoring', ['Period', 'Date Collected', 'Smear / TB LAMP', 'Xpert MTB/RIF'], [
      ['Next Follow-up', profileValue(record, 'nextSputum'), profileValue(record, 'plannedSputumTest'), '—']
    ]);
    addProfileTable(monitoring, 'Post-Treatment Follow-up', ['Months After Treatment', 'Date / Status', 'CXR Findings', 'Smear / Xpert', 'TBC & DST'], [
      ['6 Months', profileValue(record, 'postTreatmentSixMonthDate'), profileValue(record, 'postTreatmentSixMonthCxr'), profileValue(record, 'postTreatmentSixMonthSputum'), profileValue(record, 'postTreatmentSixMonthDst')],
      ['12 Months', profileValue(record, 'postTreatmentTwelveMonthDate'), profileValue(record, 'postTreatmentTwelveMonthCxr'), profileValue(record, 'postTreatmentTwelveMonthSputum'), profileValue(record, 'postTreatmentTwelveMonthDst')]
    ]);
    addProfileTable(monitoring, 'Clinical Monitoring Schedule', ['Next Sputum Collection', 'Planned Test', 'Next X-Ray', 'Next Clinical Review'], [
      [profileValue(record, 'nextSputum'), profileValue(record, 'plannedSputumTest'), profileValue(record, 'nextXray'), profileValue(record, 'nextClinicalReview')]
    ]);
    detailsContent.appendChild(monitoring);

    const appointments = createProfileSection('VIII. Appointments & Rescheduling History');
    addProfileTable(appointments, 'Schedule History', ['Change Date', 'Previous Schedule', 'New Schedule', 'Time', 'Reason / Notification'], [
      ['—', '—', profileValue(record, 'nextClinicalReview'), profileValue(record, 'preferredAppointment'), '—']
    ]);
    detailsContent.appendChild(appointments);
    detailsModal.classList.add('is-open');
    detailsModal.setAttribute('aria-hidden', 'false');
  }

  if (tbody) {
    tbody.addEventListener('click', event => {
      const button = event.target.closest('[data-action="view"]');
      if (!button) return;
      const record = records.find(item => item.id === button.dataset.recordId);
      if (record) showPatientDetails(record);
    });
  }

  const closeDetailsButton = document.getElementById('closePatientDetails');
  function closeDetails() {
    if (!detailsModal) return;
    if (queueReturnUrl) {
      window.location.assign(queueReturnUrl);
      return;
    }
    detailsModal.classList.remove('is-open');
    detailsModal.setAttribute('aria-hidden', 'true');
  }
  if (closeDetailsButton) closeDetailsButton.addEventListener('click', closeDetails);
  const editRecordButton = document.getElementById('editPatientRecord');
  if (editRecordButton) {
    editRecordButton.addEventListener('click', () => {
      if (!currentProfileRecord) return;
      const record = currentProfileRecord;
      closeDetails();
      openModal(record);
    });
  }
  const exportRecordButton = document.getElementById('exportPatientRecord');
  if (exportRecordButton) {
    exportRecordButton.addEventListener('click', () => {
      if (!currentProfileRecord) return;
      const escapeCsv = value => `"${String(Array.isArray(value) ? value.join(', ') : value == null ? '' : value).replace(/"/g, '""')}"`;
      const csv = ['Field,Value', ...Object.entries(currentProfileRecord).map(([key, value]) => `${escapeCsv(key)},${escapeCsv(value)}`)].join('\r\n');
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${String(currentProfileRecord.id || 'tbcare-patient').replace(/[^a-z0-9_-]/gi, '_')}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    });
  }
  if (detailsModal) {
    detailsModal.addEventListener('click', event => {
      if (event.target === detailsModal) closeDetails();
    });
  }

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeModal();
      closeDetails();
    }
  });

  renderTable();

  const queuedPatient = consumeResidentCareQueuePatientDetail('TBCare');
  if (queuedPatient) {
    queueReturnUrl = queuedPatient.returnUrl;
    showPatientDetails({
      id: queuedPatient.id,
      name: queuedPatient.name,
      displayName: queuedPatient.name,
      fullName: queuedPatient.name,
      sex: queuedPatient.gender,
      age: queuedPatient.age,
      address: queuedPatient.address,
      tbCaseNumber: queuedPatient.id,
      status: `Queue: ${queuedPatient.status}`,
      currentPhase: queuedPatient.treatmentForm || queuedPatient.category,
      regimenType: queuedPatient.treatmentForm || queuedPatient.category,
      updatedAt: `Queue #${String(queuedPatient.queueNo).padStart(2, '0')} · ${queuedPatient.consultation}`,
    });
    activateQueueNavigation('TBCare');
    if (editRecordButton instanceof HTMLButtonElement) {
      editRecordButton.disabled = true;
      editRecordButton.title = 'This queue profile is view-only until it is linked to a TBCare record.';
    }
  }
});