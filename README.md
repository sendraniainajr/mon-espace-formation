# Mon espace formation — guide de démarrage

Application web pédagogique en français pour suivre Python et le support informatique N2/N3.

## Fonctions incluses

- Tableau de bord avec progression, heures estimées et tâches cochées.
- Planning hebdomadaire issu du planning fourni.
- Parcours Python sur trois mois.
- Checklist des compétences Support N2/N3.
- Cahier de cas : symptôme, cause et solution.
- Bilan hebdomadaire.
- Sauvegarde locale automatique.
- Connexion réservée aux comptes explicitement autorisés dans Supabase.

## 1. Prérequis

Installe Node.js (version LTS) depuis https://nodejs.org/ et crée un projet gratuit sur https://supabase.com/.

## 2. Installer l'application

Dans le dossier du projet :

```bash
npm install
cp .env.example .env
```

Sous Windows PowerShell, si `cp` ne fonctionne pas :

```powershell
Copy-Item .env.example .env
```

## 3. Configurer la base de données et l’administrateur

Dans Supabase, ouvre **SQL Editor**, colle le contenu de `supabase/schema.sql`, puis exécute-le. Le script crée la liste d’autorisation des administrateurs et réserve les données de l’application aux comptes qui s’y trouvent.

Dans **Authentication > Users**, crée l’utilisateur administrateur avec une adresse e-mail et un mot de passe fort. Ensuite, dans le SQL Editor, ajoute son adresse à la liste blanche en remplaçant l’adresse d’exemple :

```sql
insert into public.admin_users (user_id)
select id from auth.users where email = 'ADMIN@EXEMPLE.COM'
on conflict (user_id) do nothing;
```

Désactive ensuite l’inscription publique dans **Authentication > Settings > User Signups**. Pour autoriser quelqu’un plus tard, crée d’abord son compte dans le tableau de bord Supabase, puis ajoute son adresse à `admin_users` de la même façon. Pour révoquer un accès, supprime sa ligne de `admin_users`.

Dans les paramètres du projet Supabase, récupère l'URL du projet et la clé publique **anon/publishable**. Place-les dans `.env` :

```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE
```

Ne mets jamais une clé `service_role` dans une application web.

Dans Supabase Authentication, configure les URL autorisées. Ajoute l’URL GitHub Pages ci-dessous à **Site URL** et **Redirect URLs**. Le formulaire de l’application accepte uniquement une connexion : la création de comptes se fait dans le tableau de bord Supabase par l’administrateur.

## 4. Démarrer en local

```bash
npm run dev
```

Ouvre l'adresse locale indiquée dans le terminal, souvent `http://localhost:5173`.

Pour vérifier la compilation :

```bash
npm run build
```

## 5. Synchronisation et données

Sans configuration Supabase, l'application fonctionne en mode local sur le navigateur et affiche **Mode local**. Les données ne sont pas synchronisées entre appareils.

Après configuration, connecte-toi avec le compte administrateur autorisé. Les tâches, notions, cas, tickets et bilan sont synchronisés via Supabase. Les politiques RLS refusent l’accès aux données aux comptes qui ne figurent pas dans `admin_users`.

## 6. Mettre l'application en ligne sur GitHub Pages

Le dépôt contient un workflow GitHub Actions qui lance les tests, construit l'application et la publie automatiquement à chaque mise à jour de la branche `main`.

1. Crée un dépôt GitHub (public si tu utilises GitHub Pages avec un compte gratuit) et envoie les fichiers du projet, sans `node_modules`, `dist` ni `.env`.
2. Dans **Settings > Secrets and variables > Actions > Variables**, ajoute `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` avec les valeurs publiques de ton projet Supabase. Ne publie jamais la clé `service_role`.
3. Dans **Settings > Pages**, sélectionne **GitHub Actions** comme source de publication.
4. Attends que l’action **Deploy to GitHub Pages** se termine. L'adresse affichée dans l'environnement `github-pages` sera accessible depuis ton téléphone.
5. Dans Supabase **Authentication > URL Configuration**, ajoute cette adresse aux **Site URL** et **Redirect URLs**. Exécute aussi `supabase/schema.sql` dans le SQL Editor si ce n'est pas déjà fait.
6. Ouvre l'adresse sur le téléphone et connecte-toi avec l’adresse e-mail du compte administrateur créé dans Supabase. La progression et les tickets seront alors synchronisés entre appareils. Les identifiants doivent être créés et réinitialisés dans Supabase, jamais inscrits dans le code ou dans GitHub.

En production, si Supabase n’est pas configuré, l’application reste fermée par sécurité. GitHub Pages sert des fichiers statiques : l’URL et les fichiers du site restent publiquement accessibles, mais l’interface et les données de l’application sont protégées par connexion, liste d’administrateurs et politiques RLS. Pour rendre le site lui-même privé, il faut un hébergement avec contrôle d’accès privé (GitHub Pages ne fournit pas cette restriction sur un compte standard). L’API Python locale n’est pas hébergée par GitHub Pages.

## Structure du projet

- `src/main.jsx` : composants React, planning, état, connexion et synchronisation.
- `src/style.css` : styles adaptatifs ordinateur/mobile.
- `supabase/schema.sql` : table et règles d'accès.
- `.env.example` : modèle de configuration.

## Approche pédagogique

Pour apprendre en construisant :
1. Lis une fonction avant de la modifier.
2. Explique son rôle avec tes propres mots.
3. Change une petite chose.
4. Lance l'application et observe le résultat.
5. Note l'erreur et la façon dont tu l'as comprise.

Commence par `TaskRow`, puis `toggleTask`, puis la liste `plan`. Ce sont de bons premiers exercices.
