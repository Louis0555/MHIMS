document.addEventListener("DOMContentLoaded", () => {
  const monthLabel = document.getElementById("monthLabel");
  const calendarGrid = document.getElementById("calendarGrid");
  const searchInput = document.getElementById("calendarSearch");
  const modal = document.getElementById("eventModal");
  const form = document.getElementById("eventForm");
  const emptyDayModal = document.getElementById("emptyDayModal");
  const emptyDayNumber = document.getElementById("emptyDayNumber");
  const emptyDayLabel = document.getElementById("emptyDayLabel");
  const eventDayModal = document.getElementById("eventDayModal");
  const eventDayList = document.getElementById("eventDayList");
  const eventDayNumber = document.getElementById("eventDayNumber");
  const eventDayLabel = document.getElementById("eventDayLabel");

  let viewDate = new Date(2026, 9, 1);
  let events = [
    { date: "2026-10-02", title: "Report - Week 1", category: "appointment" },
    { date: "2026-10-06", title: "Midwife Event", category: "event" },
    { date: "2026-10-06", title: "Vaccine Shot", category: "vaccine" },
    { date: "2026-10-12", title: "Midwife Event", category: "event" },
    { date: "2026-10-12", title: "Vaccine Shot", category: "vaccine" },
    { date: "2026-10-13", title: "Lab Screening", category: "lab" },
    { date: "2026-10-17", title: "Lab Screening", category: "lab" },
    { date: "2026-10-24", title: "Midwife Meeting", category: "event", time: "1:30 PM", description: "Midwife: Jennie Kim" },
    { date: "2026-10-25", title: "Vaccine Shot", category: "vaccine" },
    { date: "2026-10-30", title: "Report - Week 4", category: "appointment" },
    { date: "2026-10-30", title: "Vaccine Shot", category: "vaccine" }
  ];

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const categoryLabels = {
    appointment: "Appointment",
    vaccine: "Vaccination",
    lab: "Screening",
    event: "Meeting"
  };
  const weekdayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  function toDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function setDayHeading(date, numberElement, labelElement) {
    numberElement.textContent = String(date.getDate());
    labelElement.textContent = `${monthNames[date.getMonth()]} ${date.getFullYear()} • ${weekdayNames[date.getDay()]}`.toUpperCase();
  }

  function renderEventDay(date, dayEvents) {
    setDayHeading(date, eventDayNumber, eventDayLabel);
    eventDayList.replaceChildren();

    dayEvents.forEach(event => {
      const card = document.createElement("div");
      card.className = "day-event-card";

      const icon = document.createElement("span");
      icon.className = "day-event-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = '<iconify-icon icon="mdi:calendar-check" width="22" height="22"></iconify-icon>';

      const details = document.createElement("div");
      details.className = "day-event-details";

      const type = document.createElement("span");
      type.className = "day-event-type";
      type.textContent = categoryLabels[event.category] || "Event";

      const title = document.createElement("strong");
      title.className = "day-event-title";
      title.textContent = event.title;

      details.append(type, title);
      if (event.description) {
        const description = document.createElement("span");
        description.className = "day-event-description";
        description.textContent = event.description;
        details.appendChild(description);
      }
      card.append(icon, details);

      if (event.time) {
        const time = document.createElement("span");
        time.className = "day-event-time";
        time.textContent = event.time;
        card.appendChild(time);
      }

      const actions = document.createElement("div");
      actions.className = "day-event-actions";
      actions.setAttribute("aria-hidden", "true");
      const deleteLabel = document.createElement("span");
      deleteLabel.textContent = "Delete";
      const editLabel = document.createElement("span");
      editLabel.textContent = "Edit";
      actions.append(deleteLabel, editLabel);
      card.appendChild(actions);

      eventDayList.appendChild(card);
    });

    eventDayModal.classList.add("open");
  }

  function renderCalendar() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    monthLabel.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.innerHTML = "";

    const first = new Date(year, month, 1);
    const gridStart = new Date(year, month, 1 - first.getDay());
    const query = (searchInput.value || "").toLowerCase().trim();

    for (let i = 0; i < 35; i++) {
      const day = new Date(gridStart);
      day.setDate(gridStart.getDate() + i);
      const dayKey = toDateKey(day.getFullYear(), day.getMonth(), day.getDate());
      const cell = document.createElement("div");
      cell.className = "calendar-day";
      cell.dataset.date = dayKey;
      if (day.getMonth() !== month) cell.classList.add("outside-month");
      const dayEvents = events.filter(event => event.date === dayKey);
      cell.classList.add(dayEvents.length ? "has-events" : "empty-day");
      cell.innerHTML = `<span class="day-number">${day.getDate()}</span><div class="event-stack"></div>`;

      const stack = cell.querySelector(".event-stack");
      dayEvents
        .filter(event => !query || event.title.toLowerCase().includes(query) || event.category.includes(query))
        .forEach(event => {
          const pill = document.createElement("span");
          pill.className = `event-pill ${event.category}`;
          pill.textContent = event.title;
          pill.title = event.title;
          stack.appendChild(pill);
        });
      calendarGrid.appendChild(cell);
    }
  }

  document.getElementById("prevMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });
  document.getElementById("nextMonth").addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });
  searchInput.addEventListener("input", renderCalendar);
  calendarGrid.addEventListener("click", event => {
    const cell = event.target.closest(".calendar-day");
    if (!cell) return;

    const selectedDate = new Date(`${cell.dataset.date}T00:00:00`);
    const dayEvents = events.filter(calendarEvent => calendarEvent.date === cell.dataset.date);
    if (dayEvents.length) {
      renderEventDay(selectedDate, dayEvents);
      return;
    }

    setDayHeading(selectedDate, emptyDayNumber, emptyDayLabel);
    emptyDayModal.classList.add("open");
  });

  document.getElementById("openEventModal").addEventListener("click", () => {
    form.reset();
    modal.classList.add("open");
  });
  document.querySelectorAll("[data-close-modal]").forEach(button => {
    button.addEventListener("click", () => modal.classList.remove("open"));
  });
  document.querySelectorAll("[data-close-empty-modal]").forEach(button => {
    button.addEventListener("click", () => emptyDayModal.classList.remove("open"));
  });
  document.querySelectorAll("[data-close-event-day]").forEach(button => {
    button.addEventListener("click", () => eventDayModal.classList.remove("open"));
  });
  modal.addEventListener("click", event => {
    if (event.target === modal) modal.classList.remove("open");
  });
  emptyDayModal.addEventListener("click", event => {
    if (event.target === emptyDayModal) emptyDayModal.classList.remove("open");
  });
  eventDayModal.addEventListener("click", event => {
    if (event.target === eventDayModal) eventDayModal.classList.remove("open");
  });
  form.addEventListener("submit", event => event.preventDefault());

  renderCalendar();
});
