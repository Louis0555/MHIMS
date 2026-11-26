import { createQueuePatientReturnUrl, restoreQueuePatientSelection, saveResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - NutriTrack Queuing Logic
 * Script: js/clinical/nutritrack/queuing.js
 * ==============================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// Sample child queue data (NutriTrack-specific)
// ---------------------------------------------------------------------------
let patientQueue = [
  {
    queueNo: 1,
    id: 'NTR-2026-001',
    name: 'Juan Dela Cruz',
    age: 6,
    gender: 'Male',
    address: 'San Mateo, Camaligan',
    consultation: 'Vaccinations',
    status: 'In Consultation',
    notes: ''
  },
  {
    queueNo: 2,
    id: 'NTR-2026-002',
    name: 'Marites Cruz',
    age: 5,
    gender: 'Female',
    address: 'San Mateo, Camaligan',
    consultation: 'Nutrition Assessment',
    status: 'Urgent',
    notes: ''
  },
  {
    queueNo: 3,
    id: 'NTR-2026-003',
    name: 'Ramon Garcia',
    age: 4,
    gender: 'Male',
    address: 'Sua, Camaligan',
    consultation: 'Checkup',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 4,
    id: 'NTR-2026-004',
    name: 'Alvin Torres',
    age: 7,
    gender: 'Male',
    address: 'San Ramon, Camaligan',
    consultation: 'Deworming',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 5,
    id: 'NTR-2026-005',
    name: 'Caros Mendoza',
    age: 6,
    gender: 'Male',
    address: 'San Roque, Camaligan',
    consultation: 'Vaccinations',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 6,
    id: 'NTR-2026-006',
    name: 'Elena Garcia',
    age: 8,
    gender: 'Female',
    address: 'San Marcos, Camaligan',
    consultation: 'Checkup',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 7,
    id: 'NTR-2026-007',
    name: 'Jessa Lim',
    age: 5,
    gender: 'Female',
    address: 'Marupit, Camaligan',
    consultation: 'Nutrition Assessment',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 8,
    id: 'NTR-2026-008',
    name: 'Luz Reyes',
    age: 3,
    gender: 'Female',
    address: 'San Pablo, Camaligan',
    consultation: 'Deworming',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 9,
    id: 'NTR-2026-009',
    name: 'Ana Mendoza',
    age: 9,
    gender: 'Female',
    address: 'Sua, Camaligan',
    consultation: 'Checkup',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 10,
    id: 'NTR-2026-010',
    name: 'Luna Binangkal',
    age: 4,
    gender: 'Female',
    address: 'San Roque, Camaligan',
    consultation: 'Vaccinations',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 11,
    id: 'NTR-2026-011',
    name: 'Maya Flores',
    age: 2,
    gender: 'Female',
    address: 'San Juan, Camaligan',
    consultation: 'Vaccinations',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 12,
    id: 'NTR-2026-012',
    name: 'Luis Perez',
    age: 10,
    gender: 'Male',
    address: 'Marupit, Camaligan',
    consultation: 'Nutrition Assessment',
    status: 'Urgent',
    notes: ''
  },
  {
    queueNo: 13,
    id: 'NTR-2026-013',
    name: 'Sofia Dizon',
    age: 8,
    gender: 'Female',
    address: 'San Ramon, Camaligan',
    consultation: 'Checkup',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 14,
    id: 'NTR-2026-014',
    name: 'Gabriel Reyes',
    age: 6,
    gender: 'Male',
    address: 'San Roque, Camaligan',
    consultation: 'Deworming',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 15,
    id: 'NTR-2026-015',
    name: 'Chloe Mendoza',
    age: 4,
    gender: 'Female',
    address: 'Sua, Camaligan',
    consultation: 'Vaccinations',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 16,
    id: 'NTR-2026-016',
    name: 'Daniel Cruz',
    age: 11,
    gender: 'Male',
    address: 'San Mateo, Camaligan',
    consultation: 'Checkup',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 17,
    id: 'NTR-2026-017',
    name: 'Aira Lim',
    age: 3,
    gender: 'Female',
    address: 'San Pablo, Camaligan',
    consultation: 'Nutrition Assessment',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 18,
    id: 'NTR-2026-018',
    name: 'Enzo Santos',
    age: 7,
    gender: 'Male',
    address: 'Gogon-Dugcal, Camaligan',
    consultation: 'Deworming',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 19,
    id: 'NTR-2026-019',
    name: 'Mia Cabral',
    age: 5,
    gender: 'Female',
    address: 'San Marcos, Camaligan',
    consultation: 'Checkup',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 20,
    id: 'NTR-2026-020',
    name: 'Noel Garcia',
    age: 9,
    gender: 'Male',
    address: 'San Mateo, Camaligan',
    consultation: 'Vaccinations',
    status: 'Waiting',
    notes: ''
  },
];

let selectedPatient = restoreQueuePatientSelection(patientQueue);
let completedCount  = 12;
let currentFilter   = 'All';
let searchQuery     = '';
let urgentOnlyMode  = false;

// ---------------------------------------------------------------------------
// Initialise on DOM Ready
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  renderQueueTable();
  updateKPIs();
  renderCurrentPatient();
  setupEventListeners();
});

