import "./form-select";

type ListenerOptions = boolean | AddEventListenerOptions | undefined;

const nativeDocumentAdd = document.addEventListener.bind(document);
const nativeWindowAdd = window.addEventListener.bind(window);
let routeScope = new AbortController();
let registrationScope = routeScope;
let navigationQueue = Promise.resolve();
let moduleLoadId = 0;

function scopedOptions(type: string, options: ListenerOptions): AddEventListenerOptions {
  const normalized = typeof options === "boolean" ? { capture: options } : { ...options };
  if (type === "DOMContentLoaded") normalized.once = true;
  if (!normalized.signal) normalized.signal = registrationScope.signal;
  return normalized;
}

document.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject | null, options?: ListenerOptions) => {
  nativeDocumentAdd(type, listener, scopedOptions(type, options));
}) as typeof document.addEventListener;

window.addEventListener = ((type: string, listener: EventListenerOrEventListenerObject | null, options?: ListenerOptions) => {
  nativeWindowAdd(type, listener, scopedOptions(type, options));
}) as typeof window.addEventListener;

function isPortalRoute(url: URL): boolean {
  return url.origin === window.location.origin
    && /^\/html\/(?:clinical|personnel)(?:\/|$)/i.test(url.pathname);
}

function isModifiedClick(event: MouseEvent): boolean {
  return event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
}

function isPageStylesheet(url: URL): boolean {
  if (url.origin !== window.location.origin) return false;
  const path = url.pathname.toLowerCase();
  if (path.startsWith("/css/")) return !path.endsWith("/logout.css");
  return path.startsWith("/assets/")
    && path.endsWith(".css")
    && !/\/logout-[^/]+\.css$/.test(path);
}

function pageStyles(page: Document, pageUrl: URL): Map<string, HTMLLinkElement> {
  const styles = new Map<string, HTMLLinkElement>();
  page.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]').forEach((link) => {
    const url = new URL(link.getAttribute("href") ?? "", pageUrl);
    if (link.hasAttribute("data-mhims-page-style") || isPageStylesheet(url)) {
      styles.set(url.href, link);
    }
  });
  return styles;
}

async function updatePageStyles(page: Document, pageUrl: URL): Promise<void> {
  const requestedStyles = pageStyles(page, pageUrl);
  const existingStyles = new Map<string, HTMLLinkElement>();
  document.head.querySelectorAll<HTMLLinkElement>('link[data-mhims-page-style][rel="stylesheet"][href]').forEach((link) => {
    existingStyles.set(link.href, link);
  });
  const sharedStylesheet = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]'))
    .find((link) => {
      const url = new URL(link.href, window.location.href);
      return url.origin === window.location.origin
        && !isPageStylesheet(url);
    });

  const addedStyles: HTMLLinkElement[] = [];
  const loadPromises: Promise<void>[] = [];

  requestedStyles.forEach((source, href) => {
    if (existingStyles.has(href)) return;

    const link = document.importNode(source, false);
    link.href = href;
    link.dataset.mhimsPageStyle = "";
    addedStyles.push(link);
    loadPromises.push(new Promise<void>((resolve, reject) => {
      link.addEventListener("load", () => resolve(), { once: true });
      link.addEventListener("error", () => reject(new Error(`Unable to load stylesheet: ${href}`)), { once: true });
    }));
    document.head.insertBefore(link, sharedStylesheet ?? null);
  });

  try {
    await Promise.all(loadPromises);
  } catch (error) {
    addedStyles.forEach((link) => link.remove());
    throw error;
  }

  existingStyles.forEach((link, href) => {
    if (!requestedStyles.has(href)) link.remove();
  });
}

function pageModules(page: Document, pageUrl: URL): string[] {
  return Array.from(page.querySelectorAll<HTMLScriptElement>('script[type="module"][src]'))
    .filter((script) => !script.hasAttribute("data-mhims-router") && !script.hasAttribute("data-mhims-global"))
    .map((script) => new URL(script.getAttribute("src") ?? "", pageUrl))
    .filter((url) => url.origin === window.location.origin)
    .filter((url) => url.pathname !== "/@vite/client")
    .filter((url) => !/\/(?:logout|sidebar-navigation)(?:-[^/]+)?\.(?:ts|js)$/i.test(url.pathname))
    .map((url) => url.href);
}

