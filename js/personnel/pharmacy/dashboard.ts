import { showRecordNotice } from "../../shared/record-save-notice";

document.addEventListener('DOMContentLoaded', () => {
  const storageKey = 'mhims-personnel-pharmacy-inventory-v1';
  const form = document.getElementById('medicineForm');
  const tbody = document.getElementById('inventoryTableBody');
  const search = document.getElementById('inventorySearch');
  const emptyState = document.getElementById('inventoryEmptyState');
  const summary = document.getElementById('inventorySummary');
  const toast = document.getElementById('pharmacyToast');
  const toggleForm = document.getElementById('toggleMedicineForm');
  const cancelForm = document.getElementById('cancelMedicineForm');
  const counts = {
    total: document.getElementById('totalMedicines'),
    low: document.getElementById('lowStockCount'),
    out: document.getElementById('outOfStockCount'),
    expiring: document.getElementById('expiringCount')
  };
  let toastTimer;
  let medicines;

  function showMessage(message, isError) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.toggle('is-error', Boolean(isError));
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    medicines = stored === null ? [] : JSON.parse(stored);
    if (!Array.isArray(medicines) || medicines.some(item => !item || typeof item !== 'object')) {
      throw new TypeError('Saved pharmacy inventory is not a valid list.');
    }
  } catch (error) {
    console.error('Unable to load pharmacy inventory.', error);
    showMessage('Inventory could not be loaded from this browser.', true);
    if (form) form.querySelectorAll('input, button').forEach(control => { control.disabled = true; });
    if (toggleForm) toggleForm.disabled = true;
    return;
  }

  function save(nextMedicines) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextMedicines));
      medicines = nextMedicines;
      return true;
    } catch (error) {
      console.error('Unable to save pharmacy inventory.', error);
      showMessage('Inventory could not be saved in this browser. Check storage access and try again.', true);
      return false;
    }
  }

  function formatExpiry(value) {
    if (!value) return 'Not set';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  function getStockStatus(item) {
    if (item.quantity <= 0) return { label: 'Out of stock', className: 'stock-status--out' };
    if (item.quantity <= item.reorderLevel) return { label: 'Low stock', className: 'stock-status--low' };
    return { label: 'In stock', className: 'stock-status--ok' };
  }

  function isExpiringSoon(item) {
    if (!item.expiry) return false;
    const expiry = new Date(`${item.expiry}T00:00:00`);
    if (Number.isNaN(expiry.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiry - today) / 86400000);
    return daysUntilExpiry >= 0 && daysUntilExpiry <= 90;
  }

  function appendCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value;
    row.appendChild(cell);
    return cell;
  }

  function createRow(item) {
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    const name = document.createElement('span');
    name.className = 'medicine-name';
    name.textContent = item.name;
    const strength = document.createElement('span');
    strength.className = 'medicine-strength';
    strength.textContent = item.strength;
    nameCell.append(name, strength);
    row.appendChild(nameCell);

    appendCell(row, item.batch || '—');
    appendCell(row, String(item.quantity));
    appendCell(row, formatExpiry(item.expiry));

    const status = getStockStatus(item);
    const statusCell = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = `stock-status ${status.className}`;
    badge.textContent = status.label;
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actions = document.createElement('td');
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'inventory-remove';
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('aria-label', `Remove ${item.name}`);
    removeButton.addEventListener('click', () => {
      const next = medicines.filter(medicine => medicine.id !== item.id);
      if (save(next)) {
        render();
        showMessage(`${item.name} was removed from this browser's inventory.`);
      }
    });
    actions.appendChild(removeButton);
    row.appendChild(actions);
    return row;
  }

  function render() {
    const query = search ? search.value.trim().toLowerCase() : '';
    const filtered = medicines.filter(item =>
      `${item.name} ${item.strength} ${item.batch || ''}`.toLowerCase().includes(query)
    );
    const lowStock = medicines.filter(item => item.quantity > 0 && item.quantity <= item.reorderLevel).length;
    const outOfStock = medicines.filter(item => item.quantity <= 0).length;

    if (counts.total) counts.total.textContent = String(medicines.length);
    if (counts.low) counts.low.textContent = String(lowStock);
    if (counts.out) counts.out.textContent = String(outOfStock);
    if (counts.expiring) counts.expiring.textContent = String(medicines.filter(isExpiringSoon).length);
    if (summary) {
      summary.textContent = medicines.length
        ? `${medicines.length} item${medicines.length === 1 ? '' : 's'} in this browser's inventory.`
        : 'Add medicines to begin tracking stock.';
    }

    if (tbody) {
      tbody.replaceChildren(...filtered.map(createRow));
    }
    if (emptyState) {
      emptyState.hidden = filtered.length > 0;
      const message = emptyState.querySelector('span');
      if (message) {
        message.textContent = medicines.length && query
          ? 'No inventory items match this search.'
          : 'Add a medicine to start a local inventory list.';
      }
    }
  }

  if (toggleForm && form) {
    toggleForm.addEventListener('click', () => {
      form.hidden = !form.hidden;
      if (!form.hidden) form.querySelector('input[name="name"]').focus();
    });
  }

  if (cancelForm && form) {
    cancelForm.addEventListener('click', () => {
      form.reset();
      form.hidden = true;
    });
  }

  if (search) search.addEventListener('input', render);

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const data = new FormData(form);
      const quantity = Number(data.get('quantity'));
      const reorderLevel = Number(data.get('reorderLevel'));
      if (!Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(reorderLevel) || reorderLevel < 0) {
        showMessage('Quantity and low-stock threshold must be whole numbers of zero or more.', true);
        return;
      }

      const medicine = {
        id: window.crypto && typeof window.crypto.randomUUID === 'function'
          ? window.crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name: String(data.get('name') || '').trim(),
        strength: String(data.get('strength') || '').trim(),
        batch: String(data.get('batch') || '').trim(),
        quantity,
        reorderLevel,
        expiry: String(data.get('expiry') || '')
      };

      if (!medicine.name || !medicine.strength) {
        showMessage('Medicine name and strength/form are required.', true);
        return;
      }

      if (save([...medicines, medicine])) {
        form.reset();
        form.hidden = true;
        render();
        showRecordNotice('created', `${medicine.name} was added to the pharmacy inventory.`);
      }
    });
  }

  render();
});
