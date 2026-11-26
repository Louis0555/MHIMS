import {
  getPharmacyInventory,
  savePharmacyInventory,
  type PharmacyInventoryBatch,
} from "../../shared/pharmacy-inventory";
import { showRecordNotice } from "../../shared/record-save-notice";

type InventoryStatus = "in-stock" | "low-stock" | "expiring-soon" | "expired";

document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("medicineSearch") as HTMLInputElement | null;
  const statusButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-status-filter]"));
  const typeFilter = document.getElementById("medicineTypeFilter") as HTMLSelectElement | null;
  const table = document.getElementById("medicineInventory") as HTMLTableElement | null;
  const rows: HTMLTableRowElement[] = table
    ? Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"))
    : [];
  const mainContent = document.querySelector<HTMLElement>(".pharmacy-main-content");
  const medicineDetailView = document.getElementById("medicineDetailView");
  const medicineDetailBack = document.getElementById("medicineDetailBack");
  const medicineDetailEdit = document.getElementById("medicineDetailEdit");
  const dialog = document.getElementById("inventoryDialog") as HTMLDialogElement | null;
  const dialogTitle = document.getElementById("inventoryDialogTitle");
  const dialogDescription = document.getElementById("inventoryDialogDescription");
  const actionForm = document.getElementById("inventoryActionForm") as HTMLFormElement | null;
  const batchInput = document.getElementById("inventoryBatch") as HTMLInputElement | null;
  const categorySelect = document.getElementById("inventoryCategory") as HTMLSelectElement | null;
  const nameInput = document.getElementById("inventoryName") as HTMLInputElement | null;
  const strengthInput = document.getElementById("inventoryStrength") as HTMLInputElement | null;
  const expiryInput = document.getElementById("inventoryExpiry") as HTMLInputElement | null;
  const unitSelect = document.getElementById("inventoryUnit") as HTMLSelectElement | null;
  const quantityInput = document.getElementById("inventoryQuantity") as HTMLInputElement | null;
  const quantityLabel = document.getElementById("inventoryQuantityLabel");
  const reorderLevelInput = document.getElementById("inventoryReorderLevel") as HTMLInputElement | null;
  const dateReceivedInput = document.getElementById("inventoryDateReceived") as HTMLInputElement | null;
  const dateReceivedRequiredMarker = document.getElementById("inventoryDateReceivedRequiredMarker");
  const receivedByInput = document.getElementById("inventoryReceivedBy") as HTMLInputElement | null;
  const supplierInput = document.getElementById("inventorySupplier") as HTMLInputElement | null;
  const remarksInput = document.getElementById("inventoryRemarks") as HTMLTextAreaElement | null;
  const progressLabel = document.getElementById("inventoryProgressLabel");
  const progressPercent = document.getElementById("inventoryProgressPercent");
  const progressTrack = document.getElementById("inventoryProgressTrack");
  const progressFill = document.getElementById("inventoryProgressFill");
  const progressDetails = document.getElementById("inventoryProgressDetails");
  const emptyMessage = document.getElementById("emptyInventory");
  const submitButton = document.getElementById("inventorySubmit") as HTMLButtonElement | null;
  const errorMessage = document.getElementById("inventoryDialogError");
  const closeButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-close-dialog]"));
  let activeStatus = "all";
  let actionMode: "receive" | "edit" | null = null;
  let editingRow: HTMLTableRowElement | null = null;
  let activeMedicineRow: HTMLTableRowElement | null = null;
  let inventoryLoadError = "";

  function filterInventory(): void {
    const query = searchInput?.value.trim().toLowerCase() ?? "";
    const selectedType = typeFilter?.value ?? "";
    let visibleRows = 0;

    rows.forEach(row => {
      const matchesStatus = activeStatus === "all" || row.dataset.status === activeStatus;
      const matchesType = !selectedType || row.dataset.type === selectedType;
      const matchesQuery = !query || row.textContent?.toLowerCase().includes(query) === true;
      const isVisible = matchesStatus && matchesType && matchesQuery;
      row.hidden = !isVisible;
      if (isVisible) visibleRows += 1;
    });

    if (emptyMessage) emptyMessage.hidden = visibleRows > 0;
  }

  function updateProgress(): void {
    if (
      !nameInput || !categorySelect || !expiryInput || !unitSelect
      || !quantityInput || !dateReceivedInput
    ) return;

    const medicineComplete = Boolean(nameInput.value.trim() && categorySelect.value && expiryInput.value);
    const quantity = quantityInput.valueAsNumber;
    const stockComplete = Boolean(
      unitSelect.value
      && Number.isSafeInteger(quantity)
      && quantity >= (actionMode === "edit" ? 0 : 1)
      && (actionMode === "edit" || dateReceivedInput.value),
    );
    const completeCount = Number(medicineComplete) + Number(stockComplete);
    const percentage = completeCount * 50;
    const remainingSections = [
      !medicineComplete ? "Medicine Information" : "",
      !stockComplete ? "Stock & Distribution" : "",
    ].filter(Boolean);

    if (progressLabel) {
      progressLabel.textContent = `${completeCount} of 2 required ${completeCount === 1 ? "section" : "sections"} complete`;
    }
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(percentage));
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressDetails) {
      progressDetails.textContent = remainingSections.length
        ? `${remainingSections.length} section${remainingSections.length === 1 ? "" : "s"} left: ${remainingSections.join(", ")}`
        : "All required sections are complete.";
    }
  }

  function getStatus(expiryDate: string, quantity: number, reorderLevel: number): InventoryStatus {
    const expiry = new Date(`${expiryDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);

    if (daysUntilExpiry < 0) return "expired";
    if (quantity <= reorderLevel) return "low-stock";
    if (daysUntilExpiry <= 90) return "expiring-soon";
    return "in-stock";
  }

  function statusLabel(status: InventoryStatus): string {
    if (status === "low-stock") return "Low stock";
    if (status === "expiring-soon") return "Expiring Soon";
    if (status === "expired") return "Expired";
    return "In stock";
  }

  function createBatchNumber(): string {
    const base = `BAT-${Date.now().toString().slice(-5)}`;
    let candidate = base;
    let suffix = 1;

    while (rows.some(row => row.cells[0]?.textContent?.trim().toLowerCase() === candidate.toLowerCase())) {
      candidate = `${base}-${suffix}`;
      suffix += 1;
    }
    return candidate;
  }

  function appendInventoryRow(
    batchNumber: string,
    category: string,
    medicineName: string,
    strength: string,
    expiryDate: string,
    quantity: number,
    unit: string,
    reorderLevel: number,
    dateReceived: string,
    receivedBy: string,
    supplier: string,
    remarks: string,
  ): boolean {
    const tbody = table?.querySelector("tbody");
    if (!tbody) return false;

    const status = getStatus(expiryDate, quantity, reorderLevel);
    const row = document.createElement("tr");
    row.dataset.status = status;
    row.dataset.type = category;
    row.dataset.unit = unit;
    row.dataset.reorderLevel = String(reorderLevel);
    row.dataset.dateReceived = dateReceived;
    row.dataset.receivedBy = receivedBy;
    row.dataset.supplier = supplier;
    row.dataset.remarks = remarks;
    row.dataset.strength = strength;
    row.dataset.quantityReceived = String(quantity);

    row.insertCell().textContent = batchNumber;

    const medicineCell = row.insertCell();
    const medicineInfo = document.createElement("div");
    medicineInfo.className = "medicine-info";
    const medicineTitle = document.createElement("strong");
    medicineTitle.textContent = medicineName;
    const medicineCategory = document.createElement("span");
    medicineCategory.textContent = category;
    medicineInfo.append(medicineTitle, medicineCategory);
    medicineCell.append(medicineInfo);

    row.insertCell().textContent = strength || "—";
    const stockCell = row.insertCell();
    stockCell.className = "stock-value";
    stockCell.textContent = String(quantity);
    row.insertCell().textContent = expiryDate;

    const statusCell = row.insertCell();
    const statusPill = document.createElement("span");
    statusPill.className = `stock-status ${status}`;
    const statusDot = document.createElement("span");
    statusDot.className = "status-dot";
    statusDot.setAttribute("aria-hidden", "true");
    statusPill.append(statusDot, document.createTextNode(statusLabel(status)));
    statusCell.append(statusPill);

    const actionCell = row.insertCell();
    const actions = document.createElement("div");
    actions.className = "medicine-action";
    const separator = document.createElement("span");
    separator.textContent = "|";
    separator.setAttribute("aria-hidden", "true");
    const viewButton = document.createElement("button");
    viewButton.type = "button";
    viewButton.className = "view-link";
    viewButton.dataset.inventoryAction = "view";
    viewButton.setAttribute("aria-label", `View ${medicineName}, batch ${batchNumber}`);
    viewButton.textContent = "View";
    actions.append(separator, viewButton);
    actionCell.append(actions);

    tbody.prepend(row);
    rows.unshift(row);
    return true;
  }

  function loadSavedInventory(): void {
    try {
      const inventory = getPharmacyInventory();
      inventory.forEach(batch => {
        const row = rows.find(
          item => item.cells[0]?.textContent?.trim() === batch.batchNumber,
        );
        if (!row) {
          appendInventoryRow(
            batch.batchNumber,
            batch.category,
            batch.medicineName,
            batch.strength,
            batch.expiryDate,
            batch.quantity,
            batch.unit,
            batch.reorderLevel,
            batch.dateReceived,
            batch.receivedBy,
            batch.supplier,
            batch.remarks,
          );
          return;
        }

        row.dataset.unit = batch.unit;
        row.dataset.reorderLevel = String(batch.reorderLevel);
        row.dataset.dateReceived = batch.dateReceived;
        row.dataset.receivedBy = batch.receivedBy;
        row.dataset.supplier = batch.supplier;
        row.dataset.remarks = batch.remarks;
        row.dataset.strength = batch.strength;

        const stockCell = row.querySelector<HTMLElement>(".stock-value");
        const storedQuantity = stockCell ? Number(stockCell.textContent) : Number.NaN;
        if (!stockCell || storedQuantity === batch.quantity) return;

        stockCell.textContent = String(batch.quantity);
        const status = getStatus(batch.expiryDate, batch.quantity, batch.reorderLevel);
        row.dataset.status = status;
        const statusPill = row.cells[5]?.querySelector<HTMLElement>(".stock-status");
        const statusDot = statusPill?.querySelector<HTMLElement>(".status-dot");
        if (statusPill && statusDot) {
          statusPill.className = `stock-status ${status}`;
          statusPill.replaceChildren(statusDot, document.createTextNode(statusLabel(status)));
        }
      });
    } catch (error) {
      inventoryLoadError = error instanceof Error
        ? error.message
        : "Saved pharmacy inventory could not be loaded.";
      console.error(inventoryLoadError);
    }
  }

  function openActionDialog(): void {
    if (
      !dialog || !dialogTitle || !dialogDescription || !actionForm
      || !submitButton
    ) return;

    actionForm.reset();
    actionForm.hidden = false;
    submitButton.hidden = false;
    actionMode = "receive";
    editingRow = null;
    if (quantityInput) quantityInput.min = "1";
    if (dateReceivedInput) dateReceivedInput.required = true;
    if (dateReceivedRequiredMarker) dateReceivedRequiredMarker.hidden = false;
    if (quantityLabel?.firstChild) quantityLabel.firstChild.textContent = "Quantity Received ";
    dialogTitle.textContent = "Receive Stock";
    dialogDescription.textContent = "Add a new medicine or incoming batch to inventory";
    submitButton.textContent = "Save to Inventory";
    if (errorMessage) {
      errorMessage.textContent = inventoryLoadError;
      errorMessage.hidden = !inventoryLoadError;
    }
    updateProgress();
    dialog.showModal();
  }

  function setMedicineDetailText(id: string, value: string): void {
    const element = document.getElementById(id);
    if (!(element instanceof HTMLElement)) {
      throw new Error(`Required medicine detail element #${id} was not found.`);
    }
    element.textContent = value;
  }

  function openMedicineDetailView(row: HTMLTableRowElement): void {
    if (!mainContent || !medicineDetailView) {
      throw new Error("The medicine detail view is unavailable.");
    }

    const cells = Array.from(row.cells);
    const medicineName = cells[1]?.querySelector("strong")?.textContent?.trim() ?? "";
    const medicineType = cells[1]?.querySelector("span")?.textContent?.trim() ?? "";
    const strength = cells[2]?.textContent?.trim() || "—";
    const expiryDate = cells[4]?.textContent?.trim() || "—";
    const quantity = cells[3]?.textContent?.trim() || "—";
    const status = cells[5]?.textContent?.trim() || "—";
    const batchNumber = cells[0]?.textContent?.trim() || "—";
    const statusElement = document.getElementById("medicineDetailStatus");
    if (!(statusElement instanceof HTMLElement)) {
      throw new Error("The medicine detail status element is unavailable.");
    }

    setMedicineDetailText("medicineDetailBatch", batchNumber);
    setMedicineDetailText("medicineDetailName", medicineName || "Unnamed medicine");
    setMedicineDetailText("medicineDetailCategory", medicineType || "—");
    setMedicineDetailText("medicineDetailStrength", strength);
    setMedicineDetailText("medicineDetailOnHand", `${quantity} ${row.dataset.unit ?? ""}`.trim());
    setMedicineDetailText("medicineDetailStatusLabel", status);
    setMedicineDetailText("medicineDetailInfoName", medicineName || "—");
    setMedicineDetailText("medicineDetailInfoCategory", medicineType || "—");
    setMedicineDetailText("medicineDetailInfoStrength", strength);
    setMedicineDetailText("medicineDetailExpiry", expiryDate);
    setMedicineDetailText("medicineDetailUnit", row.dataset.unit || "Not recorded");
    setMedicineDetailText("medicineDetailQuantityReceived", row.dataset.quantityReceived || "Not recorded");
    setMedicineDetailText("medicineDetailReorderLevel", row.dataset.reorderLevel || "Not recorded");
    setMedicineDetailText("medicineDetailDateReceived", row.dataset.dateReceived || "Not recorded");
    setMedicineDetailText("medicineDetailReceivedBy", row.dataset.receivedBy || "Not recorded");
    setMedicineDetailText("medicineDetailSupplier", row.dataset.supplier || "Not recorded");
    setMedicineDetailText("medicineDetailRemarks", row.dataset.remarks || "No remarks recorded.");
    statusElement.className = `stock-status ${row.dataset.status ?? "in-stock"}`;
    activeMedicineRow = row;
    actionMode = null;
    medicineDetailView.hidden = false;
    mainContent.classList.add("medicine-detail-open");
  }

  function updateInventoryRow(row: HTMLTableRowElement, batch: PharmacyInventoryBatch): void {
    const status = getStatus(batch.expiryDate, batch.quantity, batch.reorderLevel);
    const medicineNameElement = row.cells[1]?.querySelector<HTMLElement>("strong");
    const categoryElement = row.cells[1]?.querySelector<HTMLElement>("span");
    const stockCell = row.querySelector<HTMLElement>(".stock-value");
    const statusPill = row.cells[5]?.querySelector<HTMLElement>(".stock-status");
    const statusDot = statusPill?.querySelector<HTMLElement>(".status-dot");
    const viewButton = row.querySelector<HTMLButtonElement>("[data-inventory-action='view']");

    if (!medicineNameElement || !categoryElement || !stockCell || !statusPill || !statusDot || !viewButton) {
      throw new Error("The medicine inventory row is incomplete and cannot be updated.");
    }

    row.cells[0].textContent = batch.batchNumber;
    medicineNameElement.textContent = batch.medicineName;
    categoryElement.textContent = batch.category;
    row.cells[2].textContent = batch.strength || "—";
    stockCell.textContent = String(batch.quantity);
    row.cells[4].textContent = batch.expiryDate;
    row.dataset.status = status;
    row.dataset.type = batch.category;
    row.dataset.unit = batch.unit;
    row.dataset.reorderLevel = String(batch.reorderLevel);
    row.dataset.dateReceived = batch.dateReceived;
    row.dataset.receivedBy = batch.receivedBy;
    row.dataset.supplier = batch.supplier;
    row.dataset.remarks = batch.remarks;
    row.dataset.strength = batch.strength;
    statusPill.className = `stock-status ${status}`;
    statusPill.replaceChildren(statusDot, document.createTextNode(statusLabel(status)));
    viewButton.setAttribute("aria-label", `View ${batch.medicineName}, batch ${batch.batchNumber}`);
  }

  function openEditMedicineDialog(row: HTMLTableRowElement): void {
    if (
      !dialog || !dialogTitle || !dialogDescription || !actionForm || !submitButton
      || !batchInput || !categorySelect || !nameInput || !strengthInput || !expiryInput
      || !unitSelect || !quantityInput || !reorderLevelInput || !dateReceivedInput
      || !receivedByInput || !supplierInput || !remarksInput
    ) return;

    actionForm.reset();
    const medicineName = row.cells[1]?.querySelector("strong")?.textContent?.trim() ?? "";
    const quantity = row.querySelector<HTMLElement>(".stock-value")?.textContent?.trim() ?? "";
    batchInput.value = row.cells[0]?.textContent?.trim() ?? "";
    categorySelect.value = row.dataset.type ?? "";
    nameInput.value = medicineName;
    strengthInput.value = row.dataset.strength ?? row.cells[2]?.textContent?.trim() ?? "";
    expiryInput.value = row.cells[4]?.textContent?.trim() ?? "";
    unitSelect.value = row.dataset.unit || "units";
    quantityInput.value = quantity;
    reorderLevelInput.value = row.dataset.reorderLevel ?? "0";
    dateReceivedInput.value = row.dataset.dateReceived ?? "";
    receivedByInput.value = row.dataset.receivedBy ?? "";
    supplierInput.value = row.dataset.supplier ?? "";
    remarksInput.value = row.dataset.remarks ?? "";

    actionForm.hidden = false;
    submitButton.hidden = false;
    actionMode = "edit";
    editingRow = row;
    quantityInput.min = "0";
    dateReceivedInput.required = false;
    if (dateReceivedRequiredMarker) dateReceivedRequiredMarker.hidden = true;
    if (quantityLabel?.firstChild) quantityLabel.firstChild.textContent = "On-Hand Quantity ";
    categorySelect.dispatchEvent(new Event("change", { bubbles: true }));
    unitSelect.dispatchEvent(new Event("change", { bubbles: true }));
    dialogTitle.textContent = "Edit Medicine";
    dialogDescription.textContent = "Update this medicine batch and its inventory details";
    submitButton.textContent = "Save Changes";
    if (errorMessage) {
      errorMessage.textContent = "";
      errorMessage.hidden = true;
    }
    updateProgress();
    dialog.showModal();
  }

  searchInput?.addEventListener("input", filterInventory);
  typeFilter?.addEventListener("change", filterInventory);
  actionForm?.addEventListener("input", updateProgress);
  actionForm?.addEventListener("change", updateProgress);

  statusButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeStatus = button.dataset.statusFilter ?? "all";
      statusButtons.forEach(item => {
        const isActive = item === button;
        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });
      filterInventory();
    });
  });

  document.addEventListener("click", event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const actionButton = target.closest<HTMLButtonElement>("[data-inventory-action]");
    if (!actionButton) return;

    const mode = actionButton.dataset.inventoryAction;
    if (mode === "receive") {
      openActionDialog();
    } else if (mode === "view") {
      const row = actionButton.closest<HTMLTableRowElement>("tr");
      if (row) openMedicineDetailView(row);
    }
  });

  medicineDetailBack?.addEventListener("click", () => {
    if (!mainContent || !medicineDetailView) {
      throw new Error("The medicine inventory view is unavailable.");
    }
    mainContent.classList.remove("medicine-detail-open");
    medicineDetailView.hidden = true;
    activeMedicineRow = null;
  });

  medicineDetailEdit?.addEventListener("click", () => {
    if (activeMedicineRow) openEditMedicineDialog(activeMedicineRow);
  });

  actionForm?.addEventListener("submit", event => {
    event.preventDefault();
    if (
      (actionMode !== "receive" && actionMode !== "edit")
      || !batchInput || !categorySelect || !nameInput || !strengthInput
      || !expiryInput || !unitSelect || !quantityInput || !reorderLevelInput
      || !dateReceivedInput || !receivedByInput || !supplierInput || !remarksInput
    ) return;

    const requestedBatch = batchInput.value.trim();
    const batchNumber = requestedBatch
      || (actionMode === "edit" ? editingRow?.cells[0]?.textContent?.trim() ?? "" : createBatchNumber());
    const batchExists = rows.some(row =>
      row !== editingRow
      && row.cells[0]?.textContent?.trim().toLowerCase() === batchNumber.toLowerCase(),
    );
    if (batchExists) {
      if (errorMessage) {
        errorMessage.textContent = "That batch number already exists. Enter a different batch number.";
        errorMessage.hidden = false;
      }
      batchInput.focus();
      return;
    }

    const quantity = quantityInput.valueAsNumber;
    const reorderLevel = reorderLevelInput.value === "" ? 0 : reorderLevelInput.valueAsNumber;
    if (
      !Number.isSafeInteger(quantity)
      || quantity < (actionMode === "edit" ? 0 : 1)
      || !Number.isSafeInteger(reorderLevel)
      || reorderLevel < 0
    ) {
      if (errorMessage) {
        errorMessage.textContent = "Enter a valid quantity and reorder level.";
        errorMessage.hidden = false;
      }
      return;
    }

    let inventory: PharmacyInventoryBatch[];
    try {
      inventory = getPharmacyInventory();
    } catch (error) {
      if (errorMessage) {
        errorMessage.textContent = error instanceof Error
          ? error.message
          : "Saved pharmacy inventory could not be loaded.";
        errorMessage.hidden = false;
      }
      return;
    }

    const updatedBatch: PharmacyInventoryBatch = {
      batchNumber,
      category: categorySelect.value,
      medicineName: nameInput.value.trim(),
      strength: strengthInput.value.trim(),
      expiryDate: expiryInput.value,
      quantity,
      unit: unitSelect.value,
      reorderLevel,
      dateReceived: dateReceivedInput.value,
      receivedBy: receivedByInput.value.trim(),
      supplier: supplierInput.value.trim(),
      remarks: remarksInput.value.trim(),
    };

    if (actionMode === "edit") {
      if (!editingRow) {
        if (errorMessage) {
          errorMessage.textContent = "The medicine being edited could not be found.";
          errorMessage.hidden = false;
        }
        return;
      }

      const currentBatchNumber = editingRow.cells[0]?.textContent?.trim() ?? "";
      const updatedInventory = inventory.slice();
      const existingBatchIndex = updatedInventory.findIndex(
        batch => batch.batchNumber.toLowerCase() === currentBatchNumber.toLowerCase(),
      );
      if (existingBatchIndex >= 0) {
        updatedInventory[existingBatchIndex] = updatedBatch;
      } else {
        updatedInventory.push(updatedBatch);
      }

      try {
        savePharmacyInventory(updatedInventory);
      } catch (error) {
        console.error("The medicine changes could not be saved.", error);
        if (errorMessage) {
          errorMessage.textContent = "The medicine changes could not be saved.";
          errorMessage.hidden = false;
        }
        return;
      }

      const row = editingRow;
      updateInventoryRow(row, updatedBatch);
      actionForm.reset();
      if (errorMessage) {
        errorMessage.textContent = "";
        errorMessage.hidden = true;
      }
      updateProgress();
      dialog?.close();
      openMedicineDetailView(row);
      filterInventory();
      showRecordNotice("updated", "Pharmacy medicine record has been updated.");
      return;
    }

    const rowAdded = appendInventoryRow(
      batchNumber,
      categorySelect.value,
      nameInput.value.trim(),
      strengthInput.value.trim(),
      expiryInput.value,
      quantity,
      unitSelect.value,
      reorderLevel,
      dateReceivedInput.value,
      receivedByInput.value.trim(),
      supplierInput.value.trim(),
      remarksInput.value.trim(),
    );
    if (!rowAdded) {
      if (errorMessage) {
        errorMessage.textContent = "The medicine inventory table is unavailable.";
        errorMessage.hidden = false;
      }
      return;
    }

    try {
      savePharmacyInventory([...inventory, {
        batchNumber,
        category: categorySelect.value,
        medicineName: nameInput.value.trim(),
        strength: strengthInput.value.trim(),
        expiryDate: expiryInput.value,
        quantity,
        unit: unitSelect.value,
        reorderLevel,
        dateReceived: dateReceivedInput.value,
        receivedBy: receivedByInput.value.trim(),
        supplier: supplierInput.value.trim(),
        remarks: remarksInput.value.trim(),
      }]);
    } catch {
      const addedIndex = rows.findIndex(
        row => row.cells[0]?.textContent?.trim() === batchNumber,
      );
      if (addedIndex >= 0) rows.splice(addedIndex, 1)[0].remove();
      if (errorMessage) {
        errorMessage.textContent = "The new inventory batch could not be saved.";
        errorMessage.hidden = false;
      }
      return;
    }

    actionForm.reset();
    if (errorMessage) {
      errorMessage.textContent = "";
      errorMessage.hidden = true;
    }
    updateProgress();
    actionMode = null;
    dialog?.close();
    filterInventory();
    showRecordNotice("created", "A new medicine inventory record has been added.");
  });

  closeButtons.forEach(button => button.addEventListener("click", () => dialog?.close()));
  dialog?.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
  dialog?.addEventListener("close", () => {
    actionMode = null;
    editingRow = null;
    if (actionForm) actionForm.hidden = false;
    if (submitButton) submitButton.hidden = false;
    if (quantityInput) quantityInput.min = "1";
    if (dateReceivedInput) dateReceivedInput.required = true;
    if (dateReceivedRequiredMarker) dateReceivedRequiredMarker.hidden = false;
    if (quantityLabel?.firstChild) quantityLabel.firstChild.textContent = "Quantity Received ";
    if (submitButton) submitButton.textContent = "Save to Inventory";
  });

  loadSavedInventory();
});
