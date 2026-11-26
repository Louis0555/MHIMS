type StatisticsPeriod = "daily" | "monthly" | "quarterly" | "yearly";
type TrendModule = "residentcare" | "maternatrack" | "tbcare" | "nutritrack";

interface TrendView {
  labels: string[];
  maximum: number;
  series: Record<TrendModule, number[]>;
}

document.addEventListener("DOMContentLoaded", () => {
  function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required municipal statistics element #${id} was not found.`);
    return element as T;
  }

  function getSvg(id: string): SVGSVGElement {
    const element = document.getElementById(id);
    if (!(element instanceof SVGSVGElement)) throw new Error(`Required municipal statistics chart #${id} was not found.`);
    return element;
  }

  const trendChart = getSvg("trendChart");
  const barangayChart = getSvg("barangayChart");
  const demographicsChart = getSvg("demographicsChart");
  const periodButtons = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-period]"));
  const moduleFilter = getElement<HTMLSelectElement>("moduleFilter");
  const barangayFilter = getElement<HTMLSelectElement>("barangayFilter");
  const trendTitle = getElement<HTMLHeadingElement>("trendTitle");
  const dateRangeLabel = getElement<HTMLElement>("dateRangeLabel");
  const customDateRange = getElement<HTMLElement>("customDateRange");

  const svgNamespace = "http://www.w3.org/2000/svg";
  const seriesColors: Record<TrendModule, string> = {
    residentcare: "#15389e",
    maternatrack: "#4774e8",
    tbcare: "#efa51e",
    nutritrack: "#29a567"
  };
  const seriesLabels: Record<TrendModule, string> = {
    residentcare: "ResidentCare",
    maternatrack: "MaternaTrack",
    tbcare: "TBCare",
    nutritrack: "NutriTrack"
  };
  const trendModules: TrendModule[] = ["residentcare", "maternatrack", "tbcare"];
  const isTrendModule = (value: string): value is TrendModule =>
    value === "residentcare" || value === "maternatrack" || value === "tbcare" || value === "nutritrack";
  const trendViews: Record<StatisticsPeriod, TrendView> = {
    daily: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      maximum: 180,
      series: {
        residentcare: [82, 91, 88, 104, 112, 119, 126],
        maternatrack: [28, 31, 29, 34, 37, 39, 42],
        tbcare: [16, 18, 17, 19, 21, 20, 23],
        nutritrack: [22, 24, 23, 27, 29, 31, 34]
      }
    },
    monthly: {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      maximum: 180,
      series: {
        residentcare: [82, 91, 88, 104, 112, 119, 126, 121, 137, 145, 151, 160],
        maternatrack: [28, 31, 29, 34, 37, 39, 42, 40, 44, 47, 49, 53],
        tbcare: [16, 18, 17, 19, 21, 20, 23, 22, 24, 25, 27, 29],
        nutritrack: [22, 24, 23, 27, 29, 31, 34, 32, 36, 39, 41, 43]
      }
    },
    quarterly: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      maximum: 180,
      series: {
        residentcare: [87, 112, 128, 152],
        maternatrack: [29, 37, 42, 50],
        tbcare: [17, 20, 23, 27],
        nutritrack: [23, 29, 34, 41]
      }
    },
    yearly: {
      labels: ["2022", "2023", "2024", "2025", "2026"],
      maximum: 180,
      series: {
        residentcare: [88, 101, 119, 138, 160],
        maternatrack: [30, 34, 39, 45, 53],
        tbcare: [17, 19, 22, 25, 29],
        nutritrack: [23, 27, 32, 38, 43]
      }
    }
  };

  function svgNode<K extends keyof SVGElementTagNameMap>(
    tag: K,
    attributes: Record<string, string | number> = {}
  ): SVGElementTagNameMap[K] {
    const node = document.createElementNS(svgNamespace, tag);
    Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, String(value)));
    return node;
  }

  function addText(parent: SVGElement, x: number, y: number, value: string, anchor = "middle"): void {
    const label = svgNode("text", { x, y, "text-anchor": anchor });
    label.textContent = value;
    parent.appendChild(label);
  }

  function addSvgTitle(parent: SVGElement, value: string): void {
    const title = svgNode("title");
    title.textContent = value;
    parent.appendChild(title);
  }

  function renderTrendChart(period: StatisticsPeriod): void {
    const view = trendViews[period];
    const selectedModule = moduleFilter.value;
    const modules: TrendModule[] = selectedModule === "all"
      ? trendModules
      : isTrendModule(selectedModule)
        ? [selectedModule]
        : trendModules;
    const plot = { left: 48, right: 704, top: 16, bottom: 220 };
    const xPosition = (index: number) => plot.left + index * (plot.right - plot.left) / Math.max(1, view.labels.length - 1);
    const yPosition = (value: number) => plot.bottom - value / view.maximum * (plot.bottom - plot.top);
    const svg = svgNode("svg", {
      viewBox: "0 0 720 260",
      role: "img",
      "aria-label": `${period} health service visits by module`
    });

    for (let tick = 0; tick <= 6; tick += 1) {
      const value = view.maximum * tick / 6;
      const y = yPosition(value);
      svg.appendChild(svgNode("line", { x1: plot.left, x2: plot.right, y1: y, y2: y, stroke: "#e5e9ef", "stroke-width": 1 }));
      addText(svg, plot.left - 10, y + 3, String(Math.round(value)), "end");
    }

    view.labels.forEach((label, index) => addText(svg, xPosition(index), plot.bottom + 18, label));
    const axisLabel = svgNode("text", { x: 12, y: 118, "text-anchor": "middle", transform: "rotate(-90 12 118)" });
    axisLabel.textContent = "Sample service visits";
    svg.appendChild(axisLabel);

    modules.forEach(module => {
      const points = view.series[module].map((value, index) => `${xPosition(index)},${yPosition(value)}`).join(" ");
      svg.appendChild(svgNode("polyline", {
        points,
        fill: "none",
        stroke: seriesColors[module],
        "stroke-width": 2.5,
        "stroke-linecap": "round",
        "stroke-linejoin": "round"
      }));
      view.series[module].forEach((value, index) => {
        const point = svgNode("circle", {
          cx: xPosition(index),
          cy: yPosition(value),
          r: 3,
          fill: seriesColors[module]
        });
        addSvgTitle(point, `${seriesLabels[module]}: ${value}`);
        svg.appendChild(point);
      });
    });

    trendChart.setAttribute("viewBox", "0 0 720 260");
    trendChart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    trendChart.setAttribute("aria-label", `${period} health service visits by module`);
    trendChart.replaceChildren(...Array.from(svg.childNodes));
    const legend = document.querySelector(".trend-legend");
    if (legend) {
      legend.querySelectorAll<HTMLElement>("[data-legend]").forEach(item => {
        item.hidden = selectedModule !== "all" && item.dataset.legend !== selectedModule;
      });
    }
    const description = trendTitle.nextElementSibling;
    if (description instanceof HTMLElement) {
      description.textContent = selectedModule === "all"
        ? "ResidentCare · MaternaTrack · TBCare"
        : selectedModule === "nutritrack"
          ? "NutriTrack · illustrative service visits"
          : isTrendModule(selectedModule)
            ? seriesLabels[selectedModule]
            : "ResidentCare · MaternaTrack · TBCare";
    }
  }

  function renderBarangayChart(): void {
    const names = ["Demo A", "Demo B", "Demo C", "Demo D", "Demo E"];
    const values = [248, 196, 223, 174, 211];
    const selected = barangayFilter.value;
    const plot = { left: 52, right: 486, top: 20, bottom: 218 };
    const svg = svgNode("svg", { viewBox: "0 0 500 270", role: "img", "aria-label": "Unique registered residents per barangay" });

    for (let value = 0; value <= 300; value += 50) {
      const y = plot.bottom - value / 300 * (plot.bottom - plot.top);
      svg.appendChild(svgNode("line", { x1: plot.left, x2: plot.right, y1: y, y2: y, stroke: "#e5e9ef", "stroke-width": 1 }));
      addText(svg, plot.left - 4, y + 3, String(value), "end");
    }
    const axisLabel = svgNode("text", { x: 10, y: 120, "text-anchor": "middle", transform: "rotate(-90 10 120)" });
    axisLabel.textContent = "Unique registered residents";
    svg.appendChild(axisLabel);

    names.forEach((name, index) => {
      const x = 70 + index * 82;
      const height = values[index] / 300 * (plot.bottom - plot.top);
      const bar = svgNode("rect", {
        x,
        y: plot.bottom - height,
        width: 47,
        height,
        rx: 1,
        fill: index % 2 === 0 ? "#17399a" : "#3866d8",
        opacity: selected === "all" || selected === name ? 1 : .25
      });
      addSvgTitle(bar, `${name}: ${values[index]} residents`);
      svg.appendChild(bar);
      addText(svg, x + 23.5, plot.bottom - height - 7, String(values[index]));
      addText(svg, x + 23.5, plot.bottom + 17, name);
    });
    addText(svg, 265, 256, "Demonstration barangay");

    barangayChart.setAttribute("viewBox", "0 0 500 270");
    barangayChart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    barangayChart.replaceChildren(...Array.from(svg.childNodes));
  }

  function renderDemographicsChart(): void {
    const groups = ["0–12", "13–17", "18–29", "30–59", "60+"];
    const maleValues = [96, 58, 112, 184, 71];
    const femaleValues = [89, 54, 128, 201, 83];
    const plot = { left: 50, right: 488, top: 20, bottom: 218 };
    const svg = svgNode("svg", { viewBox: "0 0 500 270", role: "img", "aria-label": "Fictional male and female residents by age group" });

    for (let value = 0; value <= 250; value += 50) {
      const y = plot.bottom - value / 250 * (plot.bottom - plot.top);
      svg.appendChild(svgNode("line", { x1: plot.left, x2: plot.right, y1: y, y2: y, stroke: "#e5e9ef", "stroke-width": 1 }));
      addText(svg, plot.left - 4, y + 3, String(value), "end");
    }
    const axisLabel = svgNode("text", { x: 10, y: 120, "text-anchor": "middle", transform: "rotate(-90 10 120)" });
    axisLabel.textContent = "Sample registered residents";
    svg.appendChild(axisLabel);

    groups.forEach((group, index) => {
      const center = 85 + index * 82;
      const maleHeight = maleValues[index] / 250 * (plot.bottom - plot.top);
      const femaleHeight = femaleValues[index] / 250 * (plot.bottom - plot.top);
      const male = svgNode("rect", { x: center - 25, y: plot.bottom - maleHeight, width: 23, height: maleHeight, fill: "#3768d9" });
      const female = svgNode("rect", { x: center + 2, y: plot.bottom - femaleHeight, width: 23, height: femaleHeight, fill: "#f18ca1" });
      addSvgTitle(male, `${group} male: ${maleValues[index]}`);
      addSvgTitle(female, `${group} female: ${femaleValues[index]}`);
      svg.append(male, female);
      addText(svg, center - 13.5, plot.bottom - maleHeight - 6, String(maleValues[index]));
      addText(svg, center + 13.5, plot.bottom - femaleHeight - 6, String(femaleValues[index]));
      addText(svg, center, plot.bottom + 17, group);
    });
    addText(svg, 265, 256, "Age group (years)");

    demographicsChart.setAttribute("viewBox", "0 0 500 270");
    demographicsChart.setAttribute("preserveAspectRatio", "xMidYMid meet");
    demographicsChart.replaceChildren(...Array.from(svg.childNodes));
  }

  function selectPeriod(period: StatisticsPeriod): void {
    const dateRanges: Record<StatisticsPeriod, { short: string; custom: string }> = {
      daily: { short: "Jan 25–31, 2026", custom: "Jan 25 – Jan 31, 2026" },
      monthly: { short: "Jan 1–31, 2026", custom: "Jan 1 – Jan 31, 2026" },
      quarterly: { short: "Jan 1–Mar 31, 2026", custom: "Jan 1 – Mar 31, 2026" },
      yearly: { short: "Jan 1–Dec 31, 2026", custom: "Jan 1 – Dec 31, 2026" }
    };
    periodButtons.forEach(button => {
      const isActive = button.dataset.period === period;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    trendTitle.textContent = `${period.charAt(0).toUpperCase()}${period.slice(1)} Health Service Trends`;
    dateRangeLabel.textContent = dateRanges[period].short;
    customDateRange.textContent = dateRanges[period].custom;
    renderTrendChart(period);
  }

  periodButtons.forEach(button => {
    button.addEventListener("click", () => {
      const period = button.dataset.period;
      if (period === "daily" || period === "monthly" || period === "quarterly" || period === "yearly") {
        selectPeriod(period);
      }
    });
  });
  moduleFilter.addEventListener("change", () => {
    const activePeriod = document.querySelector<HTMLButtonElement>("[data-period].active")?.dataset.period;
    if (activePeriod === "daily" || activePeriod === "quarterly" || activePeriod === "yearly") {
      renderTrendChart(activePeriod);
    } else {
      renderTrendChart("monthly");
    }
  });
  barangayFilter.addEventListener("change", renderBarangayChart);

  renderTrendChart("monthly");
  renderBarangayChart();
  renderDemographicsChart();
});
