export const SUPPORT_LABS = [
  {
    title: "TCP/IP et sous-réseaux",
    skill: "support:TCP/IP et sous-réseaux",
    objective: "Comprendre les adresses IP et le routage.",
    deliverable: "Un diagnostic réseau complet et documenté.",
    steps: [
      "Vérifier l’état de la carte réseau et la configuration IP.",
      "Tester ping et tracert vers la passerelle et un service distant.",
      "Analyser les erreurs de résolution DNS et documenter la cause.",
    ],
    duration: "45 min",
  },
  {
    title: "DNS, DHCP et VPN",
    skill: "support:DNS, DHCP et VPN",
    objective: "Résoudre les problèmes de résolution et d’attribution IP.",
    deliverable: "Une vérification de configuration réseau et de résolution complète.",
    steps: [
      "Vérifier l’accès au compte et les groupes utilisateur.",
      "Contrôler les services et le journal d’événements.",
      "Confirmer la cause racine avant d’appliquer une correction.",
    ],
    duration: "60 min",
  },
  {
    title: "Diagnostic réseau et résolution",
    skill: "support:Diagnostic : ping, tracert, nslookup",
    objective: "Identifier un problème de connectivité et tracer la cause de manière structurée.",
    deliverable: "Un diagnostic réseau complet et documenté.",
    steps: [
      "Reproduire le problème de droits sur un compte test.",
      "Comparer les groupes, ACL et accès réseau.",
      "Valider la correction et documenter la procédure.",
    ],
    duration: "50 min",
  },
  {
    title: "Services Windows et Active Directory",
    skill: "support:Windows Server et Active Directory",
    objective: "Valider l’authentification, les droits et la cohérence du domaine.",
    deliverable: "Un contrôle d’authentification et d’accès du domaine avec remédiation documentée.",
    steps: [
      "Construire un script simple de vérification système.",
      "Collecter les informations utiles en une commande.",
      "Comparer les résultats avant/après correction.",
    ],
    duration: "60 min",
  },
  {
    title: "Sécurité et permissions",
    skill: "support:Droits et permissions",
    objective: "Appliquer le principe du moindre privilège sans casser le service.",
    deliverable: "Une correction de droits sécurisée et une trace de validation.",
    steps: [
      "Décrire le symptôme, l’impact et la gravité.",
      "Séparer incident, problème et demande d’évolution.",
      "Choisir le bon niveau d’escalade et documenter la résolution.",
    ],
    duration: "40 min",
  },
  {
    title: "Automation et shell",
    skill: "support:Linux, Bash et PowerShell",
    objective: "Automatiser un diagnostic rapide ou une correction répétée.",
    deliverable: "Un script simple de vérification ou de diagnostic.",
    steps: [
      "Relire les points de cours et refaire un mini quiz.",
      "Noter les points faibles et les réviser immédiatement.",
      "Préparer la prochaine session de pratique.",
    ],
    duration: "30 min",
  },
  {
    title: "Gestion d’incident et escalade",
    skill: "support:ITIL : incident, problème, escalade",
    objective: "Classer le ticket, identifier l’impact et décider de l’escalade.",
    deliverable: "Une escalade de ticket correctement classée et documentée.",
    steps: [
      "Relire les points de cours et refaire un mini quiz.",
      "Noter les points faibles et les réviser immédiatement.",
      "Préparer la prochaine session de pratique.",
    ],
    duration: "30 min",
  },
  {
    title: "Préparation certification",
    skill: "support:Préparation certification",
    objective: "Réviser les thèmes clés et mesurer la confiance sur chaque domaine.",
    deliverable: "Un plan de révision et un score de confiance sur les thèmes de support.",
    steps: [
      "Relire les points de cours et refaire un mini quiz.",
      "Noter les points faibles et les réviser immédiatement.",
      "Préparer la prochaine session de pratique.",
    ],
    duration: "30 min",
  },
];

export function getSupportLabSummary(topicDone = {}, labs = SUPPORT_LABS) {
  const completedSet = Object.entries(topicDone)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);

  const completedCount = labs.filter((lab) => completedSet.includes(lab.skill)).length;
  const total = labs.length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  const remainingLabs = labs.filter((lab) => !completedSet.includes(lab.skill));
  const nextLab = remainingLabs[0] ?? labs[labs.length - 1];

  return {
    total,
    completedCount,
    percent,
    nextLab,
    remainingLabs,
    completedSet,
  };
}
