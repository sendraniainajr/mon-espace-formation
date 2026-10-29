export const WEEK_PLAN = [
  {
    day: 'Lundi',
    morning: 'Python : théorie (1 notion)',
    evening: ['Python : exercices + projet (2 h)', 'Support : lecture ou laboratoire (1 h)'],
    hours: 4,
  },
  {
    day: 'Mardi',
    morning: 'Support : révision réseau, AD ou ticketing',
    evening: ['Support N2/N3 : laboratoire pratique (2 h)', 'Python : exercices (1 h)'],
    hours: 4,
  },
  {
    day: 'Mercredi',
    morning: 'Python : théorie',
    evening: ['Python : projet (2 h 30)', 'Revue du code (30 min)'],
    hours: 4,
  },
  {
    day: 'Jeudi',
    morning: 'Support : révision',
    evening: ['Support N2/N3 : labo + certification (2 h)', 'Python : exercices (1 h)'],
    hours: 4,
  },
  {
    day: 'Vendredi',
    morning: 'Python : théorie',
    evening: ['Python : projet (2 h)', 'Support : documentation de cas (1 h)'],
    hours: 4,
  },
  {
    day: 'Samedi',
    morning: 'Repos léger ou lecture',
    evening: ['Projet Python approfondi (2 h)', 'Support : laboratoire libre (1 h)'],
    hours: 3,
  },
  {
    day: 'Dimanche',
    morning: 'Revue (30 min) + planification de la semaine suivante',
    evening: ['Repos'],
    hours: 0.5,
  },
];

const DURATION_BY_TEXT = {
  '30 min': 0.5,
  '2 h 30': 2.5,
  '2 h': 2,
  '1 h': 1,
};

function normalizeDuration(text) {
  if (!text) return 0;
  for (const [label, value] of Object.entries(DURATION_BY_TEXT)) {
    if (text.includes(label)) return value;
  }
  return 1;
}

export function buildWeeklyTasks(plan = WEEK_PLAN) {
  return plan.flatMap((dayPlan) => {
    const morningTask = {
      id: `${dayPlan.day}-matin`,
      day: dayPlan.day,
      title: dayPlan.morning,
      category: /python/i.test(dayPlan.morning) ? 'Python' : 'Support',
      duration: dayPlan.day === 'Dimanche' ? 0.5 : 1,
      isWorkSession: !/repos/i.test(dayPlan.morning),
    };

    const eveningTasks = dayPlan.evening.map((taskText, index) => {
      const isWorkSession = !/repos/i.test(taskText);
      return {
        id: `${dayPlan.day}-soir-${index}`,
        day: dayPlan.day,
        title: taskText,
        category: /python|code|projet|exercices|documentation/i.test(taskText) ? 'Python' : 'Support',
        duration: normalizeDuration(taskText),
        isWorkSession,
      };
    });

    return [morningTask, ...eveningTasks];
  });
}

export function getPlannedWorkHours(tasks) {
  return tasks
    .filter((task) => task.isWorkSession)
    .reduce((sum, task) => sum + Number(task.duration || 0), 0);
}
