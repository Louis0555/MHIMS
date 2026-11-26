import { showRecordNotice } from "./record-save-notice";

type TBCareEventType =
  | "consultation"
  | "drug-refill"
  | "lab-exam"
  | "contact-tracing"
  | "fhsis-report"
  | "tb-event"
  | "regional-seminar";

type TBCareEventStatus = "On-going" | "Scheduled" | "Completed";

interface TBCareCalendarEvent {
  id: string;
  date: string;
  type: TBCareEventType;
  title: string;
  detailType?: string;
  detailTitle?: string;
  editTitle?: string;
  patient?: string;
  time?: string;
  notes?: string;
  status?: TBCareEventStatus;
}

export function initializeTBCareCalendar(): void {
  function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required TBCare calendar element #${id} was not found.`);
    return element as T;
  }

  const calendarGrid = getElement<HTMLDivElement>("calendarGrid");
  if (calendarGrid.dataset.tbcCalendarInitialized === "true") return;

  const monthLabel = getElement<HTMLSpanElement>("monthLabel");
  const searchInput = getElement<HTMLInputElement>("calendarSearch");
  const eventModal = getElement<HTMLDivElement>("eventModal");
  const eventForm = getElement<HTMLFormElement>("eventForm");
  const eventCategory = getElement<HTMLSelectElement>("eventCategory");
  const eventTitle = getElement<HTMLInputElement>("eventTitle");
  const eventDate = getElement<HTMLInputElement>("eventDate");
  const eventTime = getElement<HTMLSelectElement>("eventTime");
  const eventNotes = getElement<HTMLTextAreaElement>("eventNotes");
  const eventModalTitle = getElement<HTMLHeadingElement>("eventModalTitle");
  const eventModalDescription = getElement<HTMLParagraphElement>("eventModalDescription");
  const eventSubmitButton = getElement<HTMLButtonElement>("eventSubmitBtn");
  const emptyDayModal = getElement<HTMLDivElement>("emptyDayModal");
  const emptyDayNumber = getElement<HTMLElement>("emptyDayNumber");
  const emptyDayLabel = getElement<HTMLElement>("emptyDayLabel");
  const eventDayModal = getElement<HTMLDivElement>("eventDayModal");
  const eventDayList = getElement<HTMLDivElement>("eventDayList");
  const eventDayNumber = getElement<HTMLElement>("eventDayNumber");
  const eventDayLabel = getElement<HTMLElement>("eventDayLabel");

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const eventTypeLabels: Record<TBCareEventType, string> = {
    consultation: "Consultation",
    "drug-refill": "Drug Refill",
    "lab-exam": "Lab Exam",
    "contact-tracing": "Contact Tracing",
    "fhsis-report": "FHSIS Report",
    "tb-event": "TB Event",
    "regional-seminar": "Regional Seminar"
  };
  const eventIcons: Record<TBCareEventType, string> = {
    consultation: "mdi:account-heart",
    "drug-refill": "mdi:pill",
    "lab-exam": "mdi:flask",
    "contact-tracing": "mdi:account-search",
    "fhsis-report": "mdi:file-document",
    "tb-event": "healthicons:lungs",
    "regional-seminar": "healthicons:lungs"
  };
  const eventTypes = new Set<string>(Object.keys(eventTypeLabels));

  let viewDate = new Date(2026, 9, 1);
  let selectedDateKey: string | null = null;
  let editingEventId: string | null = null;
  let eventSequence = 0;
  let events: TBCareCalendarEvent[] = [
    {
      id: "tb-1",
      date: "2026-10-02",
      type: "regional-seminar",
      title: "Regional Seminar",
      detailType: "Laboratory Examination",
      detailTitle: "Sputum Test",
      patient: "Mamila Mama",
      time: "2:30 PM",
      status: "On-going"
    },
    { id: "tb-2", date: "2026-10-06", type: "contact-tracing", title: "Contact Tracing" },
    { id: "tb-3", date: "2026-10-06", type: "lab-exam", title: "Lab Test - Sputum" },
    { id: "tb-4", date: "2026-10-17", type: "lab-exam", title: "Lab Test - Sputum" },
    { id: "tb-5", date: "2026-10-17", type: "consultation", title: "Follow-up Cons." },
    {
      id: "tb-6",
      date: "2026-10-24",
      type: "regional-seminar",
      title: "Outreach Program",
      editTitle: "Preventive Measures of Tuberculosis",
      detailType: "Regional Seminar",
      time: "9:00 - 10:00",
      notes: "miss ko na si babyh",
      status: "Scheduled"
    },
    { id: "tb-7", date: "2026-10-26", type: "lab-exam", title: "Lab Test - Sputum" },
    { id: "tb-8", date: "2026-10-30", type: "fhsis-report", title: "Report - Week 4" },
    { id: "tb-9", date: "2026-10-30", type: "drug-refill", title: "Drug Refill" }
  ];

  function toDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function selectedDate(dateKey: string): Date {
    const [year, month, day] = dateKey.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function weekdayFor(date: Date): string {
    if (date.getFullYear() === 2026 && date.getMonth() === 9) {
      return weekdayNames[(date.getDate() - 1) % 7];
    }
    return weekdayNames[date.getDay()];
  }

  function setDayHeading(date: Date, numberElement: HTMLElement, labelElement: HTMLElement): void {
    numberElement.textContent = String(date.getDate());
    labelElement.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()} • ${weekdayFor(date)}`.toUpperCase();
  }

  function renderEventDay(date: Date, dayEvents: TBCareCalendarEvent[]): void {
    setDayHeading(date, eventDayNumber, eventDayLabel);
    eventDayList.replaceChildren();

    dayEvents.forEach(calendarEvent => {
      const card = document.createElement("div");
      card.className = "day-event-card";

      const icon = document.createElement("span");
      icon.className = `day-event-icon ${calendarEvent.type}`;
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = `<iconify-icon icon="${eventIcons[calendarEvent.type]}" width="22" height="22"></iconify-icon>`;

      const details = document.createElement("span");
      details.className = "day-event-details";
      const type = document.createElement("span");
      type.className = "day-event-type";
      type.textContent = calendarEvent.detailType || eventTypeLabels[calendarEvent.type];
      const title = document.createElement("strong");
      title.className = "day-event-title";
      title.textContent = calendarEvent.detailTitle || calendarEvent.title;
      details.append(type, title);

      if (calendarEvent.patient) {
        const patient = document.createElement("span");
        patient.className = "day-event-description";
        patient.textContent = `Patient: ${calendarEvent.patient}`;
        details.appendChild(patient);
      }

      if (calendarEvent.status) {
        const status = document.createElement("span");
        status.className = "day-event-status";
        status.textContent = calendarEvent.status;
        details.appendChild(status);
      }

      card.append(icon, details);
      if (calendarEvent.time) {
        const time = document.createElement("span");
        time.className = "day-event-time";
        time.textContent = calendarEvent.time;
        card.appendChild(time);
      }

      const actions = document.createElement("div");
      actions.className = "day-event-actions";
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.dataset.action = "edit";
      editButton.dataset.eventId = calendarEvent.id;
      editButton.setAttribute("aria-label", `Edit event ${calendarEvent.title}`);
      editButton.textContent = "Edit";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.eventId = calendarEvent.id;
      deleteButton.setAttribute("aria-label", `Delete event ${calendarEvent.title}`);
      deleteButton.textContent = "Delete";
      actions.append(editButton, deleteButton);
      card.appendChild(actions);

      eventDayList.appendChild(card);
    });

    eventDayModal.classList.add("open");
  }

  function renderCalendar(): void {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.replaceChildren();
    const isReferenceOctober = year === 2026 && month === 9;
    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    const query = searchInput.value.trim().toLowerCase();

    for (let index = 0; index < 42; index += 1) {
      let day: Date;
      if (isReferenceOctober && index < 7) {
        day = new Date(year, month - 1, 22 + index);
      } else if (isReferenceOctober && index < 38) {
        day = new Date(year, month, index - 6);
      } else if (isReferenceOctober) {
        day = new Date(year, month + 1, index - 37);
      } else {
        day = new Date(gridStart);
        day.setDate(gridStart.getDate() + index);
      }

      const dateKey = toDateKey(day);
      const cell = document.createElement("div");
      cell.className = "calendar-day";
      cell.dataset.date = dateKey;
      cell.tabIndex = 0;
      cell.setAttribute("role", "button");
      cell.setAttribute("aria-label", `${monthNames[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`);
      if (day.getMonth() !== month) cell.classList.add("outside-month");

      const dayEvents = events.filter(calendarEvent => calendarEvent.date === dateKey);
      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(day.getDate());
      const stack = document.createElement("div");
      stack.className = "event-stack";

      dayEvents
        .filter(calendarEvent => {
          const label = eventTypeLabels[calendarEvent.type].toLowerCase();
          return !query || calendarEvent.title.toLowerCase().includes(query) || label.includes(query);
        })
        .forEach(calendarEvent => {
          const pill = document.createElement("span");
          pill.className = `event-pill ${calendarEvent.type}`;
          pill.title = calendarEvent.title;
          const icon = document.createElement("iconify-icon");
          icon.setAttribute("icon", eventIcons[calendarEvent.type]);
          icon.setAttribute("aria-hidden", "true");
          const title = document.createElement("span");
          title.textContent = calendarEvent.title;
          pill.append(icon, title);
          stack.appendChild(pill);
        });

      cell.append(number, stack);
      calendarGrid.appendChild(cell);
    }
  }

  function openAddModal(dateKey: string | null = selectedDateKey): void {
    editingEventId = null;
    eventForm.reset();
    eventModalTitle.textContent = "ADD EVENT";
    eventModalDescription.textContent = "Add an event";
    eventSubmitButton.type = "button";
    eventSubmitButton.removeAttribute("form");
    eventSubmitButton.textContent = "Close";
    eventDate.value = dateKey || "";
    eventModal.classList.add("open");
  }

  function openEditModal(calendarEvent: TBCareCalendarEvent): void {
    editingEventId = calendarEvent.id;
    eventForm.reset();
    eventCategory.value = calendarEvent.type;
    eventCategory.dispatchEvent(new Event("mhims:select-sync"));
    eventTitle.value = calendarEvent.editTitle || calendarEvent.title;
    eventDate.value = calendarEvent.date;
    eventTime.value = calendarEvent.time || "";
    eventNotes.value = calendarEvent.notes || "";
    eventModalTitle.textContent = "EDIT EVENT";
    eventModalDescription.textContent = calendarEvent.type === "regional-seminar"
      ? "Update the selected BNS event"
      : "Update the selected event";
    eventSubmitButton.type = "submit";
    eventSubmitButton.setAttribute("form", "eventForm");
    eventSubmitButton.textContent = "Update Event";
    eventDayModal.classList.remove("open");
    eventModal.classList.add("open");
  }

  function openSelectedDay(cell: HTMLElement): void {
    const dateKey = cell.dataset.date;
    if (!dateKey) return;
    selectedDateKey = dateKey;
    const date = selectedDate(dateKey);
    const dayEvents = events.filter(calendarEvent => calendarEvent.date === dateKey);
    if (dayEvents.length) {
      renderEventDay(date, dayEvents);
      return;
    }
    setDayHeading(date, emptyDayNumber, emptyDayLabel);
    emptyDayModal.classList.add("open");
  }

  getElement<HTMLButtonElement>("prevMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    selectedDateKey = null;
    renderCalendar();
  });
  getElement<HTMLButtonElement>("nextMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    selectedDateKey = null;
    renderCalendar();
  });
  searchInput.addEventListener("input", renderCalendar);
  calendarGrid.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const cell = event.target.closest<HTMLElement>(".calendar-day");
    if (cell) openSelectedDay(cell);
  });
  calendarGrid.addEventListener("keydown", event => {
    if (!(event.target instanceof HTMLElement) || !["Enter", " "].includes(event.key)) return;
    const cell = event.target.closest<HTMLElement>(".calendar-day");
    if (!cell) return;
    event.preventDefault();
    openSelectedDay(cell);
  });
  getElement<HTMLButtonElement>("openEventModal").addEventListener("click", () => openAddModal());
  eventSubmitButton.addEventListener("click", () => {
    if (!editingEventId) eventModal.classList.remove("open");
  });

  document.querySelectorAll<HTMLElement>("[data-close-event]").forEach(button => {
    button.addEventListener("click", () => eventModal.classList.remove("open"));
  });
  document.querySelectorAll<HTMLElement>("[data-close-empty]").forEach(button => {
    button.addEventListener("click", () => emptyDayModal.classList.remove("open"));
  });
  document.querySelectorAll<HTMLElement>("[data-close-event-day]").forEach(button => {
    button.addEventListener("click", () => eventDayModal.classList.remove("open"));
  });
  [eventModal, emptyDayModal, eventDayModal].forEach(backdrop => {
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) backdrop.classList.remove("open");
    });
  });

  eventForm.addEventListener("submit", event => {
    event.preventDefault();
    if (!eventForm.reportValidity()) return;
    const typeValue = eventCategory.value;
    if (!eventTypes.has(typeValue)) return;
    const type = typeValue as TBCareEventType;
    const title = eventTitle.value.trim();
    const isEditing = Boolean(editingEventId);
    const previousEvent = events.find(calendarEvent => calendarEvent.id === editingEventId);
    const updatedEvent: TBCareCalendarEvent = {
      ...previousEvent,
      id: previousEvent?.id || `tb-${Date.now()}-${++eventSequence}`,
      date: eventDate.value,
      type,
      title,
      detailType: eventTypeLabels[type],
      detailTitle: title,
      time: eventTime.value || undefined,
      notes: eventNotes.value.trim() || undefined,
      editTitle: undefined,
      status: previousEvent?.status || "Scheduled"
    };

    if (editingEventId) {
      events = events.map(calendarEvent => calendarEvent.id === editingEventId ? updatedEvent : calendarEvent);
    } else {
      events.push(updatedEvent);
    }
    selectedDateKey = updatedEvent.date;
    eventModal.classList.remove("open");
    renderCalendar();
    showRecordNotice(
      isEditing ? "updated" : "created",
      isEditing ? "TBCare calendar event has been updated." : "A new TBCare calendar event has been added.",
    );
  });

  eventDayList.addEventListener("click", event => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const { action, eventId } = event.target.dataset;
    if (!eventId) return;
    const calendarEvent = events.find(item => item.id === eventId);
    if (!calendarEvent) return;
    if (action === "edit") {
      openEditModal(calendarEvent);
      return;
    }
    if (action === "delete" && window.confirm(`Delete "${calendarEvent.title}"?`)) {
      events = events.filter(item => item.id !== eventId);
      const dayEvents = events.filter(item => item.date === calendarEvent.date);
      if (dayEvents.length) {
        renderEventDay(selectedDate(calendarEvent.date), dayEvents);
      } else {
        eventDayModal.classList.remove("open");
      }
      renderCalendar();
    }
  });

  renderCalendar();
  calendarGrid.dataset.tbcCalendarInitialized = "true";
}

