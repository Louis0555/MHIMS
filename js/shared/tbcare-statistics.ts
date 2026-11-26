type TBCarePeriod = "daily" | "monthly" | "quarterly" | "yearly";
type TBCareCategory = "service-visits" | "treatment-outcomes" | "case-distribution";
type TBCareReportId = "visits" | "outcomes" | "cases";

interface TBCareReport {
  id: TBCareReportId;
  panel: HTMLElement;
  chart: SVGSVGElement;
  categoryFilter: HTMLSelectElement;
  barangayFilter: HTMLSelectElement;
  title: HTMLHeadingElement;
  dateRangeLabel: HTMLElement;
  customDateRange: HTMLElement;
  insightTitle: HTMLHeadingElement;
  observationsList: HTMLUListElement;
  actionsList: HTMLUListElement;
  periodButtons: HTMLButtonElement[];
}

document.addEventListener("DOMContentLoaded", () => {
  if (!window.location.pathname.startsWith("/html/clinical/statistics/dashboard.html")
    || new URLSearchParams(window.location.search).get("view") !== "tbcare") return;

  const main = document.querySelector<HTMLElement>(".statistics-main");
  if (!main) throw new Error("The TBCare statistics page layout is unavailable.");
  const view = document.getElementById("tbcareStatisticsView");
  if (!view) throw new Error("The TBCare statistics view is unavailable.");

  main.classList.add("tbcare-statistics-mode");
  view.hidden = false;
  document.title = "MHIMS - TBCare Statistics | Clinical";

  const periods: TBCarePeriod[] = ["daily", "monthly", "quarterly", "yearly"];
  const periodNames: Record<TBCarePeriod, string> = {
    daily: "Daily",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };
  const periodLabels: Record<TBCarePeriod, string[]> = {
    daily: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    monthly: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    quarterly: ["Q1", "Q2", "Q3", "Q4"],
    yearly: ["2022", "2023", "2024", "2025", "2026"],
  };
  const categories: { value: TBCareCategory; label: string }[] = [
    { value: "service-visits", label: "TB Service Visits" },
    { value: "treatment-outcomes", label: "TB Treatment Outcome" },
    { value: "case-distribution", label: "TB Case Distribution" },
  ];
  const categoryLabels: Record<TBCareCategory, string> = {
    "service-visits": "TB Service Visits",
    "treatment-outcomes": "TB Treatment Outcomes",
    "case-distribution": "TB Case Distribution",
  };
  const initialCategories: Record<TBCareReportId, TBCareCategory> = {
    visits: "service-visits",
    outcomes: "treatment-outcomes",
    cases: "case-distribution",
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
  const caseCounts = [18, 14, 11, 9, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2];
  const outcomeData = [
    { label: "Cured", value: 36, color: "#24ad70" },
    { label: "Treatment Completed", value: 24, color: "#3768d9" },
    { label: "Failed", value: 3, color: "#f0444b" },
    { label: "Died", value: 2, color: "#9b9b9b" },
    { label: "Lost to Follow-up", value: 5, color: "#efa51e" },
  ];
  const visitValues: Record<TBCarePeriod, number[]> = {
    daily: [4, 5, 4, 6, 7, 5, 8],
    monthly: [32, 35, 33, 39, 42, 45, 41, 48, 51, 49, 55, 59],
    quarterly: [33, 42, 47, 55],
    yearly: [26, 32, 38, 47, 59],
  };
  const multipliers: Record<TBCarePeriod, number> = {
    daily: 0.25,
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };
  const svgNamespace = "http://www.w3.org/2000/svg";

  const reportConfigurations: Record<TBCareReportId, { initialCategory: TBCareCategory }> = {
    visits: { initialCategory: "service-visits" },
    outcomes: { initialCategory: "treatment-outcomes" },
    cases: { initialCategory: "case-distribution" },
  };

  function reportMarkup(id: TBCareReportId, description: string): string {
    const categoryOptions = categories.map(category =>
      `<option value="${category.value}"${category.value === reportConfigurations[id].initialCategory ? " selected" : ""}>${category.label}</option>`,
    ).join("");
    const barangayOptions = [
      '<option value="all">All Barangays</option>',
      ...barangays.map(name => `<option value="${name}">${name}</option>`),
    ].join("");
    const periodButtons = periods.map(period =>
      `<button type="button" data-tbcare-period="${period}"${period === "monthly" ? ' class="active" aria-pressed="true"' : ""}>${periodNames[period]}</button>`,
    ).join("");

    return `
      <div class="residentcare-report-group tbcare-report-group">
        <section class="statistics-panel residentcare-report-panel tbcare-report-panel" id="tbcare${id}Panel" aria-labelledby="tbcare${id}Title">
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
                <div class="date-range-box"><iconify-icon icon="solar:calendar-date-bold" aria-hidden="true"></iconify-icon><span id="${id}CustomDateRange">Jan 1 – Dec 31, 2026</span></div>
              </div>
            </div>
          </section>
          <div class="panel-heading">
            <div>
              <h2 id="tbcare${id}Title"></h2>
              <p>${description}</p>
            </div>
            <span class="mock-data-badge">MOCK DATA</span>
          </div>
          <div class="chart-container"><svg id="tbcare${id}Chart" role="img"></svg></div>
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
        <h1 class="dashboard-title">TBCare Statistics</h1>
        <p class="dashboard-subtitle">Statistics overview</p>
      </div>
    </header>
    <div class="statistics-scroll residentcare-statistics-scroll tbcare-statistics-scroll" aria-label="TBCare reports and insights" tabindex="0">
      <div class="overview-tab" aria-current="page">Overview</div>
      ${reportMarkup("visits", "Number of patient visits and consultations")}
      ${reportMarkup("outcomes", "Number of treatment outcomes monitored")}
      ${reportMarkup("cases", "Number of recorded TB cases by barangay")}
    </div>`;

  function required<T extends Element>(id: string, type: { new(): T }): T {
    const element = document.getElementById(id);
    if (!(element instanceof type)) throw new Error(`Required TBCare statistics element #${id} was not found.`);
    return element;
  }

  const reports: TBCareReport[] = (Object.keys(reportConfigurations) as TBCareReportId[]).map(id => ({
    id,
    panel: required(`tbcare${id}Panel`, HTMLElement),
    chart: required(`tbcare${id}Chart`, SVGSVGElement),
    categoryFilter: required(`${id}CategoryFilter`, HTMLSelectElement),
    barangayFilter: required(`${id}BarangayFilter`, HTMLSelectElement),
    title: required(`tbcare${id}Title`, HTMLHeadingElement),
    dateRangeLabel: required(`${id}DateRangeLabel`, HTMLElement),
    customDateRange: required(`${id}CustomDateRange`, HTMLElement),
    insightTitle: required(`${id}InsightsTitle`, HTMLHeadingElement),
    observationsList: required(`${id}Observations`, HTMLUListElement),
    actionsList: required(`${id}Actions`, HTMLUListElement),
    periodButtons: Array.from(required(`tbcare${id}Panel`, HTMLElement).querySelectorAll<HTMLButtonElement>("[data-tbcare-period]")),
  }));
  const selectedPeriods = new Map<TBCareReportId, TBCarePeriod>(reports.map(report => [report.id, "monthly"]));

  function svgNode(name: string, attributes: Record<string, string | number> = {}): SVGElement {
    const element = document.createElementNS(svgNamespace, name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function addText(svg: SVGSVGElement, x: number, y: number, text: string, anchor = "middle"): SVGTextElement {
    const element = svgNode("text", { x, y, "text-anchor": anchor }) as SVGTextElement;
    element.textContent = text;
    svg.append(element);
    return element;
  }

  function replaceChart(report: TBCareReport, svg: SVGSVGElement, description: string): void {
    report.chart.setAttribute("viewBox", svg.getAttribute("viewBox") ?? "0 0 760 360");
    report.chart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    report.chart.setAttribute("aria-label", description);
    report.chart.replaceChildren(...Array.from(svg.childNodes));
  }

  function selectedCaseFactor(report: TBCareReport): number {
    if (report.barangayFilter.value === "all") return 1;
    const index = barangays.indexOf(report.barangayFilter.value);
    return caseCounts[index] / caseCounts[0];
  }

  function renderVisits(report: TBCareReport, period: TBCarePeriod): void {
    const labels = periodLabels[period];
    const factor = selectedCaseFactor(report);
    const values = visitValues[period].map(value => Math.max(1, Math.round(value * factor)));
    const maximum = Math.ceil(Math.max(...values) / 10) * 10;
    const plot = { left: 78, right: 720, top: 62, bottom: 286 };
    const x = (index: number) => plot.left + index * (plot.right - plot.left) / Math.max(1, labels.length - 1);
    const y = (value: number) => plot.bottom - value / maximum * (plot.bottom - plot.top);
    const svg = svgNode("svg", { viewBox: "0 0 760 360" }) as SVGSVGElement;

    svg.append(svgNode("line", { x1: 92, x2: 110, y1: 25, y2: 25, stroke: "#17399a", "stroke-width": 3 }));
    addText(svg, 118, 29, "TB service visits", "start");
    for (let value = 0; value <= maximum; value += Math.max(1, maximum / 4)) {
      const position = y(value);
      svg.append(svgNode("line", { x1: plot.left, x2: plot.right, y1: position, y2: position, stroke: "#e5e9ef", "stroke-width": 1 }));
      addText(svg, plot.left - 10, position + 4, String(Math.round(value)), "end");
    }

    labels.forEach((label, index) => addText(svg, x(index), plot.bottom + 20, label));
    const axisLabel = svgNode("text", {
      x: 18,
      y: 174,
      "text-anchor": "middle",
      transform: "rotate(-90 18 174)",
    });
    axisLabel.textContent = "Number of visits";
    svg.append(axisLabel);
    addText(svg, 400, 344, period === "daily" ? "Day" : period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Year");

    const points = values.map((value, index) => `${x(index)},${y(value)}`);
    svg.append(svgNode("polyline", {
      points: points.join(" "),
      fill: "none",
      stroke: "#17399a",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }));
    values.forEach((value, index) => {
      svg.append(svgNode("circle", { cx: x(index), cy: y(value), r: 4, fill: "#fff", stroke: "#17399a", "stroke-width": 2 }));
    });
    replaceChart(report, svg, "TB service visits by selected period");
  }

  function renderOutcomes(report: TBCareReport, period: TBCarePeriod): void {
    const factor = selectedCaseFactor(report) * multipliers[period];
    const outcomes = outcomeData.map(item => ({ ...item, value: Math.max(1, Math.round(item.value * factor)) }));
    const total = outcomes.reduce((sum, item) => sum + item.value, 0);
    const svg = svgNode("svg", { viewBox: "0 0 760 360" }) as SVGSVGElement;
    const center = { x: 250, y: 184 };
    const radius = 122;
    let angle = -Math.PI / 2;

    outcomes.forEach(item => {
      const slice = item.value / total * Math.PI * 2;
      const endAngle = angle + slice;
      const startX = center.x + radius * Math.cos(angle);
      const startY = center.y + radius * Math.sin(angle);
      const endX = center.x + radius * Math.cos(endAngle);
      const endY = center.y + radius * Math.sin(endAngle);
      svg.append(svgNode("path", {
        d: `M ${center.x} ${center.y} L ${startX} ${startY} A ${radius} ${radius} 0 ${slice > Math.PI ? 1 : 0} 1 ${endX} ${endY} Z`,
        fill: item.color,
        stroke: "#fff",
        "stroke-width": 2,
      }));
      if (item.value / total >= 0.07) {
        const labelAngle = angle + slice / 2;
        const label = addText(
          svg,
          center.x + radius * 0.62 * Math.cos(labelAngle),
          center.y + radius * 0.62 * Math.sin(labelAngle) + 4,
          `${Math.round(item.value / total * 100)}%`,
        );
        label.style.fill = "#000";
      }
      angle = endAngle;
    });

    outcomes.forEach((item, index) => {
      const y = 110 + index * 34;
      svg.append(svgNode("rect", { x: 430, y: y - 10, width: 15, height: 5, fill: item.color }));
      const percent = (item.value / total * 100).toFixed(1);
      addText(svg, 455, y - 4, `${item.label} — ${item.value} (${percent}%)`, "start");
    });
    addText(svg, 430, 306, `Treatment outcome (n=${total})`, "start");
    replaceChart(report, svg, "TB treatment outcome proportions");
  }

  function renderCases(report: TBCareReport, period: TBCarePeriod): void {
    const selectedBarangay = report.barangayFilter.value;
    const factor = multipliers[period];
    const entries = barangays
      .map((name, index) => ({ name, value: Math.max(1, Math.round(caseCounts[index] * factor)) }))
      .filter(item => selectedBarangay === "all" || item.name === selectedBarangay);
    const maximum = Math.max(2, Math.ceil(Math.max(...entries.map(item => item.value)) / 2) * 2);
    const rowHeight = selectedBarangay === "all" ? 29 : 64;
    const top = 30;
    const left = 185;
    const right = 720;
    const bottom = top + entries.length * rowHeight;
    const svg = svgNode("svg", { viewBox: `0 0 760 ${bottom + 56}` }) as SVGSVGElement;

    for (let value = 0; value <= maximum; value += Math.max(1, maximum / 4)) {
      const x = left + value / maximum * (right - left);
      svg.append(svgNode("line", { x1: x, x2: x, y1: top, y2: bottom, stroke: "#e5e9ef", "stroke-width": 1 }));
      addText(svg, x, bottom + 17, String(Math.round(value)));
    }
    entries.forEach((item, index) => {
      const y = top + index * rowHeight;
      const height = selectedBarangay === "all" ? 15 : 30;
      const width = item.value / maximum * (right - left);
      addText(svg, left - 10, y + height * 0.75, item.name, "end");
      svg.append(svgNode("rect", {
        x: left,
        y,
        width,
        height,
        rx: 2,
        fill: index === 0 || item.value === maximum ? "#17399a" : "#3768d9",
      }));
      addText(svg, left + width + 6, y + height * 0.75, String(item.value), "start");
    });
    addText(svg, (left + right) / 2, bottom + 44, "Recorded TB cases");
    replaceChart(report, svg, "Recorded TB cases by barangay");
  }

  function renderList(list: HTMLUListElement, items: string[]): void {
    list.replaceChildren(...items.map(text => {
      const item = document.createElement("li");
      item.textContent = text;
      return item;
    }));
  }

  function updateInsights(report: TBCareReport, category: TBCareCategory, period: TBCarePeriod): void {
    const barangay = report.barangayFilter.value === "all" ? "all barangays" : report.barangayFilter.value;
    let observations: string[];
    let actions: string[];

    if (category === "service-visits") {
      const values = visitValues[period].map(value => Math.max(1, Math.round(value * selectedCaseFactor(report))));
      const change = values[values.length - 1] - values[0];
      observations = [
        `TB service visits changed from ${values[0]} to ${values[values.length - 1]} during this ${periodNames[period].toLowerCase()} period.`,
        `${periodNames[period]} reports contain ${values.reduce((sum, value) => sum + value, 0)} visits across ${barangay}.`,
        change >= 0 ? "The selected series shows an overall increase in visits." : "The selected series shows an overall decrease in visits.",
      ];
      actions = [
        "Review visit patterns and maintain regular follow-up schedules.",
        "Confirm that patients due for consultation are contacted through approved care pathways.",
        "Check that service visits are recorded consistently across barangays.",
      ];
    } else if (category === "treatment-outcomes") {
      const factor = selectedCaseFactor(report) * multipliers[period];
      const values = outcomeData.map(item => ({ ...item, value: Math.max(1, Math.round(item.value * factor)) }));
      const total = values.reduce((sum, item) => sum + item.value, 0);
      const completed = values.filter(item => item.label === "Cured" || item.label === "Treatment Completed")
        .reduce((sum, item) => sum + item.value, 0);
      const lost = values.find(item => item.label === "Lost to Follow-up")?.value ?? 0;
      observations = [
        `${Math.round(completed / total * 100)}% of recorded outcomes are cured or treatment completed.`,
        `${total} treatment outcomes are shown for ${barangay} in this ${periodNames[period].toLowerCase()} view.`,
        `${lost} patients are listed as lost to follow-up in the illustrative data.`,
      ];
      actions = [
        "Continue treatment adherence monitoring and timely outcome documentation.",
        "Coordinate follow-up for patients with missed visits using approved clinical procedures.",
        "Review unsuccessful outcomes with authorized healthcare personnel.",
      ];
    } else {
      const values = barangays
        .map((name, index) => ({ name, value: Math.max(1, Math.round(caseCounts[index] * multipliers[period])) }))
        .filter(item => report.barangayFilter.value === "all" || item.name === report.barangayFilter.value);
      const ranked = [...values].sort((a, b) => b.value - a.value);
      const total = values.reduce((sum, item) => sum + item.value, 0);
      observations = [
        `${ranked[0].name} has the highest number of recorded TB cases, with ${ranked[0].value}.`,
        `${ranked[ranked.length - 1].name} has the lowest number of recorded TB cases, with ${ranked[ranked.length - 1].value}.`,
        `The selected barangay data accounts for ${total} of the displayed cases.`,
      ];
      actions = [
        "Consider prioritizing TB awareness and screening activities where recorded case counts are higher.",
        "Coordinate with barangay health workers for appropriate referrals and follow-up.",
        "Continue monitoring case distribution across all barangays.",
      ];
    }

    report.insightTitle.textContent = `AI-Assisted ${categoryLabels[category]} Insights`;
    renderList(report.observationsList, observations);
    renderList(report.actionsList, actions);
  }

  function render(report: TBCareReport): void {
    const period = selectedPeriods.get(report.id);
    if (!period) throw new Error(`The selected period for TBCare report "${report.id}" is unavailable.`);
    const category = report.categoryFilter.value as TBCareCategory;
    report.title.textContent = category === "service-visits"
      ? `${periodNames[period]} TB Service Visits`
      : categoryLabels[category];
    report.dateRangeLabel.textContent = period === "monthly" ? "Jan 1–31, 2026" : "Jan 1 – Dec 31, 2026";

    if (category === "service-visits") renderVisits(report, period);
    else if (category === "treatment-outcomes") renderOutcomes(report, period);
    else renderCases(report, period);
    updateInsights(report, category, period);
  }

  reports.forEach(report => {
    report.categoryFilter.addEventListener("change", () => render(report));
    report.barangayFilter.addEventListener("change", () => render(report));
    report.periodButtons.forEach(button => {
      button.addEventListener("click", () => {
        const period = button.dataset.tbcarePeriod as TBCarePeriod | undefined;
        if (!period || !periods.includes(period)) throw new Error("An invalid TBCare report period was selected.");
        selectedPeriods.set(report.id, period);
        report.periodButtons.forEach(periodButton => {
          const active = periodButton === button;
          periodButton.classList.toggle("active", active);
          periodButton.setAttribute("aria-pressed", String(active));
        });
        render(report);
      });
    });
    render(report);
  });
});
