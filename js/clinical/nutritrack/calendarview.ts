import { showRecordNotice } from "../../shared/record-save-notice";

type InterventionCategory =
  | "appointment"
  | "feeding"
  | "follow-up"
  | "deworming"
  | "vitamin-a"
  | "home-visit"
  | "report";

type InterventionStatus = "Scheduled" | "In Progress" | "Completed";

interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  category: InterventionCategory;
  time?: string;
  description?: string;
  status: InterventionStatus;
}

document.addEventListener("DOMContentLoaded", () => {
  function getElement<T extends HTMLElement>(id: string): T {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Required calendar element #${id} was not found.`);
    return element as T;
  }

  const monthLabel = getElement<HTMLSpanElement>("monthLabel");
  const calendarGrid = getElement<HTMLDivElement>("calendarGrid");
  const searchInput = getElement<HTMLInputElement>("calendarSearch");
  const modal = getElement<HTMLDivElement>("eventModal");
  const form = getElement<HTMLFormElement>("eventForm");
  const eventCategory = getElement<HTMLSelectElement>("eventCategory");
  const eventTitle = getElement<HTMLInputElement>("eventTitle");
  const eventDate = getElement<HTMLInputElement>("eventDate");
  const eventTime = getElement<HTMLSelectElement>("eventTime");
  const eventNotes = getElement<HTMLTextAreaElement>("eventNotes");
  const eventModalTitle = getElement<HTMLHeadingElement>("eventModalTitle");
  const eventModalDescription = eventModalTitle.nextElementSibling;
  const eventSubmitButton = getElement<HTMLButtonElement>("eventSubmitBtn");
  const emptyDayModal = getElement<HTMLDivElement>("emptyDayModal");
  const emptyDayNumber = getElement<HTMLElement>("emptyDayNumber");
  const emptyDayLabel = getElement<HTMLElement>("emptyDayLabel");
  const eventDayModal = getElement<HTMLDivElement>("eventDayModal");
  const eventDayList = getElement<HTMLDivElement>("eventDayList");
  const eventDayNumber = getElement<HTMLElement>("eventDayNumber");
  const eventDayLabel = getElement<HTMLElement>("eventDayLabel");

  let viewDate = new Date(2026, 9, 1);
  let selectedDateKey: string | null = null;
  let editingEventId: string | null = null;
  let eventSequence = 0;
  let events: CalendarEvent[] = [
    { id: "nutri-1", date: "2026-10-05", title: "Vitamin A Distribution", category: "vitamin-a", status: "Completed" },
    { id: "nutri-2", date: "2026-10-05", title: "Report - Week 1", category: "report", status: "Completed" },
    { id: "nutri-3", date: "2026-10-10", title: "Home Visit", category: "home-visit", status: "Scheduled" },
    { id: "nutri-4", date: "2026-10-10", title: "Feeding - Week 2", category: "feeding", status: "Scheduled" },
    { id: "nutri-5", date: "2026-10-14", title: "BNS Meeting", category: "appointment", time: "13:00 - 14:00", description: "Barangay Nutrition Scholar meeting", status: "Scheduled" },
    { id: "nutri-6", date: "2026-10-17", title: "Deworming", category: "deworming", status: "Scheduled" },
    { id: "nutri-7", date: "2026-10-17", title: "Follow-up: 2nd Dose", category: "follow-up", status: "Scheduled" },
    { id: "nutri-8", date: "2026-10-20", title: "Feeding - Week 3", category: "feeding", status: "In Progress" },
    { id: "nutri-9", date: "2026-10-30", title: "Report - Week 4", category: "report", status: "Scheduled" },
    { id: "nutri-10", date: "2026-10-30", title: "Appointment", category: "appointment", status: "Scheduled" },
    { id: "nutri-11", date: "2026-10-30", title: "Vitamin A", category: "vitamin-a", status: "Scheduled" }
  ];

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const categoryLabels: Record<InterventionCategory, string> = {
    appointment: "Appointment",
    feeding: "Feeding",
    "follow-up": "Follow-up",
    deworming: "Deworming",
    "vitamin-a": "Vitamin A",
    "home-visit": "Home Visit",
    report: "Report"
  };
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function toDateKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function setDayHeading(date: Date, numberElement: HTMLElement, labelElement: HTMLElement): void {
    numberElement.textContent = String(date.getDate());
    labelElement.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()} • ${weekdayNames[date.getDay()]}`.toUpperCase();
  }

  function renderEventDay(date: Date, dayEvents: CalendarEvent[]): void {
    setDayHeading(date, eventDayNumber, eventDayLabel);
    eventDayList.replaceChildren();

    dayEvents.forEach(calendarEvent => {
      const card = document.createElement("div");
      card.className = "day-event-card";

      const icon = document.createElement("span");
      icon.className = `day-event-icon ${calendarEvent.category}`;
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<iconify-icon icon="mdi:calendar-check" width="22" height="22"></iconify-icon>';

      const details = document.createElement("div");
      details.className = "day-event-details";

      const type = document.createElement("span");
      type.className = "day-event-type";
      type.textContent = categoryLabels[calendarEvent.category];

      const title = document.createElement("strong");
      title.className = "day-event-title";
      title.textContent = calendarEvent.title;

      details.append(type, title);
      if (calendarEvent.description) {
        const description = document.createElement("span");
        description.className = "day-event-description";
        description.textContent = calendarEvent.description;
        details.appendChild(description);
      }

      const status = document.createElement("span");
      status.className = `event-status ${calendarEvent.status.toLowerCase().replace(" ", "-")}`;
      status.textContent = calendarEvent.status;

      card.append(icon, details, status);
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
      editButton.textContent = "Edit";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.dataset.action = "delete";
      deleteButton.dataset.eventId = calendarEvent.id;
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

    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    const query = searchInput.value.toLowerCase().trim();

    for (let index = 0; index < 35; index += 1) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + index);
      const dayKey = toDateKey(day.getFullYear(), day.getMonth(), day.getDate());
      const cell = document.createElement("div");
      cell.className = "calendar-day";
      cell.dataset.date = dayKey;
      cell.setAttribute("role", "button");
      cell.tabIndex = 0;
      cell.setAttribute("aria-label", `${monthNames[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`);
      if (day.getMonth() !== month) cell.classList.add("outside-month");

      const dayEvents = events.filter(calendarEvent => calendarEvent.date === dayKey);
      cell.classList.add(dayEvents.length ? "has-events" : "empty-day");

      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(day.getDate());
      const stack = document.createElement("div");
      stack.className = "event-stack";

      dayEvents
        .filter(calendarEvent => {
          const label = categoryLabels[calendarEvent.category].toLowerCase();
          return !query || calendarEvent.title.toLowerCase().includes(query) || label.includes(query);
        })
        .forEach(calendarEvent => {
          const pill = document.createElement("span");
          pill.className = `event-pill ${calendarEvent.category}`;
          pill.textContent = calendarEvent.title;
          pill.title = calendarEvent.title;
          stack.appendChild(pill);
        });

      cell.append(number, stack);
      calendarGrid.appendChild(cell);
    }
  }

  function openAddModal(dateKey: string | null = selectedDateKey): void {
    editingEventId = null;
    form.reset();
    eventModalTitle.textContent = "ADD EVENT";
    if (eventModalDescription) eventModalDescription.textContent = "Add an event";
    eventSubmitButton.textContent = "Add Event";
    eventDate.value = dateKey || toDateKey(viewDate.getFullYear(), viewDate.getMonth(), 1);
    modal.classList.add("open");
  }

  function openEditModal(calendarEvent: CalendarEvent): void {
    editingEventId = calendarEvent.id;
    form.reset();
    eventCategory.value = calendarEvent.category;
    eventCategory.dispatchEvent(new Event("mhims:select-sync"));
    eventTitle.value = calendarEvent.title;
    eventDate.value = calendarEvent.date;
    eventTime.value = calendarEvent.time || "";
    eventNotes.value = calendarEvent.description || "";
    eventModalTitle.textContent = "EDIT EVENT";
    if (eventModalDescription) eventModalDescription.textContent = "Update event details";
    eventSubmitButton.textContent = "Update Event";
    eventDayModal.classList.remove("open");
    modal.classList.add("open");
  }

  function openSelectedDay(cell: HTMLElement): void {
    const dateKey = cell.dataset.date;
    if (!dateKey) return;
    selectedDateKey = dateKey;
    const selectedDate = new Date(`${dateKey}T00:00:00`);
    const dayEvents = events.filter(calendarEvent => calendarEvent.date === dateKey);
    if (dayEvents.length) {
      renderEventDay(selectedDate, dayEvents);
      return;
    }

    setDayHeading(selectedDate, emptyDayNumber, emptyDayLabel);
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
  document.querySelectorAll<HTMLElement>("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => modal.classList.remove("open"));
  });
  document.querySelectorAll<HTMLElement>("[data-close-empty-modal]").forEach(button => {
    button.addEventListener("click", () => emptyDayModal.classList.remove("open"));
  });
  document.querySelectorAll<HTMLElement>("[data-close-event-day]").forEach(button => {
    button.addEventListener("click", () => eventDayModal.classList.remove("open"));
  });
  [modal, emptyDayModal, eventDayModal].forEach(backdrop => {
    backdrop.addEventListener("click", event => {
      if (event.target === backdrop) backdrop.classList.remove("open");
    });
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const category = eventCategory.value as InterventionCategory;
    const isEditing = Boolean(editingEventId);
    const existingEvent = events.find(calendarEvent => calendarEvent.id === editingEventId);
    const updatedEvent: CalendarEvent = {
      id: existingEvent?.id || `nutri-${Date.now()}-${++eventSequence}`,
      date: eventDate.value,
      title: eventTitle.value.trim(),
      category,
      time: eventTime.value || undefined,
      description: eventNotes.value.trim() || undefined,
      status: existingEvent?.status || "Scheduled"
    };

    if (editingEventId) {
      events = events.map(calendarEvent => calendarEvent.id === editingEventId ? updatedEvent : calendarEvent);
    } else {
      events.push(updatedEvent);
    }

    selectedDateKey = updatedEvent.date;
    modal.classList.remove("open");
    renderCalendar();
    showRecordNotice(
      isEditing ? "updated" : "created",
      isEditing ? "NutriTrack calendar event has been updated." : "A new NutriTrack calendar event has been added.",
    );
  });

  eventDayList.addEventListener("click", event => {
    if (!(event.target instanceof HTMLButtonElement)) return;
    const { action, eventId } = event.target.dataset;
    if (!eventId) return;

    const selectedEvent = events.find(calendarEvent => calendarEvent.id === eventId);
    if (!selectedEvent) return;
    if (action === "edit") {
      openEditModal(selectedEvent);
      return;
    }
    if (action === "delete" && window.confirm("Delete this intervention?")) {
      events = events.filter(calendarEvent => calendarEvent.id !== eventId);
      const dayEvents = events.filter(calendarEvent => calendarEvent.date === selectedEvent.date);
      if (dayEvents.length) {
        renderEventDay(new Date(`${selectedEvent.date}T00:00:00`), dayEvents);
      } else {
        eventDayModal.classList.remove("open");
      }
      renderCalendar();
    }
  });

  renderCalendar();
});

