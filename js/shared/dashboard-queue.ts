type DashboardQueueStatus = "waiting" | "priority" | "called" | "consultation";

export function initializeDashboardQueue(): void {
  const queueList = document.querySelector<HTMLElement>(".queue-items-container, #queueList");
  if (!queueList || queueList.dataset.dashboardQueueInitialized === "true") return;

  const queueRows = () =>
    Array.from(queueList.querySelectorAll<HTMLElement>(".patient-queue-row, .queue-patient"));
  const panel = document.querySelector<HTMLElement>(".queuing-section-card, .dashboard-aside");
  const countContainer = document.querySelector<HTMLElement>("#waitingCount, .waiting-badge-pill");
  const countValue = countContainer?.querySelector<HTMLElement>("strong") ?? countContainer;
  const banner = document.createElement("section");
  const bannerIcon = document.createElement("iconify-icon");
  const bannerContent = document.createElement("div");
  const bannerTitle = document.createElement("strong");
  const bannerMessage = document.createElement("p");
  const bannerText = document.createElement("span");
  const closeButton = document.createElement("button");
  const undoButton = document.createElement("button");
  let selectedPatient =
    queueList.querySelector<HTMLElement>(".in-consultation") ?? queueRows()[0] ?? null;
  let queueCount = Number(countValue?.textContent?.match(/\d+/)?.[0] ?? queueRows().length);
  let undoAction: (() => void) | null = null;

  banner.className = "dashboard-queue-banner";
  banner.setAttribute("role", "status");
  banner.setAttribute("aria-live", "polite");
  banner.setAttribute("aria-atomic", "true");
  banner.hidden = true;
  bannerIcon.className = "dashboard-queue-banner__icon";
  bannerContent.className = "dashboard-queue-banner__content";
  bannerMessage.className = "dashboard-queue-banner__message";
  closeButton.className = "dashboard-queue-banner__close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Dismiss notification");
  closeButton.textContent = "×";
  undoButton.className = "dashboard-queue-banner__undo";
  undoButton.type = "button";
  undoButton.textContent = "Undo";
  undoButton.hidden = true;
  bannerMessage.append(bannerText, undoButton);
  bannerContent.append(bannerTitle, bannerMessage);
  banner.append(bannerIcon, bannerContent, closeButton);
  if (panel) panel.insertBefore(banner, panel.firstElementChild);

  function getName(patient: HTMLElement | null): string {
    return patient?.dataset.patient ??
      patient?.querySelector(".patient-name-text, .queue-patient-info strong")?.textContent?.trim() ??
      "No patient available";
  }

  function showBanner(
    type: "warning" | "success" | "complete" | "error",
    title: string,
    message: string,
    undo?: () => void
  ) {
    banner.dataset.type = type;
    bannerTitle.textContent = title;
    bannerText.textContent = message;
    undoAction = undo ?? null;
    undoButton.hidden = !undoAction;
    bannerIcon.setAttribute(
      "icon",
      type === "warning" ? "mdi:bullhorn" :
        type === "error" ? "mdi:alert-circle" :
          type === "complete" ? "mdi:check-circle" : "mdi:account-check"
    );
    banner.hidden = false;
  }

  function updateQueue() {
    const patients = queueRows();
    patients.forEach((patient, index) => {
      const number = patient.querySelector<HTMLElement>(".queue-number-badge, .queue-number");
      if (number) number.textContent = String(index + 1);
      patient.classList.toggle("is-queue-selected", patient === selectedPatient);
    });
    if (countValue) {
      countValue.textContent = countValue === countContainer
        ? `${Math.max(0, queueCount)} Waiting`
        : String(Math.max(0, queueCount));
    }
    if (selectedPatient && !queueList.contains(selectedPatient)) {
      selectedPatient = patients[0] ?? null;
    }
  }

  function setStatus(patient: HTMLElement, status: DashboardQueueStatus) {
    const previousStatus = patient.dataset.queueStatus;
    patient.classList.remove("in-consultation", "queue-called");
    patient.querySelectorAll(".consult-status-label, .queue-current-label, .queue-called-label")
      .forEach(label => label.remove());

    if (previousStatus === "consultation") {
      patient.querySelectorAll<HTMLElement>(".queue-patient-info small").forEach(label => {
        if (label.textContent?.trim().toLowerCase() === "in consultation") label.remove();
      });
    }

    patient.dataset.queueStatus = status;
    if (status === "consultation" || status === "called") {
      const label = document.createElement("span");
      label.className = status === "consultation" ? "queue-current-label" : "queue-called-label";
      label.textContent = status === "consultation" ? "In consultation" : "Now calling";
      patient.querySelector(".queue-patient-info")?.prepend(label);
      patient.classList.toggle("in-consultation", status === "consultation");
      patient.classList.toggle("queue-called", status === "called");
    }
  }

  function clearSelectionStatus() {
    queueRows().forEach(patient => {
      if (patient.dataset.queueStatus === "consultation") {
        setStatus(patient, patient.dataset.queuePriority === "true" ? "priority" : "waiting");
      }
    });
  }

  queueRows().forEach(patient => {
    patient.dataset.queuePriority = String(
      patient.classList.contains("urgent") || patient.classList.contains("priority")
    );
    const initialStatus: DashboardQueueStatus = patient.classList.contains("in-consultation")
      ? "consultation"
      : patient.dataset.queuePriority === "true"
        ? "priority"
        : "waiting";
    patient.dataset.queueStatus = initialStatus;
  });

  queueList.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const patient = event.target.closest<HTMLElement>(".patient-queue-row, .queue-patient");
    if (!patient) return;
    selectedPatient = patient;
    updateQueue();

    if (event.target.closest(".queue-view-btn")) {
      showBanner("success", `Selected: ${getName(patient)}`, "Patient is ready for queue actions.");
    }
  });

  const callNext = () => {
    const patients = queueRows();
    const nextPatient = patients.find(patient => patient.dataset.queueStatus === "priority") ??
      patients.find(patient => patient.dataset.queueStatus === "waiting");

    if (!nextPatient) {
      showBanner(
        "error",
        `Failed to Call: ${getName(selectedPatient)}`,
        "Patient remains in the queue. Please retry."
      );
      return;
    }

    selectedPatient = nextPatient;
    setStatus(nextPatient, "called");
    updateQueue();
    showBanner(
      "warning",
      `Now calling: ${getName(nextPatient)}`,
      "Queuing will be updated upon marking in consultation."
    );
  };

  document.getElementById("btnCallNext")?.addEventListener("click", callNext);
  document.getElementById("callNextBtn")?.addEventListener("click", callNext);

  const markInConsultation = () => {
    if (!selectedPatient) {
      showBanner("error", "Failed to update consultation", "Please select a patient and try again.");
      return;
    }

    clearSelectionStatus();
    setStatus(selectedPatient, "consultation");
    updateQueue();
    showBanner("success", `In consultation: ${getName(selectedPatient)}`, "Queuing updated.");
  };

  document.getElementById("btnMarkInConsult")?.addEventListener("click", markInConsultation);
  document.getElementById("markConsultationBtn")?.addEventListener("click", markInConsultation);

  const markCompleted = () => {
    if (!selectedPatient) {
      showBanner("error", "Failed to complete consultation", "Please select a patient and try again.");
      return;
    }

    const finishedPatient = selectedPatient;
    const name = getName(finishedPatient);
    finishedPatient.remove();
    queueCount = Math.max(0, queueCount - 1);
    selectedPatient = queueRows().find(patient => patient.dataset.queueStatus !== "consultation") ??
      queueRows()[0] ?? null;
    updateQueue();
    showBanner("complete", `Consultation Completed : ${name}`, "Patient removed from queue. Queue updated successfully");
  };

  document.getElementById("btnMarkCompleted")?.addEventListener("click", markCompleted);
  document.getElementById("markCompletedBtn")?.addEventListener("click", markCompleted);

  const skipPatient = () => {
    if (!selectedPatient || queueRows().length <= 1) {
      showBanner(
        "error",
        `Couldn't skip : ${getName(selectedPatient)}`,
        "Previous queue position restored. Please try again."
      );
      return;
    }

    const skippedPatient = selectedPatient;
    const name = getName(skippedPatient);
    const previousPatients = queueRows();
    const previousStatuses: DashboardQueueStatus[] = previousPatients.map(patient => {
      const status = patient.dataset.queueStatus;
      return status === "priority" || status === "called" || status === "consultation"
        ? status
        : "waiting";
    });
    const previousSelection = selectedPatient;
    setStatus(skippedPatient, skippedPatient.dataset.queuePriority === "true" ? "priority" : "waiting");
    queueList.append(skippedPatient);
    selectedPatient = queueRows().find(patient => patient !== skippedPatient) ?? skippedPatient;
    updateQueue();
    showBanner("success", `Skipped Patient : ${name}`, "Patient skipped but remains in the queue.", () => {
      previousPatients.forEach((patient, index) => {
        queueList.append(patient);
        setStatus(patient, previousStatuses[index]);
      });
      selectedPatient = previousSelection;
      updateQueue();
      showBanner("success", `Skip undone: ${name}`, "Previous queue position restored.");
    });
  };

  document.getElementById("btnSkipPatient")?.addEventListener("click", skipPatient);
  document.getElementById("skipPatientBtn")?.addEventListener("click", skipPatient);

  closeButton.addEventListener("click", () => {
    banner.hidden = true;
    undoAction = null;
    undoButton.hidden = true;
  });
  undoButton.addEventListener("click", () => {
    const action = undoAction;
    if (action) action();
  });

  const searchInput = document.querySelector<HTMLInputElement>("#dashboardSearchInput");
  searchInput?.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase();
    queueRows().forEach(patient => {
      patient.hidden = Boolean(query) && !patient.textContent.toLowerCase().includes(query);
    });
  });

  updateQueue();
  queueList.dataset.dashboardQueueInitialized = "true";
}

initializeDashboardQueue();
