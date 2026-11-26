import { createQueuePatientReturnUrl, restoreQueuePatientSelection, saveResidentCareQueuePatientDetail } from "../../shared/residentcare-queue-patient";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - Queuing Management Logic
 * Script: js/clinical/queuing.js
 * ==============================================================================
 */

// Initial patient queue data matching the municipal clinic screenshot
type QueuePatientStatus = "Waiting" | "Urgent" | "Upcoming" | "In Consultation" | "Completed";

interface QueuePatient {
  queueNo: number;
  id: string;
  name: string;
  age: number;
  gender: string;
  address: string;
  consultation: string;
  category: string;
  status: QueuePatientStatus;
}

let patientQueue: QueuePatient[] = [
  {
    queueNo: 1,
    id: "CAM-2026-001",
    name: "Juan Dela Cruz",
    age: 56,
    gender: "Male",
    address: "San Mateo, Camaligan",
    consultation: "General",
    category: "Resident",
    status: "In Consultation"
  },
  {
    queueNo: 9,
    id: "CAM-2026-009",
    name: "Marites Cruz",
    age: 45,
    gender: "Female",
    address: "San Mateo, Camaligan",
    consultation: "Injury",
    category: "Senior",
    status: "Urgent"
  },
  {
    queueNo: 3,
    id: "CAM-2026-003",
    name: "Giro Paulo A David",
    age: 28,
    gender: "Male",
    address: "San Mateo, Camaligan",
    consultation: "Nutrition Assessment",
    category: "Nutri",
    status: "Waiting"
  },
  {
    queueNo: 4,
    id: "CAM-2026-004",
    name: "Ceasar Antonio",
    age: 32,
    gender: "Male",
    address: "San Juan, Camaligan",
    consultation: "Prenatal Checkup",
    category: "Materna",
    status: "Waiting"
  },
  {
    queueNo: 6,
    id: "CAM-2026-006",
    name: "Caros Mendoza",
    age: 50,
    gender: "Male",
    address: "San Roque, Camaligan",
    consultation: "Follow-Up",
    category: "General",
    status: "Waiting"
  },
  {
    queueNo: 7,
    id: "CAM-2026-007",
    name: "Jessa Lim",
    age: 24,
    gender: "Female",
    address: "Marupit, Camaligan",
    consultation: "TB Treatment",
    category: "TB",
    status: "Waiting"
  },
  {
    queueNo: 8,
    id: "CAM-2026-008",
    name: "Ramon Garcia",
    age: 38,
    gender: "Male",
    address: "Sua, Camaligan",
    consultation: "Postnatal Checkup",
    category: "Materna",
    status: "Waiting"
  },
  {
    queueNo: 10,
    id: "CAM-2026-010",
    name: "Elena Garcia",
    age: 42,
    gender: "Female",
    address: "San Marcos, Camaligan",
    consultation: "Sickness",
    category: "Resident",
    status: "Waiting"
  },
  {
    queueNo: 11,
    id: "CAM-2026-011",
    name: "Maria Sigmund Mae D. Sandigan",
    age: 4,
    gender: "Male",
    address: "Gogon-Dugcal, Camaligan",
    consultation: "Follow-Up",
    category: "Nutri",
    status: "Waiting"
  },
  {
    queueNo: 12,
    id: "CAM-2026-012",
    name: "Isabella Reyes",
    age: 36,
    gender: "Female",
    address: "San Mateo, Camaligan",
    consultation: "Follow-Up",
    category: "Resident",
    status: "Waiting"
  },
  {
    queueNo: 13,
    id: "CAM-2026-013",
    name: "Jose Cabral",
    age: 64,
    gender: "Male",
    address: "San Pablo, Camaligan",
    consultation: "Injury",
    category: "Senior",
    status: "Urgent"
  },
  {
    queueNo: 14,
    id: "CAM-2026-014",
    name: "Daniela Santos",
    age: 5,
    gender: "Female",
    address: "San Roque, Camaligan",
    consultation: "Nutrition Assessment",
    category: "Nutri",
    status: "Waiting"
  },
  {
    queueNo: 15,
    id: "CAM-2026-015",
    name: "Angela Torres",
    age: 30,
    gender: "Female",
    address: "San Juan, Camaligan",
    consultation: "Prenatal Checkup",
    category: "Materna",
    status: "Waiting"
  },
  {
    queueNo: 16,
    id: "CAM-2026-016",
    name: "Miguel Mendoza",
    age: 33,
    gender: "Male",
    address: "Marupit, Camaligan",
    consultation: "TB Treatment",
    category: "TB",
    status: "Waiting"
  },
  {
    queueNo: 17,
    id: "CAM-2026-017",
    name: "Teresa Dizon",
    age: 29,
    gender: "Female",
    address: "Sua, Camaligan",
    consultation: "Postnatal Checkup",
    category: "Materna",
    status: "Waiting"
  },
  {
    queueNo: 18,
    id: "CAM-2026-018",
    name: "Liza Garcia",
    age: 71,
    gender: "Female",
    address: "San Marcos, Camaligan",
    consultation: "General",
    category: "Senior",
    status: "Waiting"
  },
  {
    queueNo: 19,
    id: "CAM-2026-019",
    name: "Noah Lim",
    age: 6,
    gender: "Male",
    address: "San Ramon, Camaligan",
    consultation: "Checkup",
    category: "Nutri",
    status: "Waiting"
  },
  {
    queueNo: 20,
    id: "CAM-2026-020",
    name: "Catalina Cruz",
    age: 42,
    gender: "Female",
    address: "Gogon-Dugcal, Camaligan",
    consultation: "Sickness",
    category: "Resident",
    status: "Waiting"
  },
  {
    queueNo: 21,
    id: "CAM-2026-021",
    name: "Ramon Perez",
    age: 38,
    gender: "Male",
    address: "San Mateo, Camaligan",
    consultation: "Disability-Related",
    category: "Ability",
    status: "Waiting"
  },
  {
    queueNo: 22,
    id: "CAM-2026-022",
    name: "Mariel Flores",
    age: 28,
    gender: "Female",
    address: "San Marcos, Camaligan",
    consultation: "Prenatal Checkup",
    category: "Materna",
    status: "Waiting"
  }
];