// ---------------------------------------------------------------------------
// KPI Counters
// ---------------------------------------------------------------------------
function updateKPIs() {
  const total      = patientQueue.length;
  const inConsult  = patientQueue.filter(p => p.status === 'In Consultation').length;
  const waiting    = patientQueue.filter(p => p.status === 'Waiting' || p.status === 'Urgent').length;

  document.getElementById('kpiTotal').textContent     = String(total);
  document.getElementById('kpiServed').textContent    = String(inConsult);
  document.getElementById('kpiWaiting').textContent   = String(waiting);
  document.getElementById('kpiCompleted').textContent = String(completedCount);
}

// ---------------------------------------------------------------------------
// Queue Table Renderer
// ---------------------------------------------------------------------------
function renderQueueTable() {
  const tbody = document.getElementById('queueTableBody');
  if (!tbody) return;

  tbody.innerHTML = '';

  const filtered = patientQueue.filter(patient => {
    // Consultation filter
    const matchesConsult = currentFilter === 'All' ||
      patient.consultation.toLowerCase().replace(/[^a-z0-9]/g, '') === currentFilter.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Urgent only toggle
    const matchesUrgent = !urgentOnlyMode || patient.status === 'Urgent';

    // Search filter
    let matchesSearch = true;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch =
        patient.name.toLowerCase().includes(q)         ||
        patient.address.toLowerCase().includes(q)      ||
        patient.consultation.toLowerCase().includes(q) ||
        patient.gender.toLowerCase().includes(q)       ||
        patient.queueNo.toString().includes(q)         ||
        patient.id.toLowerCase().includes(q);
    }

    return matchesConsult && matchesUrgent && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center;padding:28px;color:#64748b;font-weight:600;">
          No queuing records found matching your filter criteria.
        </td>
      </tr>`;
    return;
  }

  const groups = [
    { title: 'IN CONSULTATION', patients: filtered.filter(patient => patient.status === 'In Consultation') },
    { title: 'WAITING', patients: filtered.filter(patient => patient.status === 'Waiting' || patient.status === 'Urgent') },
    { title: 'OTHER', patients: filtered.filter(patient => patient.status !== 'In Consultation' && patient.status !== 'Waiting' && patient.status !== 'Urgent') }
  ];

  groups.forEach(group => {
    if (group.patients.length === 0) return;

    const sectionRow = document.createElement('tr');
    sectionRow.className = 'queue-group-row';
    const sectionCell = sectionRow.insertCell();
    sectionCell.colSpan = 6;
    sectionCell.textContent = `${group.title} · ${group.patients.length}`;
    tbody.appendChild(sectionRow);

    group.patients.forEach(patient => {
    const tr = document.createElement('tr');
    if (selectedPatient && selectedPatient.queueNo === patient.queueNo) {
      tr.classList.add('selected');
    }

    let badgeClass = 'waiting';
    if (patient.status === 'In Consultation') badgeClass = 'in-consultation';
    if (patient.status === 'Urgent')          badgeClass = 'urgent';
    if (patient.status === 'Completed')       badgeClass = 'completed';

    tr.innerHTML = `
      <td class="td-queue-num">${patient.queueNo}</td>
      <td>
        <div class="patient-info-wrap">
          <span class="patient-name">${patient.name}</span>
          <span class="patient-address">${patient.address}</span>
        </div>
      </td>
      <td class="td-consultation">${patient.consultation}</td>
      <td class="td-gender">${patient.gender}</td>
      <td style="text-align:center;">
        <span class="status-badge ${badgeClass}">${patient.status}</span>
      </td>
      <td class="td-action">
        <button type="button" class="action-menu-btn" data-id="${patient.queueNo}" title="View Details">
          <iconify-icon icon="bi:three-dots-vertical"></iconify-icon>
        </button>
      </td>`;

    // Row action button opens details modal for that patient
    const actionBtn = tr.querySelector('.action-menu-btn');
    if (actionBtn) {
      actionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedPatient = patient;
        renderCurrentPatient();
        renderQueueTable();
        const vBtn = document.getElementById('btnViewDetails');
        if (vBtn) vBtn.click();
      });
    }

    // Row click → select patient
    tr.addEventListener('click', (e) => {
      if (e.target instanceof Element && e.target.closest('.action-menu-btn')) return;
      selectedPatient = patient;
      renderCurrentPatient();
      renderQueueTable();
    });

    tbody.appendChild(tr);
    });
  });
}

// ---------------------------------------------------------------------------
// Current Patient Side Panel
// ---------------------------------------------------------------------------
function renderCurrentPatient() {
  const cpName             = document.getElementById('cpName');
  const cpDemographics     = document.getElementById('cpDemographics');
  const cpConsultationTag  = document.getElementById('cpConsultationTag');
  const cpGenderTag        = document.getElementById('cpGenderTag');
  const cpQueueNo          = document.getElementById('cpQueueNo');
  const cpConsultation     = document.getElementById('cpConsultation');
  const cpQueueNoHeader    = document.getElementById('cpQueueNoHeader');

  if (!selectedPatient) {
    cpName.textContent            = '—';
    cpDemographics.textContent    = '—';
    cpConsultationTag.textContent = '—';
    cpGenderTag.textContent       = '';
    cpQueueNo.textContent         = '—';
    cpConsultation.textContent    = '—';
    cpQueueNoHeader.textContent  = '—';
    return;
  }

  cpName.textContent            = selectedPatient.name;
  cpDemographics.textContent    = `${selectedPatient.age} years old`;
  cpConsultationTag.textContent = selectedPatient.consultation;
  cpGenderTag.textContent       = selectedPatient.gender;
  cpQueueNo.textContent         = String(selectedPatient.queueNo);
  cpConsultation.textContent    = selectedPatient.consultation;
  cpQueueNoHeader.textContent  = String(selectedPatient.queueNo).padStart(2, '0');
}

// ---------------------------------------------------------------------------
// All Event Listeners
// ---------------------------------------------------------------------------
function setupEventListeners() {

  // ── Search ──────────────────────────────────────────────────────────────
  const searchInput = document.getElementById('queueSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      searchQuery = (e.target as HTMLInputElement).value;
      renderQueueTable();
    });
  }

  // ── Filter Dropdown ─────────────────────────────────────────────────────
  const filterBtn  = document.getElementById('filterDropdownBtn');
  const filterMenu = document.getElementById('filterDropdownMenu');

  if (filterBtn && filterMenu) {
    filterBtn.addEventListener('click', e => {
      e.stopPropagation();
      filterMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => filterMenu.classList.remove('show'));

    filterMenu.querySelectorAll<HTMLAnchorElement>('.filter-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const val = item.dataset.consultation;
        if (!val) return;
        currentFilter = val;
        filterMenu.querySelectorAll('.filter-menu-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        filterBtn.innerHTML = `<span>${val}</span><iconify-icon icon="material-symbols:arrow-drop-down-rounded" width="20" height="20"></iconify-icon>`;
        filterMenu.classList.remove('show');
        renderQueueTable();
      });
    });
  }

  // ── Urgent Only Toggle ───────────────────────────────────────────────────
  const urgentToggle = document.getElementById('urgentOnlyToggle');
  if (urgentToggle) {
    urgentToggle.addEventListener('click', () => {
      urgentOnlyMode = !urgentOnlyMode;
      urgentToggle.setAttribute('aria-checked', urgentOnlyMode.toString());
      renderQueueTable();
    });
  }

  // ── Call Next Patient ────────────────────────────────────────────────────
  const callNextBtn = document.getElementById('btnCallNext');
  if (callNextBtn) {
    callNextBtn.addEventListener('click', () => {
      const next = patientQueue.find(p => p.status === 'Urgent' || p.status === 'Waiting');
      if (next) {
        next.status     = 'In Consultation';
        selectedPatient = next;
        updateKPIs();
        renderCurrentPatient();
        renderQueueTable();
        showToast(`In consultation: ${next.name}`, 'Queueing updated.', 'success');
      } else {
        showToast('Queue is clear', 'All queued patients have been called or are currently being served.', 'info');
      }
    });
  }

  // ── Mark as In Consultation ──────────────────────────────────────────────
  const markConsultBtn = document.getElementById('btnMarkConsultation');
  if (markConsultBtn) {
    markConsultBtn.addEventListener('click', () => {
      if (!selectedPatient) return;
      selectedPatient.status = 'In Consultation';
      updateKPIs();
      renderCurrentPatient();
      renderQueueTable();
      showToast(`In consultation: ${selectedPatient.name}`, 'Queueing updated.', 'success');
    });
  }

  // ── Mark as Completed ────────────────────────────────────────────────────
  const markCompletedBtn = document.getElementById('btnMarkCompleted');
  if (markCompletedBtn) {
    markCompletedBtn.addEventListener('click', () => {
      if (!selectedPatient) return;

      const finishedPatient = selectedPatient;
      // Increment completed stat
      completedCount++;

      // Remove from current active queue or archive
      patientQueue = patientQueue.filter(p => p.queueNo !== finishedPatient.queueNo);

      // Re-index remaining queue numbers
      patientQueue.forEach((p, idx) => {
        p.queueNo = idx + 1;
      });

      // Automatically select the next patient
      selectedPatient = patientQueue.length > 0 ? patientQueue[0] : null;

      updateKPIs();
      renderCurrentPatient();
      renderQueueTable();
      showToast(`Completed: ${finishedPatient.name}`, 'Queueing updated.', 'success');
    });
  }

  // ── Skip Patient ─────────────────────────────────────────────────────────
  const skipBtn = document.getElementById('btnSkipPatient');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      if (!selectedPatient || patientQueue.length <= 1) return;

      const currentIndex = patientQueue.findIndex(p => p.queueNo === selectedPatient.queueNo);
      if (currentIndex !== -1) {
        // Move selected patient to the bottom of the queue
        const [skipped] = patientQueue.splice(currentIndex, 1);
        patientQueue.push(skipped);

        // Re-index queue numbers
        patientQueue.forEach((p, idx) => {
          p.queueNo = idx + 1;
        });

        // Set the new first waiting patient as selected
        selectedPatient = patientQueue[0];

        updateKPIs();
        renderCurrentPatient();
        renderQueueTable();
        showToast(`Skipped: ${skipped.name}`, 'Moved to the end of the queue.', 'info');
      }
    });
  }

  // Route queue details to the NutriTrack patient profile
  const viewDetailsBtn = document.getElementById('btnViewDetails');
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      const patient = selectedPatient || (patientQueue.length > 0 ? patientQueue[0] : null);
      if (!patient) return;
      selectedPatient = patient;
      try {
        saveResidentCareQueuePatientDetail({
          module: 'Nutri',
          category: 'Nutri',
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          address: patient.address,
          consultation: patient.consultation,
          status: patient.status,
          queueNo: patient.queueNo,
          returnUrl: createQueuePatientReturnUrl(patient.queueNo),
        });
        window.location.assign('childrecords.html');
      } catch (error) {
        console.error("Unable to open the selected patient's NutriTrack details.", error);
        alert("Unable to open the patient's NutriTrack details. Please try again.");
      }
    });
  }

  // ── Notification button ──────────────────────────────────────────────────
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      showToast('Queue notifications', 'You have 1 urgent nutrition assessment in queue.', 'info');
    });
  }

  const queueNoticeClose = document.getElementById('queueNoticeClose');
  queueNoticeClose?.addEventListener('click', () => {
    const queueNotice = document.getElementById('queueNotice');
    if (queueNotice) queueNotice.hidden = true;
    if (toastTimer) clearTimeout(toastTimer);
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Status banner used for queue actions and notifications. */
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(title: string, message: string, type: 'success' | 'info' = 'success') {
  const toast = document.getElementById('queueNotice');
  const titleElement = document.getElementById('queueNoticeTitle');
  const messageElement = document.getElementById('queueNoticeMessage');
  const icon = document.getElementById('queueNoticeIcon');
  if (!toast || !titleElement || !messageElement || !icon) return;

  titleElement.textContent = title;
  messageElement.textContent = message;
  toast.classList.toggle('is-info', type === 'info');
  icon.setAttribute('icon', type === 'info' ? 'mdi:information' : 'bi:person-fill-check');
  toast.hidden = false;

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 5000);
}
