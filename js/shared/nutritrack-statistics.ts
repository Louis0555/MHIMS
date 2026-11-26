type NutriPeriod = "daily" | "monthly" | "quarterly" | "yearly";
type NutriCategory = "nutrition-status" | "children-monitoring" | "children-gender";
type NutriReportId = "status" | "monitoring" | "gender";

interface NutriReport {
  id: NutriReportId;
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
  if (!window.location.pathname.startsWith("/html/clinical/statistics/dashboard.html")
    || new URLSearchParams(window.location.search).get("view") !== "nutritrack") return;

  const main = document.querySelector<HTMLElement>(".statistics-main");
  if (!main) throw new Error("The NutriTrack statistics page layout is unavailable.");
  const view = document.getElementById("nutriStatisticsView");
  if (!view) throw new Error("The NutriTrack statistics view is unavailable.");

  main.classList.add("nutritrack-statistics-mode");
  view.hidden = false;
  document.title = `MHIMS - NutriTrack Statistics | ${window.location.pathname.includes("/personnel/") ? "Personnel" : "Clinical"}`;

  const periods: NutriPeriod[] = ["daily", "monthly", "quarterly", "yearly"];
  const periodNames: Record<NutriPeriod, string> = {
    daily: "Daily",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };
  const categories: { value: NutriCategory; label: string }[] = [
    { value: "nutrition-status", label: "Nutritional Status Trend" },
    { value: "children-monitoring", label: "Children Monitoring" },
    { value: "children-gender", label: "Children Monitored (Gender)" },
  ];
  const categoryLabels: Record<NutriCategory, string> = {
    "nutrition-status": "Nutritional Status Trend",
    "children-monitoring": "Children Monitoring",
    "children-gender": "Children Monitored by Gender",
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
  const statusSeries: Record<NutriPeriod, {
    labels: string[];
    series: { label: string; color: string; values: number[]; dashed?: boolean }[];
    maximum: number;
  }> = {
    daily: {
      labels: ["Thu", "Fri", "Sat", "Sun", "Mon", "Tue", "Wed"],
      series: [
        { label: "Normal", color: "#29ad69", values: [4, 4, 5, 4, 5, 5, 6] },
        { label: "Underweight", color: "#efa51e", values: [4, 3, 3, 3, 3, 2, 2] },
        { label: "Severely underweight", color: "#f0444b", values: [2, 2, 2, 2, 2, 1, 1] },
        { label: "Stunted", color: "#17399a", values: [1, 1, 1, 1, 1, 1, 1], dashed: true },
      ],
      maximum: 8,
    },
    monthly: {
      labels: ["January", "February", "March"],
      series: [
        { label: "Normal", color: "#29ad69", values: [4, 5, 6] },
        { label: "Underweight", color: "#efa51e", values: [4, 3, 2] },
        { label: "Severely underweight", color: "#f0444b", values: [2, 2, 1] },
        { label: "Stunted", color: "#17399a", values: [1, 1, 1], dashed: true },
      ],
      maximum: 8,
    },
    quarterly: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      series: [
        { label: "Normal", color: "#29ad69", values: [6, 8, 9, 11] },
        { label: "Underweight", color: "#efa51e", values: [8, 7, 6, 5] },
        { label: "Severely underweight", color: "#f0444b", values: [4, 3, 3, 2] },
        { label: "Stunted", color: "#17399a", values: [2, 2, 2, 1], dashed: true },
      ],
      maximum: 12,
    },
    yearly: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      series: [
        { label: "Normal", color: "#29ad69", values: [18, 24, 31, 39, 48] },
        { label: "Underweight", color: "#efa51e", values: [33, 29, 24, 20, 16] },
        { label: "Severely underweight", color: "#f0444b", values: [15, 13, 10, 8, 6] },
        { label: "Stunted", color: "#17399a", values: [8, 7, 6, 6, 5], dashed: true },
      ],
      maximum: 60,
    },
  };
  const monitoringData = barangays.map((name, index) => ({
    name,
    monitored: [8, 7, 6, 9, 8, 5, 7, 6, 4, 5, 6, 3, 7, 4, 5][index],
    unmonitored: [2, 1, 3, 2, 2, 2, 1, 3, 2, 2, 1, 2, 1, 3, 2][index],
  }));
  const genderData = barangays.map((name, index) => ({
    name,
    male: [4, 4, 3, 5, 4, 3, 5, 4, 2, 3, 4, 2, 4, 3, 3][index],
    female: [4, 3, 4, 4, 5, 2, 4, 3, 3, 2, 3, 2, 3, 3, 4][index],
  }));
  const periodMultipliers: Record<NutriPeriod, number> = {
    daily: 0.1,
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };
  const svgNamespace = "http://www.w3.org/2000/svg";

  function reportMarkup(id: NutriReportId, initialCategory: NutriCategory, description: string): string {
    const categoryOptions = categories.map(category =>
      `<option value="${category.value}"${category.value === initialCategory ? " selected" : ""}>${category.label}</option>`,
    ).join("");
    const barangayOptions = [
      '<option value="all">All Barangays</option>',
      ...barangays.map(name => `<option value="${name}">${name}</option>`),
    ].join("");
    const periodButtons = periods.map(period =>
      `<button type="button" data-nutri-period="${period}"${period === "monthly" ? ' class="active" aria-pressed="true"' : ""}>${periodNames[period]}</button>`,
    ).join("");

    return `
      <div class="residentcare-report-group nutritrack-report-group">
        <section class="statistics-panel residentcare-report-panel nutritrack-report-panel" id="nutri${id}Panel" aria-labelledby="nutri${id}Title">
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
              <h2 id="nutri${id}Title"></h2>
              <p id="nutri${id}Description">${description}</p>
            </div>
            <span class="mock-data-badge">MOCK DATA</span>
          </div>
          <div class="chart-container"><svg id="nutri${id}Chart" role="img"></svg></div>
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
        <h1 class="dashboard-title">NutriTrack Statistics</h1>
        <p class="dashboard-subtitle">Statistics overview</p>
      </div>
    </header>
    <div class="statistics-scroll residentcare-statistics-scroll nutritrack-statistics-scroll" aria-label="NutriTrack reports and insights" tabindex="0">
      <div class="overview-tab" aria-current="page">Overview</div>
      ${reportMarkup("status", "nutrition-status", "Nutritional status trend among children")}
      ${reportMarkup("monitoring", "children-monitoring", "Number of children being monitored in each barangay")}
      ${reportMarkup("gender", "children-gender", "Number of children being monitored by gender")}
    </div>`;

  function required<T extends Element>(id: string, type: { new(): T }): T {
    const element = document.getElementById(id);
    if (!(element instanceof type)) throw new Error(`Required NutriTrack statistics element #${id} was not found.`);
    return element;
  }

  const reports: NutriReport[] = ([
    { id: "status", category: "nutrition-status" },
    { id: "monitoring", category: "children-monitoring" },
    { id: "gender", category: "children-gender" },
  ] as const).map(({ id }) => {
    const panel = required(`nutri${id}Panel`, HTMLElement);
    return {
      id,
      panel,
      chart: required(`nutri${id}Chart`, SVGSVGElement),
      categoryFilter: required(`${id}CategoryFilter`, HTMLSelectElement),
      barangayFilter: required(`${id}BarangayFilter`, HTMLSelectElement),
      dateRangeLabel: required(`${id}DateRangeLabel`, HTMLElement),
      customDateRange: required(`${id}CustomDateRange`, HTMLElement),
      description: required(`nutri${id}Description`, HTMLElement),
      title: required(`nutri${id}Title`, HTMLHeadingElement),
      insightTitle: required(`${id}InsightsTitle`, HTMLHeadingElement),
      observationsList: required(`${id}Observations`, HTMLUListElement),
      actionsList: required(`${id}Actions`, HTMLUListElement),
      periodButtons: Array.from(panel.querySelectorAll<HTMLButtonElement>("[data-nutri-period]")),
    };
  });

  function svgNode<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attributes: Record<string, string | number>,
  ): SVGElementTagNameMap[K] {
    const element = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    return element;
  }

  function addText(parent: SVGElement, x: number, y: number, text: string, anchor = "middle"): void {
    const element = svgNode("text", { x, y, "text-anchor": anchor });
    element.textContent = text;
    parent.append(element);
  }

  function addTitle(parent: SVGElement, text: string): void {
    const element = svgNode("title", {});
    element.textContent = text;
    parent.append(element);
  }

  function selectedPeriod(report: NutriReport): NutriPeriod {
    const period = report.periodButtons.find(button => button.classList.contains("active"))?.dataset.nutriPeriod;
    return period === "daily" || period === "quarterly" || period === "yearly" ? period : "monthly";
  }

  function selectedCategory(report: NutriReport): NutriCategory {
    const category = report.categoryFilter.value;
    return category === "children-monitoring" || category === "children-gender" ? category : "nutrition-status";
  }

  function selectedFactor(report: NutriReport): number {
    const index = barangays.indexOf(report.barangayFilter.value);
    return index < 0 ? 1 : barangayFactors[index];
  }

  function selectedBarangayName(report: NutriReport): string {
    return report.barangayFilter.value === "all" ? "all barangays" : report.barangayFilter.value;
  }

  function dateRange(category: NutriCategory, period: NutriPeriod): { short: string; full: string } {
    const monthStart: Record<NutriPeriod, { short: string; full: string }> = {
      daily: { short: "Nov 20–26, 2026", full: "Nov 20 – Nov 26, 2026" },
      monthly: { short: "Jan 1–31, 2026", full: "Jan 1 – Jan 31, 2026" },
      quarterly: { short: "Jan 1–Mar 31, 2026", full: "Jan 1 – Mar 31, 2026" },
      yearly: { short: "Jan 1–Dec 31, 2026", full: "Jan 1 – Dec 31, 2026" },
    };
    const coverageRange: Record<NutriPeriod, { short: string; full: string }> = {
      daily: { short: "Nov 20–26, 2026", full: "Nov 20 – Nov 26, 2026" },
      monthly: { short: "Jan 1–31, 2026", full: "Jan 1 – Dec 31, 2026" },
      quarterly: { short: "Jan 1–Mar 31, 2026", full: "Jan 1 – Dec 31, 2026" },
      yearly: { short: "Jan 1–Dec 31, 2026", full: "Jan 1 – Dec 31, 2026" },
    };
    return category === "nutrition-status" ? monthStart[period] : coverageRange[period];
  }

  function replaceChart(report: NutriReport, svg: SVGSVGElement, viewBox: string, description: string): void {
    report.chart.setAttribute("viewBox", viewBox);
    report.chart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    report.chart.setAttribute("aria-label", description);
    report.chart.replaceChildren(...Array.from(svg.childNodes));
  }

  function renderStatusChart(report: NutriReport, period: NutriPeriod): void {
    const view = statusSeries[period];
    const factor = selectedFactor(report);
    const plot = { left: 64, right: 690, top: 58, bottom: 246 };
    const x = (index: number) => plot.left + index * (plot.right - plot.left) / Math.max(1, view.labels.length - 1);
    const y = (value: number) => plot.bottom - value / view.maximum * (plot.bottom - plot.top);
    const svg = svgNode("svg", { viewBox: "0 0 720 310" });

    const legendPositions = [64, 190, 335, 545];
    view.series.forEach((series, seriesIndex) => {
      const legendX = legendPositions[seriesIndex];
      svg.append(svgNode("line", {
        x1: legendX,
        x2: legendX + 16,
        y1: 20,
        y2: 20,
        stroke: series.color,
        "stroke-width": 3,
        ...(series.dashed ? { "stroke-dasharray": "5 3" } : {}),
      }));
      addText(svg, legendX + 22, 24, series.label, "start");
    });

    for (let value = 0; value <= view.maximum; value += Math.max(1, view.maximum / 4)) {
      const position = y(value);
      svg.append(svgNode("line", {
        x1: plot.left,
        x2: plot.right,
        y1: position,
        y2: position,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, plot.left - 10, position + 4, String(Math.round(value)), "end");
    }

    view.labels.forEach((label, index) => addText(svg, x(index), plot.bottom + 20, label));
    const axisLabel = svgNode("text", {
      x: 16,
      y: 155,
      "text-anchor": "middle",
      transform: "rotate(-90 16 155)",
    });
    axisLabel.textContent = "Number of children";
    svg.append(axisLabel);
    addText(svg, 378, 290, period === "daily" ? "Day" : period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Year");

    view.series.forEach(series => {
      const values = series.values.map(value => Math.round(value * factor));
      const points = values.map((value, index) => `${x(index)},${y(value)}`);
      const line = svgNode("polyline", {
        points: points.join(" "),
        fill: "none",
        stroke: series.color,
        "stroke-width": 2.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        ...(series.dashed ? { "stroke-dasharray": "6 4" } : {}),
      });
      addTitle(line, series.label);
      svg.append(line);
      values.forEach((value, index) => {
        const point = svgNode("circle", {
          cx: x(index),
          cy: y(value),
          r: 3.5,
          fill: series.color,
        });
        addTitle(point, `${view.labels[index]} ${series.label.toLowerCase()}: ${value} children`);
        svg.append(point);
      });
    });

    replaceChart(report, svg, "0 0 720 310", "Nutritional status trend among children");
  }

  function renderMonitoringChart(report: NutriReport, period: NutriPeriod): void {
    const factor = selectedFactor(report) * periodMultipliers[period];
    const selected = report.barangayFilter.value;
    const rows = selected === "all"
      ? monitoringData
      : monitoringData.filter(item => item.name === selected);
    const values = rows.map(item => ({
      ...item,
      monitored: Math.round(item.monitored * factor),
      unmonitored: Math.round(item.unmonitored * factor),
    }));
    const maximum = Math.max(2, Math.ceil(Math.max(...values.map(item => item.monitored + item.unmonitored)) / 2) * 2);
    const plot = { left: 178, right: 690, top: 44, rowHeight: selected === "all" ? 27 : 72 };
    const bottom = plot.top + values.length * plot.rowHeight;
    const svg = svgNode("svg", { viewBox: `0 0 720 ${bottom + 56}` });

    svg.append(svgNode("rect", { x: 235, y: 14, width: 10, height: 10, fill: "#29ad69" }));
    addText(svg, 250, 23, "Monitored", "start");
    svg.append(svgNode("rect", { x: 342, y: 14, width: 10, height: 10, fill: "#efa51e" }));
    addText(svg, 357, 23, "Unmonitored", "start");

    for (let value = 0; value <= maximum; value += Math.max(1, maximum / 5)) {
      const x = plot.left + value / maximum * (plot.right - plot.left);
      svg.append(svgNode("line", {
        x1: x,
        x2: x,
        y1: plot.top,
        y2: bottom,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, x, bottom + 16, String(Math.round(value)));
    }

    values.forEach((item, index) => {
      const rowY = plot.top + index * plot.rowHeight;
      const barHeight = selected === "all" ? 8 : 18;
      const gap = selected === "all" ? 3 : 6;
      addText(svg, plot.left - 9, rowY + (selected === "all" ? 13 : 19), item.name, "end");
      const monitoredWidth = item.monitored / maximum * (plot.right - plot.left);
      const monitoredBar = svgNode("rect", {
        x: plot.left,
        y: rowY,
        width: monitoredWidth,
        height: barHeight,
        rx: 2,
        fill: "#29ad69",
      });
      addTitle(monitoredBar, `${item.name}: ${item.monitored} children monitored`);
      svg.append(monitoredBar);
      const unmonitoredWidth = item.unmonitored / maximum * (plot.right - plot.left);
      const unmonitoredBar = svgNode("rect", {
        x: plot.left,
        y: rowY + barHeight + gap,
        width: unmonitoredWidth,
        height: barHeight,
        rx: 2,
        fill: "#efa51e",
      });
      addTitle(unmonitoredBar, `${item.name}: ${item.unmonitored} children not monitored`);
      svg.append(unmonitoredBar);
    });

    const axisLabel = svgNode("text", {
      x: 17,
      y: bottom / 2,
      "text-anchor": "middle",
      transform: `rotate(-90 17 ${bottom / 2})`,
    });
    axisLabel.textContent = "Barangay";
    svg.append(axisLabel);
    addText(svg, (plot.left + plot.right) / 2, bottom + 42, "Number of children");
    replaceChart(report, svg, `0 0 720 ${bottom + 56}`, "Children monitored and unmonitored by barangay");
  }

  function renderGenderChart(report: NutriReport, period: NutriPeriod): void {
    const factor = selectedFactor(report) * periodMultipliers[period];
    const selected = report.barangayFilter.value;
    const rows = selected === "all"
      ? genderData
      : genderData.filter(item => item.name === selected);
    const values = rows.map(item => ({
      ...item,
      male: Math.round(item.male * factor),
      female: Math.round(item.female * factor),
    }));
    const maximum = Math.max(2, Math.ceil(Math.max(...values.map(item => Math.max(item.male, item.female))) / 2) * 2);
    const rowHeight = selected === "all" ? 34 : 72;
    const plot = { left: 180, right: 730, top: 46, rowHeight };
    const bottom = plot.top + values.length * plot.rowHeight;
    const svg = svgNode("svg", { viewBox: `0 0 760 ${bottom + 56}` });

    svg.append(svgNode("rect", { x: 260, y: 14, width: 10, height: 10, fill: "#3768d9" }));
    addText(svg, 275, 23, "Male", "start");
    svg.append(svgNode("rect", { x: 335, y: 14, width: 10, height: 10, fill: "#f18ca1" }));
    addText(svg, 350, 23, "Female", "start");

    for (let value = 0; value <= maximum; value += Math.max(1, maximum / 4)) {
      const x = plot.left + value / maximum * (plot.right - plot.left);
      svg.append(svgNode("line", {
        x1: x,
        x2: x,
        y1: plot.top,
        y2: bottom,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, x, bottom + 16, String(Math.round(value)));
    }

    values.forEach((item, index) => {
      const rowY = plot.top + index * plot.rowHeight;
      const barHeight = selected === "all" ? 8 : 18;
      const gap = selected === "all" ? 3 : 6;
      addText(svg, plot.left - 10, rowY + (selected === "all" ? 13 : 20), item.name, "end");
      const bars = [
        { label: "Male", value: item.male, y: rowY, fill: "#3768d9" },
        { label: "Female", value: item.female, y: rowY + barHeight + gap, fill: "#f18ca1" },
      ];
      bars.forEach(barData => {
        const width = barData.value / maximum * (plot.right - plot.left);
        const bar = svgNode("rect", {
          x: plot.left,
          y: barData.y,
          width,
          height: barHeight,
          rx: 2,
          fill: barData.fill,
        });
        addTitle(bar, `${item.name}: ${barData.value} ${barData.label.toLowerCase()} children monitored`);
        svg.append(bar);
        addText(svg, plot.left + width + 5, barData.y + barHeight - 1, String(barData.value), "start");
      });
    });
    addText(svg, (plot.left + plot.right) / 2, bottom + 42, "Number of children");
    replaceChart(report, svg, `0 0 760 ${bottom + 56}`, "Children monitored by gender and barangay");
  }

  function replaceList(list: HTMLUListElement, values: string[]): void {
    list.replaceChildren(...values.map(value => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }));
  }

  function renderInsights(report: NutriReport, category: NutriCategory, period: NutriPeriod): void {
    const factor = selectedFactor(report);
    const barangay = selectedBarangayName(report);

    if (category === "nutrition-status") {
      const view = statusSeries[period];
      const totals = view.series.map(series => ({
        label: series.label,
        values: series.values.map(value => Math.round(value * factor)),
      }));
      const highest = [...totals].sort((first, second) =>
        second.values[second.values.length - 1] - first.values[first.values.length - 1],
      );
      const normal = totals.find(series => series.label === "Normal");
      const underweight = totals.find(series => series.label === "Underweight");
      replaceList(report.observationsList, [
        `${highest[0].label} is the largest recorded nutrition category at the end of this ${periodNames[period].toLowerCase()} period.`,
        `Normal nutritional status changed from ${normal?.values[0]} to ${normal?.values[normal.values.length - 1]} children.`,
        `Underweight cases changed from ${underweight?.values[0]} to ${underweight?.values[underweight.values.length - 1]} for ${barangay}.`,
      ]);
      replaceList(report.actionsList, [
        "Continue regular growth monitoring and review measurements with qualified health staff.",
        "Maintain appropriate nutrition follow-up for children with recorded concerns.",
        "Review records regularly to ensure each child's latest growth assessment is captured.",
      ]);
      return;
    }

    if (category === "children-monitoring") {
      const rows = report.barangayFilter.value === "all"
        ? monitoringData
        : monitoringData.filter(item => item.name === report.barangayFilter.value);
      const monitored = Math.round(rows.reduce((sum, item) => sum + item.monitored, 0) * factor * periodMultipliers[period]);
      const unmonitored = Math.round(rows.reduce((sum, item) => sum + item.unmonitored, 0) * factor * periodMultipliers[period]);
      const total = monitored + unmonitored;
      const coverage = total ? Math.round(monitored / total * 100) : 0;
      replaceList(report.observationsList, [
        `${monitored} children are monitored and ${unmonitored} are not marked as monitored in ${barangay}.`,
        `Recorded monitoring coverage is approximately ${coverage}% for the selected period.`,
        `This ${periodNames[period].toLowerCase()} report includes ${rows.length} ${rows.length === 1 ? "barangay" : "barangays"}.`,
      ]);
      replaceList(report.actionsList, [
        "Review children without a current monitoring record and plan appropriate follow-up.",
        "Keep barangay-level monitoring records current and complete.",
        "Coordinate growth-monitoring activities with local health staff.",
      ]);
      return;
    }

    const rows = report.barangayFilter.value === "all"
      ? genderData
      : genderData.filter(item => item.name === report.barangayFilter.value);
    const male = Math.round(rows.reduce((sum, item) => sum + item.male, 0) * factor * periodMultipliers[period]);
    const female = Math.round(rows.reduce((sum, item) => sum + item.female, 0) * factor * periodMultipliers[period]);
    replaceList(report.observationsList, [
      `${male} male and ${female} female children are represented in the monitoring data for ${barangay}.`,
      `${male === female ? "The recorded totals are equal." : `${male > female ? "Male" : "Female"} children have the higher recorded count.`}`,
      `The report covers ${rows.length} ${rows.length === 1 ? "barangay" : "barangays"} for the selected ${periodNames[period].toLowerCase()} period.`,
    ]);
    replaceList(report.actionsList, [
      "Maintain complete child records across the reported barangays.",
      "Review monitoring coverage for children with missing or outdated records.",
      "Use current, validated population records when planning nutrition activities.",
    ]);
  }

  function render(report: NutriReport): void {
    const period = selectedPeriod(report);
    const category = selectedCategory(report);
    const dates = dateRange(category, period);
    report.dateRangeLabel.textContent = dates.short;
    report.customDateRange.textContent = dates.full;
    report.description.textContent = category === "nutrition-status"
      ? "Nutritional status trend among children"
      : category === "children-monitoring"
        ? "Number of children being monitored in each barangay"
        : "Number of children being monitored by gender";
    report.title.textContent = category === "nutrition-status"
      ? `${periodNames[period]} Nutritional Status Trend`
      : category === "children-monitoring"
        ? `${periodNames[period]} Children Monitoring`
        : `${periodNames[period]} Children Monitored by Gender`;
    report.insightTitle.textContent = `AI-Assisted ${categoryLabels[category]} Insights`;

    if (category === "children-monitoring") renderMonitoringChart(report, period);
    else if (category === "children-gender") renderGenderChart(report, period);
    else renderStatusChart(report, period);
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
