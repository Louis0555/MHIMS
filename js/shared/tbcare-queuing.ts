import { createQueuePatientReturnUrl, restoreQueuePatientSelection, saveResidentCareQueuePatientDetail } from "./residentcare-queue-patient";

type TbQueueStatus = "Waiting" | "Urgent" | "Upcoming" | "In Consultation" | "Completed";

interface TbQueuePatient {
  queueNo: number;
  id: string;
  name: string;
  age: number;
  gender: string;
  address: string;
  consultation: string;
  treatmentForm: string;
  status: TbQueueStatus;
}

function initializeTbCareQueue() {
  const tableBody = document.getElementById("queueTableBody");
  if (!tableBody) return;

  let patientQueue: TbQueuePatient[] = [
    { queueNo: 1, id: "TB-2026-001", name: "Jennie Kim", age: 34, gender: "Female", address: "San Mateo, Camaligan", consultation: "TB Follow-up", treatmentForm: "DS-TB", status: "In Consultation" },
    { queueNo: 2, id: "TB-2026-002", name: "Ana Reyes", age: 52, gender: "Female", address: "San Pablo, Camaligan", consultation: "Sputum Follow-up", treatmentForm: "DR-TB", status: "In Consultation" },
    { queueNo: 3, id: "TB-2026-003", name: "Jessica Santos", age: 28, gender: "Female", address: "San Mateo, Camaligan", consultation: "TB Treatment", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 4, id: "TB-2026-004", name: "Sande Cruz", age: 41, gender: "Male", address: "San Juan, Camaligan", consultation: "Treatment Monitoring", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 5, id: "TB-2026-005", name: "Kyla Mendoza", age: 37, gender: "Female", address: "San Ramon, Camaligan", consultation: "TB Follow-up", treatmentForm: "DR-TB", status: "Waiting" },
    { queueNo: 6, id: "TB-2026-006", name: "Carla Dizon", age: 45, gender: "Female", address: "San Roque, Camaligan", consultation: "Sputum Follow-up", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 7, id: "TB-2026-007", name: "Jessa Lim", age: 24, gender: "Female", address: "Marupit, Camaligan", consultation: "TB Treatment", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 8, id: "TB-2026-008", name: "Ramona Garcia", age: 38, gender: "Female", address: "Sua, Camaligan", consultation: "Treatment Monitoring", treatmentForm: "DR-TB", status: "Waiting" },
    { queueNo: 9, id: "TB-2026-009", name: "Marites Cruz", age: 45, gender: "Female", address: "San Mateo, Camaligan", consultation: "TB Follow-up", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 10, id: "TB-2026-010", name: "Elena Garcia", age: 42, gender: "Female", address: "San Marcos, Camaligan", consultation: "Sputum Follow-up", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 11, id: "TB-2026-011", name: "Axela Torres", age: 31, gender: "Female", address: "San Ramon, Camaligan", consultation: "Treatment Monitoring", treatmentForm: "DR-TB", status: "Waiting" },
    { queueNo: 12, id: "TB-2026-012", name: "Irene Perez", age: 39, gender: "Female", address: "San Mateo, Camaligan", consultation: "TB Follow-up", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 13, id: "TB-2026-013", name: "Ramon Cabral", age: 47, gender: "Male", address: "San Pablo, Camaligan", consultation: "Sputum Follow-up", treatmentForm: "DR-TB", status: "Urgent" },
    { queueNo: 14, id: "TB-2026-014", name: "Teresa Dizon", age: 35, gender: "Female", address: "Sua, Camaligan", consultation: "Treatment Monitoring", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 15, id: "TB-2026-015", name: "Miguel Santos", age: 42, gender: "Male", address: "San Ramon, Camaligan", consultation: "TB Treatment", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 16, id: "TB-2026-016", name: "Catalina Reyes", age: 29, gender: "Female", address: "San Marcos, Camaligan", consultation: "Sputum Follow-up", treatmentForm: "DR-TB", status: "Waiting" },
    { queueNo: 17, id: "TB-2026-017", name: "Jose Mendoza", age: 56, gender: "Male", address: "Marupit, Camaligan", consultation: "Treatment Monitoring", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 18, id: "TB-2026-018", name: "Mariel Garcia", age: 33, gender: "Female", address: "San Juan, Camaligan", consultation: "TB Follow-up", treatmentForm: "DR-TB", status: "Waiting" },
    { queueNo: 19, id: "TB-2026-019", name: "Noel Flores", age: 61, gender: "Male", address: "Gogon-Dugcal, Camaligan", consultation: "TB Treatment", treatmentForm: "DS-TB", status: "Waiting" },
    { queueNo: 20, id: "TB-2026-020", name: "Angela Lim", age: 26, gender: "Female", address: "San Roque, Camaligan", consultation: "Sputum Follow-up", treatmentForm: "DR-TB", status: "Waiting" }
  ];
  let selectedPatient: TbQueuePatient | null = restoreQueuePatientSelection(patientQueue);
  let completedCount = 28;
  let currentFilter = "All";
  let searchQuery = "";
  let bannerUndoAction: (() => void) | null = null;

  const getElement = <T extends HTMLElement>(id: string): T | null =>
    document.getElementById(id) as T | null;
  const banner = getElement("queueActionBanner");
  const bannerTitle = getElement("queueActionBannerTitle");
  const bannerMessage = getElement("queueActionBannerMessage");
  const bannerUndo = getElement<HTMLButtonElement>("queueActionUndo");
  const searchInput = getElement<HTMLInputElement>("queueSearchInput");
  const filterButton = getElement<HTMLButtonElement>("filterDropdownBtn");
  const filterMenu = getElement("filterDropdownMenu");
  const selectedName = getElement("cpName");
  const selectedDetails = getElement("cpDemographics");
  const selectedQueueNo = getElement("cpQueueNo");

  function showBanner(
    type: "warning" | "success" | "complete" | "error",
    title: string,
    message: string,
    undoAction?: () => void
  ) {
    if (!banner || !bannerTitle || !bannerMessage || !bannerUndo) return;
    banner.dataset.type = type;
    bannerTitle.textContent = title;
    bannerMessage.textContent = message;
    bannerUndo.hidden = !undoAction;
    bannerUndoAction = undoAction ?? null;
    banner.querySelector("iconify-icon")?.setAttribute(
      "icon",
      type === "warning" ? "mdi:bullhorn" :
        type === "error" ? "mdi:alert-circle" :
          type === "complete" ? "mdi:check-circle" : "mdi:account-check"
    );
    banner.hidden = false;
  }

  function dismissBanner() {
    if (banner) banner.hidden = true;
    if (bannerUndo) bannerUndo.hidden = true;
    bannerUndoAction = null;
  }

  function getStatusClass(status: TbQueueStatus): string {
    if (status === "In Consultation") return "in-consultation";
    if (status === "Upcoming") return "upcoming";
    if (status === "Urgent") return "urgent";
    return "waiting";
  }

  function updateKpis() {
    const consultationCount = patientQueue.filter(patient => patient.status === "In Consultation").length;
    const waitingCount = patientQueue.filter(patient =>
      patient.status === "Waiting" || patient.status === "Urgent"
    ).length;
    const total = getElement("kpiTotal");
    const served = getElement("kpiServed");
    const waiting = getElement("kpiWaiting");
    const completed = getElement("kpiCompleted");
    if (total) total.textContent = String(patientQueue.length);
    if (served) served.textContent = String(consultationCount);
    if (waiting) waiting.textContent = String(waitingCount);
    if (completed) completed.textContent = String(completedCount);
  }

  function updateSelectedPatient() {
    const viewDetailsButton = getElement<HTMLButtonElement>("btnViewDetails");
    const consultationTag = getElement("cpConsultationTag");
    const genderTag = getElement("cpGenderTag");
    if (!selectedPatient) {
      if (selectedName) selectedName.textContent = "No upcoming patient";
      if (selectedDetails) selectedDetails.textContent = "The queue is currently empty.";
      if (selectedQueueNo) selectedQueueNo.textContent = "#--";
      if (consultationTag) consultationTag.textContent = "—";
      if (genderTag) genderTag.textContent = "";
      if (viewDetailsButton) viewDetailsButton.disabled = true;
      return;
    }

    if (viewDetailsButton) viewDetailsButton.disabled = false;
    if (selectedName) selectedName.textContent = selectedPatient.name;
    if (selectedDetails) {
      selectedDetails.textContent =
        `${selectedPatient.consultation} · ${selectedPatient.treatmentForm} · ${selectedPatient.address}`;
    }
    if (selectedQueueNo) {
      selectedQueueNo.textContent = `#${String(selectedPatient.queueNo).padStart(2, "0")}`;
    }
    if (consultationTag) consultationTag.textContent = selectedPatient.consultation;
    if (genderTag) genderTag.textContent = selectedPatient.gender;
  }

  function createGroupRow(label: string, count: number): HTMLTableRowElement {
    const row = document.createElement("tr");
    row.className = "queue-group-row";
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = `${label} · ${count}`;
    row.append(cell);
    return row;
  }

  function appendPatientRow(patient: TbQueuePatient) {
    const row = document.createElement("tr");
    row.className = patient.id === selectedPatient?.id ? "selected" : "";

    const queueNumber = document.createElement("td");
    queueNumber.className = "td-queue-num";
    queueNumber.textContent = String(patient.queueNo);

    const patientCell = document.createElement("td");
    const patientInfo = document.createElement("div");
    patientInfo.className = "patient-info-wrap";
    const name = document.createElement("span");
    name.className = "patient-name";
    name.textContent = patient.name;
    const address = document.createElement("span");
    address.className = "patient-address";
    address.textContent = patient.address;
    patientInfo.append(name, address);
    patientCell.append(patientInfo);

    const consultation = document.createElement("td");
    consultation.className = "td-consultation";
    consultation.textContent = patient.consultation;

    const treatmentForm = document.createElement("td");
    treatmentForm.className = "td-category";
    treatmentForm.textContent = patient.treatmentForm;

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = `status-badge ${getStatusClass(patient.status)}`;
    statusBadge.textContent = patient.status;
    statusCell.append(statusBadge);

    const actionCell = document.createElement("td");
    actionCell.className = "td-action";
    const actionButton = document.createElement("button");
    actionButton.type = "button";
    actionButton.className = "action-menu-btn";
    actionButton.dataset.id = String(patient.queueNo);
    actionButton.title = "Options";
    actionButton.innerHTML = '<iconify-icon icon="bi:three-dots-vertical"></iconify-icon>';
    actionCell.append(actionButton);

    row.append(queueNumber, patientCell, consultation, treatmentForm, statusCell, actionCell);
    tableBody.append(row);
  }

  function renderQueueTable() {
    tableBody.replaceChildren();
    const query = searchQuery.trim().toLowerCase();
    const filtered = patientQueue.filter(patient => {
      const matchesTreatment = currentFilter === "All" ||
        patient.treatmentForm.toLowerCase().includes(currentFilter.toLowerCase()) ||
        patient.consultation.toLowerCase().includes(currentFilter.toLowerCase());
      const matchesSearch = !query ||
        [patient.id, patient.name, patient.address, patient.consultation, patient.treatmentForm, String(patient.queueNo)]
          .some(value => value.toLowerCase().includes(query));
      return matchesTreatment && matchesSearch;
    });

    if (!filtered.length) {
      const emptyRow = document.createElement("tr");
      const emptyCell = document.createElement("td");
      emptyCell.colSpan = 6;
      emptyCell.style.cssText = "text-align:center;padding:24px;color:#64748b;font-weight:600";
      emptyCell.textContent = "No queuing records found matching your filter criteria.";
      emptyRow.append(emptyCell);
      tableBody.append(emptyRow);
      return;
    }

    const groups: Array<{ label: string; className: string; patients: TbQueuePatient[] }> = [
      {
        label: "Priority",
        className: "priority-group-row",
        patients: filtered.filter(patient => patient.status === "Urgent")
      },
      {
        label: "In Consultation",
        className: "consultation-group-row",
        patients: filtered.filter(patient =>
          patient.status === "In Consultation" || patient.status === "Upcoming"
        )
      },
      {
        label: "Waiting",
        className: "waiting-group-row",
        patients: filtered.filter(patient => patient.status === "Waiting")
      }
    ];

    groups.forEach(group => {
      if (!group.patients.length) return;
      const groupRow = createGroupRow(group.label, group.patients.length);
      groupRow.className = `queue-group-row ${group.className}`;
      tableBody.append(groupRow);
      group.patients
        .sort((first, second) => first.queueNo - second.queueNo)
        .forEach(appendPatientRow);
    });
  }

  function refreshQueue() {
    updateKpis();
    updateSelectedPatient();
    renderQueueTable();
  }

  function openPatientDetails() {
    if (!selectedPatient) return;
    try {
      saveResidentCareQueuePatientDetail({
        module: "TBCare",
        category: "TB",
        id: selectedPatient.id,
        name: selectedPatient.name,
        age: selectedPatient.age,
        gender: selectedPatient.gender,
        address: selectedPatient.address,
        consultation: selectedPatient.consultation,
        treatmentForm: selectedPatient.treatmentForm,
        status: selectedPatient.status,
        queueNo: selectedPatient.queueNo,
        returnUrl: createQueuePatientReturnUrl(selectedPatient.queueNo),
      });
      window.location.assign("patient.html");
    } catch (error) {
      console.error("Unable to open the selected patient's TBCare details.", error);
      alert("Unable to open the patient's TBCare details. Please try again.");
    }
  }

  tableBody.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    if (event.target.closest(".action-menu-btn")) return;
    const row = event.target.closest("tr");
    const queueNumber = Number(row?.querySelector(".td-queue-num")?.textContent);
    const patient = patientQueue.find(item => item.queueNo === queueNumber);
    if (patient) {
      selectedPatient = patient;
      updateSelectedPatient();
      renderQueueTable();
    }
  });

  searchInput?.addEventListener("input", () => {
    searchQuery = searchInput.value;
    renderQueueTable();
  });

  filterButton?.addEventListener("click", () => {
    filterMenu?.classList.toggle("show");
  });

  filterButton?.addEventListener("click", event => event.stopPropagation());
  document.addEventListener("click", () => filterMenu?.classList.remove("show"));

  filterMenu?.querySelectorAll<HTMLAnchorElement>(".filter-menu-item").forEach(option => {
    option.addEventListener("click", () => {
      const value = option.dataset.category;
      if (!value) return;
      currentFilter = value;
      if (filterButton) {
        filterButton.innerHTML = `${value} <iconify-icon icon="material-symbols:arrow-drop-down-rounded" width="20" height="20"></iconify-icon>`;
      }
      filterMenu.querySelectorAll(".filter-menu-item").forEach(item => {
        item.classList.toggle("active", item === option);
      });
      renderQueueTable();
    });
  });

  getElement("queueActionBannerClose")?.addEventListener("click", dismissBanner);
  bannerUndo?.addEventListener("click", () => bannerUndoAction?.());

  getElement("btnCallNext")?.addEventListener("click", () => {
    const nextPatient = patientQueue.find(patient => patient.status === "Urgent") ??
      patientQueue.find(patient => patient.status === "Waiting");
    if (!nextPatient) {
      showBanner(
        "error",
        `Failed to Call: ${selectedPatient?.name ?? "No patient available"}`,
        "Patient remains in the queue. Please retry."
      );
      return;
    }
    nextPatient.status = "Upcoming";
    selectedPatient = nextPatient;
    refreshQueue();
    showBanner("warning", `Now calling: ${nextPatient.name}`, "Queuing will be updated upon marking in consultation.");
  });

  getElement("btnMarkConsultation")?.addEventListener("click", () => {
    if (!selectedPatient) {
      showBanner("error", "Failed to update consultation", "Please select a patient and try again.");
      return;
    }
    selectedPatient.status = "In Consultation";
    refreshQueue();
    showBanner("success", `In consultation: ${selectedPatient.name}`, "Queuing updated.");
  });

  getElement("btnMarkCompleted")?.addEventListener("click", () => {
    if (!selectedPatient) {
      showBanner("error", "Failed to complete consultation", "Please select a patient and try again.");
      return;
    }
    const completedPatient = selectedPatient;
    patientQueue = patientQueue.filter(patient => patient.queueNo !== completedPatient.queueNo);
    patientQueue.forEach((patient, index) => {
      patient.queueNo = index + 1;
    });
    completedCount += 1;
    selectedPatient = patientQueue[0] ?? null;
    refreshQueue();
    showBanner(
      "complete",
      `Consultation Completed : ${completedPatient.name}`,
      "Patient removed from queue. Queue updated successfully"
    );
  });

  getElement("btnSkipPatient")?.addEventListener("click", () => {
    if (!selectedPatient || patientQueue.length <= 1) {
      showBanner(
        "error",
        `Couldn't skip: ${selectedPatient?.name ?? "No patient selected"}`,
        "Previous queue position restored. Please try again."
      );
      return;
    }

    const currentIndex = patientQueue.findIndex(patient => patient.queueNo === selectedPatient?.queueNo);
    if (currentIndex === -1) {
      showBanner(
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
    refreshQueue();
    showBanner("success", `Skipped Patient : ${skippedPatient.name}`, "Patient skipped but remains in the queue.", () => {
      patientQueue = previousQueue;
      patientQueue.forEach((patient, index) => {
        patient.queueNo = previousQueueNumbers[index];
      });
      selectedPatient = previousSelection;
      refreshQueue();
      showBanner("success", `Skip undone: ${skippedPatient.name}`, "Previous queue position restored.");
    });
  });

  getElement("btnViewDetails")?.addEventListener("click", openPatientDetails);
  refreshQueue();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeTbCareQueue, { once: true });
} else {
  initializeTbCareQueue();
}
