import test from "node:test";
import assert from "node:assert/strict";
import { getMonthGrid, getAgendaWeekdayLabels, normalizeAgendaEvent, sortAgendaEvents, toDateKey } from "../src/agenda.js";

test("la grille mensuelle commence le lundi et contient six semaines", () => {
  const grid = getMonthGrid(new Date(2026, 9, 15));
  assert.equal(grid.length, 42);
  assert.equal(grid[0].getDay(), 1);
  assert.equal(grid[6].getDay(), 0);
});

test("toDateKey utilise une date locale stable au format ISO court", () => {
  assert.equal(toDateKey(new Date(2026, 0, 5)), "2026-01-05");
});

test("les jours de la semaine sont localisés et commencent par lundi", () => {
  assert.deepEqual(getAgendaWeekdayLabels(), ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]);
});

test("normalizeAgendaEvent nettoie les champs et applique les valeurs par défaut", () => {
  const event = normalizeAgendaEvent({ title: "  Révision Python  ", date: "2026-10-30", category: "invalide" });
  assert.equal(event.title, "Révision Python");
  assert.equal(event.category, "Personnel");
  assert.equal(event.completed, false);
  assert.ok(event.id);
});

test("sortAgendaEvents trie par date puis heure", () => {
  const sorted = sortAgendaEvents([
    { id: "b", title: "Plus tard", date: "2026-10-30", time: "12:00" },
    { id: "a", title: "Avant", date: "2026-10-29", time: "18:00" },
    { id: "c", title: "Matin", date: "2026-10-30", time: "08:30" },
  ]);
  assert.deepEqual(sorted.map((event) => event.id), ["a", "c", "b"]);
});