let selectedPatient: QueuePatient | null = restoreQueuePatientSelection(patientQueue);
let completedCount = 28;
let currentFilter = "All";
let searchQuery = "";
let bannerUndoAction: (() => void) | null = null;

document.addEventListener("DOMContentLoaded", () => {
  renderQueueTable();
  updateKPIs();
  renderCurrentPatient();
  setupEventListeners();
});

// Update KPI Counts
function updateKPIs() {
  const total = patientQueue.length;
  const beingServed = patientQueue.filter(p => p.status === "In Consultation").length;
  const waiting = patientQueue.filter(p => p.status === "Waiting" || p.status === "Urgent").length;

  document.getElementById("kpiTotal").textContent = String(total);
  document.getElementById("kpiServed").textContent = String(beingServed);
  document.getElementById("kpiWaiting").textContent = String(waiting);
  document.getElementById("kpiCompleted").textContent = String(completedCount);
}

function showQueueBanner(
  type: "warning" | "success" | "complete" | "error",
  title: string,
  message: string,
  undoAction?: () => void
) {
  const banner = document.getElementById("queueActionBanner");
  const bannerTitle = document.getElementById("queueActionBannerTitle");
  const bannerMessage = document.getElementById("queueActionBannerMessage");
  const undoButton = document.querySelector<HTMLButtonElement>("#queueActionUndo");

  if (!banner || !bannerTitle || !bannerMessage || !undoButton) return;

  banner.dataset.type = type;
  bannerTitle.textContent = title;
  bannerMessage.textContent = message;
  undoButton.hidden = !undoAction;
  bannerUndoAction = undoAction ?? null;
  banner.querySelector("iconify-icon")?.setAttribute(
    "icon",
    type === "warning" ? "mdi:bullhorn" :
      type === "error" ? "mdi:alert-circle" :
        type === "complete" ? "mdi:check-circle" : "mdi:account-check"
  );
  banner.hidden = false;
}