async function initializePageModules(sources: string[]): Promise<Error[]> {
  const failures: Error[] = [];
  for (const source of sources) {
    const moduleUrl = new URL(source);
    moduleUrl.searchParams.set("mhims-navigation", String(++moduleLoadId));
    try {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "module";
        script.src = moduleUrl.href;
        script.addEventListener("load", () => {
          script.remove();
          resolve();
        }, { once: true });
        script.addEventListener("error", () => {
          script.remove();
          reject(new Error(`Unable to initialize page module: ${moduleUrl.pathname}`));
        }, { once: true });
        document.head.append(script);
      });
    } catch (error) {
      failures.push(error instanceof Error ? error : new Error(String(error)));
    }
  }
  document.dispatchEvent(new Event("DOMContentLoaded"));
  return failures;
}

function sidebarLinkUrl(anchor: HTMLAnchorElement, baseUrl: URL): string {
  return new URL(anchor.getAttribute("href") ?? "", baseUrl).href;
}

function synchronizeSidebar(targetShell: Element, targetUrl: URL): void {
  const currentNav = document.querySelector<HTMLElement>(".sidebar-nav");
  const targetNav = targetShell.querySelector<HTMLElement>(".sidebar-nav");
  if (!currentNav || !targetNav) return;

  const activeLinks = new Set(
    Array.from(targetNav.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .filter((anchor) => anchor.classList.contains("active") || anchor.getAttribute("aria-current") === "page")
      .map((anchor) => sidebarLinkUrl(anchor, targetUrl))
  );
  const isPersonnelStatisticsPage = targetUrl.pathname === "/html/personnel/statistics/dashboard.html";
  const isClinicalStatisticsView = targetUrl.pathname.startsWith("/html/clinical/statistics/dashboard.html")
    && targetUrl.searchParams.has("view");

  currentNav.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((anchor) => {
    const isStatisticsModuleLink = Boolean(
      anchor.closest('.nav-dropdown[data-statistics-dropdown]')
      && anchor.hasAttribute("data-statistics-module")
    );
    const active = isPersonnelStatisticsPage
      ? anchor.querySelector("span")?.textContent?.trim() === "Statistics"
      : isClinicalStatisticsView
      ? isStatisticsModuleLink && anchor.href === targetUrl.href
      : !isStatisticsModuleLink && activeLinks.has(anchor.href);
    anchor.classList.toggle("active", active);
    if (active) anchor.setAttribute("aria-current", "page");
    else anchor.removeAttribute("aria-current");
  });

  currentNav.querySelectorAll<HTMLElement>(".nav-dropdown").forEach((dropdown) => {
    const active = Boolean(dropdown.querySelector(".submenu-item.active"));
    dropdown.classList.toggle("open", active);
    dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", String(active));
  });
}

function replacePageMarkup(page: Document, targetUrl: URL): void {
  const nextShell = page.querySelector<HTMLElement>(".dashboard-layout");
  const currentShell = document.querySelector<HTMLElement>(".dashboard-layout");
  const nextMain = nextShell?.querySelector<HTMLElement>("main.main-content");
  const currentMain = currentShell?.querySelector<HTMLElement>("main.main-content");
  if (!nextShell || !nextMain || !currentShell || !currentMain) {
    throw new Error("The requested page does not contain the MHIMS portal layout.");
  }

  synchronizeSidebar(nextShell, targetUrl);
  currentMain.replaceWith(document.importNode(nextMain, true));

  const persistentNodes = Array.from(document.body.children)
    .filter((element) => element.classList.contains("logout-dialog"));
  const routeNodes = Array.from(page.body.children)
    .filter((element) => !element.classList.contains("dashboard-layout"))
    .map((element) => document.importNode(element, true));

  document.body.replaceChildren(
    currentShell,
    ...routeNodes,
    ...persistentNodes
  );
}

function updateDocumentMetadata(page: Document): void {
  document.title = page.title;
  const nextDescription = page.querySelector<HTMLMetaElement>('meta[name="description"]');
  const currentDescription = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (nextDescription && currentDescription) {
    currentDescription.content = nextDescription.content;
  }
}

function reportNavigationError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error("Sidebar navigation failed:", error);
  window.alert(`Unable to open this page without reloading. ${message}`);
}

