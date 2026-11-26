export type ResidentCareQueueModule = "ResidentCare" | "Nutri" | "Materna" | "TBCare";

export interface ResidentCareQueuePatientDetail {
  module: ResidentCareQueueModule;
  category: string;
  id: string;
  name: string;
  age: number;
  gender: string;
  address: string;
  consultation: string;
  treatmentForm?: string;
  status: string;
  queueNo: number;
  returnUrl: string;
}

export function activateQueueNavigation(module: ResidentCareQueueModule): void {
  const moduleName = {
    ResidentCare: "ResidentCare",
    Nutri: "NutriTrack",
    Materna: "MaternaTrack",
    TBCare: "TBCare"
  }[module];
  const dropdown = Array.from(document.querySelectorAll<HTMLElement>(".sidebar .nav-dropdown"))
    .find((item) =>
      item.querySelector(".nav-dropdown-toggle .nav-btn-content span")?.textContent?.trim() === moduleName
    );
  if (!dropdown) {
    throw new Error(`The ${moduleName} navigation is unavailable.`);
  }

  const queueLink = Array.from(dropdown.querySelectorAll<HTMLAnchorElement>(".nav-submenu .submenu-item"))
    .find((link) => link.textContent?.trim() === "Queuing");
  if (!queueLink) {
    throw new Error(`The ${moduleName} queuing navigation link is unavailable.`);
  }

  dropdown.querySelectorAll<HTMLAnchorElement>(".nav-submenu .submenu-item").forEach((link) => {
    const active = link === queueLink;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  dropdown.classList.add("open");
  dropdown.querySelector<HTMLButtonElement>(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "true");
}

export function createQueuePatientReturnUrl(queueNo: number): string {
  const returnUrl = new URL(window.location.href);
  returnUrl.searchParams.set("selectedQueueNo", String(queueNo));
  return returnUrl.toString();
}

export function restoreQueuePatientSelection<T extends { queueNo: number }>(patients: T[]): T | null {
  const returnParams = new URLSearchParams(window.location.search);
  const returnedQueueNo = Number(returnParams.get("selectedQueueNo"));
  const selectedPatient = patients.find(patient => patient.queueNo === returnedQueueNo) ?? patients[0] ?? null;

  if (returnParams.has("selectedQueueNo")) {
    returnParams.delete("selectedQueueNo");
    const cleanSearch = returnParams.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${window.location.hash}`,
    );
  }

  return selectedPatient;
}

const storageKey = "mhims:residentcare-queue-patient";

export function saveResidentCareQueuePatientDetail(detail: ResidentCareQueuePatientDetail): void {
  sessionStorage.setItem(storageKey, JSON.stringify(detail));
}

export function consumeResidentCareQueuePatientDetail(
  expectedModule: ResidentCareQueueModule,
): ResidentCareQueuePatientDetail | null {
  const serializedDetail = sessionStorage.getItem(storageKey);
  if (!serializedDetail) return null;

  sessionStorage.removeItem(storageKey);
  const detail: unknown = JSON.parse(serializedDetail);
  if (!isQueuePatientDetail(detail)) {
    throw new Error("The queued patient details are invalid.");
  }
  if (detail.module !== expectedModule) {
    throw new Error(`Expected ${expectedModule} queue details but received ${detail.module}.`);
  }
  if (!detail.returnUrl.startsWith(window.location.origin)) {
    throw new Error("The queued patient return address is invalid.");
  }

  return detail;
}

function isQueuePatientDetail(value: unknown): value is ResidentCareQueuePatientDetail {
  if (typeof value !== "object" || value === null) return false;
  const detail = value as Record<string, unknown>;

  return (detail.module === "ResidentCare" || detail.module === "Nutri" ||
    detail.module === "Materna" || detail.module === "TBCare") &&
    typeof detail.category === "string" &&
    typeof detail.id === "string" &&
    typeof detail.name === "string" &&
    typeof detail.age === "number" &&
    Number.isFinite(detail.age) &&
    typeof detail.gender === "string" &&
    typeof detail.address === "string" &&
    typeof detail.consultation === "string" &&
    (detail.treatmentForm === undefined || typeof detail.treatmentForm === "string") &&
    typeof detail.status === "string" &&
    typeof detail.queueNo === "number" &&
    Number.isFinite(detail.queueNo) &&
    typeof detail.returnUrl === "string";
}
