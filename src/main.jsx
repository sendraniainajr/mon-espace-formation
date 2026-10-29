import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient } from "@supabase/supabase-js";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Code2,
  Flame,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Server,
  Settings,
  ShieldCheck,
  Target,
  Trash2,
  TrendingUp,
  Wrench,
  X,
} from "lucide-react";
import {
  createTicket,
  exportTicketsCsv,
  filterTickets,
  normalizeTicket,
  validateTicketInput,
} from "./tickets.js";
import { buildWeeklyTasks } from "./planning.js";
import { SUPPORT_LABS, getSupportLabSummary } from "./support.js";
import { getAdminAccessState } from "./adminAccess.js";
import "./style.css";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const DEFAULT_REVIEW = { wins: "", blockers: "", next: "" };

const readFromStorage = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const mergeProgressData = (remote = {}, local = {}) => ({
  completed: { ...(local.completed || {}), ...(remote.completed || {}) },
  topicDone: { ...(local.topicDone || {}), ...(remote.topicDone || {}) },
  cases: Array.isArray(remote.cases) && remote.cases.length > 0 ? remote.cases : local.cases || [],
  review: remote.review && Object.keys(remote.review).length > 0 ? remote.review : local.review || DEFAULT_REVIEW,
});

const plan = [
  {
    day: "Lundi",
    morning: "Python : théorie (1 notion)",
    evening: [
      "Python : exercices + projet (2 h)",
      "Support : lecture ou laboratoire (1 h)",
    ],
    hours: 4,
  },
  {
    day: "Mardi",
    morning: "Support : révision réseau, AD ou ticketing",
    evening: [
      "Support N2/N3 : laboratoire pratique (2 h)",
      "Python : exercices (1 h)",
    ],
    hours: 4,
  },
  {
    day: "Mercredi",
    morning: "Python : théorie",
    evening: ["Python : projet (2 h 30)", "Revue du code (30 min)"],
    hours: 4,
  },
  {
    day: "Jeudi",
    morning: "Support : révision",
    evening: [
      "Support N2/N3 : labo + certification (2 h)",
      "Python : exercices (1 h)",
    ],
    hours: 4,
  },
  {
    day: "Vendredi",
    morning: "Python : théorie",
    evening: ["Python : projet (2 h)", "Support : documentation de cas (1 h)"],
    hours: 4,
  },
  {
    day: "Samedi",
    morning: "Repos léger ou lecture",
    evening: [
      "Projet Python approfondi (2 h)",
      "Support : laboratoire libre (1 h)",
    ],
    hours: 3,
  },
  {
    day: "Dimanche",
    morning: "Revue (30 min) + plan de la semaine",
    evening: ["Repos"],
    hours: 0.5,
  },
];
const topics = [
  {
    month: "Mois 1",
    title: "Bases solides",
    items: [
      "Variables et types",
      "Conditions et boucles",
      "Fonctions",
      "Listes et dictionnaires",
      "Lire et écrire des fichiers",
    ],
  },
  {
    month: "Mois 2",
    title: "Structurer son code",
    items: [
      "Programmation orientée objet",
      "Gestion des erreurs",
      "Modules et environnements",
      "Git et GitHub",
      "Tests simples",
    ],
  },
  {
    month: "Mois 3",
    title: "Projet concret",
    items: [
      "Concevoir un gestionnaire de tickets",
      "Ajouter / rechercher / clôturer",
      "Exporter en CSV",
      "Tester et documenter",
      "Préparer le portfolio",
    ],
  },
];
const supportTopics = [
  "TCP/IP et sous-réseaux",
  "DNS, DHCP et VPN",
  "Diagnostic : ping, tracert, nslookup",
  "Windows Server et Active Directory",
  "Droits et permissions",
  "Linux, Bash et PowerShell",
  "ITIL : incident, problème, escalade",
  "Préparation certification",
];
const todayName = [
  "Dimanche",
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
][new Date().getDay()];
const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const initialTasks = buildWeeklyTasks(plan);
function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(!supabase);
  const [adminReady, setAdminReady] = useState(!supabase);
  const [isAdmin, setIsAdmin] = useState(false);
  const accessState = getAdminAccessState({
    supabaseConfigured: Boolean(supabase),
    isDevelopment: import.meta.env.DEV,
    hasSession: Boolean(session),
    adminVerified: adminReady && isAdmin,
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [view, setView] = useState("dashboard");
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [completed, setCompleted] = useState({});
  const [topicDone, setTopicDone] = useState({});
  const [cases, setCases] = useState([]);
  const [review, setReview] = useState({ wins: "", blockers: "", next: "" });
  const [caseForm, setCaseForm] = useState({
    symptom: "",
    cause: "",
    solution: "",
  });
  const [tickets, setTickets] = useState(() =>
    readFromStorage("study-tickets", [
      {
        id: "T-101",
        title: "DNS interne",
        description: "Les postes ne résolvent plus les noms locaux.",
        priority: "Haute",
        category: "Réseau",
        status: "Ouvert",
        createdAt: dateKey(),
      },
      {
        id: "T-102",
        title: "Accès utilisateur",
        description: "Un compte ne peut plus ouvrir ses dossiers partagés.",
        priority: "Moyenne",
        category: "Active Directory",
        status: "En cours",
        createdAt: dateKey(),
      },
    ]),
  );

  async function fetchTicketsFromApi() {
    if (!API_BASE_URL) return [];

    const response = await fetch(`${API_BASE_URL}/tickets`);
    if (!response.ok) {
      throw new Error("Impossible de charger les tickets depuis l’API.");
    }

    const payload = await response.json();
    return Array.isArray(payload) ? payload.map(normalizeTicket) : [];
  }

  useEffect(() => {
    let alive = true;

    async function loadTickets() {
      try {
        if (supabase && session && isAdmin) {
          const { data, error } = await supabase
            .from("tickets")
            .select("*")
            .order("created_at", { ascending: false });
          if (error) throw error;
          if (alive) setTickets((data || []).map(normalizeTicket));
          return;
        }
        if (supabase || !import.meta.env.DEV) return;

        const remoteTickets = await fetchTicketsFromApi();
        if (!alive || remoteTickets.length === 0) return;

        setTickets((current) => {
          const existingIds = new Set(current.map((ticket) => ticket.id));
          const merged = [...remoteTickets, ...current.filter((ticket) => !existingIds.has(ticket.id))];
          return merged.length > 0 ? merged : current;
        });
      } catch {
        // Fallback local si le stockage distant est indisponible.
      }
    }

    loadTickets();

    return () => {
      alive = false;
    };
  }, [session?.user?.id, isAdmin]);
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "Moyenne",
    category: "Général",
    status: "Ouvert",
  });
  const [ticketFilters, setTicketFilters] = useState({
    query: "",
    priority: "",
    status: "",
  });
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [ticketMessage, setTicketMessage] = useState("");
  const [showCaseForm, setShowCaseForm] = useState(false);
  const [syncState, setSyncState] = useState("local");
  const supportSummary = useMemo(
    () => getSupportLabSummary(topicDone, SUPPORT_LABS),
    [topicDone],
  );
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery";
    if (recoveryLink) setResetMode(true);
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthMessage("Impossible de vérifier la session. Réessaie.");
      setSession(data?.session ?? null);
      setAuthReady(true);
    }).catch(() => {
      setAuthMessage("Service d’authentification indisponible. Réessaie plus tard.");
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAdmin(import.meta.env.DEV);
      setAdminReady(true);
      return;
    }
    if (!session) {
      setIsAdmin(false);
      setAdminReady(true);
      return;
    }

    let active = true;
    setIsAdmin(false);
    setAdminReady(false);
    const timer = setTimeout(() => {
      void verifyAdminAccess();
    }, 0);

    async function verifyAdminAccess() {
      try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;

      if (error || !data) {
        setIsAdmin(false);
        setAuthMessage("Accès refusé : ce compte n’est pas autorisé à accéder à cet espace.");
        if (active) setAdminReady(true);
        await supabase.auth.signOut();
        return;
      }

      setIsAdmin(true);
      setAuthMessage("");
      setAdminReady(true);
      } catch {
        if (!active) return;
        setIsAdmin(false);
        setAuthMessage("Autorisation impossible à vérifier. Accès bloqué par sécurité.");
        setAdminReady(true);
        await supabase.auth.signOut();
      }
    }

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const snapshot = {
      completed: readFromStorage("study-completed", {}),
      topicDone: readFromStorage("study-topics", {}),
      cases: readFromStorage("study-cases", []),
      review: readFromStorage("study-review", DEFAULT_REVIEW),
    };
    setCompleted(snapshot.completed);
    setTopicDone(snapshot.topicDone);
    setCases(snapshot.cases);
    setReview(snapshot.review);
  }, []);
  useEffect(() => {
    localStorage.setItem("study-completed", JSON.stringify(completed));
  }, [completed]);
  useEffect(() => {
    localStorage.setItem("study-topics", JSON.stringify(topicDone));
  }, [topicDone]);
  useEffect(() => {
    localStorage.setItem("study-cases", JSON.stringify(cases));
  }, [cases]);
  useEffect(() => {
    localStorage.setItem("study-review", JSON.stringify(review));
  }, [review]);
  useEffect(() => {
    localStorage.setItem("study-tickets", JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    if (!session || !supabase || !isAdmin) {
      setSyncState("local");
      return;
    }
    let active = true;
    (async () => {
      setSyncState("syncing");
      const localSnapshot = {
        completed: readFromStorage("study-completed", {}),
        topicDone: readFromStorage("study-topics", {}),
        cases: readFromStorage("study-cases", []),
        review: readFromStorage("study-review", DEFAULT_REVIEW),
      };

      const { data, error } = await supabase
        .from("study_progress")
        .select("data")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        setSyncState("error");
        return;
      }

      const remoteData = data?.data || {};
      const nextState = mergeProgressData(remoteData, localSnapshot);

      setCompleted(nextState.completed);
      setTopicDone(nextState.topicDone);
      setCases(nextState.cases);
      setReview(nextState.review);
      setSyncState("synced");
    })();
    return () => {
      active = false;
    };
  }, [session?.user?.id, isAdmin]);

  useEffect(() => {
    if (!session || !supabase || !isAdmin || syncState !== "synced") return;
    const timer = setTimeout(async () => {
      setSyncState("syncing");
      const payload = { completed, topicDone, cases, review };
      const { error } = await supabase
        .from("study_progress")
        .upsert(
          {
            user_id: session.user.id,
            data: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      setSyncState(error ? "error" : "synced");
    }, 700);
    return () => clearTimeout(timer);
  }, [completed, topicDone, cases, review, session?.user?.id, isAdmin]);

  const allCount = initialTasks.filter((task) => task.isWorkSession).length;
  const completedCount = initialTasks.filter(
    (task) => task.isWorkSession && completed[task.id],
  ).length;
  const percent = allCount === 0 ? 0 : Math.round((completedCount / allCount) * 100);
  const dayTasks = initialTasks.filter((t) => t.day === selectedDay);
  const doneHours = initialTasks
    .filter((t) => t.isWorkSession && completed[t.id])
    .reduce((s, t) => s + t.duration, 0);
  const thisWeek = useMemo(
    () => initialTasks.filter((t) => completed[t.id]).length,
    [completed],
  );
  async function handleAuth(e) {
    e.preventDefault();
    setBusy(true);
    setAuthMessage("");
    if (!supabase) {
      setAuthMessage(
        "Configure les variables Supabase dans le fichier .env pour activer les comptes en ligne.",
      );
      setBusy(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setAuthMessage(error?.message || "Connexion vérifiée. Contrôle de l’autorisation en cours…");
    } catch {
      setAuthMessage("Connexion impossible. Vérifie les informations saisies et réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePasswordReset() {
    if (!supabase) {
      setAuthMessage(
        "Configure les variables Supabase dans le fichier .env pour réinitialiser le mot de passe.",
      );
      return;
    }
    if (!email.trim()) {
      setAuthMessage("Saisis ton e-mail pour recevoir le lien de réinitialisation.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
    });
    setAuthMessage(
      error
        ? error.message
        : "Un e-mail de réinitialisation a été envoyé à ton adresse.",
    );
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    if (!supabase || password.length < 8) {
      setAuthMessage("Choisis un mot de passe d’au moins 8 caractères.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      setAuthMessage(error?.message || "Mot de passe mis à jour.");
      if (!error) setResetMode(false);
    } catch {
      setAuthMessage("Mise à jour impossible. Demande un nouveau lien de réinitialisation.");
    } finally {
      setPassword("");
      setBusy(false);
    }
  }

  async function logout() {
    await supabase?.auth.signOut();
    setSession(null);
    setAdminReady(true);
    setIsAdmin(false);
  }
  function toggleTask(id) {
    setCompleted((old) => ({ ...old, [id]: !old[id] }));
  }
  function addCase(e) {
    e.preventDefault();
    if (!caseForm.symptom.trim()) return;
    setCases((old) => [
      { ...caseForm, id: crypto.randomUUID(), created: dateKey() },
      ...old,
    ]);
    setCaseForm({ symptom: "", cause: "", solution: "" });
    setShowCaseForm(false);
  }

  function resetTicketForm() {
    setTicketForm({
      title: "",
      description: "",
      priority: "Moyenne",
      category: "Général",
      status: "Ouvert",
    });
    setEditingTicketId(null);
  }

  async function handleTicketSubmit(e) {
    e.preventDefault();
    const errors = validateTicketInput(ticketForm);
    if (Object.keys(errors).length > 0) {
      setTicketMessage(Object.values(errors)[0]);
      return;
    }

    const payload = {
      title: ticketForm.title,
      description: ticketForm.description,
      priority: ticketForm.priority,
      category: ticketForm.category,
      status: ticketForm.status,
    };

    try {
      let ticketFromApi;
      if (supabase && session) {
        const query = editingTicketId
          ? supabase.from("tickets").update(payload).eq("id", editingTicketId)
          : supabase.from("tickets").insert({ ...payload, user_id: session.user.id });
        const { data, error } = await query.select().single();
        if (error) throw error;
        ticketFromApi = normalizeTicket(data);
      } else if (supabase || !import.meta.env.DEV) {
        throw new Error("Accès distant non autorisé");
      } else {
        if (!API_BASE_URL) throw new Error("API distante non configurée");
        const url = editingTicketId
          ? `${API_BASE_URL}/tickets/${editingTicketId}`
          : `${API_BASE_URL}/tickets`;
        const method = editingTicketId ? "PUT" : "POST";
        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) throw new Error("Erreur API");
        ticketFromApi = normalizeTicket(await response.json());
      }

      if (editingTicketId) {
        setTickets((old) =>
          old.map((ticket) =>
            ticket.id === editingTicketId || ticket.id === ticketFromApi.id
              ? { ...ticket, ...ticketFromApi }
              : ticket,
          ),
        );
        setTicketMessage("Ticket mis à jour avec succès.");
      } else {
        setTickets((old) => [ticketFromApi, ...old.filter((ticket) => ticket.id !== ticketFromApi.id)]);
        setTicketMessage("Ticket ajouté avec succès via l’API.");
      }
    } catch {
      if (supabase || !import.meta.env.DEV) {
        setTicketMessage("Échec de l’enregistrement sécurisé. Aucune modification locale n’a été effectuée.");
        return;
      }
      if (editingTicketId) {
        setTickets((old) =>
          old.map((ticket) =>
            ticket.id === editingTicketId
              ? {
                  ...ticket,
                  title: ticketForm.title,
                  description: ticketForm.description,
                  priority: ticketForm.priority,
                  category: ticketForm.category,
                  status: ticketForm.status,
                }
              : ticket,
          ),
        );
        setTicketMessage("Ticket modifié localement. L’API n’est pas disponible.");
      } else {
        const newTicket = createTicket({
          ...ticketForm,
          createdAt: dateKey(),
        });
        setTickets((old) => [newTicket, ...old]);
        setTicketMessage("Ticket ajouté localement. L’API n’est pas disponible.");
      }
    }

    resetTicketForm();
  }

  async function closeTicket(ticketId) {
    try {
      let closedTicket;
      if (supabase && session) {
        const { data, error } = await supabase
          .from("tickets")
          .update({ status: "Fermé", closed_at: new Date().toISOString() })
          .eq("id", ticketId)
          .select()
          .single();
        if (error) throw error;
        closedTicket = normalizeTicket(data);
      } else if (supabase || !import.meta.env.DEV) {
        throw new Error("Accès distant non autorisé");
      } else {
        if (!API_BASE_URL) throw new Error("API distante non configurée");
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/close`, {
          method: "POST",
        });
        if (!response.ok) throw new Error("Erreur API");
        const result = await response.json();
        closedTicket = normalizeTicket(result.ticket);
      }

      setTickets((old) =>
        old.map((ticket) =>
          ticket.id === closedTicket.id || ticket.id === ticketId ? { ...ticket, ...closedTicket, status: "Fermé" } : ticket,
        ),
      );
      setTicketMessage("Ticket clôturé avec succès.");
      return;
    } catch {
      if (supabase || !import.meta.env.DEV) {
        setTicketMessage("Impossible de clôturer le ticket dans le stockage sécurisé.");
        return;
      }
      setTickets((old) =>
        old.map((ticket) =>
          ticket.id === ticketId ? { ...ticket, status: "Fermé" } : ticket,
        ),
      );
      setTicketMessage("Ticket clôturé localement. L’API n’est pas disponible.");
    }
  }

  async function deleteTicket(ticketId) {
    try {
      if (supabase && session) {
        const { error } = await supabase.from("tickets").delete().eq("id", ticketId);
        if (error) throw error;
      } else if (supabase || !import.meta.env.DEV) {
        throw new Error("Accès distant non autorisé");
      } else {
        if (!API_BASE_URL) throw new Error("API distante non configurée");
        const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Erreur API");
      }

      setTickets((old) => old.filter((ticket) => ticket.id !== ticketId));
      setTicketMessage("Ticket supprimé avec succès.");
      if (editingTicketId === ticketId) {
        resetTicketForm();
      }
      return;
    } catch {
      if (supabase || !import.meta.env.DEV) {
        setTicketMessage("Impossible de supprimer le ticket dans le stockage sécurisé.");
        return;
      }
      setTickets((old) => old.filter((ticket) => ticket.id !== ticketId));
      setTicketMessage("Ticket supprimé localement. L’API n’est pas disponible.");
      if (editingTicketId === ticketId) {
        resetTicketForm();
      }
    }
  }

  function editTicket(ticket) {
    setTicketForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
      status: ticket.status,
    });
    setEditingTicketId(ticket.id);
    setTicketMessage("Modifie le ticket puis enregistre les changements.");
  }

  async function exportTickets() {
    try {
      if (supabase && session && isAdmin) {
        const { data, error } = await supabase
          .from("tickets")
          .select("id,title,description,priority,status,category,created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        const csv = exportTicketsCsv((data || []).map(normalizeTicket));
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "tickets.csv";
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      if (supabase || !import.meta.env.DEV) throw new Error("Accès distant non autorisé");
      if (!API_BASE_URL) throw new Error("API distante non configurée");

      const response = await fetch(`${API_BASE_URL}/tickets/export.csv`);
      if (!response.ok) {
        throw new Error("CSV API indisponible");
      }

      const csv = await response.text();
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tickets.csv";
      link.click();
      URL.revokeObjectURL(url);
      return;
    } catch {
      if (supabase || !import.meta.env.DEV) {
        setTicketMessage("Export impossible : vérifie la connexion sécurisée.");
        return;
      }
      const csv = exportTicketsCsv(tickets);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "tickets.csv";
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  const visibleTickets = useMemo(
    () => filterTickets(tickets, ticketFilters),
    [tickets, ticketFilters],
  );

  const nav = [
    ["dashboard", "Tableau de bord", LayoutDashboard],
    ["planning", "Mon planning", CalendarDays],
    ["python", "Parcours Python", Code2],
    ["support", "Support N2/N3", Server],
    ["cases", "Cahier de cas", Wrench],
    ["review", "Bilan hebdomadaire", TrendingUp],
  ];
  if (!authReady)
    return <div className="loading">Préparation de ton espace…</div>;
  if (accessState === "configuration-required")
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand-mark"><ShieldCheck size={28} /></div>
          <p className="eyebrow">ACCÈS SÉCURISÉ</p>
          <h1>Accès temporairement fermé</h1>
          <p className="muted">L’authentification n’est pas encore configurée. L’accès au site est bloqué jusqu’à l’activation de Supabase.</p>
        </div>
      </div>
    );
  if (["login-required", "verification-pending"].includes(accessState))
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand-mark">
            <ShieldCheck size={28} />
          </div>
          <p className="eyebrow">ESPACE ADMINISTRATEUR</p>
          <h1>{session ? "Vérification de l’accès" : "Connexion sécurisée"}</h1>
          <p className="muted">
            {session && !adminReady
              ? "Vérification de ton autorisation…"
              : "Accès réservé aux comptes ajoutés à la liste des administrateurs."}
          </p>
          {!session && <form onSubmit={handleAuth}>
            <label>
              Adresse e-mail
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="toi@exemple.com"
              />
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                placeholder="6 caractères minimum"
              />
            </label>
            <button className="primary full" disabled={busy}>
              {busy ? "Patiente…" : "Se connecter"}
            </button>
          </form>}
          {!session && (
            <button className="link-button" onClick={handlePasswordReset}>
              Mot de passe oublié ?
            </button>
          )}
          {authMessage && <p className="notice">{authMessage}</p>}
          {session && <button className="link-button" onClick={logout}>Se déconnecter</button>}
          <p className="tiny muted">
            Aucun compte ne peut s’inscrire depuis cette page. L’administrateur doit autoriser les comptes depuis Supabase.
          </p>
        </div>
      </div>
    );
  if (accessState === "granted" && resetMode)
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="brand-mark"><ShieldCheck size={28} /></div>
          <p className="eyebrow">ESPACE ADMINISTRATEUR</p>
          <h1>Nouveau mot de passe</h1>
          <form onSubmit={handlePasswordUpdate}>
            <label>
              Mot de passe (8 caractères minimum)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength="8"
                autoComplete="new-password"
                required
              />
            </label>
            <button className="primary full" disabled={busy}>
              {busy ? "Patiente…" : "Enregistrer le mot de passe"}
            </button>
          </form>
          {authMessage && <p className="notice">{authMessage}</p>}
        </div>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={23} />
          </div>
          <div>
            <strong>Mon espace</strong>
            <span>FORMATION</span>
          </div>
          <button
            className="icon-btn mobile-close"
            onClick={() => setMenuOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <div className="side-label">ESPACE DE TRAVAIL</div>
        {nav.map(([id, label, Icon]) => (
          <button
            key={id}
            className={`nav-item ${view === id ? "active" : ""}`}
            onClick={() => {
              setView(id);
              setMenuOpen(false);
            }}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === "cases" && cases.length > 0 && <em>{cases.length}</em>}
          </button>
        ))}
        <div className="sidebar-bottom">
          <div className="streak">
            <Flame size={19} />
            <div>
              <strong>La régularité avant tout</strong>
              <span>Un petit pas chaque jour.</span>
            </div>
          </div>
          {session && isAdmin && (
            <button className="nav-item" onClick={logout}>
              <LogOut size={18} />
              Se déconnecter
            </button>
          )}
        </div>
      </aside>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-toggle"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="breadcrumb">
            Mon espace <span>/</span> {nav.find((n) => n[0] === view)?.[1]}
          </div>
          <div className="top-right">
            <span className={`sync-pill ${syncState}`}>
              <span className="sync-dot" />
              {syncState === "synced"
                ? "Synchronisé"
                : syncState === "syncing"
                  ? "Synchronisation…"
                  : syncState === "error"
                    ? "Erreur de sync"
                    : "Mode local"}
            </span>
            <div className="avatar">
              {session?.user?.email?.[0]?.toUpperCase() || "A"}
            </div>
          </div>
        </header>
        <div className="content">
          {view === "dashboard" && (
            <>
              <div className="welcome">
                <div>
                  <p className="eyebrow">TON ESPACE D'APPRENTISSAGE</p>
                  <h1>Chaque séance te rapproche de ton objectif.</h1>
                  <p className="muted">
                    Apprends, pratique, documente. La régularité fait la
                    différence.
                  </p>
                </div>
                <div className="welcome-icon">
                  <Target size={35} />
                </div>
              </div>
              <div className="stats-grid">
                <Stat
                  icon={CheckCircle2}
                  label="Tâches terminées"
                  value={`${completedCount}/${allCount}`}
                  sub={`${percent}% du planning coché`}
                />
                <Stat
                  icon={Clock3}
                  label="Heures suivies"
                  value={`${doneHours.toFixed(1)} h`}
                  sub="D'après les tâches cochées"
                />
                <Stat
                  icon={Code2}
                  label="Python"
                  value={`${topics.reduce((n, m) => n + m.items.filter((i) => topicDone[i]).length, 0)}/15`}
                  sub="Notions marquées maîtrisées"
                />
                <Stat
                  icon={BookOpen}
                  label="Cas documentés"
                  value={cases.length}
                  sub="Dans ton cahier de cas"
                />
              </div>
              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Le planning de la semaine</h2>
                      <p className="muted">
                        Coche une séance quand tu l'as réellement terminée.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setView("planning")}
                    >
                      Tout voir ↗
                    </button>
                  </div>
                  <div className="week-strip">
                    {plan.map((p) => (
                      <button
                        key={p.day}
                        onClick={() => {
                          setSelectedDay(p.day);
                          setView("planning");
                        }}
                        className={`week-day ${p.day === todayName ? "today" : ""}`}
                      >
                        <span>{p.day.slice(0, 3)}</span>
                        <strong>
                          {
                            initialTasks.filter(
                              (t) => t.day === p.day && completed[t.id],
                            ).length
                          }
                          /{initialTasks.filter((t) => t.day === p.day).length}
                        </strong>
                        <i>
                          <b
                            style={{
                              width: `${(initialTasks.filter((t) => t.day === p.day && completed[t.id]).length / initialTasks.filter((t) => t.day === p.day).length) * 100}%`,
                            }}
                          />
                        </i>
                      </button>
                    ))}
                  </div>
                  <div className="next-task">
                    <div className="next-icon">
                      <CalendarDays size={20} />
                    </div>
                    <div>
                      <strong>
                        Prochaine étape :{" "}
                        {plan.find((p) => p.day === todayName)?.morning ||
                          "Faire le bilan de la semaine"}
                      </strong>
                      <p className="muted">
                        Commence par une séance courte et précise.
                      </p>
                    </div>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Progression globale</h2>
                      <p className="muted">Une tâche à la fois.</p>
                    </div>
                    <span className="progress-number">{percent}%</span>
                  </div>
                  <div className="big-progress">
                    <div style={{ width: `${percent}%` }} />
                  </div>
                  <div className="progress-legend">
                    <span>
                      <i className="legend-dot python-dot" />
                      Python & projet
                    </span>
                    <span>
                      <i className="legend-dot support-dot" />
                      Support N2/N3
                    </span>
                  </div>
                  <div className="tip-box">
                    <CircleHelp size={18} />
                    <p>
                      <strong>Règle anti-vibe coding</strong>
                      <br />
                      Cherche seul pendant 15 minutes avant de demander une
                      explication. Tu dois pouvoir expliquer ton code à voix
                      haute.
                    </p>
                  </div>
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Ton parcours sur 3 mois</h2>
                    <p className="muted">
                      Progresse à ton rythme, sans sauter les bases.
                    </p>
                  </div>
                </div>
                <div className="roadmap">
                  {topics.map((m, i) => (
                    <div className="roadmap-card" key={m.month}>
                      <div className="roadmap-top">
                        <span className="month-tag">{m.month}</span>
                        <span className="muted tiny">
                          {m.items.filter((x) => topicDone[x]).length}/
                          {m.items.length} notions
                        </span>
                      </div>
                      <h3>{m.title}</h3>
                      <div className="mini-progress">
                        <div
                          style={{
                            width: `${(m.items.filter((x) => topicDone[x]).length / m.items.length) * 100}%`,
                          }}
                        />
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setView("python")}
                      >
                        Continuer le parcours ↗
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          {view === "planning" && (
            <>
              <PageTitle
                eyebrow="ORGANISATION"
                title="Mon planning"
                description="Un cadre stable, mais assez souple pour durer."
              />
              <div className="day-tabs">
                {plan.map((p) => (
                  <button
                    key={p.day}
                    onClick={() => setSelectedDay(p.day)}
                    className={selectedDay === p.day ? "selected" : ""}
                  >
                    {p.day}
                  </button>
                ))}
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>{selectedDay}</h2>
                    <p className="muted">Séances prévues pour cette journée.</p>
                  </div>
                  <span className="month-tag">
                    {dayTasks.filter((t) => completed[t.id]).length}/
                    {dayTasks.length} terminées
                  </span>
                </div>
                {dayTasks.map((t) => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    checked={!!completed[t.id]}
                    onToggle={() => toggleTask(t.id)}
                  />
                ))}
              </section>
              <p className="muted small-note">
                Astuce : si tu rates une journée, reprends le lendemain. Évite
                simplement deux jours d'arrêt consécutifs.
              </p>
            </>
          )}
          {view === "python" && (
            <>
              <PageTitle
                eyebrow="APPRENTISSAGE PRATIQUE"
                title="Parcours Python"
                description="Du premier concept à un gestionnaire de tickets présentable dans ton portfolio."
              />
              <div className="principle-banner">
                <Code2 size={22} />
                <div>
                  <strong>Tu écris le code toi-même.</strong>
                  <p>
                    Lis une notion, fais un exercice sans copier de solution,
                    puis explique à voix haute ce que fait chaque ligne.
                  </p>
                </div>
              </div>
              {topics.map((m, idx) => (
                <section className="panel topic-panel" key={m.month}>
                  <div className="panel-heading">
                    <div>
                      <span className="month-tag">{m.month}</span>
                      <h2>{m.title}</h2>
                    </div>
                    <span className="muted tiny">
                      {m.items.filter((x) => topicDone[x]).length}/
                      {m.items.length} maîtrisées
                    </span>
                  </div>
                  {m.items.map((item, i) => (
                    <label className="topic-row" key={item}>
                      <input
                        type="checkbox"
                        checked={!!topicDone[item]}
                        onChange={(e) =>
                          setTopicDone((old) => ({
                            ...old,
                            [item]: e.target.checked,
                          }))
                        }
                      />
                      <span>
                        <strong>{item}</strong>
                        <small>
                          {idx === 0
                            ? [
                                "Comprendre les types et affectations",
                                "Écrire des conditions et répéter des actions",
                                "Découper le programme en fonctions",
                                "Organiser des collections de données",
                                "Lire et sauvegarder des données",
                              ][i]
                            : idx === 1
                              ? [
                                  "Créer des classes et objets",
                                  "Anticiper les erreurs avec try/except",
                                  "Réutiliser du code proprement",
                                  "Suivre les changements du projet",
                                  "Vérifier le comportement du programme",
                                ][i]
                              : [
                                  "Définir les besoins et les données",
                                  "Créer les fonctions principales",
                                  "Ajouter la recherche et la clôture",
                                  "Sauvegarder les tickets en CSV",
                                  "Rédiger README et exemples",
                                ][i]}
                        </small>
                      </span>
                      {topicDone[item] && (
                        <CheckCircle2 size={18} className="success-icon" />
                      )}
                    </label>
                  ))}
                </section>
              ))}
              <section className="panel">
                <h2>Projet fil rouge : gestionnaire de tickets</h2>
                <p className="muted">
                  Version 1 : ajouter un ticket avec un titre et une priorité.
                  Version 2 : rechercher et clôturer. Version 3 : exporter les
                  données en CSV.
                </p>
                <div className="project-steps">
                  <span>01 · Définir les données</span>
                  <span>02 · Créer les fonctions</span>
                  <span>03 · Gérer les erreurs</span>
                  <span>04 · Tester et documenter</span>
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Tickets IT</h2>
                    <p className="muted">
                      Ajoute, recherche, filtre et exporte un ticket de démonstration.
                    </p>
                  </div>
                  <button className="primary" onClick={exportTickets}>
                    Export CSV
                  </button>
                </div>

                <form className="case-form" onSubmit={handleTicketSubmit}>
                  <label>
                    Titre
                    <input
                      value={ticketForm.title}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, title: e.target.value })
                      }
                      placeholder="Ex. : Poste bloqué"
                    />
                  </label>
                  <label>
                    Description
                    <textarea
                      value={ticketForm.description}
                      onChange={(e) =>
                        setTicketForm({ ...ticketForm, description: e.target.value })
                      }
                      placeholder="Ex. : L’utilisateur ne peut plus ouvrir Outlook."
                    />
                  </label>
                  <div className="form-row">
                    <label>
                      Priorité
                      <select
                        value={ticketForm.priority}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, priority: e.target.value })
                        }
                      >
                        <option>Faible</option>
                        <option>Moyenne</option>
                        <option>Haute</option>
                        <option>Critique</option>
                      </select>
                    </label>
                    <label>
                      Catégorie
                      <input
                        value={ticketForm.category}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, category: e.target.value })
                        }
                        placeholder="Réseau"
                      />
                    </label>
                    <label>
                      Statut
                      <select
                        value={ticketForm.status}
                        onChange={(e) =>
                          setTicketForm({ ...ticketForm, status: e.target.value })
                        }
                      >
                        <option>Ouvert</option>
                        <option>En cours</option>
                        <option>Fermé</option>
                      </select>
                    </label>
                  </div>
                  <div className="form-actions">
                    <button className="primary" type="submit">
                      {editingTicketId ? "Enregistrer les modifications" : "Ajouter le ticket"}
                    </button>
                    {editingTicketId && (
                      <button
                        className="secondary"
                        type="button"
                        onClick={resetTicketForm}
                      >
                        Annuler
                      </button>
                    )}
                  </div>
                </form>

                {ticketMessage && <p className="notice">{ticketMessage}</p>}

                <div className="filter-bar">
                  <input
                    value={ticketFilters.query}
                    onChange={(e) =>
                      setTicketFilters({ ...ticketFilters, query: e.target.value })
                    }
                    placeholder="Rechercher"
                  />
                  <select
                    value={ticketFilters.priority}
                    onChange={(e) =>
                      setTicketFilters({
                        ...ticketFilters,
                        priority: e.target.value,
                      })
                    }
                  >
                    <option value="">Toutes priorités</option>
                    <option>Faible</option>
                    <option>Moyenne</option>
                    <option>Haute</option>
                    <option>Critique</option>
                  </select>
                  <select
                    value={ticketFilters.status}
                    onChange={(e) =>
                      setTicketFilters({ ...ticketFilters, status: e.target.value })
                    }
                  >
                    <option value="">Tous statuts</option>
                    <option>Ouvert</option>
                    <option>En cours</option>
                    <option>Fermé</option>
                  </select>
                </div>

                <div className="ticket-list">
                  {visibleTickets.length === 0 ? (
                    <div className="empty-state">
                      <BookOpen size={26} />
                      <strong>Aucun ticket ne correspond à la recherche.</strong>
                    </div>
                  ) : (
                    visibleTickets.map((ticket) => (
                      <article className="case-card" key={ticket.id}>
                        <div className="case-title">
                          <div>
                            <span className="month-tag">{ticket.id}</span>
                            <h3>{ticket.title}</h3>
                          </div>
                          <span className="month-tag">{ticket.status}</span>
                        </div>
                        <p>{ticket.description}</p>
                        <div className="ticket-meta">
                          <span>{ticket.priority}</span>
                          <span>{ticket.category}</span>
                          <span>{ticket.createdAt}</span>
                        </div>
                        <div className="form-actions ticket-actions">
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => editTicket(ticket)}
                          >
                            Modifier
                          </button>
                          {ticket.status !== "Fermé" && (
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => closeTicket(ticket.id)}
                            >
                              Fermer
                            </button>
                          )}
                          <button
                            type="button"
                            className="secondary danger"
                            onClick={() => deleteTicket(ticket.id)}
                          >
                            Supprimer
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
          {view === "support" && (
            <>
              <PageTitle
                eyebrow="COMPÉTENCES IT"
                title="Support N2/N3"
                description="Relie chaque thème à un laboratoire concret et à un cas de dépannage."
              />
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Liste des compétences</h2>
                    <p className="muted">
                      Coche une notion quand tu peux l'expliquer et la
                      pratiquer.
                    </p>
                  </div>
                  <ShieldCheck size={23} className="muted" />
                </div>
                {supportTopics.map((t, i) => (
                  <label className="topic-row" key={t}>
                    <input
                      type="checkbox"
                      checked={!!topicDone["support:" + t]}
                      onChange={(e) =>
                        setTopicDone((old) => ({
                          ...old,
                          ["support:" + t]: e.target.checked,
                        }))
                      }
                    />
                    <span>
                      <strong>{t}</strong>
                      <small>
                        {
                          [
                            "Comprendre les adresses IP et le routage",
                            "Résoudre les problèmes de résolution et d’attribution IP",
                            "Savoir interpréter les résultats des commandes",
                            "Administrer les comptes et services Windows",
                            "Appliquer le principe du moindre privilège",
                            "Automatiser des tâches d’administration",
                            "Classer, diagnostiquer et escalader un incident",
                            "Choisir une certification et réviser régulièrement",
                          ][i]
                        }
                      </small>
                    </span>
                    {topicDone["support:" + t] && (
                      <CheckCircle2 size={18} className="success-icon" />
                    )}
                  </label>
                ))}
              </section>
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Suivi du support</h2>
                    <p className="muted">
                      {supportSummary.completedCount}/{supportSummary.total} compétences validées
                    </p>
                  </div>
                  <span className="month-tag">{supportSummary.percent}%</span>
                </div>
                <div className="tip-box standalone">
                  <CircleHelp size={18} />
                  <p>
                    <strong>Prochain labo logique :</strong> {supportSummary.nextLab.title}
                    <br />
                    {supportSummary.nextLab.objective}
                  </p>
                </div>
                <div className="project-steps support-meta">
                  <span>{supportSummary.nextLab.duration}</span>
                  <span>{supportSummary.remainingLabs.length} restantes</span>
                  <span>{supportSummary.nextLab.skill.replace("support:", "")}</span>
                  <span>{supportSummary.nextLab.deliverable}</span>
                </div>
              </div>
              <section className="panel lab-panel">
                <div className="panel-heading">
                  <div>
                    <h2>Laboratoire recommandé</h2>
                    <p className="muted">Réalise la séance suivante pour progresser dans la compétence cible.</p>
                  </div>
                  <span className="month-tag">{supportSummary.nextLab.duration}</span>
                </div>
                <div className="lab-card">
                  <h3>{supportSummary.nextLab.title}</h3>
                  <p>{supportSummary.nextLab.objective}</p>
                  <div className="lab-deliverable">
                    <strong>Livrable attendu :</strong> {supportSummary.nextLab.deliverable}
                  </div>
                  <ul className="lab-steps">
                    {supportSummary.nextLab.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                  <button
                    className="primary"
                    type="button"
                    onClick={() =>
                      setTopicDone((old) => ({
                        ...old,
                        [supportSummary.nextLab.skill]: true,
                      }))
                    }
                  >
                    Marquer cette compétence comme validée
                  </button>
                </div>
              </section>
              <div className="tip-box standalone">
                <CircleHelp size={18} />
                <p>
                  <strong>Le cahier de cas est ton avantage.</strong>
                  <br />
                  Pour chaque incident, note le symptôme, les vérifications, la
                  cause confirmée, la solution et le résultat.
                </p>
              </div>
            </>
          )}
          {view === "cases" && (
            <>
              <PageTitle
                eyebrow="APPRENTISSAGE PAR L'EXPÉRIENCE"
                title="Cahier de cas"
                description="Transforme chaque dépannage en connaissance réutilisable."
              />
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Cas documentés ({cases.length})</h2>
                    <p className="muted">
                      N'inclus pas de mots de passe, données personnelles ou
                      informations confidentielles.
                    </p>
                  </div>
                  <button
                    className="primary"
                    onClick={() => setShowCaseForm(!showCaseForm)}
                  >
                    <Plus size={16} /> Ajouter un cas
                  </button>
                </div>
                {showCaseForm && (
                  <form className="case-form" onSubmit={addCase}>
                    <label>
                      Symptôme observé *
                      <textarea
                        required
                        value={caseForm.symptom}
                        onChange={(e) =>
                          setCaseForm({ ...caseForm, symptom: e.target.value })
                        }
                        placeholder="Ex. : le poste ne résout pas les noms DNS."
                      />
                    </label>
                    <label>
                      Cause identifiée
                      <textarea
                        value={caseForm.cause}
                        onChange={(e) =>
                          setCaseForm({ ...caseForm, cause: e.target.value })
                        }
                        placeholder="Ex. : mauvais serveur DNS configuré."
                      />
                    </label>
                    <label>
                      Solution et vérification
                      <textarea
                        value={caseForm.solution}
                        onChange={(e) =>
                          setCaseForm({ ...caseForm, solution: e.target.value })
                        }
                        placeholder="Ex. : corriger la configuration, puis tester nslookup."
                      />
                    </label>
                    <div className="form-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setShowCaseForm(false)}
                      >
                        Annuler
                      </button>
                      <button className="primary">Enregistrer le cas</button>
                    </div>
                  </form>
                )}
                {cases.length === 0 && !showCaseForm && (
                  <div className="empty-state">
                    <BookOpen size={30} />
                    <strong>Ton premier cas commence ici.</strong>
                    <p>
                      Documente un problème résolu pour mieux t'en souvenir et
                      progresser.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => setShowCaseForm(true)}
                    >
                      Ajouter mon premier cas
                    </button>
                  </div>
                )}
                {cases.map((c) => (
                  <article className="case-card" key={c.id}>
                    <div className="case-title">
                      <div>
                        <span className="month-tag">{c.created}</span>
                        <h3>{c.symptom}</h3>
                      </div>
                      <button
                        className="icon-btn danger"
                        title="Supprimer ce cas"
                        onClick={() =>
                          setCases((old) => old.filter((x) => x.id !== c.id))
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    {c.cause && (
                      <p>
                        <strong>Cause :</strong> {c.cause}
                      </p>
                    )}
                    {c.solution && (
                      <p>
                        <strong>Solution :</strong> {c.solution}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
          {view === "review" && (
            <>
              <PageTitle
                eyebrow="RÉFLEXION ET AJUSTEMENT"
                title="Bilan hebdomadaire"
                description="Le dimanche, observe ce qui fonctionne et choisis tes priorités suivantes."
              />
              <div className="stats-grid">
                <Stat
                  icon={CheckCircle2}
                  label="Tâches cochées"
                  value={thisWeek}
                  sub="Sur l'ensemble du planning"
                />
                <Stat
                  icon={Clock3}
                  label="Temps suivi"
                  value={`${doneHours.toFixed(1)} h`}
                  sub="Estimation basée sur les séances"
                />
                <Stat
                  icon={Target}
                  label="Progression"
                  value={`${percent}%`}
                  sub="Planning total"
                />
              </div>
              <section className="panel review-form">
                <label>
                  Qu'ai-je appris ou accompli cette semaine ?
                  <textarea
                    value={review.wins}
                    onChange={(e) =>
                      setReview({ ...review, wins: e.target.value })
                    }
                    placeholder="Ex. : j'ai compris les fonctions et résolu un incident DNS…"
                  />
                </label>
                <label>
                  Qu'est-ce qui m'a bloqué ?
                  <textarea
                    value={review.blockers}
                    onChange={(e) =>
                      setReview({ ...review, blockers: e.target.value })
                    }
                    placeholder="Ex. : j'ai eu du mal à structurer mes données…"
                  />
                </label>
                <label>
                  Mes trois priorités pour la semaine prochaine
                  <textarea
                    value={review.next}
                    onChange={(e) =>
                      setReview({ ...review, next: e.target.value })
                    }
                    placeholder="1. …&#10;2. …&#10;3. …"
                  />
                </label>
                <p className="muted tiny">
                  Le bilan est enregistré automatiquement sur cet appareil et
                  synchronisé si ton compte en ligne est configuré.
                </p>
              </section>
            </>
          )}
          <footer className="footer">
            <span>Mon espace formation · Version 1.0</span>
            <span>Apprendre · Pratiquer · Expliquer</span>
          </footer>
        </div>
      </main>
    </div>
  );
}
function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={18} />
      </div>
      <strong>{value}</strong>
      <small>{sub}</small>
    </div>
  );
}
function PageTitle({ eyebrow, title, description }) {
  return (
    <div className="page-title">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
    </div>
  );
}
function TaskRow({ task, checked, onToggle }) {
  return (
    <div className={`task-row ${checked ? "task-done" : ""}`}>
      <button
        className="task-check"
        onClick={onToggle}
        aria-label={checked ? "Marquer non terminée" : "Marquer terminée"}
      >
        {checked ? <CheckCircle2 size={22} /> : <span />}
      </button>
      <div className="task-info">
        <strong>{task.title}</strong>
        <span>
          <i
            className={`category-dot ${task.category === "Python" ? "python-dot" : "support-dot"}`}
          />
          {task.category} · {task.duration} h estimée
        </span>
      </div>
      <span className="task-day">{task.day}</span>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