async function navigateTo(url: URL, addHistoryEntry: boolean): Promise<void> {
  if (!isPortalRoute(url)) return;

  const response = await fetch(url.href, { headers: { "X-MHIMS-Navigation": "true" } });
  if (!response.ok) {
    throw new Error(`The server returned ${response.status} for ${url.pathname}.`);
  }

  const page = new DOMParser().parseFromString(await response.text(), "text/html");
  const nextShell = page.querySelector(".dashboard-layout");
  if (!nextShell || !nextShell.querySelector("main.main-content")) {
    throw new Error("The requested page did not return a valid MHIMS portal page.");
  }

  await updatePageStyles(page, url);
  const previousScope = routeScope;
  routeScope = new AbortController();
  registrationScope = routeScope;

  if (addHistoryEntry) {
    window.history.pushState({ mhimsClientNavigation: true }, "", url.href);
  }
  previousScope.abort();
  updateDocumentMetadata(page);
  replacePageMarkup(page, url);
  window.scrollTo(0, 0);

  const failures = await initializePageModules(pageModules(page, url));
  if (failures.length > 0) {
    const details = failures.map((error) => error.message).join("\n");
    reportNavigationError(new Error(`Some page features could not initialize:\n${details}`));
  }
}

function queueNavigation(url: URL, addHistoryEntry: boolean): void {
  navigationQueue = navigationQueue
    .then(() => navigateTo(url, addHistoryEntry))
    .catch(reportNavigationError);
}

function handleSidebarClick(event: MouseEvent): void {
  if (event.defaultPrevented || isModifiedClick(event) || !(event.target instanceof Element)) return;

  const anchor = event.target.closest<HTMLAnchorElement>(".sidebar a[href]");
  if (!anchor || anchor.hasAttribute("download") || (anchor.target && anchor.target !== "_self")) return;

  const url = new URL(anchor.href, window.location.href);
  if (!isPortalRoute(url)) return;
  if (url.pathname === window.location.pathname && url.search === window.location.search) return;

  event.preventDefault();
  queueNavigation(url, true);
}

function handleSidebarControls(event: MouseEvent): void {
  if (!(event.target instanceof Element)) return;

  const toggle = event.target.closest<HTMLButtonElement>(".sidebar .nav-dropdown-toggle");
  if (toggle) {
    event.preventDefault();
    event.stopPropagation();
    const currentDropdown = toggle.closest(".nav-dropdown");
    if (!currentDropdown) return;

    const shouldOpen = !currentDropdown.classList.contains("open");
    document.querySelectorAll<HTMLElement>(".sidebar .nav-dropdown").forEach((dropdown) => {
      const open = dropdown === currentDropdown && shouldOpen;
      dropdown.classList.toggle("open", open);
      dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", String(open));
    });
    return;
  }

  if (event.target.closest("#notifBtn")) {
    window.alert("You have new health-care reminders and notifications.");
  }
}

