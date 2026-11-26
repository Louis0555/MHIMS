import { showRecordNotice } from "../../shared/record-save-notice";

document.addEventListener('DOMContentLoaded', () => {
  const table = document.getElementById('interventionTable') as HTMLTableElement | null;
  const tbody = table?.tBodies[0] ?? null;
  const rows = Array.from(tbody?.querySelectorAll<HTMLTableRowElement>('tr[data-patient-no]') ?? []);
  const searchInput = document.getElementById('interventionSearchInput') as HTMLInputElement | null;
  const allFilterButton = document.getElementById('btnFilterAll') as HTMLButtonElement | null;
  const progressButtons = Array.from(document.querySelectorAll<HTMLButtonElement>('.progress-filter-btn'));
  const programFilterButton = document.getElementById('programDropdownBtn') as HTMLButtonElement | null;
  const programFilterWrap = document.getElementById('programDropdownWrap');
  const programFilterMenu = document.getElementById('programDropdownMenu');
  const addButton = document.getElementById('btnAddIntervention') as HTMLButtonElement | null;
  const modal = document.getElementById('interventionModal');
  const viewModal = document.getElementById('interventionViewModal');
  const form = document.getElementById('interventionForm') as HTMLFormElement | null;
  const patientSelect = document.getElementById('interventionPatientNo') as HTMLSelectElement | null;
  const programSelect = document.getElementById('interventionProgram') as HTMLSelectElement | null;
  const dateInput = document.getElementById('interventionDate') as HTMLInputElement | null;
  const followUpInput = document.getElementById('interventionFollowUp') as HTMLInputElement | null;
  const formTitle = document.getElementById('interventionModalTitle');
  const formSubtitle = document.querySelector<HTMLElement>('#interventionModal .modal-subtitle');
  const saveButton = document.getElementById('btnSaveIntervention');
  const viewSections = document.querySelector<HTMLElement>('#interventionViewModal .intervention-view-sections');
  const activeFilters: { progress: string | null; program: string | null } = {
    progress: null,
    program: null
  };
  let emptyRow: HTMLTableRowElement | null = null;
  let activeViewRow: HTMLTableRowElement | null = null;
  let editingRow: HTMLTableRowElement | null = null;

  rows.forEach((row, index) => {
    row.dataset.logId = row.dataset.logId ?? `LOG${String(index + 1).padStart(3, '0')}`;
    row.dataset.registeredDate = row.dataset.registeredDate ?? 'October 1, 2026';
  });

  function applyFilters() {
    const query = searchInput?.value.trim().toLowerCase() ?? '';
    let visibleCount = 0;

    rows.forEach(row => {
      const searchableText = `${row.textContent ?? ''} ${row.dataset.notes ?? ''}`.toLowerCase();
      const matchesSearch = !query || searchableText.includes(query);
      const matchesProgress = !activeFilters.progress || row.dataset.progress === activeFilters.progress;
      const matchesProgram = !activeFilters.program || row.dataset.program === activeFilters.program;
      const visible = matchesSearch && matchesProgress && matchesProgram;
      row.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    if (tbody && visibleCount === 0) {
      if (!emptyRow) {
        emptyRow = document.createElement('tr');
        emptyRow.className = 'empty-table-row';
        const cell = emptyRow.insertCell();
        cell.colSpan = 6;
        cell.textContent = 'No intervention entries match the selected filters.';
        tbody.appendChild(emptyRow);
      }
      emptyRow.style.display = '';
    } else if (emptyRow) {
      emptyRow.style.display = 'none';
    }

    allFilterButton?.classList.toggle('active', !activeFilters.progress && !activeFilters.program);
    progressButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.progress === activeFilters.progress);
    });
    programFilterButton?.classList.toggle('has-filter', Boolean(activeFilters.program));
    programFilterButton?.classList.toggle('active', Boolean(activeFilters.program));
  }

  function closeDropdown() {
    programFilterWrap?.classList.remove('open');
    programFilterMenu?.classList.remove('show');
    programFilterButton?.setAttribute('aria-expanded', 'false');
  }

  programFilterButton?.addEventListener('click', event => {
    event.stopPropagation();
    const shouldOpen = !programFilterWrap?.classList.contains('open');
    closeDropdown();
    if (shouldOpen) {
      programFilterWrap?.classList.add('open');
      programFilterMenu?.classList.add('show');
      programFilterButton?.setAttribute('aria-expanded', 'true');
    }
  });

  programFilterMenu?.querySelectorAll<HTMLAnchorElement>('.filter-menu-item').forEach(item => {
    item.addEventListener('click', event => {
      event.preventDefault();
      programFilterMenu.querySelectorAll('.filter-menu-item').forEach(option => option.classList.remove('selected'));
      item.classList.add('selected');
      activeFilters.program = item.dataset.value ?? null;
      const label = programFilterButton?.querySelector('.filter-btn-text');
      if (label) label.textContent = item.textContent?.trim() ?? 'Programs';
      closeDropdown();
      applyFilters();
    });
  });

  programFilterWrap?.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', closeDropdown);

  allFilterButton?.addEventListener('click', () => {
    activeFilters.progress = null;
    activeFilters.program = null;
    if (programFilterButton) {
      const label = programFilterButton.querySelector('.filter-btn-text');
      if (label) label.textContent = 'Programs';
    }
    programFilterMenu?.querySelectorAll('.filter-menu-item').forEach(item => item.classList.remove('selected'));
    closeDropdown();
    applyFilters();
  });

  progressButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeFilters.progress = button.dataset.progress ?? null;
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', applyFilters);

  function closeModal() {
    if (!modal || !form) return;
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('intervention-modal-open');
    form.reset();
    const progressInput = form.querySelector<HTMLInputElement>('input[name="progress"]');
    if (progressInput) {
      progressInput.defaultValue = 'On-Going';
      progressInput.value = 'On-Going';
    }
    editingRow = null;
    if (formTitle) formTitle.textContent = 'Add Intervention Log';
    if (formSubtitle) formSubtitle.textContent = 'Record a new intervention entry for a child';
    if (saveButton) saveButton.textContent = 'Save Record';
    addButton?.focus();
  }

  addButton?.addEventListener('click', () => {
    if (!modal || !form) return;
    editingRow = null;
    form.reset();
    const progressInput = form.querySelector<HTMLInputElement>('input[name="progress"]');
    if (progressInput) {
      progressInput.defaultValue = 'On-Going';
      progressInput.value = 'On-Going';
    }
    if (formTitle) formTitle.textContent = 'Add Intervention Log';
    if (formSubtitle) formSubtitle.textContent = 'Record a new intervention entry for a child';
    if (saveButton) saveButton.textContent = 'Save Record';
    document.body.classList.add('intervention-modal-open');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    patientSelect?.focus();
  });

  document.getElementById('btnCloseInterventionModal')?.addEventListener('click', closeModal);
  document.getElementById('btnCancelIntervention')?.addEventListener('click', closeModal);
  modal?.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (viewModal?.style.display === 'flex') closeViewModal();
    else if (modal?.style.display === 'flex') closeModal();
  });

  function formatDate(value: string) {
    if (!value) return '—';
    const [year, month, day] = value.split('-');
    return `${month}/${day}/${year}`;
  }

  function toIsoDate(value: string) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const parts = value.trim().split(/[/-]/);
    if (parts.length !== 3) return '';
    const [first, second, third] = parts;
    if (first.length === 4) return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
    return `${third}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
  }

  function toLongDate(value: string) {
    const isoDate = toIsoDate(value);
    if (!isoDate) return value || '—';
    const [year, month, day] = isoDate.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function setViewText(id: string, value: string) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function openViewModal(row: HTMLTableRowElement) {
    if (!viewModal) return;
    activeViewRow = row;
    const patientName = row.querySelector<HTMLElement>('.patient-col-name')?.textContent?.trim() ?? row.dataset.patientNo ?? 'Child';
    const program = row.dataset.program ?? row.cells[2]?.textContent?.trim() ?? 'Feeding';
    const progress = row.dataset.progress ?? 'On-Going';
    const lastUpdated = row.cells[4]?.textContent?.trim() ?? '';
    const isFeeding = program.toLowerCase() === 'feeding';
    const hasFeedingSessions = isFeeding && progress === 'On-Going';
    const programStatus = document.getElementById('interventionViewProgramStatus');
    const sessionBlock = document.getElementById('interventionViewSessionBlock');
    const followUp = document.querySelector<HTMLElement>('.intervention-follow-up');
    const followUpValue = row.dataset.nextFollowUp ?? '';

    setViewText('interventionViewLogId', row.dataset.logId ?? 'LOG001');
    setViewText('interventionViewPatientName', patientName);
    setViewText('interventionViewLastUpdated', toLongDate(lastUpdated));
    setViewText('interventionViewNutritionStatus', row.dataset.nutritionStatus ?? 'Underweight');
    setViewText('interventionViewRegistered', row.dataset.registeredDate ?? 'October 1, 2026');
    setViewText('interventionViewProgramCategory', isFeeding ? 'SUPPLEMENTARY FEEDING' : `${program.toUpperCase()} PROGRAM`);
    setViewText('interventionViewProgramName', `${program} Intervention`);
    setViewText('interventionViewProgramStatus', progress);
    setViewText('interventionViewActionTaken', row.dataset.actionTaken || 'Provided supplementary lugaw with egg to child during home visit. BNS Louis prepared and served the meal, observed child eating. Guardian was present and assisted. Child finished approximately 80% of the serving.');
    setViewText('interventionViewRecommendation', row.dataset.recommendation || 'Increase protein-rich foods at home between feeding sessions — eggs, fish, or legumes daily if possible. Avoid giving sugary snacks before meal time as this reduces appetite. Guardian was advised to monitor weight at home and report any illness immediately.');
    setViewText('interventionViewFollowUpDate', followUpValue ? toLongDate(followUpValue) : 'March 14, 2026');

    if (programStatus) {
      programStatus.className = '';
      programStatus.classList.add(progress === 'Pending' ? 'status-pending' : progress === 'Complete' ? 'status-complete' : 'status-ongoing');
    }
    if (sessionBlock) sessionBlock.hidden = !hasFeedingSessions;
    if (followUp) followUp.hidden = !hasFeedingSessions;
    setViewText('interventionViewSessionSummary', `3 of ${row.dataset.sessionCount || '8'} sessions completed`);

    if (viewSections) viewSections.scrollTop = 0;
    document.body.classList.add('intervention-modal-open');
    viewModal.style.display = 'flex';
    viewModal.setAttribute('aria-hidden', 'false');
    document.getElementById('btnCloseInterventionView')?.focus();
  }

  function closeViewModal(restoreFocus = true) {
    if (!viewModal) return;
    viewModal.style.display = 'none';
    viewModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('intervention-modal-open');
    if (restoreFocus) {
      activeViewRow?.querySelector<HTMLAnchorElement>('.view-link')?.focus();
      activeViewRow = null;
    }
  }

  function openEditModal() {
    if (!modal || !form || !activeViewRow) return;
    const row = activeViewRow;
    closeViewModal(false);
    editingRow = row;
    form.reset();
    if (patientSelect) {
      patientSelect.value = row.dataset.patientNo ?? '';
      patientSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (programSelect) {
      programSelect.value = row.dataset.program ?? '';
      programSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (dateInput) dateInput.value = toIsoDate(row.cells[4]?.textContent?.trim() ?? '');
    if (followUpInput) followUpInput.value = toIsoDate(row.dataset.nextFollowUp ?? '');

    const formValues: Array<[string, string]> = [
      ['interventionFindings', row.dataset.findings ?? ''],
      ['interventionActionTaken', row.dataset.actionTaken ?? ''],
      ['interventionRecommendation', row.dataset.recommendation ?? ''],
      ['interventionAppetite', row.dataset.appetite ?? ''],
      ['interventionFoodGiven', row.dataset.foodGiven ?? ''],
      ['interventionSessionCount', row.dataset.sessionCount ?? '']
    ];
    formValues.forEach(([id, value]) => {
      const field = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
      if (field) field.value = value;
    });
    const progressInput = form.querySelector<HTMLInputElement>('input[name="progress"]');
    if (progressInput) {
      progressInput.defaultValue = 'On-Going';
      progressInput.value = row.dataset.progress ?? 'On-Going';
    }
    if (formTitle) formTitle.textContent = 'Edit Intervention Log';
    if (formSubtitle) formSubtitle.textContent = 'Update the intervention entry for this child';
    if (saveButton) saveButton.textContent = 'Update Record';
    document.body.classList.add('intervention-modal-open');
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    patientSelect?.focus();
  }

  tbody?.addEventListener('click', event => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>('.view-link');
    const row = link?.closest<HTMLTableRowElement>('tr[data-patient-no]');
    if (!link || !row) return;
    event.preventDefault();
    openViewModal(row);
  });

  document.getElementById('btnCloseInterventionView')?.addEventListener('click', () => closeViewModal());
  viewModal?.addEventListener('click', event => {
    if (event.target === viewModal) closeViewModal();
  });
  document.getElementById('btnEditIntervention')?.addEventListener('click', openEditModal);
  document.getElementById('btnRescheduleIntervention')?.addEventListener('click', () => {
    openEditModal();
    followUpInput?.focus();
  });
  document.getElementById('btnPrintIntervention')?.addEventListener('click', () => {
    document.body.classList.add('intervention-printing');
    window.addEventListener('afterprint', () => document.body.classList.remove('intervention-printing'), { once: true });
    window.print();
  });

  function makeProgressPill(progress: string) {
    const statusClasses: Record<string, string> = {
      Pending: 'status-warning',
      'On-Going': 'progress-ongoing',
      Complete: 'status-normal'
    };
    const statusClass = statusClasses[progress] ?? 'status-pending';
    const pill = document.createElement('span');
    pill.className = `status-pill ${statusClass}`;
    const label = document.createElement('span');
    label.className = 'status-pill-label';
    label.textContent = progress;
    pill.append(label);
    return pill;
  }

  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    if (!tbody || !patientSelect) return;

    const data = new FormData(form);
    const selectedPatient = patientSelect.selectedOptions[0];
    const patientNo = String(data.get('patientNo') ?? '');
    const patientName = selectedPatient.dataset.name ?? selectedPatient.textContent?.trim() ?? patientNo;
    const patientAddress = selectedPatient.dataset.address ?? '';
    const date = String(data.get('date') ?? '');
    const program = String(data.get('program') ?? '');
    const progress = String(data.get('progress') ?? 'On-Going');
    const findings = String(data.get('findings') ?? '').trim();
    const actionTaken = String(data.get('actionTaken') ?? '').trim();
    const recommendation = String(data.get('recommendation') ?? '').trim();
    const appetite = String(data.get('appetite') ?? '').trim();
    const foodGiven = String(data.get('foodGiven') ?? '').trim();
    const sessionCount = String(data.get('sessionCount') ?? '').trim();
    const nextFollowUp = String(data.get('nextFollowUp') ?? '');
    const notes = [
      ['Findings / Observations', findings],
      ['Action Taken', actionTaken],
      ['Recommendation to Guardian', recommendation],
      ['Child’s Appetite', appetite],
      ['Food Given', foodGiven],
      ['Number of Session', sessionCount],
      ['Next Follow-up', nextFollowUp]
    ]
      .map(([label, value]) => `${label}: ${String(value ?? '').trim()}`)
      .filter(entry => !entry.endsWith(':'))
      .join(' | ');
    const isEditing = Boolean(editingRow);
    const row = editingRow ?? document.createElement('tr');
    row.dataset.patientNo = patientNo;
    row.dataset.program = program;
    row.dataset.progress = progress;
    row.dataset.notes = notes;
    row.dataset.findings = findings;
    row.dataset.actionTaken = actionTaken;
    row.dataset.recommendation = recommendation;
    row.dataset.appetite = appetite;
    row.dataset.foodGiven = foodGiven;
    row.dataset.sessionCount = sessionCount;
    row.dataset.nextFollowUp = nextFollowUp;
    if (!isEditing) {
      const nextLogNumber = rows.reduce((max, existingRow) => {
        const number = Number(existingRow.dataset.logId?.replace(/\D/g, '') ?? 0);
        return Math.max(max, number);
      }, 0) + 1;
      row.dataset.logId = `LOG${String(nextLogNumber).padStart(3, '0')}`;
      row.dataset.registeredDate = toLongDate(new Date().toISOString().slice(0, 10));
    }

    while (row.cells.length < 6) row.insertCell();
    row.cells[0].textContent = patientNo;
    const patientInfo = document.createElement('div');
    patientInfo.className = 'patient-info-col';
    const name = document.createElement('span');
    name.className = 'patient-col-name';
    name.textContent = patientName;
    const address = document.createElement('span');
    address.className = 'patient-col-address';
    address.textContent = patientAddress;
    patientInfo.append(name, address);
    row.cells[1].replaceChildren(patientInfo);
    row.cells[2].textContent = program;
    row.cells[3].replaceChildren(makeProgressPill(progress));
    row.cells[4].textContent = formatDate(date);
    const action = row.cells[5];
    const divider = document.createElement('span');
    divider.className = 'view-action-divider';
    divider.textContent = '|';
    const viewLink = document.createElement('a');
    viewLink.className = 'view-link';
    viewLink.href = '#view';
    viewLink.textContent = 'View';
    action.replaceChildren(divider, viewLink);

    if (!isEditing) {
      rows.unshift(row);
      tbody.insertBefore(row, tbody.firstChild);
    }
    applyFilters();
    closeModal();
    activeViewRow = null;
    showRecordNotice(
      isEditing ? 'updated' : 'created',
      isEditing ? 'Nutrition intervention has been updated.' : 'A new nutrition intervention has been added.',
    );
  });

  applyFilters();
});