function dismissQueueBanner() {
  const banner = document.getElementById("queueActionBanner");
  const undoButton = document.querySelector<HTMLButtonElement>("#queueActionUndo");
  if (banner) banner.hidden = true;
  if (undoButton) undoButton.hidden = true;
  bannerUndoAction = null;
}

// Render the Queuing Table based on search and category filters
function renderQueueTable() {
  const tbody = document.getElementById("queueTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const filtered = patientQueue.filter(patient => {
    // Category filter
    let matchesCategory = true;
    if (currentFilter !== "All") {
      matchesCategory = patient.category.toLowerCase().includes(currentFilter.toLowerCase()) ||
                        patient.consultation.toLowerCase().includes(currentFilter.toLowerCase());
    }

    // Search filter
    let matchesSearch = true;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase().trim();
      matchesSearch = patient.name.toLowerCase().includes(q) ||
                      patient.address.toLowerCase().includes(q) ||
                      patient.category.toLowerCase().includes(q) ||
                      patient.consultation.toLowerCase().includes(q) ||
                      patient.queueNo.toString().includes(q) ||
                      patient.id.toLowerCase().includes(q);
    }

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 24px; color: #64748b; font-weight: 600;">
          No queuing records found matching your filter criteria.
        </td>
      </tr>
    `;
    return;
  }

  const groupedPatients = [
    {
      label: "Priority",
      className: "priority-group-row",
      patients: filtered
        .filter(patient => patient.status === "Urgent")
        .sort((a, b) => a.queueNo - b.queueNo)
    },
    {
      label: "In Consultation",
      className: "consultation-group-row",
      patients: filtered
        .filter(patient => patient.status === "In Consultation" || patient.status === "Upcoming")
        .sort((a, b) => a.queueNo - b.queueNo)
    },
    {
      label: "Waiting",
      className: "waiting-group-row",
      patients: filtered
        .filter(patient => patient.status === "Waiting")
        .sort((a, b) => a.queueNo - b.queueNo)
    }
  ];

  groupedPatients.forEach(group => {
    if (!group.patients.length) return;

    const groupRow = document.createElement("tr");
    groupRow.className = `queue-group-row ${group.className}`;
    groupRow.innerHTML = `<td colspan="6">${group.label} · ${group.patients.length}</td>`;
    tbody.appendChild(groupRow);

    group.patients.forEach(patient => {
      const tr = document.createElement("tr");
      if (selectedPatient && selectedPatient.queueNo === patient.queueNo) {
        tr.classList.add("selected");
      }

      let badgeClass = "waiting";
      if (patient.status === "In Consultation") badgeClass = "in-consultation";
      if (patient.status === "Upcoming") badgeClass = "upcoming";
      if (patient.status === "Urgent") badgeClass = "urgent";
      if (patient.status === "Completed") badgeClass = "completed";

      tr.innerHTML = `
        <td class="td-queue-num">${patient.queueNo}</td>
        <td>
          <div class="patient-info-wrap">
            <span class="patient-name">${patient.name}</span>
            <span class="patient-address">${patient.address}</span>
          </div>
        </td>
        <td class="td-consultation">${patient.consultation}</td>
        <td class="td-category">${patient.category}</td>
        <td>
          <span class="status-badge ${badgeClass}">${patient.status}</span>
        </td>
        <td class="td-action">
          <button type="button" class="action-menu-btn" data-id="${patient.queueNo}" title="Options">
            <iconify-icon icon="bi:three-dots-vertical"></iconify-icon>
          </button>
        </td>
      `;

      tr.addEventListener("click", (e) => {
        if (e.target instanceof Element && e.target.closest(".action-menu-btn")) return;
        selectedPatient = patient;
        renderCurrentPatient();
        renderQueueTable();
      });

      tbody.appendChild(tr);
    });
  });
}

// Render Current Patient Panel
function renderCurrentPatient() {
  const viewDetailsBtn = document.querySelector<HTMLButtonElement>("#btnViewDetails");

  if (!selectedPatient) {
    document.getElementById("cpName").textContent = "No upcoming patient";
    document.getElementById("cpDemographics").textContent = "The queue is currently empty.";
    document.getElementById("cpQueueNo").textContent = "#--";
    if (viewDetailsBtn) viewDetailsBtn.disabled = true;
    return;
  }

  if (viewDetailsBtn) viewDetailsBtn.disabled = false;
  document.getElementById("cpName").textContent = selectedPatient.name;
  document.getElementById("cpDemographics").textContent =
    `${selectedPatient.consultation} · ${selectedPatient.category} · ${selectedPatient.address}`;
  document.getElementById("cpQueueNo").textContent =
    `#${String(selectedPatient.queueNo).padStart(2, "0")}`;
}

