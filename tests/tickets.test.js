import test from "node:test";
import assert from "node:assert/strict";

import {
  createTicket,
  filterTickets,
  exportTicketsCsv,
  normalizeTicket,
  validateTicketInput,
} from "../src/tickets.js";

test("createTicket valide les champs obligatoires et attribue un identifiant", () => {
  const ticket = createTicket({
    title: "Poste bloqué",
    description: "L’utilisateur ne peut plus ouvrir Outlook.",
    priority: "Moyenne",
    category: "Matériel",
    status: "Ouvert",
  });

  assert.equal(ticket.title, "Poste bloqué");
  assert.equal(ticket.id.startsWith("T-"), true);
  assert.equal(ticket.status, "Ouvert");
});

test("validateTicketInput rejette un titre vide et un statut interdit", () => {
  const errors = validateTicketInput({
    title: "",
    description: "",
    priority: "Faible",
    category: "Réseau",
    status: "Mystère",
  });

  assert.equal(errors.title, "Le titre est obligatoire.");
  assert.equal(errors.status, "Le statut doit être Ouvert, En cours ou Fermé.");
});

test("normalizeTicket prend les données API et les adapte au format local", () => {
  const ticket = normalizeTicket({
    ticket_id: "T-42",
    title: " DNS interne ",
    description: "Problème de résolution",
    priority: "Haute",
    category: "Réseau",
    status: "Ouvert",
    created_at: "2026-10-29T12:00:00Z",
  });

  assert.equal(ticket.id, "T-42");
  assert.equal(ticket.title, "DNS interne");
  assert.equal(ticket.createdAt, "2026-10-29T12:00:00Z");
});

test("filterTickets trie et recherche par mot-clé", () => {
  const tickets = [
    { id: "T-1", title: "Serveur DNS", priority: "Haute", category: "Réseau", status: "Ouvert" },
    { id: "T-2", title: "Imprimante lente", priority: "Faible", category: "Matériel", status: "Fermé" },
    { id: "T-3", title: "AD - droits utilisateurs", priority: "Moyenne", category: "Active Directory", status: "En cours" },
  ];

  const filtered = filterTickets(tickets, {
    query: "dns",
    priority: "Haute",
    status: "Ouvert",
  });

  assert.deepEqual(filtered, [tickets[0]]);
});

test("exportTicketsCsv génère une ligne CSV exploitable", () => {
  const csv = exportTicketsCsv([
    { id: "T-1", title: "DNS", description: "Problème de résolution", priority: "Haute", category: "Réseau", status: "Ouvert", createdAt: "2026-10-29" },
  ]);

  assert.equal(csv.includes("id,titre,description,priorite,statut,categorie,date"), true);
  assert.equal(csv.includes("T-1"), true);
});
