import { showRecordNotice } from "../../shared/record-save-notice";

/**
 * ==============================================================================
 * MHIMS - Municipal Health Office Information Management System
 * Clinical Personnel Portal - MaternaTrack Consultation Log Logic
 * Script: js/clinical/maternatrack/consultationlog.js
 * ==============================================================================
 * Handles:
 *  - ResidentCare-style live filter (Trimester, Risk Level, Barangay) and Search
 *  - Seamless transition between Consultation Log Table and Full Consultation View
 *  - Dynamic population of patient details on View click
 *  - Interactive Trimester Selector (1st, 2nd, 3rd Trimester) in Full View
 *  - Segmented Check-Up Tabs (1st, 2nd, 3rd Checkup) with persistent field structure
 * ==============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Table & View Containers ───────────────────────────────────────────────
  const consultationTableView = document.getElementById('consultationTableView');
  const consultationFullView  = document.getElementById('consultationFullView');
  const btnBackToConsultations = document.getElementById('btnBackToConsultations');

  // Search & Filter Elements (ResidentCare-Style)
  const searchInput          = document.getElementById('consultSearchInput');
  const table                = document.getElementById('consultationTable');
  const tbody                = table ? table.querySelector('tbody') : null;
  const rows                 = table ? Array.from(table.querySelectorAll('tbody tr')) : [];
  const btnFilterAll         = document.getElementById('btnFilterAll');

  const trimesterDropdownWrap = document.getElementById('trimesterDropdownWrap');
  const trimesterDropdownBtn  = document.getElementById('trimesterDropdownBtn');
  const trimesterDropdownMenu = document.getElementById('trimesterDropdownMenu');

  const riskDropdownWrap      = document.getElementById('riskDropdownWrap');
  const riskDropdownBtn       = document.getElementById('riskDropdownBtn');
  const riskDropdownMenu      = document.getElementById('riskDropdownMenu');

  const barangayDropdownWrap  = document.getElementById('barangayDropdownWrap');
  const barangayDropdownBtn   = document.getElementById('barangayDropdownBtn');
  const barangayDropdownMenu  = document.getElementById('barangayDropdownMenu');

  // Full View Target Elements
  const viewConsultPatientId    = document.getElementById('viewConsultPatientId');
  const viewConsultPatientName  = document.getElementById('viewConsultPatientName');
  const viewConsultPregnancy    = document.getElementById('viewConsultPregnancy');
  const viewConsultAge          = document.getElementById('viewConsultAge');
  const viewConsultAddress      = document.getElementById('viewConsultAddress');
  const viewConsultRisk         = document.getElementById('viewConsultRisk');
  const viewConsultLmpEdd       = document.getElementById('viewConsultLmpEdd');

  const consultTrimesterDropdownWrap = document.getElementById('consultTrimesterDropdownWrap');
  const consultTrimesterDropdownBtn  = document.getElementById('consultTrimesterDropdownBtn');
  const consultTrimesterDropdownMenu = document.getElementById('consultTrimesterDropdownMenu');
  const consultTrimesterBtnText      = document.getElementById('consultTrimesterBtnText');
  const consultCheckupIndicator      = document.getElementById('consultCheckupIndicator');

  const checkupTabsBar = document.getElementById('checkupTabsBar');
  const trimesterView1 = document.getElementById('trimesterView1');
  const trimesterView2 = document.getElementById('trimesterView2');
  const trimesterView3 = document.getElementById('trimesterView3');

  const btnConsultEditProfile = document.getElementById('btnConsultEditProfile');
  const btnConsultExport      = document.getElementById('btnConsultExport');
  const fullviewNotifBtn      = document.getElementById('fullviewNotifBtn');
  const prenatalVisitModal    = document.getElementById('prenatalVisitModal');
  const btnClosePrenatalModal = document.getElementById('btnClosePrenatalModal');
  const btnCancelPrenatalModal = document.getElementById('btnCancelPrenatalModal');
  const prenatalVisitForm     = document.getElementById('prenatalVisitForm') as HTMLFormElement | null;
  const prenatalVisitDate     = document.getElementById('prenatalVisitDate') as HTMLInputElement | null;
  const prenatalVisitNumber   = document.getElementById('prenatalVisitNumber') as HTMLSelectElement | null;

  // State Management
  const activeFilters = {
    trimester: null,
    riskLevel: null,
    barangay: null,
    query: ''
  };

  let currentActiveTrimester = '1'; // '1', '2', or '3'
  let currentActiveCheckup = '1';   // '1', '2', or '3'

  // Get today's date formatted as MM/DD/YYYY
  function getTodayFormatted() {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${mm}/${dd}/${yyyy}`;
  }

  function getTodayInputValue() {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${mm}-${dd}`;
  }

  // Per-checkup dates all use today's date (user's current system date)
  const todayStr = getTodayFormatted();
  const checkupDates = {
    '1': { '1': todayStr, '2': todayStr, '3': todayStr },
    '2': { '1': todayStr, '2': todayStr, '3': todayStr },
    '3': { '1': todayStr, '2': todayStr, '3': todayStr }
  };

  const trimesterCheckupValues = {
    '1': {
      '1': { weight: '70 kg', height: '180 cm', aog: '4 weeks and 2 days', bp: '120/80', nutrition: 'Normal', dental: 'Needs Treatment', hgb: '11.0 g/dL', cbc: '11.5 g/dL', returnDate: '10/25/2026' },
      '2': { weight: '71 kg', height: '180 cm', aog: '6 weeks and 3 days', bp: '120/80', nutrition: 'Normal', dental: 'In Treatment', hgb: '11.2 g/dL', cbc: '11.6 g/dL', returnDate: '11/02/2026' },
      '3': { weight: '72 kg', height: '180 cm', aog: '9 weeks and 1 day', bp: '118/78', nutrition: 'Normal', dental: 'Completed', hgb: '11.3 g/dL', cbc: '11.7 g/dL', returnDate: '11/15/2026' }
    },
    '2': {
      '1': { weight: '75 kg', height: '180 cm', aog: '13 weeks', bp: '120/80', nutrition: 'Normal', condition: 'Normal fundal height growth, no edema or severe headaches.', cbc: '11.0 g/dL', returnDate: '11/22/2026' },
      '2': { weight: '76 kg', height: '180 cm', aog: '17 weeks', bp: '120/80', nutrition: 'Normal', condition: 'Good fetal heart tone heard, no vaginal discharge or cramping.', cbc: '11.1 g/dL', returnDate: '12/01/2026' },
      '3': { weight: '77 kg', height: '180 cm', aog: '22 weeks', bp: '118/80', nutrition: 'Normal', condition: 'Quickening felt regularly, fundal height 22 cm, normal progress.', cbc: '11.2 g/dL', returnDate: '12/20/2026' }
    },
    '3': {
      '1': { weight: '82 kg', height: '180 cm', aog: '28 weeks', bp: '120/80', nutrition: 'Normal', condition: 'Normal fundal height growth, no edema or severe headaches.', cbc: '11.0 g/dL', returnDate: '11/22/2026' },
      '2': { weight: '83.5 kg', height: '180 cm', aog: '32 weeks', bp: '120/80', nutrition: 'Normal', condition: 'Active fetal movements felt, normal fundal height growth.', cbc: '11.2 g/dL', returnDate: '12/06/2026' },
      '3': { weight: '85 kg', height: '180 cm', aog: '36 weeks', bp: '120/80', nutrition: 'Normal', condition: 'Cephalic presentation confirmed, active fetal heart tones, delivery plan set.', cbc: '11.3 g/dL', returnDate: '12/20/2026' }
    }
  };

  // ─── Filter & Search Logic (Matching ResidentCare) ─────────────────────────

  function applyFilters() {
    activeFilters.query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    rows.forEach(row => {
      const rowText = row.textContent.toLowerCase();
      const matchesSearch = !activeFilters.query || rowText.includes(activeFilters.query);

      // 1. Trimester Filter Check
      let matchesTrimester = true;
      if (activeFilters.trimester) {
        const trimesterCell = row.cells[3] ? row.cells[3].textContent.trim().toLowerCase() : '';
        matchesTrimester = trimesterCell.includes(activeFilters.trimester.toLowerCase());
      }

      // 2. Risk Level Filter Check
      let matchesRisk = true;
      if (activeFilters.riskLevel) {
        const riskPill = row.querySelector('.risk-pill');
        const riskText = riskPill ? riskPill.textContent.trim().toLowerCase() : '';
        matchesRisk = riskText.includes(activeFilters.riskLevel.toLowerCase());
      }

      // 3. Barangay Filter Check
      let matchesBarangay = true;
      if (activeFilters.barangay) {
        const addressEl = row.querySelector('.patient-col-address');
        const address = (addressEl ? addressEl.textContent : rowText).toLowerCase();
        const targetBarangay = activeFilters.barangay.toLowerCase();
        if (targetBarangay === 'gugon') {
          matchesBarangay = address.includes('gugon') || address.includes('gogon');
        } else {
          matchesBarangay = address.includes(targetBarangay);
        }
      }

      if (matchesSearch && matchesTrimester && matchesRisk && matchesBarangay) {
        row.style.display = '';
        visibleCount++;
      } else {
        row.style.display = 'none';
      }
    });

    // Handle Empty State
    if (tbody) {
      let emptyRow = tbody.querySelector('.empty-table-row');
      if (visibleCount === 0) {
        if (!emptyRow) {
          emptyRow = document.createElement('tr');
          emptyRow.className = 'empty-table-row';
          emptyRow.innerHTML = `<td colspan="7" style="text-align: center; padding: 24px; color: #64748b;">No consultation records found matching the selected filters.</td>`;
          tbody.appendChild(emptyRow);
        }
        emptyRow.style.display = '';
      } else if (emptyRow) {
        emptyRow.style.display = 'none';
      }
    }
  }

  function closeAllFilterDropdowns() {
    [trimesterDropdownWrap, riskDropdownWrap, barangayDropdownWrap].forEach(wrap => {
      if (wrap) {
        wrap.classList.remove('open');
        const menu = wrap.querySelector('.filter-dropdown-menu');
        const btn = wrap.querySelector('.filter-btn');
        if (menu) menu.classList.remove('show');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      }
    });

    if (consultTrimesterDropdownWrap) {
      consultTrimesterDropdownWrap.classList.remove('open');
      if (consultTrimesterDropdownMenu) consultTrimesterDropdownMenu.classList.remove('show');
      if (consultTrimesterDropdownBtn) consultTrimesterDropdownBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function updateAllBtnState() {
    const hasAnyFilter = Boolean(activeFilters.trimester || activeFilters.riskLevel || activeFilters.barangay);
    if (btnFilterAll) {
      if (hasAnyFilter) {
        btnFilterAll.classList.remove('active');
      } else {
        btnFilterAll.classList.add('active');
      }
    }
  }

  function setupFilterDropdown(wrap, btn, menu, filterKey, defaultLabel) {
    if (!wrap || !btn || !menu) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrap.classList.contains('open');
      closeAllFilterDropdowns();
      if (!isOpen) {
        wrap.classList.add('open');
        menu.classList.add('show');
        btn.setAttribute('aria-expanded', 'true');
      }
    });

    menu.querySelectorAll('.filter-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const value = item.getAttribute('data-value');
        const labelSpan = btn.querySelector('.filter-btn-text');

        if (activeFilters[filterKey] === value) {
          activeFilters[filterKey] = null;
          item.classList.remove('selected');
          btn.classList.remove('has-filter');
          if (labelSpan) labelSpan.textContent = defaultLabel;
        } else {
          activeFilters[filterKey] = value;
          menu.querySelectorAll('.filter-menu-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
          btn.classList.add('has-filter');
          if (labelSpan) labelSpan.textContent = value;
        }

        updateAllBtnState();
        closeAllFilterDropdowns();
        applyFilters();
      });
    });
  }

  // Initialize table filter dropdowns
  setupFilterDropdown(trimesterDropdownWrap, trimesterDropdownBtn, trimesterDropdownMenu, 'trimester', 'Trimester');
  setupFilterDropdown(riskDropdownWrap, riskDropdownBtn, riskDropdownMenu, 'riskLevel', 'Risk Level');
  setupFilterDropdown(barangayDropdownWrap, barangayDropdownBtn, barangayDropdownMenu, 'barangay', 'Barangay');

  if (btnFilterAll) {
    btnFilterAll.addEventListener('click', () => {
      activeFilters.trimester = null;
      activeFilters.riskLevel = null;
      activeFilters.barangay = null;

      if (trimesterDropdownBtn) {
        const text = trimesterDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Trimester';
        trimesterDropdownBtn.classList.remove('has-filter');
      }
      if (riskDropdownBtn) {
        const text = riskDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Risk Level';
        riskDropdownBtn.classList.remove('has-filter');
      }
      if (barangayDropdownBtn) {
        const text = barangayDropdownBtn.querySelector('.filter-btn-text');
        if (text) text.textContent = 'Barangay';
        barangayDropdownBtn.classList.remove('has-filter');
      }

      document.querySelectorAll('.filter-dropdown-menu .filter-menu-item').forEach(item => item.classList.remove('selected'));
      updateAllBtnState();
      applyFilters();
    });
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  document.addEventListener('click', closeAllFilterDropdowns);

  // ─── Full View Checkup Tab & Field Updating Logic ─────────────────────────

  function updateCheckupData() {
    const dates = checkupDates[currentActiveTrimester] || checkupDates['1'];
    const chosenDate = dates[currentActiveCheckup] || '10/04/2026';

    // Update indicator text
    if (consultCheckupIndicator) {
      consultCheckupIndicator.textContent = `Checkup #${currentActiveCheckup} • [${chosenDate}]`;
    }

    // Update checkup tab buttons active state
    if (checkupTabsBar) {
      checkupTabsBar.querySelectorAll('.checkup-segment-tab').forEach(tab => {
        if (tab.getAttribute('data-checkup') === currentActiveCheckup) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
    }

    // Apply values for current trimester & checkup
    const trimesterData = trimesterCheckupValues[currentActiveTrimester];
    if (!trimesterData) return;
    const values = trimesterData[currentActiveCheckup] || trimesterData['1'];

    if (currentActiveTrimester === '1') {
      const valW = document.getElementById('valWeight1');
      const valA = document.getElementById('valAog1');
      const valBp = document.getElementById('valBp1');
      const valD = document.getElementById('valDental1');
      const valH = document.getElementById('valHgb1');
      const valC = document.getElementById('valCbc1');
      const valR = document.getElementById('valReturnDate1');

      if (valW) valW.textContent = values.weight;
      if (valA) valA.textContent = values.aog;
      if (valBp) valBp.textContent = values.bp;
      if (valD) valD.textContent = values.dental;
      if (valH) valH.textContent = values.hgb;
      if (valC) valC.textContent = values.cbc;
      if (valR) valR.textContent = values.returnDate;
    } else if (currentActiveTrimester === '2') {
      const valW = document.getElementById('valWeight2');
      const valA = document.getElementById('valAog2');
      const valBp = document.getElementById('valBp2');
      const valCond = document.getElementById('valCondition2');
      const valC = document.getElementById('valCbc2');
      const valR = document.getElementById('valReturnDate2');

      if (valW) valW.textContent = values.weight;
      if (valA) valA.textContent = values.aog;
      if (valBp) valBp.textContent = values.bp;
      if (valCond) valCond.textContent = values.condition;
      if (valC) valC.textContent = values.cbc;
      if (valR) valR.textContent = values.returnDate;
    } else if (currentActiveTrimester === '3') {
      const valW = document.getElementById('valWeight3');
      const valA = document.getElementById('valAog3');
      const valBp = document.getElementById('valBp3');
      const valCond = document.getElementById('valCondition3');
      const valC = document.getElementById('valCbc3');
      const valR = document.getElementById('valReturnDate3');

      if (valW) valW.textContent = values.weight;
      if (valA) valA.textContent = values.aog;
      if (valBp) valBp.textContent = values.bp;
      if (valCond) valCond.textContent = values.condition;
      if (valC) valC.textContent = values.cbc;
      if (valR) valR.textContent = values.returnDate;
    }
  }

  function switchTrimester(trimesterNum) {
    currentActiveTrimester = String(trimesterNum);

    // Update button text
    if (consultTrimesterBtnText) {
      if (currentActiveTrimester === '1') {
        consultTrimesterBtnText.textContent = '1ST TRIMESTER (1-12 Weeks)';
      } else if (currentActiveTrimester === '2') {
        consultTrimesterBtnText.textContent = '2ND TRIMESTER (13-27 weeks)';
      } else if (currentActiveTrimester === '3') {
        consultTrimesterBtnText.textContent = '3RD TRIMESTER (28-40+ weeks)';
      }
    }

    // Update dropdown menu items active state
    if (consultTrimesterDropdownMenu) {
      consultTrimesterDropdownMenu.querySelectorAll('.trimester-menu-item').forEach(item => {
        if (item.getAttribute('data-trimester') === currentActiveTrimester) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }

    // Show selected trimester panel and hide the others
    if (trimesterView1) trimesterView1.style.display = currentActiveTrimester === '1' ? 'block' : 'none';
    if (trimesterView2) trimesterView2.style.display = currentActiveTrimester === '2' ? 'block' : 'none';
    if (trimesterView3) trimesterView3.style.display = currentActiveTrimester === '3' ? 'block' : 'none';

    updateCheckupData();
  }

  // Setup Trimester Dropdown in Full View (Right Part Button)
  if (consultTrimesterDropdownBtn && consultTrimesterDropdownWrap && consultTrimesterDropdownMenu) {
    consultTrimesterDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = consultTrimesterDropdownWrap.classList.contains('open');
      closeAllFilterDropdowns();
      if (!isOpen) {
        consultTrimesterDropdownWrap.classList.add('open');
        consultTrimesterDropdownMenu.classList.add('show');
        consultTrimesterDropdownBtn.setAttribute('aria-expanded', 'true');
      }
    });

    consultTrimesterDropdownMenu.querySelectorAll('.trimester-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const trimester = item.getAttribute('data-trimester') || '1';
        switchTrimester(trimester);
        closeAllFilterDropdowns();
      });
    });
  }

  // Setup Segmented Check-Up Tabs (1st, 2nd, 3rd Checkup)
  if (checkupTabsBar) {
    checkupTabsBar.querySelectorAll('.checkup-segment-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const checkupNum = tab.getAttribute('data-checkup') || '1';
        currentActiveCheckup = checkupNum;
        updateCheckupData();
      });
    });
  }

  // ─── Open Full View from Table Row "View" Click ───────────────────────────

  function openConsultationFullView(row) {
    const cells = row.cells;
    const patientId = cells[0] ? cells[0].textContent.trim() : 'PNT-1021';

    const nameEl = row.querySelector('.patient-col-name');
    const patientName = nameEl ? nameEl.textContent.trim() : 'Yoshika S. Boncodin';
    const addressEl = row.querySelector('.patient-col-address');
    const address = addressEl ? addressEl.textContent.trim() : 'Zone 2, San Mateo Camaligan';

    const age = cells[2] ? cells[2].textContent.trim() : '20';
    const trimesterText = cells[3] ? cells[3].textContent.trim().toLowerCase() : '';
    const riskPill = row.querySelector('.risk-pill');
    const riskLevel = riskPill ? riskPill.textContent.trim() : '';

    // Populate patient summary in header
    if (viewConsultPatientId) {
      viewConsultPatientId.textContent = `Patient No. : ${patientId.includes('PT-') ? 'PNT-1021' : patientId}`;
    }
    if (viewConsultPatientName) {
      viewConsultPatientName.textContent = patientName;
    }
    if (viewConsultAge) {
      viewConsultAge.textContent = `${age} years old`;
    }
    if (viewConsultAddress) {
      viewConsultAddress.textContent = address.includes('Camaligan') && !address.includes('Zone')
        ? `Zone 2, ${address.replace(', Camaligan', ' Camaligan')}`
        : address;
    }
    if (viewConsultPregnancy) {
      viewConsultPregnancy.textContent = 'Second Pregnancy';
    }
    if (viewConsultRisk) {
      const riskClass = riskPill && ['low-risk', 'medium-risk', 'high-risk']
        .find(className => riskPill.classList.contains(className));
      viewConsultRisk.textContent = riskLevel;
      viewConsultRisk.classList.remove('low-risk', 'medium-risk', 'high-risk');
      if (riskClass) viewConsultRisk.classList.add(riskClass);
    }

    // Determine initial active trimester based on row's Trimester
    let initialTrimester = '1';
    if (trimesterText.includes('2nd') || trimesterText.includes('second')) {
      initialTrimester = '2';
    } else if (trimesterText.includes('3rd') || trimesterText.includes('third')) {
      initialTrimester = '3';
    }

    currentActiveCheckup = '1';
    switchTrimester(initialTrimester);

    // Switch view containers
    if (consultationTableView) consultationTableView.style.display = 'none';
    if (consultationFullView) consultationFullView.style.display = 'flex';

    // Scroll main-content to top
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.scrollTop = 0;
  }

  // Attach event listeners to all "View" links in consultation log table
  rows.forEach(row => {
    const viewLink = row.querySelector('.view-link');
    if (viewLink) {
      viewLink.addEventListener('click', (e) => {
        e.preventDefault();
        openConsultationFullView(row);
      });
    }
  });

  // Back Button Navigation (Returns to Consultation Table)
  if (btnBackToConsultations) {
    btnBackToConsultations.addEventListener('click', () => {
      if (consultationFullView) consultationFullView.style.display = 'none';
      if (consultationTableView) consultationTableView.style.display = 'block';

      const mainContent = document.querySelector('.main-content');
      if (mainContent) mainContent.scrollTop = 0;
    });
  }

  // Full View Action Buttons
  if (btnConsultEditProfile) {
    btnConsultEditProfile.addEventListener('click', () => {
      openPrenatalVisitModal();
    });
  }

  if (btnConsultExport) {
    btnConsultExport.addEventListener('click', () => {
      alert("Exporting Patient's Consultation Records...");
    });
  }

  if (fullviewNotifBtn) {
    fullviewNotifBtn.addEventListener('click', () => {
      alert('You have no new notifications.');
    });
  }

  function openPrenatalVisitModal() {
    if (!prenatalVisitModal) return;

    const patientNo = viewConsultPatientId ? viewConsultPatientId.textContent.replace('Patient No. : ', '') : 'MTRN-0987';
    const patientName = viewConsultPatientName ? viewConsultPatientName.textContent : 'Yoshika S. Boncodin';
    const trimesterLabel = consultTrimesterBtnText ? consultTrimesterBtnText.textContent : '1ST TRIMESTER (1-12 Weeks)';

    const modalPatientNo = document.getElementById('prenatalPatientNo');
    const modalPatientName = document.getElementById('prenatalPatientName');
    const modalTrimester = document.getElementById('prenatalTrimesterBadge');
    const modalRisk = document.getElementById('prenatalRisk');
    const modalLmp = document.getElementById('prenatalLmp');
    const modalEdd = document.getElementById('prenatalEdd');

    if (modalPatientNo) modalPatientNo.textContent = `Patient No. : ${patientNo}`;
    if (modalPatientName) modalPatientName.textContent = patientName;
    if (modalTrimester) modalTrimester.textContent = trimesterLabel;
    if (modalRisk) modalRisk.textContent = viewConsultRisk ? viewConsultRisk.textContent.trim() : 'Low Risk';
    if (viewConsultLmpEdd) {
      const dates = viewConsultLmpEdd.textContent.match(/LMP:\s*([^|]+)\|\s*EDD:\s*(.+)/);
      if (dates && modalLmp && modalEdd) {
        modalLmp.textContent = `LMP: ${dates[1].trim()}`;
        modalEdd.textContent = `EDD: ${dates[2].trim()}`;
      }
    }
    if (prenatalVisitDate) prenatalVisitDate.value = getTodayInputValue();

    if (prenatalVisitNumber) {
      const checkupNo = currentActiveCheckup === '2' ? 'Checkup #2'
        : currentActiveCheckup === '3' ? 'Checkup #3' : 'Checkup #1';
      prenatalVisitNumber.value = checkupNo;
      prenatalVisitNumber.dispatchEvent(new Event('mhims:select-sync'));
    }

    prenatalVisitModal.querySelectorAll<HTMLElement>('[data-trimester-fields]').forEach(section => {
      const isActive = section.dataset.trimesterFields === currentActiveTrimester;
      section.hidden = !isActive;
      section.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('input, select, textarea')
        .forEach(field => { field.disabled = !isActive; });
    });

    prenatalVisitModal.classList.add('show');
    prenatalVisitModal.setAttribute('aria-hidden', 'false');
    const firstField = prenatalVisitModal.querySelector<HTMLElement>('select, input, textarea, button');
    firstField?.focus();
  }

  function closePrenatalVisitModal() {
    if (!prenatalVisitModal) return;
    prenatalVisitModal.classList.remove('show');
    prenatalVisitModal.setAttribute('aria-hidden', 'true');
    btnConsultEditProfile?.focus();
  }

  if (btnClosePrenatalModal) {
    btnClosePrenatalModal.addEventListener('click', closePrenatalVisitModal);
  }
  if (btnCancelPrenatalModal) {
    btnCancelPrenatalModal.addEventListener('click', closePrenatalVisitModal);
  }
  if (prenatalVisitModal) {
    prenatalVisitModal.addEventListener('click', (event) => {
      if (event.target === prenatalVisitModal) closePrenatalVisitModal();
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && prenatalVisitModal?.classList.contains('show')) {
      closePrenatalVisitModal();
    }
  });

  if (prenatalVisitForm) {
    prenatalVisitForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const visitLabel = prenatalVisitNumber ? prenatalVisitNumber.value : 'Checkup';
      if (consultCheckupIndicator) {
        consultCheckupIndicator.textContent = `${visitLabel} • Saved`;
      }

      const progressTitle = document.getElementById('prenatalProgressTitle');
      const progressPercent = document.getElementById('prenatalProgressPercent');
      const progressBar = document.getElementById('prenatalProgressBar');
      const progressNote = document.getElementById('prenatalProgressNote');
      const autosaved = document.getElementById('prenatalAutosaved');

      if (progressTitle) progressTitle.textContent = '2 of 2 required sections complete';
      if (progressPercent) progressPercent.textContent = '100%';
      if (progressBar) progressBar.style.width = '100%';
      if (progressNote) progressNote.textContent = 'Consultation details saved for this session';
      if (autosaved) autosaved.textContent = 'Saved just now';

      closePrenatalVisitModal();
      showRecordNotice('updated', 'Prenatal consultation details were saved for this session.');
    });
  }

});