// Event Listeners for Queue Actions & Filters
function setupEventListeners() {
  const bannerCloseBtn = document.getElementById("queueActionBannerClose");
  const bannerUndoBtn = document.querySelector<HTMLButtonElement>("#queueActionUndo");
  if (bannerCloseBtn) {
    bannerCloseBtn.addEventListener("click", dismissQueueBanner);
  }
  if (bannerUndoBtn) {
    bannerUndoBtn.addEventListener("click", () => {
      const undoAction = bannerUndoAction;
      if (undoAction) undoAction();
    });
  }

  // Search input
  const searchInput = document.querySelector<HTMLInputElement>("#queueSearchInput");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value;
      renderQueueTable();
    });
  }

  // Filter dropdown toggle
  const filterBtn = document.querySelector<HTMLButtonElement>("#filterDropdownBtn");
  const filterMenu = document.getElementById("filterDropdownMenu");
  if (filterBtn && filterMenu) {
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      filterMenu.classList.remove("show");
    });

    filterMenu.querySelectorAll<HTMLAnchorElement>(".filter-menu-item").forEach(item => {
      item.addEventListener("click", () => {
        const val = item.dataset.category;
        if (!val) return;
        currentFilter = val;
        filterBtn.innerHTML = `${val} <iconify-icon icon="material-symbols:arrow-drop-down-rounded" width="20" height="20"></iconify-icon>`;
        renderQueueTable();
      });
    });
  }

  // 1. Call Next Patient
  const callNextBtn = document.getElementById("btnCallNext");
  if (callNextBtn) {
    callNextBtn.addEventListener("click", () => {
      const nextWaiting = patientQueue.find(p => p.status === "Urgent") ??
        patientQueue.find(p => p.status === "Waiting");
      if (nextWaiting) {
        nextWaiting.status = "Upcoming";
        selectedPatient = nextWaiting;
        updateKPIs();
        renderCurrentPatient();
        renderQueueTable();
        showQueueBanner(
          "warning",
          `Now calling: ${nextWaiting.name}`,
          "Queuing will be updated upon marking in consultation."
        );
      } else {
        showQueueBanner(
          "error",
          `Failed to Call: ${selectedPatient?.name ?? "No patient available"}`,
          "Patient remains in the queue. Please retry."
        );
      }
    });
  }

  // 2. Mark as in Consultation
  const markConsultationBtn = document.getElementById("btnMarkConsultation");
  if (markConsultationBtn) {
    markConsultationBtn.addEventListener("click", () => {
      if (!selectedPatient) {
        showQueueBanner("error", "Failed to update consultation", "Please select a patient and try again.");
        return;
      }
      selectedPatient.status = "In Consultation";
      updateKPIs();
      renderCurrentPatient();
      renderQueueTable();
      showQueueBanner(
        "success",
        `In consultation: ${selectedPatient.name}`,
        "Queuing updated."
      );
    });
  }

  // 3. Mark as Completed
  const markCompletedBtn = document.getElementById("btnMarkCompleted");
  if (markCompletedBtn) {
    markCompletedBtn.addEventListener("click", () => {
      if (!selectedPatient) {
        showQueueBanner("error", "Failed to complete consultation", "Please select a patient and try again.");
        return;
      }
      
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
      showQueueBanner(
        "complete",
        `Consultation Completed : ${finishedPatient.name}`,
        "Patient removed from queue. Queue updated successfully"
      );
    });
  }

  // 4. Skip Patient
  const skipPatientBtn = document.getElementById("btnSkipPatient");
  if (skipPatientBtn) {
    skipPatientBtn.addEventListener("click", () => {
      if (!selectedPatient || patientQueue.length <= 1) {
        showQueueBanner(
          "error",
          `Couldn't skip: ${selectedPatient?.name ?? "No patient selected"}`,
          "Previous queue position restored. Please try again."
        );
        return;
      }

      const currentIndex = patientQueue.findIndex(p => p.queueNo === selectedPatient.queueNo);
      if (currentIndex === -1) {
        showQueueBanner(
          "error",
          `Couldn't skip: ${selectedPatient.name}`,
          "Previous queue position restored. Please try again."
        );
        return;
      }

      const previousQueue = [...patientQueue];
      const previousQueueNumbers = previousQueue.map(patient => patient.queueNo);
      const previousSelection = selectedPatient;
      const [skippedPatient] = patientQueue.splice(currentIndex, 1);
      patientQueue.push(skippedPatient);

      patientQueue.forEach((patient, index) => {
        patient.queueNo = index + 1;
      });

      selectedPatient = patientQueue[0] ?? null;
      updateKPIs();
      renderCurrentPatient();
      renderQueueTable();
      showQueueBanner(
        "success",
        `Skipped Patient : ${skippedPatient.name}`,
        "Patient skipped but remains in the queue.",
        () => {
          patientQueue = previousQueue;
          patientQueue.forEach((patient, index) => {
            patient.queueNo = previousQueueNumbers[index];
          });
          selectedPatient = previousSelection;
          updateKPIs();
          renderCurrentPatient();
          renderQueueTable();
          showQueueBanner(
            "success",
            `Skip undone: ${skippedPatient.name}`,
            "Previous queue position restored."
          );
        }
      );
    });
  }

  // Route queue details to the appropriate patient profile
  const viewDetailsBtn = document.getElementById("btnViewDetails");
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener("click", () => {
      if (!selectedPatient) return;

      const module: "ResidentCare" | "Nutri" | "Materna" | "TBCare" =
        selectedPatient.category === "TB"
          ? "TBCare"
          : selectedPatient.category === "Nutri"
            ? "Nutri"
            : selectedPatient.category === "Materna"
              ? "Materna"
              : "ResidentCare";
      const targetPage = module === "Nutri"
        ? "../nutritrack/childrecords.html"
        : module === "Materna"
          ? "../maternatrack/patientrecords.html"
          : module === "TBCare"
            ? "../tbcare/patient.html"
            : "../residentcare/patient.html";

      try {
        saveResidentCareQueuePatientDetail({
          module,
          category: selectedPatient.category,
          id: selectedPatient.id,
          name: selectedPatient.name,
          age: selectedPatient.age,
          gender: selectedPatient.gender,
          address: selectedPatient.address,
          consultation: selectedPatient.consultation,
          treatmentForm: module === "TBCare" ? selectedPatient.category : undefined,
          status: selectedPatient.status,
          queueNo: selectedPatient.queueNo,
          returnUrl: createQueuePatientReturnUrl(selectedPatient.queueNo),
        });
        window.location.assign(targetPage);
      } catch (error) {
        console.error("Unable to open the selected patient's module details.", error);
        alert("Unable to open the patient's module details. Please try again.");
      }
    });
  }

  // Notification button alert
  const notifBtn = document.getElementById("notifBtn");
  if (notifBtn) {
    notifBtn.addEventListener("click", () => {
      alert("You have active queue notifications for 2 urgent triage cases.");
    });
  }
}
