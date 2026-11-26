type ResidentCarePeriod = "daily" | "monthly" | "quarterly" | "yearly";
type ResidentCareCategory = "consultation-frequency" | "patient-distribution" | "consultation-causes";
type ResidentCareReportId = "frequency" | "distribution" | "causes";

interface ResidentCareReport {
  id: ResidentCareReportId;
  panel: HTMLElement;
  chart: SVGSVGElement;
  categoryFilter: HTMLSelectElement;
  barangayFilter: HTMLSelectElement;
  dateRangeLabel: HTMLElement;
  customDateRange: HTMLElement;
  title: HTMLHeadingElement;
  insightTitle: HTMLHeadingElement;
  observationsList: HTMLUListElement;
  actionsList: HTMLUListElement;
  periodButtons: HTMLButtonElement[];
}

document.addEventListener("DOMContentLoaded", () => {
  const view = document.getElementById("residentcareStatisticsView");
  if (!view) return;

  const statisticsView = new URLSearchParams(window.location.search).get("view");
  const isResidentCareView = statisticsView === "residentcare"
    || (statisticsView !== "maternatrack" && document.body.classList.contains("residentcare-statistics-page"));
  if (!isResidentCareView) return;

  const main = document.querySelector<HTMLElement>(".statistics-main");
  if (!main) throw new Error("The ResidentCare statistics page layout is unavailable.");
  main.classList.add("residentcare-statistics-mode");
  view.hidden = false;
  document.title = `MHIMS - ResidentCare Statistics | ${window.location.pathname.includes("/personnel/") ? "Personnel" : "Clinical"}`;

  function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required ResidentCare statistics element #${id} was not found.`);
    return element as T;
  }

  function getSvg(id: string): SVGSVGElement {
    const chart = document.getElementById(id);
    if (!(chart instanceof SVGSVGElement)) {
      throw new Error(`The ResidentCare statistics chart #${id} is unavailable.`);
    }
    return chart;
  }

  const reportConfigurations: Record<ResidentCareReportId, {
    panelId: string;
    chartId: string;
    categoryFilterId: string;
    barangayFilterId: string;
    dateRangeLabelId: string;
    customDateRangeId: string;
    titleId: string;
    insightTitleId: string;
    observationsListId: string;
    actionsListId: string;
  }> = {
    frequency: {
      panelId: "residentcareFrequencyPanel",
      chartId: "residentcareFrequencyChart",
      categoryFilterId: "frequencyCategoryFilter",
      barangayFilterId: "frequencyBarangayFilter",
      dateRangeLabelId: "frequencyDateRangeLabel",
      customDateRangeId: "frequencyCustomDateRange",
      titleId: "residentcareFrequencyTitle",
      insightTitleId: "frequencyInsightsTitle",
      observationsListId: "frequencyObservations",
      actionsListId: "frequencyActions",
    },
    distribution: {
      panelId: "residentcareDistributionPanel",
      chartId: "residentcareDistributionChart",
      categoryFilterId: "distributionCategoryFilter",
      barangayFilterId: "distributionBarangayFilter",
      dateRangeLabelId: "distributionDateRangeLabel",
      customDateRangeId: "distributionCustomDateRange",
      titleId: "residentcareDistributionTitle",
      insightTitleId: "distributionInsightsTitle",
      observationsListId: "distributionObservations",
      actionsListId: "distributionActions",
    },
    causes: {
      panelId: "residentcareCausesPanel",
      chartId: "residentcareCausesChart",
      categoryFilterId: "causesCategoryFilter",
      barangayFilterId: "causesBarangayFilter",
      dateRangeLabelId: "causesDateRangeLabel",
      customDateRangeId: "causesCustomDateRange",
      titleId: "residentcareCausesTitle",
      insightTitleId: "causesInsightsTitle",
      observationsListId: "causesObservations",
      actionsListId: "causesActions",
    },
  };
  const reportIds: ResidentCareReportId[] = ["frequency", "distribution", "causes"];
  const reports: ResidentCareReport[] = reportIds.map(id => {
    const config = reportConfigurations[id];
    const panel = getElement<HTMLElement>(config.panelId);
    return {
      id,
      panel,
      chart: getSvg(config.chartId),
      categoryFilter: getElement<HTMLSelectElement>(config.categoryFilterId),
      barangayFilter: getElement<HTMLSelectElement>(config.barangayFilterId),
      dateRangeLabel: getElement<HTMLElement>(config.dateRangeLabelId),
      customDateRange: getElement<HTMLElement>(config.customDateRangeId),
      title: getElement<HTMLHeadingElement>(config.titleId),
      insightTitle: getElement<HTMLHeadingElement>(config.insightTitleId),
      observationsList: getElement<HTMLUListElement>(config.observationsListId),
      actionsList: getElement<HTMLUListElement>(config.actionsListId),
      periodButtons: Array.from(panel.querySelectorAll<HTMLButtonElement>("[data-residentcare-period]")),
    };
  });
  const svgNamespace = "http://www.w3.org/2000/svg";
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
  const distribution = [248, 196, 223, 174, 211, 182, 156, 204, 194, 163, 178, 129, 231, 142, 188];
  const causes = [
    { label: "Fever", value: 142 },
    { label: "Cough and colds", value: 126 },
    { label: "General check-up", value: 104 },
    { label: "Hypertension follow-up", value: 83 },
    { label: "Headache", value: 61 },
    { label: "Minor wounds / injuries", value: 38 },
  ];
  const frequencyViews: Record<ResidentCarePeriod, { labels: string[]; values: number[]; maximum: number }> = {
    daily: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      values: [118, 126, 122, 140, 146, 153, 148],
      maximum: 200,
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      values: [118, 126, 122, 140, 146, 153, 148, 164, 172, 168, 186, 193],
      maximum: 200,
    },
    quarterly: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      values: [122, 146, 161, 182],
      maximum: 200,
    },
    yearly: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      values: [92, 111, 139, 165, 193],
      maximum: 200,
    },
  };
  const periodNames: Record<ResidentCarePeriod, string> = {
    daily: "Daily",
    monthly: "Monthly",
    quarterly: "Quarterly",
    yearly: "Yearly",
  };
  const categoryTitles: Record<ResidentCareCategory, string> = {
    "consultation-frequency": "Patient Consultation Frequency",
    "patient-distribution": "Patient Distribution",
    "consultation-causes": "Causes of Consultation",
  };
  const periodMultipliers: Record<ResidentCarePeriod, number> = {
    daily: 0.1,
    monthly: 1,
    quarterly: 3,
    yearly: 12,
  };
  const distributionMaximums: Record<ResidentCarePeriod, number> = {
    daily: 30,
    monthly: 300,
    quarterly: 900,
    yearly: 3600,
  };
  const causeMaximums: Record<ResidentCarePeriod, number> = {
    daily: 20,
    monthly: 160,
    quarterly: 480,
    yearly: 1920,
  };
  const barangayFactors = [0.84, 0.79, 0.86, 0.74, 0.91, 0.82, 0.77, 0.88, 0.85, 0.75, 0.8, 0.73, 0.9, 0.76, 0.83];

  function svgNode<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attributes: Record<string, string | number>,
  ): SVGElementTagNameMap[K] {
    const node = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    return node;
  }

  function addText(parent: SVGElement, x: number, y: number, value: string, anchor = "middle"): void {
    const text = svgNode("text", { x, y, "text-anchor": anchor });
    text.textContent = value;
    parent.append(text);
  }

  function addTitle(parent: SVGElement, value: string): void {
    const title = svgNode("title", {});
    title.textContent = value;
    parent.append(title);
  }

  function selectedFactor(report: ResidentCareReport): number {
    const index = barangays.indexOf(report.barangayFilter.value);
    return index < 0 ? 1 : barangayFactors[index];
  }

  function replaceChart(
    report: ResidentCareReport,
    svg: SVGSVGElement,
    viewBox: string,
    description: string,
  ): void {
    report.chart.setAttribute("viewBox", viewBox);
    report.chart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    report.chart.setAttribute("aria-label", description);
    report.chart.replaceChildren(...Array.from(svg.childNodes));
  }

  function renderFrequencyChart(report: ResidentCareReport, period: ResidentCarePeriod): void {
    const view = frequencyViews[period];
    const factor = selectedFactor(report);
    const values = view.values.map(value => Math.round(value * factor));
    const plot = { left: 64, right: 690, top: 24, bottom: 238 };
    const x = (index: number) => plot.left + index * (plot.right - plot.left) / Math.max(1, view.labels.length - 1);
    const y = (value: number) => plot.bottom - value / view.maximum * (plot.bottom - plot.top);
    const svg = svgNode("svg", { viewBox: "0 0 720 300" });

    for (let value = 0; value <= view.maximum; value += 50) {
      const position = y(value);
      svg.append(svgNode("line", {
        x1: plot.left,
        x2: plot.right,
        y1: position,
        y2: position,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, plot.left - 10, position + 4, String(value), "end");
    }

    view.labels.forEach((label, index) => addText(svg, x(index), plot.bottom + 22, label));
    const axisLabel = svgNode("text", {
      x: 16,
      y: 145,
      "text-anchor": "middle",
      transform: "rotate(-90 16 145)",
    });
    axisLabel.textContent = "Number of consultations";
    svg.append(axisLabel);
    addText(svg, 378, 286, period === "daily" ? "Day" : period === "monthly" ? "Month" : period === "quarterly" ? "Quarter" : "Year");

    const points = values.map((value, index) => `${x(index)},${y(value)}`);
    const area = [
      `${x(0)},${plot.bottom}`,
      ...points,
      `${x(values.length - 1)},${plot.bottom}`,
    ].join(" ");
    svg.append(svgNode("polygon", {
      points: area,
      fill: "#3768d9",
      opacity: 0.08,
    }));
    svg.append(svgNode("polyline", {
      points: points.join(" "),
      fill: "none",
      stroke: "#17399a",
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }));
    values.forEach((value, index) => {
      const point = svgNode("circle", {
        cx: x(index),
        cy: y(value),
        r: 3.5,
        fill: "#f0ad2f",
        stroke: "#17399a",
        "stroke-width": 1.5,
      });
      addTitle(point, `${view.labels[index]}: ${value} consultations`);
      svg.append(point);
    });
    replaceChart(report, svg, "0 0 720 300", "ResidentCare patient consultation frequency");
  }

  function renderDistributionChart(report: ResidentCareReport, period: ResidentCarePeriod): void {
    const selectedBarangay = report.barangayFilter.value;
    const maximum = distributionMaximums[period];
    const tick = maximum / 6;
    const plot = { left: 222, right: 690, top: 14, rowHeight: 22 };
    const bottom = plot.top + barangays.length * plot.rowHeight;
    const svg = svgNode("svg", { viewBox: "0 0 720 390" });

    for (let value = 0; value <= maximum; value += tick) {
      const position = plot.left + value / maximum * (plot.right - plot.left);
      svg.append(svgNode("line", {
        x1: position,
        x2: position,
        y1: plot.top,
        y2: bottom,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, position, bottom + 17, String(value));
    }

    barangays.forEach((name, index) => {
      const value = Math.round(distribution[index] * periodMultipliers[period]);
      const rowY = plot.top + index * plot.rowHeight;
      const barWidth = value / maximum * (plot.right - plot.left);
      addText(svg, plot.left - 10, rowY + 15, name, "end");
      const bar = svgNode("rect", {
        x: plot.left,
        y: rowY + 2,
        width: barWidth,
        height: 15,
        rx: 2,
        fill: index === 0 ? "#efa51e" : "#3866d8",
        opacity: selectedBarangay === "all" || selectedBarangay === name ? 1 : 0.28,
      });
      addTitle(bar, `${name}: ${value} residents`);
      svg.append(bar);
      addText(svg, plot.left + barWidth + 6, rowY + 15, String(value), "start");
    });
    addText(svg, 450, 378, "Registered residents");
    replaceChart(report, svg, "0 0 720 390", "Registered residents by barangay");
  }

  function renderCausesChart(report: ResidentCareReport, period: ResidentCarePeriod): void {
    const factor = selectedFactor(report) * periodMultipliers[period];
    const plot = { left: 212, right: 690, top: 27, bottom: 243 };
    const maximum = causeMaximums[period];
    const tick = maximum / 8;
    const svg = svgNode("svg", { viewBox: "0 0 720 300" });

    for (let value = 0; value <= maximum; value += tick) {
      const position = plot.left + value / maximum * (plot.right - plot.left);
      svg.append(svgNode("line", {
        x1: position,
        x2: position,
        y1: plot.top,
        y2: plot.bottom,
        stroke: "#e5e9ef",
        "stroke-width": 1,
      }));
      addText(svg, position, plot.bottom + 18, String(value));
    }

    causes.forEach((cause, index) => {
      const value = Math.round(cause.value * factor);
      const rowY = plot.top + index * 36;
      addText(svg, plot.left - 12, rowY + 16, cause.label, "end");
      const bar = svgNode("rect", {
        x: plot.left,
        y: rowY,
        width: value / maximum * (plot.right - plot.left),
        height: 22,
        rx: 1,
        fill: index === 0 ? "#efa51e" : "#3866d8",
      });
      addTitle(bar, `${cause.label}: ${value} consultations`);
      svg.append(bar);
      addText(svg, plot.left + value / maximum * (plot.right - plot.left) + 7, rowY + 16, String(value), "start");
    });
    addText(svg, 450, 286, "Number of consultations");
    replaceChart(report, svg, "0 0 720 300", "Common causes of consultation");
  }

  function insightItems(items: string[], list: HTMLUListElement): void {
    list.replaceChildren(...items.map(item => {
      const listItem = document.createElement("li");
      listItem.textContent = item;
      return listItem;
    }));
  }

  function renderInsights(
    report: ResidentCareReport,
    category: ResidentCareCategory,
    period: ResidentCarePeriod,
  ): void {
    if (category === "patient-distribution") {
      const distributionValues = distribution.map(value => Math.round(value * periodMultipliers[period]));
      const rankedBarangays = barangays
        .map((name, index) => ({ name, value: distributionValues[index] }))
        .sort((first, second) => second.value - first.value);
      const highestBarangay = rankedBarangays[0];
      const lowestBarangay = rankedBarangays[rankedBarangays.length - 1];
      const coverageDifference = Math.round(
        (highestBarangay.value - lowestBarangay.value) / lowestBarangay.value * 100,
      );
      insightItems([
        `${highestBarangay.name} has the highest number of registered residents, with ${highestBarangay.value}.`,
        `${lowestBarangay.name} has the lowest number, with ${lowestBarangay.value}.`,
        `${highestBarangay.name} has approximately ${coverageDifference}% more registered residents than ${lowestBarangay.name}.`,
        `Registration counts are shown for all ${barangays.length} Camaligan barangays.`,
      ], report.observationsList);
      insightItems([
        "Prioritize barangays with lower registration counts.",
        "Review resident records for completeness across all barangays.",
        "Continue monitoring registration coverage over time.",
      ], report.actionsList);
      return;
    }

    if (category === "consultation-causes") {
      const factor = selectedFactor(report) * periodMultipliers[period];
      const filteredCauses = causes.map(cause => ({
        label: cause.label,
        value: Math.round(cause.value * factor),
      }));
      const rankedCauses = [...filteredCauses].sort((first, second) => second.value - first.value);
      const totalConsultations = filteredCauses.reduce((total, cause) => total + cause.value, 0);
      const leadingShare = Math.round(
        (rankedCauses[0].value + rankedCauses[1].value) / totalConsultations * 100,
      );
      insightItems([
        `${rankedCauses[0].label} recorded the highest number of consultations, with ${rankedCauses[0].value} cases.`,
        `${rankedCauses[1].label} followed with ${rankedCauses[1].value} consultations.`,
        `${rankedCauses[0].label} and ${rankedCauses[1].label} account for approximately ${leadingShare}% of recorded consultations.`,
        `${rankedCauses[rankedCauses.length - 1].label} recorded the lowest number, at ${rankedCauses[rankedCauses.length - 1].value}.`,
      ], report.observationsList);
      insightItems([
        "Strengthen community health education on fever and respiratory illness prevention.",
        "Encourage early consultation and proper monitoring for persistent symptoms.",
        "Monitor frequently reported complaints to identify possible increases in community health concerns.",
      ], report.actionsList);
      return;
    }

    const frequencyView = frequencyViews[period];
    const frequencyValues = frequencyView.values.map(value => Math.round(value * selectedFactor(report)));
    const maxIndex = frequencyValues.indexOf(Math.max(...frequencyValues));
    const minValue = Math.min(...frequencyValues);
    const startValue = frequencyValues[0];
    const endValue = frequencyValues[frequencyValues.length - 1];
    insightItems([
      `${periodNames[period]} consultations ranged from ${minValue} to ${frequencyValues[maxIndex]} visits.`,
      `${frequencyView.labels[maxIndex]} recorded the highest ${periodNames[period].toLowerCase()} consultation volume.`,
      `Consultations changed from ${startValue} in ${frequencyView.labels[0]} to ${endValue} in ${frequencyView.labels[frequencyView.labels.length - 1]}.`,
      "This report uses fictional demonstration data for illustration.",
    ], report.observationsList);
    insightItems([
      `Review staffing and personnel availability during ${periodNames[period].toLowerCase()} periods with higher consultation volumes.`,
      "Ensure sufficient medical supplies and commonly used medicines are available.",
      `Monitor ${periodNames[period].toLowerCase()} consultation records to identify recurring increases in demand.`,
    ], report.actionsList);
  }

  function selectedCategory(report: ResidentCareReport): ResidentCareCategory {
    const categoryValue = report.categoryFilter.value;
    return categoryValue === "patient-distribution" || categoryValue === "consultation-causes"
      ? categoryValue
      : "consultation-frequency";
  }

  function selectedPeriod(report: ResidentCareReport): ResidentCarePeriod {
    const periodValue = report.periodButtons.find(button => button.classList.contains("active"))?.dataset.residentcarePeriod;
    return periodValue === "daily" || periodValue === "quarterly" || periodValue === "yearly"
      ? periodValue
      : "monthly";
  }

  function render(report: ResidentCareReport): void {
    const period = selectedPeriod(report);
    const category = selectedCategory(report);
    const dates: Record<ResidentCarePeriod, { short: string; full: string }> = {
      daily: { short: "Jan 25–31, 2026", full: "Jan 25 – Jan 31, 2026" },
      monthly: { short: "Jan 1–31, 2026", full: "Jan 1 – Jan 31, 2026" },
      quarterly: { short: "Jan 1–Mar 31, 2026", full: "Jan 1 – Mar 31, 2026" },
      yearly: { short: "Jan 1–Dec 31, 2026", full: "Jan 1 – Dec 31, 2026" },
    };
    report.dateRangeLabel.textContent = dates[period].short;
    report.customDateRange.textContent = dates[period].full;

    report.title.textContent = `${periodNames[period]} ${categoryTitles[category]}${category === "patient-distribution" ? " by Barangay" : ""}`;
    report.insightTitle.textContent = `AI-Assisted ${categoryTitles[category]} Insights`;

    if (category === "patient-distribution") renderDistributionChart(report, period);
    else if (category === "consultation-causes") renderCausesChart(report, period);
    else renderFrequencyChart(report, period);

    renderInsights(report, category, period);
  }

  reports.forEach(report => {
    report.periodButtons.forEach(button => {
      button.addEventListener("click", () => {
        const selectedPeriod = button.dataset.residentcarePeriod;
        if (
          selectedPeriod !== "daily"
          && selectedPeriod !== "monthly"
          && selectedPeriod !== "quarterly"
          && selectedPeriod !== "yearly"
        ) return;

        report.periodButtons.forEach(periodButton => {
          const isActive = periodButton === button;
          periodButton.classList.toggle("active", isActive);
          periodButton.setAttribute("aria-pressed", String(isActive));
        });
        render(report);
      });
    });
    report.categoryFilter.addEventListener("change", () => render(report));
    report.barangayFilter.addEventListener("change", () => render(report));
    render(report);
  });
});
