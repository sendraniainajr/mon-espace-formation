import test from "node:test";
import assert from "node:assert/strict";

import {
  WEEK_PLAN,
  buildWeeklyTasks,
  getPlannedWorkHours,
} from "../src/planning.js";

test("Le planning exclut le repos du calcul des heures de travail", () => {
  const tasks = buildWeeklyTasks(WEEK_PLAN);
  const workTasks = tasks.filter((task) => task.isWorkSession);

  assert.equal(workTasks.length > 0, true);
  assert.equal(getPlannedWorkHours(workTasks), 23.5);
  assert.equal(
    tasks.some(
      (task) => task.isWorkSession === false && /repos/i.test(task.title),
    ),
    true,
  );
});

test("Le vendredi et le samedi conservent leur charge de travail prévue", () => {
  const friday = buildWeeklyTasks(WEEK_PLAN).filter(
    (task) => task.day === "Vendredi" && task.isWorkSession,
  );
  const saturday = buildWeeklyTasks(WEEK_PLAN).filter(
    (task) => task.day === "Samedi" && task.isWorkSession,
  );

  assert.equal(
    friday.reduce((sum, task) => sum + task.duration, 0),
    4,
  );
  assert.equal(
    saturday.reduce((sum, task) => sum + task.duration, 0),
    3,
  );
});
