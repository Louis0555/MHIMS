import {
  dispenseFromInventory,
  getAvailableQuantity,
  getPharmacyInventory,
} from "../../shared/pharmacy-inventory";
import { showRecordNotice } from "../../shared/record-save-notice";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("patientSearch") as HTMLInputElement | null;
  const table = document.getElementById("pharmacyPatients") as HTMLTableElement | null;
  const tableBody = table?.querySelector("tbody") ?? null;
  const emptyMessage = document.getElementById("emptyDispensedPatients");
  const dateFilterButtons = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-date-filter]"),
  );
  const dateRangeWrap = document.getElementById("dateRangeWrap");
  const dateRangeToggle = document.getElementById("dateRangeToggle") as HTMLButtonElement | null;
  const dateRangeMenu = document.getElementById("dateRangeMenu") as HTMLFormElement | null;
  const dateRangeStart = document.getElementById("dateRangeStart") as HTMLInputElement | null;
  const dateRangeEnd = document.getElementById("dateRangeEnd") as HTMLInputElement | null;
  const dateRangeError = document.getElementById("dateRangeError");
  const clearDateRangeButton = document.getElementById("clearDateRange") as HTMLButtonElement | null;
  const openDispenseButton = document.getElementById("openDispenseDialog") as HTMLButtonElement | null;
  const dispenseDialog = document.getElementById("dispenseDialog") as HTMLDialogElement | null;
  const dispenseForm = document.getElementById("dispenseForm") as HTMLFormElement | null;
  const dispenseFormError = document.getElementById("dispenseFormError");
  const dispensePatientName = document.getElementById("dispensePatientName") as HTMLInputElement | null;
  const dispensePhilhealth = document.getElementById("dispensePhilhealth") as HTMLInputElement | null;
  const dispenseDiagnosis = document.getElementById("dispenseDiagnosis") as HTMLInputElement | null;
  const dispenseMedicineName = document.getElementById("dispenseMedicineName") as HTMLInputElement | null;
  const dispenseStrength = document.getElementById("dispenseStrength") as HTMLInputElement | null;
  const dispenseOnHand = document.getElementById("dispenseOnHand") as HTMLInputElement | null;
  const dispenseQuantity = document.getElementById("dispenseQuantity") as HTMLInputElement | null;
  const dispenseFrequency = document.getElementById("dispenseFrequency") as HTMLInputElement | null;
  const dispenseDate = document.getElementById("dispenseDate") as HTMLInputElement | null;
  const dispenseBy = document.getElementById("dispenseBy") as HTMLInputElement | null;
  const dispenseMedicineOptions = document.getElementById("dispenseMedicineOptions") as HTMLDataListElement | null;
  const dispensedPatientDetail = document.getElementById("dispensedPatientDetail");
  const backToDispensedPatients = document.getElementById("backToDispensedPatients") as HTMLButtonElement | null;
  const dispensedHistoryBody = document.getElementById("dispensedHistoryBody");
  const headerActions = document.querySelector<HTMLElement>(".pharmacy-patient-content .header-actions");
  const headerSubtitle = document.querySelector<HTMLElement>(".pharmacy-patient-content .dashboard-subtitle");
  const patientToolbar = document.querySelector<HTMLElement>(".pharmacy-patient-toolbar");
  const patientTableCard = document.querySelector<HTMLElement>(".pharmacy-patient-content .pharmacy-table-card");
  let lastViewedButton: HTMLButtonElement | null = null;
  let activeDateFilter = "all";
  let selectedStartDate = "";
  let selectedEndDate = "";

  interface DispensingHistoryRecord {
    date: string;
    medicine: string;
    strength: string;
    quantity: string;
    frequency: string;
    dispensedBy: string;
    status: string;
  }

  const mariaSantosHistory: DispensingHistoryRecord[] = [
    {
      date: "2026-11-23",
      medicine: "Amoxicillin",
      strength: "500 mg",
      quantity: "21 caps",
      frequency: "3x daily for 7 days",
      dispensedBy: "Elena Aquino",
      status: "Dispensed",
    },
    {
      date: "2026-10-12",
      medicine: "Cetirizine",
      strength: "10 mg",
      quantity: "10 tabs",
      frequency: "Once daily for 10 days",
      dispensedBy: "Elena Aquino",
      status: "Dispensed",
    },
    {
      date: "2026-08-05",
      medicine: "Paracetamol",
      strength: "500 mg",
      quantity: "10 tabs",
      frequency: "As prescribed for 3 days",
      dispensedBy: "Elena Aquino",
      status: "Dispensed",
    },
  ];

  function getLocalDateString(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function formatDispensedDate(dateString: string, month: "short" | "long"): string {
    const [year, monthNumber, day] = dateString.split("-").map(Number);
    if (!year || !monthNumber || !day) return "Not provided";
    return new Intl.DateTimeFormat("en-US", {
      month,
      day: "2-digit",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(Date.UTC(year, monthNumber - 1, day)));
  }

  function formatLongQuantity(quantity: string): string {
    return quantity
      .replace(/\bcaps\b/i, "capsules")
      .replace(/\bcap\b/i, "capsule")
      .replace(/\btabs\b/i, "tablets")
      .replace(/\btab\b/i, "tablet");
  }

  function getDispensingHistory(row: HTMLTableRowElement): DispensingHistoryRecord[] {
    if (row.dataset.patientId === "PT-0001") return mariaSantosHistory;
    return [{
      date: row.dataset.dispensedDate ?? "",
      medicine: row.dataset.medicine ?? "Not provided",
      strength: row.dataset.strength ?? "",
      quantity: row.dataset.quantity ?? "Not provided",
      frequency: row.dataset.frequencyDuration ?? "Not provided",
      dispensedBy: row.dataset.dispensedBy ?? "Not provided",
      status: "Dispensed",
    }];
  }

  function appendHistoryCell(row: HTMLTableRowElement, value: string): HTMLTableCellElement {
    const cell = document.createElement("td");
    cell.textContent = value || "Not provided";
    row.append(cell);
    return cell;
  }

  function setDetailViewVisible(visible: boolean): void {
    document.body.classList.toggle("patient-detail-open", visible);
    if (dispensedPatientDetail) dispensedPatientDetail.hidden = !visible;
    if (patientToolbar) patientToolbar.hidden = visible;
    if (patientTableCard) patientTableCard.hidden = visible;
    if (headerActions) headerActions.hidden = visible;
    if (backToDispensedPatients) backToDispensedPatients.hidden = !visible;
    if (headerSubtitle) {
      headerSubtitle.textContent = visible
        ? "Patient Dispensing History"
        : "Patients with Dispensed Medicine";
    }
  }

  function closeDateRangeMenu(restoreFocus = false): void {
    dateRangeWrap?.classList.remove("open");
    dateRangeMenu?.classList.remove("show");
    dateRangeToggle?.setAttribute("aria-expanded", "false");
    if (restoreFocus) dateRangeToggle?.focus();
  }

  function setActiveDateFilter(filter: string): void {
    activeDateFilter = filter;
    dateFilterButtons.forEach((button) => {
      const isActive = button.dataset.dateFilter === filter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    dateRangeToggle?.classList.toggle("active", filter === "custom");
    dateRangeToggle?.setAttribute("aria-pressed", String(filter === "custom"));
  }

  function matchesDateFilter(dateString: string): boolean {
    if (activeDateFilter === "all") return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = getLocalDateString(today);

    if (activeDateFilter === "today") return dateString === todayString;
    if (activeDateFilter === "custom") {
      return dateString >= selectedStartDate && dateString <= selectedEndDate;
    }

    if (activeDateFilter === "week") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      return dateString >= getLocalDateString(weekStart) && dateString <= todayString;
    }

    if (activeDateFilter === "month") {
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      return dateString >= monthStart && dateString <= todayString;
    }

    return true;
  }

  function filterDispensedPatients(): void {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const rows = tableBody
      ? Array.from(tableBody.querySelectorAll<HTMLTableRowElement>("tr[data-dispensed-date]"))
      : [];
    let visibleRows = 0;

    rows.forEach((row) => {
      const matchesSearch = !query || row.textContent?.toLowerCase().includes(query) === true;
      const matchesDate = matchesDateFilter(row.dataset.dispensedDate ?? "");
      const visible = matchesSearch && matchesDate;
      row.hidden = !visible;
      if (visible) visibleRows += 1;
    });

    if (emptyMessage) emptyMessage.hidden = visibleRows > 0;
  }

  function createCell(value: string): HTMLTableCellElement {
    const cell = document.createElement("td");
    cell.textContent = value;
    return cell;
  }

  function showDispenseError(message: string): void {
    if (!dispenseFormError) return;
    dispenseFormError.textContent = message;
    dispenseFormError.hidden = false;
  }

  function populateMedicineOptions(): void {
    if (!dispenseMedicineOptions) return;

    const medicines = getPharmacyInventory()
      .filter(batch => batch.quantity > 0 && batch.expiryDate >= getLocalDateString())
      .sort((left, right) => left.medicineName.localeCompare(right.medicineName));
    const seenMedicines = new Set<string>();
    const options = medicines
      .filter(batch => {
        const key = `${batch.medicineName.toLowerCase()}|${batch.strength.toLowerCase()}`;
        if (seenMedicines.has(key)) return false;
        seenMedicines.add(key);
        return true;
      })
      .map(batch => {
        const option = document.createElement("option");
        option.value = batch.medicineName;
        option.label = `${batch.medicineName} · ${batch.strength}`;
        return option;
      });
    dispenseMedicineOptions.replaceChildren(...options);
  }

  function updateSelectedMedicine(): void {
    if (!dispenseMedicineName || !dispenseStrength || !dispenseOnHand) return;
    const medicineName = dispenseMedicineName.value.trim();
    if (!medicineName) {
      dispenseStrength.value = "";
      dispenseOnHand.value = "";
      return;
    }

    try {
      const inventory = getPharmacyInventory();
      const matchingBatch = inventory.find(batch => (
        batch.medicineName.toLowerCase() === medicineName.toLowerCase()
        && getAvailableQuantity(inventory, batch.medicineName, batch.strength) > 0
      ));
      if (!matchingBatch) {
        dispenseStrength.value = "";
        dispenseOnHand.value = "";
        return;
      }

      const availableQuantity = getAvailableQuantity(
        inventory,
        matchingBatch.medicineName,
        matchingBatch.strength,
      );
      dispenseStrength.value = matchingBatch.strength;
      dispenseOnHand.value = `${availableQuantity} units`;
    } catch {
      dispenseStrength.value = "";
      dispenseOnHand.value = "";
      showDispenseError("Pharmacy inventory could not be loaded. Please reload and try again.");
    }
  }

  function createPatientId(): string {
    const existingIds = tableBody
      ? Array.from(tableBody.querySelectorAll<HTMLTableRowElement>("tr[data-patient-id]"))
        .map(row => Number(row.dataset.patientId?.match(/^PT-(\d+)$/)?.[1] ?? 0))
      : [];
    const nextId = Math.max(0, ...existingIds) + 1;
    return `PT-${String(nextId).padStart(4, "0")}`;
  }

  function appendDispensedRecord(
    patientId: string,
    patientName: string,
    location: string,
    philhealth: string,
    prescription: string,
    diagnosis: string,
    medicineName: string,
    strength: string,
    quantity: string,
    date: string,
    frequency: string,
    dispensedBy: string,
  ): HTMLTableRowElement | null {
    if (!tableBody) return null;

    const row = document.createElement("tr");
    row.dataset.dispensedDate = date;
    row.dataset.patientId = patientId;
    row.dataset.patientName = patientName;
    row.dataset.location = location;
    row.dataset.philhealth = philhealth || "Not provided";
    row.dataset.prescription = prescription;
    row.dataset.diagnosis = diagnosis || "Not provided";
    row.dataset.medicine = medicineName;
    row.dataset.strength = strength;
    row.dataset.quantity = quantity;
    row.dataset.frequencyDuration = frequency;
    row.dataset.dispensedBy = dispensedBy;
    row.append(createCell(patientId));

    const patientCell = document.createElement("td");
    const patientInfo = document.createElement("div");
    patientInfo.className = "dispensed-patient";
    const patientNameElement = document.createElement("strong");
    patientNameElement.textContent = patientName;
    patientInfo.append(patientNameElement);
    if (location) {
      const locationElement = document.createElement("span");
      locationElement.textContent = location;
      patientInfo.append(locationElement);
    }
    patientCell.append(patientInfo);
    row.append(patientCell);

    const medicineCell = document.createElement("td");
    const medicineInfo = document.createElement("div");
    medicineInfo.className = "dispensed-medicine";
    const medicineNameElement = document.createElement("span");
    medicineNameElement.textContent = medicineName;
    medicineInfo.append(medicineNameElement);
    if (strength) {
      const strengthElement = document.createElement("strong");
      strengthElement.textContent = strength;
      medicineInfo.append(strengthElement);
    }
    medicineCell.append(medicineInfo);
    row.append(medicineCell, createCell(quantity), createCell(date));

    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "medicine-action";
    const separator = document.createElement("span");
    separator.setAttribute("aria-hidden", "true");
    separator.textContent = "|";
    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "view-link";
    viewButton.dataset.viewDispensed = "";
    viewButton.textContent = "View";
    actions.append(separator, viewButton);
    actionsCell.append(actions);
    row.append(actionsCell);

    tableBody.prepend(row);
    return row;
  }

  function showDispensedRecord(row: HTMLTableRowElement): void {
    if (!dispensedPatientDetail || !dispensedHistoryBody) return;

    const patientId = row.dataset.patientId ?? "Not provided";
    const patientName = row.dataset.patientName ?? "Not provided";
    const location = row.dataset.location ?? "Not provided";
    const medicine = row.dataset.medicine ?? "Not provided";
    const strength = row.dataset.strength ?? "";
    const quantity = row.dataset.quantity ?? "Not provided";
    const date = row.dataset.dispensedDate ?? "";
    const history = getDispensingHistory(row);
    lastViewedButton = row.querySelector<HTMLButtonElement>("[data-view-dispensed]");

    const setText = (id: string, value: string): void => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    };

    setText("dispensedPatientNumber", `Patient No.: ${patientId}`);
    setText("dispensedPatientName", patientName);
    setText("dispensedPatientLocation", location);
    setText("dispensedLastDate", formatDispensedDate(history[0]?.date ?? date, "long"));
    setText("dispensedHistoryCount", `${history.length} ${history.length === 1 ? "record" : "records"}`);
    setText("dispensedSelectedRecord", [
      formatDispensedDate(date, "long"),
      [medicine, strength].filter(Boolean).join(" "),
      formatLongQuantity(quantity),
    ].join("  ·  "));
    setText("dispensedRecordBy", row.dataset.dispensedBy ?? "Not provided");
    setText("dispensedRecordDate", formatDispensedDate(date, "long"));
    setText("dispensedRecordFrequency", row.dataset.frequencyDuration ?? "Not provided");
    setText("dispensedDiagnosis", row.dataset.diagnosis ?? "Not provided");
    setText("dispensedPrescription", row.dataset.prescription ?? "Not provided");
    setText("dispensedPhilhealth", row.dataset.philhealth ?? "Not provided");

    dispensedHistoryBody.replaceChildren();
    history.forEach((record) => {
      const historyRow = document.createElement("tr");
      appendHistoryCell(historyRow, formatDispensedDate(record.date, "short"));
      const medicineCell = document.createElement("td");
      medicineCell.className = "dispensed-medicine-cell";
      const medicineName = document.createElement("strong");
      medicineName.textContent = record.medicine;
      medicineCell.append(medicineName);
      if (record.strength) {
        const medicineStrength = document.createElement("span");
        medicineStrength.textContent = record.strength;
        medicineCell.append(medicineStrength);
      }
      historyRow.append(medicineCell);
      appendHistoryCell(historyRow, record.quantity);
      appendHistoryCell(historyRow, record.frequency);
      appendHistoryCell(historyRow, record.dispensedBy);

      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = "dispensed-status";
      status.textContent = record.status;
      statusCell.append(status);
      historyRow.append(statusCell);
      dispensedHistoryBody.append(historyRow);
    });

    setDetailViewVisible(true);
    document.querySelectorAll<HTMLElement>(".dispensed-history-section, .dispensed-record-section")
      .forEach((section) => { section.scrollTop = 0; });
    backToDispensedPatients?.focus();
  }

  searchInput?.addEventListener("input", filterDispensedPatients);

  dateFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setActiveDateFilter(button.dataset.dateFilter ?? "all");
      closeDateRangeMenu();
      filterDispensedPatients();
    });
  });

  dateRangeToggle?.addEventListener("click", () => {
    if (dateRangeMenu?.classList.contains("show")) {
      closeDateRangeMenu();
      return;
    }
    dateRangeWrap?.classList.add("open");
    dateRangeMenu?.classList.add("show");
    dateRangeToggle.setAttribute("aria-expanded", "true");
  });

  dateRangeMenu?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!dateRangeMenu.reportValidity() || !dateRangeStart || !dateRangeEnd) return;

    if (dateRangeStart.value > dateRangeEnd.value) {
      if (dateRangeError) dateRangeError.hidden = false;
      return;
    }

    selectedStartDate = dateRangeStart.value;
    selectedEndDate = dateRangeEnd.value;
    if (dateRangeError) dateRangeError.hidden = true;
    setActiveDateFilter("custom");
    closeDateRangeMenu();
    filterDispensedPatients();
  });

  dateRangeStart?.addEventListener("input", () => {
    if (dateRangeEnd) dateRangeEnd.min = dateRangeStart.value;
    if (dateRangeError) dateRangeError.hidden = true;
  });
  dateRangeEnd?.addEventListener("input", () => {
    if (dateRangeStart) dateRangeStart.max = dateRangeEnd.value;
    if (dateRangeError) dateRangeError.hidden = true;
  });

  clearDateRangeButton?.addEventListener("click", () => {
    if (dateRangeStart) dateRangeStart.value = "";
    if (dateRangeEnd) dateRangeEnd.value = "";
    if (dateRangeStart) dateRangeStart.removeAttribute("max");
    if (dateRangeEnd) dateRangeEnd.removeAttribute("min");
    selectedStartDate = "";
    selectedEndDate = "";
    if (dateRangeError) dateRangeError.hidden = true;
    setActiveDateFilter("all");
    closeDateRangeMenu();
    filterDispensedPatients();
  });

  document.addEventListener("click", (event) => {
    if (event.target instanceof Node && !dateRangeWrap?.contains(event.target)) {
      closeDateRangeMenu();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dateRangeMenu?.classList.contains("show")) {
      event.preventDefault();
      closeDateRangeMenu(true);
    }
  });

  openDispenseButton?.addEventListener("click", () => {
    try {
      populateMedicineOptions();
    } catch {
      showDispenseError("Pharmacy inventory could not be loaded. Please reload and try again.");
    }
    dispenseDialog?.showModal();
    const formScroll = dispenseDialog?.querySelector<HTMLElement>(".dispense-form-scroll");
    if (formScroll) formScroll.scrollTop = 0;
    dispensePatientName?.focus({ preventScroll: true });
  });

  dispenseMedicineName?.addEventListener("input", updateSelectedMedicine);
  dispenseMedicineName?.addEventListener("change", updateSelectedMedicine);

  document.querySelectorAll<HTMLButtonElement>("[data-close-dispense]").forEach((button) => {
    button.addEventListener("click", () => dispenseDialog?.close());
  });
  dispenseDialog?.addEventListener("click", (event) => {
    if (event.target === dispenseDialog) dispenseDialog.close();
  });
  dispenseDialog?.addEventListener("close", () => {
    dispenseForm?.reset();
    if (dispenseStrength) dispenseStrength.value = "";
    if (dispenseOnHand) dispenseOnHand.value = "";
    if (dispenseFormError) dispenseFormError.hidden = true;
  });

  dispenseForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (
      !dispensePatientName || !dispensePhilhealth || !dispenseDiagnosis
      || !dispenseMedicineName || !dispenseStrength || !dispenseOnHand
      || !dispenseQuantity || !dispenseFrequency || !dispenseDate || !dispenseBy
      || !tableBody
    ) {
      showDispenseError("The dispense form could not be completed.");
      return;
    }

    if (!dispenseForm.reportValidity()) return;
    const prescription = dispenseForm.querySelector<HTMLInputElement>('input[name="prescription"]:checked');
    const medicineName = dispenseMedicineName.value.trim();
    const strength = dispenseStrength.value.trim();
    const quantity = dispenseQuantity.valueAsNumber;
    let inventory: ReturnType<typeof getPharmacyInventory>;
    try {
      inventory = getPharmacyInventory();
    } catch {
      showDispenseError("Pharmacy inventory could not be loaded. Please reload and try again.");
      return;
    }

    const availableQuantity = getAvailableQuantity(inventory, medicineName, strength);
    if (!strength || availableQuantity === 0) {
      showDispenseError("Choose a medicine with available stock.");
      return;
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > availableQuantity) {
      showDispenseError(`Enter a quantity from 1 to ${availableQuantity} units.`);
      dispenseQuantity.focus();
      return;
    }

    const row = appendDispensedRecord(
      createPatientId(),
      dispensePatientName.value.trim(),
      "",
      dispensePhilhealth.value.trim(),
      prescription?.value ?? "",
      dispenseDiagnosis.value.trim(),
      medicineName,
      strength,
      `${quantity} units`,
      dispenseDate.value,
      dispenseFrequency.value.trim(),
      dispenseBy.value.trim(),
    );
    if (!row) {
      showDispenseError("The dispense record could not be added.");
      return;
    }

    try {
      dispenseFromInventory(medicineName, strength, quantity);
    } catch (error) {
      row.remove();
      showDispenseError(
        error instanceof Error ? error.message : "Stock could not be updated. Please try again.",
      );
      updateSelectedMedicine();
      return;
    }

    dispenseDialog?.close();
    filterDispensedPatients();
    showRecordNotice("created", "A new pharmacy dispense record has been added.");
  });

  tableBody?.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const viewButton = event.target.closest<HTMLButtonElement>("[data-view-dispensed]");
    const row = viewButton?.closest<HTMLTableRowElement>("tr");
    if (row) showDispensedRecord(row);
  });

  backToDispensedPatients?.addEventListener("click", () => {
    setDetailViewVisible(false);
    lastViewedButton?.focus();
  });
});
