export const EMPTY_AGENDA_EVENT = {
  title: "",
  date: "",
  time: "09:00",
  category: "Personnel",
  notes: "",
  completed: false,
};

export const AGENDA_CATEGORIES = ["Personnel", "Python", "Support", "Rendez-vous"];

export function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

export function getAgendaWeekdayLabels(locale = "fr-FR") {
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return new Intl.DateTimeFormat(locale, { weekday: "short" })
      .format(date)
      .replace(/\.$/, "");
  });
}

export function normalizeAgendaEvent(event = {}) {
  return {
    id: event.id || globalThis.crypto?.randomUUID?.() || `event-${Date.now()}`,
    title: String(event.title || "").trim(),
    date: event.date || toDateKey(new Date()),
    time: event.time || "09:00",
    category: AGENDA_CATEGORIES.includes(event.category) ? event.category : "Personnel",
    notes: String(event.notes || "").trim(),
    completed: Boolean(event.completed),
  };
}

export function sortAgendaEvents(events = []) {
  return [...events]
    .map(normalizeAgendaEvent)
    .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
}