function addStatisticsDropdown(): void {
  const nav = document.querySelector<HTMLElement>(".sidebar-nav");
  const portal = window.location.pathname.match(/^\/html\/(clinical|personnel)(?:\/|$)/i)?.[1]?.toLowerCase();
  const statisticsLink = Array.from(nav?.querySelectorAll<HTMLAnchorElement>("a.nav-item-btn") ?? [])
    .find((anchor) => anchor.querySelector("span")?.textContent?.trim() === "Statistics");
  if (!nav || !portal) return;
  if (portal === "personnel") {
    if (statisticsLink) return;

    const link = document.createElement("a");
    link.className = "nav-item-btn";
    link.href = `/html/${portal}/statistics/dashboard.html`;
    const icon = document.createElement("iconify-icon");
    icon.setAttribute("icon", "mdi:google-analytics");
    icon.setAttribute("width", "22");
    icon.setAttribute("height", "22");
    const label = document.createElement("span");
    label.textContent = "Statistics";
    link.append(icon, label);
    if (window.location.pathname === `/html/${portal}/statistics/dashboard.html`) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
    nav.append(link);
    return;
  }
  if (!statisticsLink) return;

  const dashboardHref = statisticsLink.getAttribute("href") ?? "";
  const statisticsView = new URLSearchParams(window.location.search).get("view");
  const isStatisticsModuleView = statisticsView === "residentcare"
    || statisticsView === "maternatrack"
    || statisticsView === "nutritrack"
    || statisticsView === "tbcare";
  const dashboardIsActive = !isStatisticsModuleView && (
    statisticsLink.classList.contains("active")
    || statisticsLink.getAttribute("aria-current") === "page"
  );
  const dropdownIsActive = dashboardIsActive || isStatisticsModuleView;
  const dropdown = document.createElement("div");
  dropdown.className = dropdownIsActive ? "nav-dropdown open" : "nav-dropdown";
  dropdown.dataset.statisticsDropdown = "";

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "nav-dropdown-toggle";
  toggle.setAttribute("aria-expanded", String(dropdownIsActive));
  toggle.setAttribute("aria-controls", "statisticsSubmenu");
  toggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const shouldOpen = !dropdown.classList.contains("open");
    document.querySelectorAll<HTMLElement>(".sidebar .nav-dropdown").forEach((item) => {
      const open = item === dropdown && shouldOpen;
      item.classList.toggle("open", open);
      item.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", String(open));
    });
  });

  const content = document.createElement("span");
  content.className = "nav-btn-content";
  const statisticsIcon = document.createElement("iconify-icon");
  statisticsIcon.setAttribute("icon", "mdi:google-analytics");
  statisticsIcon.setAttribute("width", "22");
  statisticsIcon.setAttribute("height", "22");
  const statisticsLabel = document.createElement("span");
  statisticsLabel.textContent = "Statistics";
  content.append(statisticsIcon, statisticsLabel);

  const chevron = document.createElement("iconify-icon");
  chevron.setAttribute("icon", "mingcute:down-line");
  chevron.className = "nav-chevron";
  chevron.setAttribute("width", "18");
  chevron.setAttribute("height", "18");
  toggle.append(content, chevron);

  const submenu = document.createElement("div");
  submenu.className = "nav-submenu";
  submenu.id = "statisticsSubmenu";

  const menuItems = [
    { label: "Dashboard", href: dashboardHref, icon: "ant-design:home-filled", dashboard: true },
    { label: "ResidentCare", href: `/html/${portal}/statistics/dashboard.html?view=residentcare`, icon: "bi:people-fill" },
    { label: "MaternaTrack", href: `/html/${portal}/statistics/dashboard.html?view=maternatrack`, icon: "fa6-solid:person-breastfeeding" },
    { label: "NutriTrack", href: `/html/${portal}/statistics/dashboard.html?view=nutritrack`, icon: "fa:child" },
    { label: "TBCare", href: `/html/${portal}/statistics/dashboard.html?view=tbcare`, icon: "healthicons:lungs" },
  ];

  menuItems.forEach((item) => {
    const anchor = document.createElement("a");
    anchor.className = "submenu-item";
    anchor.href = item.href;
    if (!item.dashboard) anchor.dataset.statisticsModule = "";
    const itemUrl = new URL(item.href, window.location.origin);
    const isActiveModule = !item.dashboard
      && itemUrl.pathname === window.location.pathname
      && itemUrl.search === window.location.search;
    if (
      (item.dashboard && dashboardIsActive)
      || isActiveModule
    ) {
      anchor.classList.add("active");
      anchor.setAttribute("aria-current", "page");
    }

    const icon = document.createElement("iconify-icon");
    icon.setAttribute("icon", item.icon);
    icon.setAttribute("width", "18");
    icon.setAttribute("height", "18");
    const label = document.createElement("span");
    label.textContent = item.label;
    anchor.append(icon, label);
    submenu.append(anchor);
  });

  dropdown.append(toggle, submenu);
  statisticsLink.replaceWith(dropdown);
}

addStatisticsDropdown();

document.querySelectorAll<HTMLAnchorElement>(".sidebar a[href]").forEach((anchor) => {
  anchor.href = new URL(anchor.getAttribute("href") ?? "", window.location.href).href;
});
document.querySelectorAll<HTMLElement>(".sidebar .nav-dropdown").forEach((dropdown) => {
  const active = Boolean(dropdown.querySelector(".submenu-item.active"));
  dropdown.classList.toggle("open", active);
  dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", String(active));
});

nativeDocumentAdd("click", handleSidebarControls);
nativeDocumentAdd("click", handleSidebarClick);
nativeWindowAdd("popstate", () => queueNavigation(new URL(window.location.href), false));

document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]').forEach((link) => {
  const url = new URL(link.href, window.location.href);
  if (isPageStylesheet(url)) link.dataset.mhimsPageStyle = "";
});
