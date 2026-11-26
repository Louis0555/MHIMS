import { showRecordNotice } from "./record-save-notice";

type ResidentCareEventCategory = "consultation" | "follow-up" | "vaccination" | "community";

interface ResidentCareEvent {
  id: string;
  title: string;
  category: ResidentCareEventCategory;
  date: string;
  time?: string;
  resident?: string;
  notes?: string;
}

const categoryLabels: Record<ResidentCareEventCategory, string> = {
  consultation: "Consultation",
  "follow-up": "Follow-up",
  vaccination: "Vaccination",
  community: "Community Event"
};

const categoryValues = new Set<string>(Object.keys(categoryLabels));

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`ResidentCare calendar is missing required element #${id}`);
  }
  return element as T;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

document.addEventListener("DOMContentLoaded", () => {
  const calendarGrid = requiredElement<HTMLDivElement>("calendarGrid");
  const monthLabel = requiredElement<HTMLSpanElement>("monthLabel");
  const searchInput = requiredElement<HTMLInputElement>("calendarSearch");
  const eventModal = requiredElement<HTMLDivElement>("eventModal");
  const dayModal = requiredElement<HTMLDivElement>("dayModal");
  const eventForm = requiredElement<HTMLFormElement>("eventForm");
  const eventModalTitle = requiredElement<HTMLHeadingElement>("eventModalTitle");
  const eventModalDescription = requiredElement<HTMLParagraphElement>("eventModalDescription");
  const eventCategory = requiredElement<HTMLSelectElement>("eventCategory");
  const eventTitle = requiredElement<HTMLInputElement>("eventTitle");
  const eventDate = requiredElement<HTMLInputElement>("eventDate");
  const eventTime = requiredElement<HTMLInputElement>("eventTime");
  const eventResident = requiredElement<HTMLInputElement>("eventResident");
  const eventNotes = requiredElement<HTMLTextAreaElement>("eventNotes");
  const saveEventButton = requiredElement<HTMLButtonElement>("saveEventButton");
  const dayModalTitle = requiredElement<HTMLHeadingElement>("dayModalTitle");
  const dayModalLabel = requiredElement<HTMLParagraphElement>("dayModalLabel");
  const dayEventList = requiredElement<HTMLDivElement>("dayEventList");

  let viewDate = new Date(2026, 9, 1);
  let selectedDateKey: string | null = null;
  let editingEventId: string | null = null;
  let nextEventId = 1;
  let events: ResidentCareEvent[] = [
    { id: "resident-1", title: "General Health Consultation", category: "consultation", date: "2026-10-02", time: "09:00", resident: "Maria Santos" },
    { id: "resident-2", title: "Resident Follow-up", category: "follow-up", date: "2026-10-06", time: "10:30", resident: "Juan Dela Cruz" },
    { id: "resident-3", title: "Community Vaccination", category: "vaccination", date: "2026-10-13", time: "08:00" },
    { id: "resident-4", title: "Barangay Health Outreach", category: "community", date: "2026-10-17", time: "13:00" },
    { id: "resident-5", title: "Blood Pressure Check", category: "consultation", date: "2026-10-21", time: "09:30", resident: "Ana Reyes" },
    { id: "resident-6", title: "Nutrition and Wellness Session", category: "community", date: "2026-10-28", time: "14:00" }
  ];

  function matchesSearch(calendarEvent: ResidentCareEvent, query: string): boolean {
    const searchable = [
      calendarEvent.title,
      categoryLabels[calendarEvent.category],
      calendarEvent.resident || ""
    ].join(" ").toLowerCase();
    return searchable.includes(query);
  }

  function renderCalendar(): void {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstVisibleDate = new Date(year, month, 1 - firstOfMonth.getDay());
    const query = searchInput.value.trim().toLowerCase();
    monthLabel.textContent = new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(viewDate);
    calendarGrid.replaceChildren();

    for (let index = 0; index < 42; index += 1) {
      const date = new Date(firstVisibleDate.getFullYear(), firstVisibleDate.getMonth(), firstVisibleDate.getDate() + index);
      const key = dateKey(date);
      const dayEvents = events.filter(calendarEvent => calendarEvent.date === key && matchesSearch(calendarEvent, query));
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "calendar-day";
      cell.dataset.date = key;
      cell.setAttribute("aria-label", `${date.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}, ${dayEvents.length} event${dayEvents.length === 1 ? "" : "s"}`);
      if (date.getMonth() !== month) cell.classList.add("outside-month");

      const number = document.createElement("span");
      number.className = "day-number";
      number.textContent = String(date.getDate());
      const stack = document.createElement("span");
      stack.className = "event-stack";

      dayEvents.slice(0, 2).forEach(calendarEvent => {
        const pill = document.createElement("span");
        pill.className = `event-pill ${calendarEvent.category}`;
        pill.title = `${categoryLabels[calendarEvent.category]}: ${calendarEvent.title}`;
        pill.textContent = calendarEvent.title;
        stack.appendChild(pill);
      });
      if (dayEvents.length > 2) {
        const more = document.createElement("span");
        more.className = "event-count";
        more.textContent = `+${dayEvents.length - 2} more`;
        stack.appendChild(more);
      }

      cell.append(number, stack);
      calendarGrid.appendChild(cell);
    }
  }

  function setModalOpen(modal: HTMLElement, open: boolean): void {
    modal.classList.toggle("open", open);
    modal.setAttribute("aria-hidden", String(!open));
  }

  function renderDayModal(key: string): void {
    selectedDateKey = key;
    const date = parseDateKey(key);
    dayModalTitle.textContent = new Intl.DateTimeFormat("en", { day: "numeric" }).format(date);
    dayModalLabel.textContent = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", year: "numeric" }).format(date);
    dayEventList.replaceChildren();

    const dayEvents = events.filter(calendarEvent => calendarEvent.date === key);
    if (!dayEvents.length) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "empty-day-message";
      emptyMessage.textContent = "No events scheduled for this day.";
      dayEventList.appendChild(emptyMessage);
    }

    dayEvents.forEach(calendarEvent => {
      const card = document.createElement("article");
      card.className = `day-event-card ${calendarEvent.category}`;
      const title = document.createElement("h3");
      title.className = "day-event-title";
      title.textContent = calendarEvent.title;
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

      const meta = document.createElement("p");
      meta.className = "day-event-meta";
      meta.textContent = [
        categoryLabels[calendarEvent.category],
        calendarEvent.time ? new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(`2000-01-01T${calendarEvent.time}`)) : "",
        calendarEvent.resident ? `Resident: ${calendarEvent.resident}` : ""
      ].filter(Boolean).join(" · ");
      card.append(title, actions, meta);

      if (calendarEvent.notes) {
        const notes = document.createElement("p");
        notes.className = "day-event-notes";
        notes.textContent = calendarEvent.notes;
        card.appendChild(notes);
      }
      dayEventList.appendChild(card);
    });

    setModalOpen(dayModal, true);
  }

  function openEventForm(key: string | null = selectedDateKey): void {
    editingEventId = null;
    eventForm.reset();
    eventModalTitle.textContent = "Add Event";
    eventModalDescription.textContent = "Create a ResidentCare calendar event";
    saveEventButton.textContent = "Save Event";
    eventDate.value = key || dateKey(new Date(viewDate.getFullYear(), viewDate.getMonth(), 1));
    setModalOpen(dayModal, false);
    setModalOpen(eventModal, true);
    eventCategory.focus();
  }

  function openEditForm(calendarEvent: ResidentCareEvent): void {
    editingEventId = calendarEvent.id;
    eventForm.reset();
    eventCategory.value = calendarEvent.category;
    eventCategory.dispatchEvent(new Event("mhims:select-sync"));
    eventTitle.value = calendarEvent.title;
    eventDate.value = calendarEvent.date;
    eventTime.value = calendarEvent.time || "";
    eventResident.value = calendarEvent.resident || "";
    eventResident.dispatchEvent(new Event("mhims:select-sync"));
    eventNotes.value = calendarEvent.notes || "";
    eventModalTitle.textContent = "Edit Event";
    eventModalDescription.textContent = "Update this ResidentCare calendar event";
    saveEventButton.textContent = "Update Event";
    setModalOpen(dayModal, false);
    setModalOpen(eventModal, true);
    eventTitle.focus();
  }

  requiredElement<HTMLButtonElement>("prevMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    selectedDateKey = null;
    renderCalendar();
  });
  requiredElement<HTMLButtonElement>("nextMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    selectedDateKey = null;
    renderCalendar();
  });
  searchInput.addEventListener("input", renderCalendar);
  calendarGrid.addEventListener("click", event => {
    if (!(event.target instanceof Element)) return;
    const cell = event.target.closest<HTMLButtonElement>(".calendar-day");
    if (cell?.dataset.date) renderDayModal(cell.dataset.date);
  });
  requiredElement<HTMLButtonElement>("openEventModal").addEventListener("click", () => openEventForm());

  document.querySelectorAll<HTMLElement>("[data-close-event]").forEach(button => {
    button.addEventListener("click", () => setModalOpen(eventModal, false));
  });
  document.querySelectorAll<HTMLElement>("[data-close-day]").forEach(button => {
    button.addEventListener("click", () => setModalOpen(dayModal, false));
  });
  eventModal.addEventListener("click", event => {
    if (event.target === eventModal) setModalOpen(eventModal, false);
  });
  dayModal.addEventListener("click", event => {
    if (event.target === dayModal) setModalOpen(dayModal, false);
  });

  eventForm.addEventListener("submit", event => {
    event.preventDefault();
    eventTitle.value = eventTitle.value.trim();
    if (!eventForm.reportValidity()) return;

    const category = eventCategory.value;
    if (!categoryValues.has(category)) {
      eventCategory.setCustomValidity("Select a valid event type.");
      eventCategory.reportValidity();
      eventCategory.setCustomValidity("");
      return;
    }

    const isEditing = Boolean(editingEventId);
    const previousEvent = events.find(calendarEvent => calendarEvent.id === editingEventId);
    const savedEvent: ResidentCareEvent = {
      id: previousEvent?.id || `resident-event-${Date.now()}-${nextEventId++}`,
      title: eventTitle.value.trim(),
      category: category as ResidentCareEventCategory,
      date: eventDate.value,
      time: eventTime.value || undefined,
      resident: eventResident.value.trim() || undefined,
      notes: eventNotes.value.trim() || undefined
    };

    events = editingEventId
      ? events.map(calendarEvent => calendarEvent.id === editingEventId ? savedEvent : calendarEvent)
      : [...events, savedEvent];
    viewDate = new Date(parseDateKey(savedEvent.date).getFullYear(), parseDateKey(savedEvent.date).getMonth(), 1);
    setModalOpen(eventModal, false);
    renderCalendar();
    renderDayModal(savedEvent.date);
    showRecordNotice(
      isEditing ? "updated" : "created",
      isEditing ? "ResidentCare calendar event has been updated." : "A new ResidentCare calendar event has been added.",
    );
  });

  dayEventList.addEventListener("click", event => {
    if (!(event.target instanceof HTMLElement)) return;
    const actionButton = event.target.closest<HTMLButtonElement>("button[data-action]");
    const eventId = actionButton?.dataset.eventId;
    if (!actionButton || !eventId) return;
    const calendarEvent = events.find(item => item.id === eventId);
    if (!calendarEvent) return;

    if (actionButton.dataset.action === "edit") {
      openEditForm(calendarEvent);
    } else if (actionButton.dataset.action === "delete" && window.confirm(`Delete "${calendarEvent.title}"?`)) {
      events = events.filter(item => item.id !== eventId);
      renderCalendar();
      renderDayModal(calendarEvent.date);
    }
  });

  document.addEventListener("keydown", event => {
    if (event.key !== "Escape") return;
    setModalOpen(eventModal, false);
    setModalOpen(dayModal, false);
  });

  renderCalendar();
});

