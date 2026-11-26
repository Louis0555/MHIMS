import { createQueuePatientReturnUrl, restoreQueuePatientSelection, saveResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - MaternaTrack Queuing Logic
 * Script: js/clinical/maternatrack/queuing.js
 * ==============================================================================
 */

'use strict';

// ---------------------------------------------------------------------------
// Sample patient queue data (Materna-specific)
// ---------------------------------------------------------------------------
let patientQueue = [
  {
    queueNo: 1,
    id: 'MTR-2026-001',
    name: 'Maria Santos',
    age: 24,
    gender: 'Female',
    address: 'San Mateo, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '2nd Trimester',
    status: 'In Consultation',
    notes: ''
  },
  {
    queueNo: 2,
    id: 'MTR-2026-002',
    name: 'Luz Reyes',
    age: 31,
    gender: 'Female',
    address: 'San Pablo, Camaligan',
    consultation: 'High-Risk OB',
    trimester: '3rd Trimester',
    status: 'Urgent',
    notes: 'Hypertension – priority monitoring'
  },
  {
    queueNo: 3,
    id: 'MTR-2026-003',
    name: 'Ana Mendoza',
    age: 27,
    gender: 'Female',
    address: 'Sua, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '1st Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 4,
    id: 'MTR-2026-004',
    name: 'Rosa Dela Cruz',
    age: 22,
    gender: 'Female',
    address: 'San Ramon, Camaligan',
    consultation: 'Postnatal Checkup',
    trimester: 'Postnatal',
    status: 'Waiting',
    notes: '1-week post-delivery follow-up'
  },
  {
    queueNo: 5,
    id: 'MTR-2026-006',
    name: 'Irene Cabral',
    age: 34,
    gender: 'Female',
    address: 'San Marcos, Camaligan',
    consultation: 'Immunization',
    trimester: 'Postnatal',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 6,
    id: 'MTR-2026-007',
    name: 'Luna Binangkal',
    age: 25,
    gender: 'Female',
    address: 'Marupit, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '2nd Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 7,
    id: 'MTR-2026-009',
    name: 'Sabrina Carpenter',
    age: 20,
    gender: 'Female',
    address: 'San Roque, Camaligan',
    consultation: 'Prenatal Check-up',
    trimester: '1st Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 8,
    id: 'MTR-2026-010',
    name: 'Olivia Rodrigo',
    age: 23,
    gender: 'Female',
    address: 'San Roque, Camaligan',
    consultation: 'Prenatal Check-up',
    trimester: '1st Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 9,
    id: 'MTR-2026-011',
    name: 'Ariana Grande',
    age: 26,
    gender: 'Female',
    address: 'Marupit, Camaligan',
    consultation: 'Prenatal Check-up',
    trimester: '1st Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 10,
    id: 'MTR-2026-012',
    name: 'Taylor Swift',
    age: 24,
    gender: 'Female',
    address: 'San Roque, Camaligan',
    consultation: 'Prenatal Check-up',
    trimester: '3rd Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 11,
    id: 'MTR-2026-013',
    name: 'Irene Perez',
    age: 30,
    gender: 'Female',
    address: 'San Mateo, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '2nd Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 12,
    id: 'MTR-2026-014',
    name: 'Camila Dizon',
    age: 28,
    gender: 'Female',
    address: 'San Pablo, Camaligan',
    consultation: 'High-Risk OB',
    trimester: '3rd Trimester',
    status: 'Urgent',
    notes: 'Priority monitoring'
  },
  {
    queueNo: 13,
    id: 'MTR-2026-015',
    name: 'Angela Flores',
    age: 25,
    gender: 'Female',
    address: 'Sua, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '1st Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 14,
    id: 'MTR-2026-016',
    name: 'Beatriz Cruz',
    age: 33,
    gender: 'Female',
    address: 'San Ramon, Camaligan',
    consultation: 'Postnatal Checkup',
    trimester: 'Postnatal',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 15,
    id: 'MTR-2026-017',
    name: 'Patricia Lim',
    age: 21,
    gender: 'Female',
    address: 'San Roque, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '2nd Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 16,
    id: 'MTR-2026-018',
    name: 'Monica Santos',
    age: 36,
    gender: 'Female',
    address: 'San Marcos, Camaligan',
    consultation: 'Immunization',
    trimester: 'Postnatal',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 17,
    id: 'MTR-2026-019',
    name: 'Clarice Mendoza',
    age: 27,
    gender: 'Female',
    address: 'Marupit, Camaligan',
    consultation: 'High-Risk OB',
    trimester: '3rd Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 18,
    id: 'MTR-2026-020',
    name: 'Vivian Garcia',
    age: 23,
    gender: 'Female',
    address: 'San Juan, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '1st Trimester',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 19,
    id: 'MTR-2026-021',
    name: 'Carla Reyes',
    age: 30,
    gender: 'Female',
    address: 'Gogon-Dugcal, Camaligan',
    consultation: 'Postnatal Checkup',
    trimester: 'Postnatal',
    status: 'Waiting',
    notes: ''
  },
  {
    queueNo: 20,
    id: 'MTR-2026-022',
    name: 'Teresa Cabral',
    age: 32,
    gender: 'Female',
    address: 'San Mateo, Camaligan',
    consultation: 'Prenatal Checkup',
    trimester: '2nd Trimester',
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

  document.getElementById('kpiTotal').textContent     = total;
  document.getElementById('kpiServed').textContent    = inConsult;
  document.getElementById('kpiWaiting').textContent   = waiting;
  document.getElementById('kpiCompleted').textContent = completedCount;
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
        patient.trimester.toLowerCase().includes(q)    ||
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
      <td class="td-trimester">${patient.trimester}</td>
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
      if (e.target.closest('.action-menu-btn')) return;
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
  const cpTrimesterTag     = document.getElementById('cpTrimesterTag');
  const cpQueueNo          = document.getElementById('cpQueueNo');
  const cpConsultation     = document.getElementById('cpConsultation');
  const cpQueueNoHeader    = document.getElementById('cpQueueNoHeader');

  if (!selectedPatient) {
    cpName.textContent            = '—';
    cpDemographics.textContent    = '—';
    cpConsultationTag.textContent = '—';
    cpTrimesterTag.textContent    = '';
    cpQueueNo.textContent         = '—';
    cpConsultation.textContent    = '—';
    cpQueueNoHeader.textContent  = '—';
    return;
  }

  cpName.textContent            = selectedPatient.name;
  cpDemographics.textContent    = `${selectedPatient.age} years old • ${selectedPatient.gender}`;
  cpConsultationTag.textContent = selectedPatient.consultation;
  cpTrimesterTag.textContent    = selectedPatient.trimester !== 'N/A' ? selectedPatient.trimester : '';
  cpQueueNo.textContent         = selectedPatient.queueNo;
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

    filterMenu.querySelectorAll('.filter-menu-item').forEach(item => {
      item.addEventListener('click', e => {
        const val = e.currentTarget.getAttribute('data-consultation');
        currentFilter = val;
        filterMenu.querySelectorAll('.filter-menu-item').forEach(i => i.classList.remove('active'));
        e.currentTarget.classList.add('active');
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

  // Route queue details to the MaternaTrack patient profile
  const viewDetailsBtn = document.getElementById('btnViewDetails');
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      const patient = selectedPatient || (patientQueue.length > 0 ? patientQueue[0] : null);
      if (!patient) return;
      selectedPatient = patient;
      try {
        saveResidentCareQueuePatientDetail({
          module: 'Materna',
          category: 'Materna',
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
        window.location.assign('patientrecords.html');
      } catch (error) {
        console.error("Unable to open the selected patient's MaternaTrack details.", error);
        alert("Unable to open the patient's MaternaTrack details. Please try again.");
      }
    });
  }

  // ── Notification button ──────────────────────────────────────────────────
  const notifBtn = document.getElementById('notifBtn');
  if (notifBtn) {
    notifBtn.addEventListener('click', () => {
      showToast('Queue notifications', 'You have 1 urgent high-risk OB patient in queue.', 'info');
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
