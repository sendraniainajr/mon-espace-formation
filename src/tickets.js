export const TICKET_STATUSES = ["Ouvert", "En cours", "Fermé"];
export const TICKET_PRIORITIES = ["Faible", "Moyenne", "Haute", "Critique"];

const sanitizeText = (value = "") => String(value).trim();

export function normalizeTicket(ticket = {}) {
  const source = ticket ?? {};
  return {
    id: source.id ?? source.ticket_id ?? `T-${Date.now()}`,
    title: sanitizeText(source.title),
    description: sanitizeText(source.description),
    priority: sanitizeText(source.priority) || "Moyenne",
    category: sanitizeText(source.category) || "Général",
    status: sanitizeText(source.status) || "Ouvert",
    createdAt: source.createdAt || source.created_at || new Date().toISOString(),
  };
}

export function validateTicketInput(ticket = {}) {
  const errors = {};
  const title = sanitizeText(ticket.title);
  const description = sanitizeText(ticket.description);
  const priority = sanitizeText(ticket.priority);
  const category = sanitizeText(ticket.category);
  const status = sanitizeText(ticket.status);

  if (!title) {
    errors.title = "Le titre est obligatoire.";
  }

  if (!description) {
    errors.description = "La description est obligatoire.";
  }

  if (priority && !TICKET_PRIORITIES.includes(priority)) {
    errors.priority = "La priorité doit être Faible, Moyenne, Haute ou Critique.";
  }

  if (!category) {
    errors.category = "La catégorie est obligatoire.";
  }

  if (status && !TICKET_STATUSES.includes(status)) {
    errors.status = "Le statut doit être Ouvert, En cours ou Fermé.";
  }

  return errors;
}

export function createTicket(input = {}) {
  const clean = normalizeTicket(input);

  const errors = validateTicketInput(clean);
  if (Object.keys(errors).length > 0) {
    throw new Error(Object.values(errors)[0]);
  }

  return clean;
}

export function filterTickets(tickets = [], filters = {}) {
  const query = sanitizeText(filters.query).toLowerCase();
  const priority = sanitizeText(filters.priority);
  const status = sanitizeText(filters.status);

  return tickets.filter((ticket) => {
    const matchesQuery =
      !query ||
      [ticket.title, ticket.description, ticket.category]
        .join(" ")
        .toLowerCase()
        .includes(query);

    const matchesPriority = !priority || ticket.priority === priority;
    const matchesStatus = !status || ticket.status === status;

    return matchesQuery && matchesPriority && matchesStatus;
  });
}

export function exportTicketsCsv(tickets = []) {
  const headers = ["id", "titre", "description", "priorite", "statut", "categorie", "date"];
  const rows = tickets.map((ticket) => [
    ticket.id || "",
    ticket.title || "",
    ticket.description || "",
    ticket.priority || "",
    ticket.status || "",
    ticket.category || "",
    ticket.createdAt || "",
  ]);

  const escapeCsvValue = (value) => {
    const stringValue = String(value ?? "");
    return /[",\n]/.test(stringValue)
      ? `"${stringValue.replace(/"/g, '""')}"`
      : stringValue;
  };

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}
