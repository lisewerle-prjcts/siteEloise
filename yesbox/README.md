# YES BOX — Le Pacte

Programme d'accompagnement pour couples. Next.js + Supabase + Stripe.

## Stack

- **Next.js 14** (App Router, Server Actions)
- **Supabase** (Auth, PostgreSQL, RLS)
- **Tailwind CSS** (design system YES BOX)
- **Stripe** (paiement — Étape 3)
- **Vercel** (déploiement)

## Démarrage rapide

```bash
cd yesbox
npm install
cp .env.local.example .env.local
# → Remplis les variables dans .env.local
npm run dev
```

## Configuration Supabase

1. Crée un projet sur [supabase.com](https://supabase.com)
2. Dans l'éditeur SQL, exécute `supabase/schema.sql`
3. Dans **Authentication > Email Templates**, personnalise les emails de confirmation
4. Dans **Authentication > URL Configuration**, ajoute :
   - Site URL : `http://localhost:3000`
   - Redirect URLs : `http://localhost:3000/auth/callback`

## Variables d'environnement

Voir `.env.local.example` pour la liste complète.

## Structure

```
app/
  page.tsx           → Landing page
  login/             → Connexion
  signup/            → Inscription (+ rejoindre via token)
  invite/            → Invitation partenaire
  dashboard/         → Tableau de bord couple
  module/[slug]/     → (Étape 2) Pages de module
  reveal/[slug]/     → (Étape 2) Sessions de révélation
  api/invite/        → API route envoi d'invitation
  auth/callback/     → Callback OAuth/Magic Link

components/
  Logo.tsx           → Logo YES BOX
  Header.tsx         → Navigation

lib/supabase/
  client.ts          → Client navigateur
  server.ts          → Client serveur (Server Components)
  middleware.ts      → Protection des routes

supabase/
  schema.sql         → Schéma complet avec RLS
```

## Avancement

- [x] **Étape 1** — Fondations (Next.js, Supabase, Auth, Invitation)
- [ ] **Étape 2** — Modules (Dashboard complet, Module "Moi", Révélation)
- [ ] **Étape 3** — Paiement (Stripe Checkout, déblocage modules)
