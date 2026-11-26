type MaternaPeriod = "daily" | "monthly" | "quarterly" | "yearly";
type MaternaCategory = "maternal-service" | "pregnancy-risk" | "edd-timeline";
type MaternaReportId = "service" | "risk" | "edd";

interface MaternaReport {
  id: MaternaReportId;
  panel: HTMLElement;
  chart: SVGSVGElement;
  categoryFilter: HTMLSelectElement;
  barangayFilter: HTMLSelectElement;
  dateRangeLabel: HTMLElement;
  customDateRange: HTMLElement;
  description: HTMLElement;
  title: HTMLHeadingElement;
  insightTitle: HTMLHeadingElement;
  observationsList: HTMLUListElement;
  actionsList: HTMLUListElement;
  periodButtons: HTMLButtonElement[];
}

document.addEventListener("DOMContentLoaded", () => {
  const isMaternaTrackView = new URLSearchParams(window.location.search).get("view") === "maternatrack";
  if (!isMaternaTrackView) return;

  const main = document.querySelector<HTMLElement>(".statistics-main");
  if (!main) throw new Error("The MaternaTrack statistics page layout is unavailable.");

  const view = document.getElementById("maternaStatisticsView");
  if (!view) throw new Error("The MaternaTrack statistics view is unavailable.");

  main.classList.add("maternatrack-statistics-mode");
  view.hidden = false;
  document.title = `MHIMS - MaternaTrack Statistics | ${window.location.pathname.includes("/personnel/") ? "Personnel" : "Clinical"}`;

  const periods: MaternaPeriod[] = ["daily", "monthly", "quarterly", "yearly"];
  const periodNames: Record<MaternaPeriod, string> = {
    daily: "Daily",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };
  const categories: { value: MaternaCategory; label: string }[] = [
    { value: "maternal-service", label: "Maternal Service" },
    { value: "pregnancy-risk", label: "Pregnancy Risk Rate" },
    { value: "edd-timeline", label: "EDD Timeline" },
  ];
  const categoryLabels: Record<MaternaCategory, string> = {
    "maternal-service": "Maternal Service",
    "pregnancy-risk": "Pregnancy Risk Rate",
    "edd-timeline": "EDD Timeline",
  };
  const barangays = [
    "San Marcos",
    "Santo Domingo",
    "San Jose",
    "San Pablo",
    "San Mateo",
    "Santo Tomas",
    "San Lucas",
    "San Juan",
    "San Ramon",
    "Gugon",
    "Dugcal",
    "Sua",
    "Marupit",
    "Tarosanan",
    "San Francisco",
  ];
  const barangayFactors = [0.84, 0.79, 0.86, 0.74, 0.91, 0.82, 0.77, 0.88, 0.85, 0.75, 0.8, 0.73, 0.9, 0.76, 0.83];
  const serviceViews: Record<MaternaPeriod, { labels: string[]; values: number[]; maximum: number }> = {
    daily: {
      labels: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"],
      values: [9, 11, 8, 6, 12, 10, 13],
      maximum: 16,
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      values: [74, 81, 78, 89, 94, 102, 97, 108, 113, 109, 121, 128],
      maximum: 160,
    },
    quarterly: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      values: [233, 285, 320, 358],
      maximum: 400,
    },
    yearly: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      values: [612, 690, 744, 781, 812],
      maximum: 900,
    },
  };
  const riskCategories = [
    { label: "Hypertensive disorders", value: 8 },
    { label: "Previous C-section", value: 6 },
    { label: "Gestational diabetes", value: 5 },
    { label: "Anemia", value: 3 },
    { label: "Other", value: 2 },
  ];
  const eddViews: Record<MaternaPeriod, { labels: string[]; values: number[]; maximum: number }> = {
    daily: {
      labels: ["Today", "Nov 27", "Nov 28", "Nov 29", "Nov 30", "Dec 1"],
      values: [0, 1, 0, 1, 0, 1],
      maximum: 2,
    },
    monthly: {
      labels: ["Dec '26", "Jan '27", "Feb '27", "Mar '27", "Apr '27", "May '27"],
      values: [7, 10, 12, 9, 14, 11],
      maximum: 16,
    },
    quarterly: {
      labels: ["Q4 '26", "Q1 '27", "Q2 '27", "Q3 '27"],
      values: [7, 31, 34, 28],
      maximum: 40,
    },
    yearly: {
      labels: ["2024", "2025", "2026", "2027"],
      values: [68, 104, 121, 86],
      maximum: 140,
    },
  };
  const periodMultipliers: Record<MaternaPeriod, number> = {
    daily: 0.1,
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };
  const svgNamespace = "http://www.w3.org/2000/svg";

  function reportMarkup(id: MaternaReportId, initialCategory: MaternaCategory, description: string): string {
    const categoryOptions = categories.map(category =>
      `<option value="${category.value}"${category.value === initialCategory ? " selected" : ""}>${category.label}</option>`,
    ).join("");
    const barangayOptions = [
      '<option value="all">All Barangays</option>',
      ...barangays.map(name => `<option value="${name}">${name}</option>`),
    ].join("");
    const periodButtons = periods.map(period =>
      `<button type="button" data-materna-period="${period}"${period === "monthly" ? ' class="active" aria-pressed="true"' : ""}>${periodNames[period]}</button>`,
    ).join("");

    return `
      <div class="residentcare-report-group">
        <section class="statistics-panel residentcare-report-panel" id="materna${id}Panel" aria-labelledby="materna${id}Title">
          <section class="statistics-controls residentcare-report-controls" aria-label="${description} filters">
            <div class="period-row">
              <strong>Period</strong>
              <div class="period-options" role="group" aria-label="${description} report period">${periodButtons}</div>
              <span class="date-range-label" id="${id}DateRangeLabel"></span>
            </div>
            <div class="filter-row">
              <label class="filter-field" for="${id}CategoryFilter">CATEGORIES
                <select id="${id}CategoryFilter">${categoryOptions}</select>
              </label>
              <label class="filter-field" for="${id}BarangayFilter">BARANGAY
                <select id="${id}BarangayFilter">${barangayOptions}</select>
              </label>
              <div class="filter-field date-filter">
                <span>CUSTOM DATE RANGE</span>
                <div class="date-range-box"><iconify-icon icon="solar:calendar-date-bold" aria-hidden="true"></iconify-icon><span id="${id}CustomDateRange"></span></div>
              </div>
            </div>
          </section>
          <div class="panel-heading">
            <div>
              <h2 id="materna${id}Title"></h2>
              <p id="materna${id}Description">${description}</p>
            </div>
            <span class="mock-data-badge">MOCK DATA</span>
          </div>
          <div class="chart-container"><svg id="materna${id}Chart" role="img"></svg></div>
        </section>
        <section class="statistics-panel insights-panel residentcare-insights-panel" aria-labelledby="${id}InsightsTitle">
          <div class="insights-heading"><iconify-icon icon="ph:sparkle-fill" aria-hidden="true"></iconify-icon><h2 id="${id}InsightsTitle"></h2></div>
          <div class="insights-content">
            <section class="observation-column" aria-labelledby="${id}ObservationsTitle">
              <h3 id="${id}ObservationsTitle"><iconify-icon icon="mdi:lightbulb-on" aria-hidden="true"></iconify-icon>Key observations</h3>
              <ul id="${id}Observations"></ul>
            </section>
            <section class="actions-column" aria-labelledby="${id}ActionsTitle">
              <h3 id="${id}ActionsTitle"><iconify-icon icon="mdi:account-check" aria-hidden="true"></iconify-icon>Suggested actions</h3>
              <ul id="${id}Actions"></ul>
            </section>
          </div>
          <div class="insights-disclaimer">
            <strong>AI supports — it does not replace — professional clinical judgment.</strong>
            <p>These observations use illustrative sample data and must be reviewed by a qualified healthcare professional.</p>
          </div>
        </section>
      </div>`;
  }

  view.innerHTML = `
    <header class="statistics-header">
      <div>
        <h1 class="dashboard-title">MaternaTrack Statistics</h1>
        <p class="dashboard-subtitle">Statistics overview</p>
      </div>
    </header>
    <div class="statistics-scroll residentcare-statistics-scroll" aria-label="MaternaTrack reports and insights" tabindex="0">
      <div class="overview-tab" aria-current="page">Overview</div>
      ${reportMarkup("service", "maternal-service", "Number of maternal service visits")}
      ${reportMarkup("risk", "pregnancy-risk", "Number of high-risk pregnancies")}
      ${reportMarkup("edd", "edd-timeline", "Expected deliveries grouped by month")}
    </div>`;

  function required<T extends Element>(id: string, type: { new(): T }): T {
    const element = document.getElementById(id);
    if (!(element instanceof type)) throw new Error(`Required MaternaTrack statistics element #${id} was not found.`);
    return element;
  }

  const reports: MaternaReport[] = ([
    { id: "service", category: "maternal-service" },
    { id: "risk", category: "pregnancy-risk" },
    { id: "edd", category: "edd-timeline" },
  ] as const).map(({ id }) => {
    const panel = required(`materna${id}Panel`, HTMLElement);
    return {
      id,
      panel,
      chart: required(`materna${id}Chart`, SVGSVGElement),
      categoryFilter: required(`${id}CategoryFilter`, HTMLSelectElement),
      barangayFilter: required(`${id}BarangayFilter`, HTMLSelectElement),
      dateRangeLabel: required(`${id}DateRangeLabel`, HTMLElement),
      customDateRange: required(`${id}CustomDateRange`, HTMLElement),
      description: required(`materna${id}Description`, HTMLElement),
      title: required(`materna${id}Title`, HTMLHeadingElement),
      insightTitle: required(`${id}InsightsTitle`, HTMLHeadingElement),
      observationsList: required(`${id}Observations`, HTMLUListElement),
      actionsList: required(`${id}Actions`, HTMLUListElement),
      periodButtons: Array.from(panel.querySelectorAll<HTMLButtonElement>("[data-materna-period]")),
    };
  });

  function createSvg<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attributes: Record<string, string | number>,
  ): SVGElementTagNameMap[K] {
    const element = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    return element;
  }

  function addText(parent: SVGElement, x: number, y: number, text: string, anchor = "middle"): void {
    const element = createSvg("text", { x, y, "text-anchor": anchor });
    element.textContent = text;
    parent.append(element);
  }

  function addTitle(parent: SVGElement, text: string): void {
    const element = createSvg("title", {});
    element.textContent = text;
    parent.append(element);
  }

  function selectedPeriod(report: MaternaReport): MaternaPeriod {
    const period = report.periodButtons.find(button => button.classList.contains("active"))?.dataset.maternaPeriod;
    return period === "daily" || period === "quarterly" || period === "yearly" ? period : "monthly";
  }

  function selectedCategory(report: MaternaReport): MaternaCategory {
    const category = report.categoryFilter.value;
    return category === "pregnancy-risk" || category === "edd-timeline" ? category : "maternal-service";
  }

  function selectedFactor(report: MaternaReport): number {
    const index = barangays.indexOf(report.barangayFilter.value);
    return index < 0 ? 1 : barangayFactors[index];
  }

  function dateRange(category: MaternaCategory, period: MaternaPeriod): { short: string; full: string } {
    if (category === "edd-timeline") {
      const ranges: Record<MaternaPeriod, { short: string; full: string }> = {
        daily: { short: "Nov 26–Dec 1, 2026", full: "Nov 26 – Dec 1, 2026" },
        monthly: { short: "Dec 2026–May 2027", full: "Dec 1, 2026 – May 31, 2027" },
        quarterly: { short: "Q4 2026–Q3 2027", full: "Oct 1, 2026 – Sep 30, 2027" },
        yearly: { short: "2024–2027", full: "Jan 1, 2024 – Dec 31, 2027" },
      };
      return ranges[period];
    }

    const ranges: Record<MaternaPeriod, { short: string; full: string }> = {
      daily: { short: "Nov 26–Dec 2, 2026", full: "Nov 26 – Dec 2, 2026" },
      monthly: { short: "Nov 1–30, 2026", full: "Nov 1 – Nov 30, 2026" },
      quarterly: { short: "Oct 1–Dec 31, 2026", full: "Oct 1 – Dec 31, 2026" },
      yearly: { short: "Jan 1–Dec 31, 2026", full: "Jan 1 – Dec 31, 2026" },
    };
    return ranges[period];
  }

  function replaceChart(report: MaternaReport, svg: SVGSVGElement, viewBox: string, description: string): void {
    report.chart.setAttribute("viewBox", viewBox);
    report.chart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    report.chart.setAttribute("aria-label", description);
    report.chart.replaceChildren(...Array.from(svg.childNodes));
  }

  function renderServiceChart(report: MaternaReport, period: MaternaPeriod): void {
    const view = serviceViews[period];
    const values = view.values.map(value => Math.round(value * selectedFactor(report)));
    const plot = { left: 64, right: 690, top: 24, bottom: 238 };
    const x = (index: number) => plot.left + index * (plot.right - plot.left) / Math.max(1, view.labels.length - 1);
    const y = (value: number) => plot.bottom - value / view.maximum * (plot.bottom - plot.top);
    const svg = createSvg("svg", { viewBox: "0 0 720 300" });

    for (let value = 0; value <= view.maximum; value += view.maximum / 4) {
      const position = y(value);
      svg.append(createSvg("line", {
        x1: plot.left,
        x2: plot.right,
        y1: position,
        y2: position,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, plot.left - 10, position + 4, String(Math.round(value)), "end");
    }

    view.labels.forEach((label, index) => addText(svg, x(index), plot.bottom + 22, label));
    const axisLabel = createSvg("text", {
      x: 16,
      y: 145,
      "text-anchor": "middle",
      transform: "rotate(-90 16 145)",
    });
    axisLabel.textContent = "Maternal service visits";
    svg.append(axisLabel);
    addText(svg, 378, 286, period === "daily" ? "Day" : period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Year");

    const points = values.map((value, index) => `${x(index)},${y(value)}`);
    const area = [`${x(0)},${plot.bottom}`, ...points, `${x(values.length - 1)},${plot.bottom}`].join(" ");
    svg.append(createSvg("polygon", { points: area, fill: "#3768d9", opacity: 0.08 }));
    svg.append(createSvg("polyline", {
      points: points.join(" "),
      fill: "none",
      stroke: "#17399a",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }));
    values.forEach((value, index) => {
      const point = createSvg("circle", {
        cx: x(index),
        cy: y(value),
        r: 3.5,
        fill: "#f0ad2f",
        stroke: "#17399a",
        "stroke-width": 1.5,
      });
      addTitle(point, `${view.labels[index]}: ${value} maternal service visits`);
      svg.append(point);
    });
    replaceChart(report, svg, "0 0 720 300", "Maternal service visits over time");
  }

  function renderRiskChart(report: MaternaReport, period: MaternaPeriod): void {
    const factor = selectedFactor(report) * periodMultipliers[period];
    const values = riskCategories.map(category => Math.round(category.value * factor));
    const maximum = Math.max(10, Math.ceil(Math.max(...values) / 2) * 2);
    const plot = { left: 62, right: 690, top: 50, bottom: 244 };
    const step = (plot.right - plot.left) / riskCategories.length;
    const svg = createSvg("svg", { viewBox: "0 0 720 310" });

    for (let value = 0; value <= maximum; value += Math.max(1, maximum / 5)) {
      const y = plot.bottom - value / maximum * (plot.bottom - plot.top);
      svg.append(createSvg("line", {
        x1: plot.left,
        x2: plot.right,
        y1: y,
        y2: y,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, plot.left - 8, y + 4, String(Math.round(value)), "end");
    }

    const total = values.reduce((sum, value) => sum + value, 0);
    const registered = Math.round(120 * factor * periodMultipliers[period]);
    const rate = registered ? Math.round(total / registered * 100) : 0;
    const badge = createSvg("text", { x: 688, y: 28, "text-anchor": "end", fill: "#e4444e" });
    badge.textContent = `High-risk rate: ${total}/${registered} = ${rate}%`;
    svg.append(badge);

    riskCategories.forEach((category, index) => {
      const barWidth = 56;
      const barHeight = values[index] / maximum * (plot.bottom - plot.top);
      const x = plot.left + index * step + (step - barWidth) / 2;
      const y = plot.bottom - barHeight;
      const fill = index === 0 ? "#f0444b" : index === 1 ? "#efa51e" : "#3866d8";
      const bar = createSvg("rect", { x, y, width: barWidth, height: barHeight, rx: 1, fill });
      addTitle(bar, `${category.label}: ${values[index]} high-risk pregnancies`);
      svg.append(bar);
      addText(svg, x + barWidth / 2, y - 7, String(values[index]));
      const labelParts = category.label === "Hypertensive disorders"
        ? ["Hypertensive", "disorders"]
        : category.label === "Gestational diabetes"
          ? ["Gestational", "diabetes"]
          : category.label === "Previous C-section"
            ? ["Previous", "C-section"]
            : [category.label];
      labelParts.forEach((part, line) => addText(svg, x + barWidth / 2, plot.bottom + 15 + line * 12, part));
    });
    addText(svg, 378, 300, "Primary recorded risk category");
    replaceChart(report, svg, "0 0 720 310", "High-risk pregnancy rate and categories");
  }

  function renderEddChart(report: MaternaReport, period: MaternaPeriod): void {
    const view = eddViews[period];
    const values = view.values.map(value => Math.round(value * selectedFactor(report)));
    const plot = { left: 62, right: 690, top: 38, bottom: 238 };
    const maximum = view.maximum;
    const step = (plot.right - plot.left) / view.labels.length;
    const svg = createSvg("svg", { viewBox: "0 0 720 300" });

    for (let value = 0; value <= maximum; value += maximum / 4) {
      const y = plot.bottom - value / maximum * (plot.bottom - plot.top);
      svg.append(createSvg("line", {
        x1: plot.left,
        x2: plot.right,
        y1: y,
        y2: y,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, plot.left - 8, y + 4, String(Math.round(value)), "end");
    }

    view.labels.forEach((label, index) => {
      const barWidth = Math.min(64, step * 0.58);
      const barHeight = values[index] / maximum * (plot.bottom - plot.top);
      const x = plot.left + index * step + (step - barWidth) / 2;
      const y = plot.bottom - barHeight;
      const fill = values[index] === Math.max(...values) ? "#f0444b" : index === 2 ? "#efa51e" : "#3866d8";
      const bar = createSvg("rect", { x, y, width: barWidth, height: barHeight, rx: 1, fill });
      addTitle(bar, `${label}: ${values[index]} expected deliveries`);
      svg.append(bar);
      addText(svg, x + barWidth / 2, y - 7, String(values[index]));
      addText(svg, x + barWidth / 2, plot.bottom + 17, label);
    });
    addText(svg, 378, 286, period === "daily" ? "Expected delivery date" : period === "monthly" ? "Expected delivery month (EDD)" : period === "quarterly" ? "Expected delivery quarter" : "Expected delivery year");
    replaceChart(report, svg, "0 0 720 300", "Expected delivery dates by period");
  }

  function replaceList(list: HTMLUListElement, values: string[]): void {
    list.replaceChildren(...values.map(value => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }));
  }

  function renderInsights(report: MaternaReport, category: MaternaCategory, period: MaternaPeriod): void {
    const factor = selectedFactor(report);
    const selectedBarangay = report.barangayFilter.value === "all" ? "all barangays" : report.barangayFilter.value;

    if (category === "pregnancy-risk") {
      const values = riskCategories.map(item => ({
        label: item.label,
        value: Math.round(item.value * factor * periodMultipliers[period]),
      }));
      const ranked = [...values].sort((first, second) => second.value - first.value);
      const totalHighRisk = values.reduce((sum, item) => sum + item.value, 0);
      const totalRegistered = Math.round(120 * factor * periodMultipliers[period]);
      const rate = totalRegistered ? Math.round(totalHighRisk / totalRegistered * 100) : 0;
      replaceList(report.observationsList, [
        `${ranked[0].label} is the most frequently recorded risk category, with ${ranked[0].value} cases.`,
        `${totalHighRisk} of ${totalRegistered} registered pregnancies are classified as high-risk (${rate}%).`,
        `This ${periodNames[period].toLowerCase()} view covers ${selectedBarangay}.`,
      ]);
      replaceList(report.actionsList, [
        "Prioritize clinician review and follow-up for pregnancies classified as high-risk.",
        "Confirm that risk classifications and care plans are current in patient records.",
        "Coordinate appropriate referrals with the patient's healthcare team when indicated.",
      ]);
      return;
    }

    if (category === "edd-timeline") {
      const view = eddViews[period];
      const values = view.values.map(value => Math.round(value * factor));
      const total = values.reduce((sum, value) => sum + value, 0);
      const peakIndex = values.indexOf(Math.max(...values));
      const ranked = values.map((value, index) => ({ value, label: view.labels[index] }))
        .sort((first, second) => second.value - first.value);
      replaceList(report.observationsList, [
        `${view.labels[peakIndex]} has the highest expected delivery count, with ${values[peakIndex]} patients.`,
        `${total} expected deliveries are shown across the ${periodNames[period].toLowerCase()} timeline.`,
        `${ranked[1].label} follows with ${ranked[1].value} expected deliveries for ${selectedBarangay}.`,
      ]);
      replaceList(report.actionsList, [
        "Prepare delivery-related supplies ahead of months with higher expected volume.",
        "Review delivery plans and follow-up schedules with upcoming mothers.",
        "Coordinate with appropriate healthcare facilities for delivery referrals.",
      ]);
      return;
    }

    const view = serviceViews[period];
    const values = view.values.map(value => Math.round(value * factor));
    const highestIndex = values.indexOf(Math.max(...values));
    const lowestIndex = values.indexOf(Math.min(...values));
    const total = values.reduce((sum, value) => sum + value, 0);
    replaceList(report.observationsList, [
      `${view.labels[highestIndex]} has the highest recorded maternal service volume, with ${values[highestIndex]} visits.`,
      `${view.labels[lowestIndex]} has the lowest recorded volume, with ${values[lowestIndex]} visits.`,
      `${total} maternal service visits are shown for ${selectedBarangay} in this ${periodNames[period].toLowerCase()} view.`,
    ]);
    replaceList(report.actionsList, [
      "Review staffing and service availability during periods with higher visit volumes.",
      "Ensure routine antenatal follow-up schedules are up to date.",
      "Monitor service records for changes in maternal care demand.",
    ]);
  }

  function render(report: MaternaReport): void {
    const period = selectedPeriod(report);
    const category = selectedCategory(report);
    const dates = dateRange(category, period);
    report.dateRangeLabel.textContent = dates.short;
    report.customDateRange.textContent = dates.full;
    report.description.textContent = category === "pregnancy-risk"
      ? "Number of high-risk pregnancies by recorded category"
      : category === "edd-timeline"
        ? "Expected deliveries grouped by period"
        : "Number of maternal service visits";
    report.title.textContent = category === "pregnancy-risk"
      ? `${periodNames[period]} High-Risk Pregnancy Rate & Categories`
      : category === "edd-timeline"
        ? `${periodNames[period]} Expected Delivery Dates (EDD) Timeline`
        : `${periodNames[period]} Maternal Service Visits`;
    report.insightTitle.textContent = `AI-Assisted ${categoryLabels[category]} Insights`;

    if (category === "pregnancy-risk") renderRiskChart(report, period);
    else if (category === "edd-timeline") renderEddChart(report, period);
    else renderServiceChart(report, period);
    renderInsights(report, category, period);
  }

  reports.forEach(report => {
    report.periodButtons.forEach(button => button.addEventListener("click", () => {
      report.periodButtons.forEach(periodButton => {
        const active = periodButton === button;
        periodButton.classList.toggle("active", active);
        periodButton.setAttribute("aria-pressed", String(active));
      });
      render(report);
    }));
    report.categoryFilter.addEventListener("change", () => render(report));
    report.barangayFilter.addEventListener("change", () => render(report));
    render(report);
  });
});
