-- YES BOX — Le Pacte — Schéma Supabase
-- À exécuter dans l'éditeur SQL de ton projet Supabase

-- Extension UUID
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- couples
-- ─────────────────────────────────────────────
create table public.couples (
  id uuid primary key default gen_random_uuid(),
  partner_a_id uuid references auth.users(id) on delete cascade,
  partner_b_id uuid references auth.users(id) on delete set null,
  invite_token text unique default encode(gen_random_bytes(24), 'hex'),
  invite_email text,
  anniversary_date date,
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- profiles (extension de auth.users)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  couple_id uuid references public.couples(id) on delete set null,
  has_paid boolean default false,
  created_at timestamptz default now()
);

-- Trigger : créer un profil à chaque inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────
-- modules
-- ─────────────────────────────────────────────
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  subtitle text,
  "order" integer not null,
  is_free boolean default false,
  created_at timestamptz default now()
);

-- Données initiales des 7 modules
insert into public.modules (slug, title, subtitle, "order", is_free) values
  ('moi',            'Moi, moi, moi',   'Bilan personnel — qui es-tu vraiment ?',                  1, true),
  ('toi',            'T''es qui toi ?', 'Ce que tu sais (ou crois savoir) de ton·ta partenaire',   2, false),
  ('nous',           'Nous',            'Notre couple — ce qui nous unit et nous définit',           3, false),
  ('communication',  'Parle-moi',       'Styles de communication et besoins d''expression',         4, false),
  ('conflits',       'Les conflits',    'Désamorcer, comprendre, grandir ensemble',                 5, false),
  ('engagement',     'Le Pacte',        'Vœux, CDD de couple, renouvellement',                     6, false),
  ('renouvellement', 'Toujours nous',   'Les petits gestes au quotidien et le bilan annuel',       7, false);

-- ─────────────────────────────────────────────
-- responses
-- ─────────────────────────────────────────────
create table public.responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  question_id text not null,
  answer jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, module_id, question_id)
);

-- ─────────────────────────────────────────────
-- module_completions
-- ─────────────────────────────────────────────
create table public.module_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  completed_at timestamptz default now(),
  unique(user_id, module_id)
);

-- ─────────────────────────────────────────────
-- reveals
-- ─────────────────────────────────────────────
create table public.reveals (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  module_id uuid references public.modules(id) on delete cascade not null,
  revealed_at timestamptz default now(),
  connivence_score numeric(3,1),
  unique(couple_id, module_id)
);

-- ─────────────────────────────────────────────
-- journal
-- ─────────────────────────────────────────────
create table public.journal (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  content text not null,
  type text check (type in ('auto', 'manual')) default 'manual',
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────
-- engagements
-- ─────────────────────────────────────────────
create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references public.couples(id) on delete cascade not null,
  vows_a text,
  vows_b text,
  signed_at timestamptz,
  renewal_date date,
  unique(couple_id)
);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.couples enable row level security;
alter table public.responses enable row level security;
alter table public.module_completions enable row level security;
alter table public.reveals enable row level security;
alter table public.journal enable row level security;
alter table public.engagements enable row level security;

-- profiles : chaque utilisateur·ice voit et modifie son propre profil
create policy "profiles: own read" on public.profiles for select using (auth.uid() = id);
create policy "profiles: own update" on public.profiles for update using (auth.uid() = id);

-- couples : les deux partenaires y ont accès
create policy "couples: partners read" on public.couples for select
  using (auth.uid() = partner_a_id or auth.uid() = partner_b_id);
create policy "couples: partner_a create" on public.couples for insert
  with check (auth.uid() = partner_a_id);
create policy "couples: partners update" on public.couples for update
  using (auth.uid() = partner_a_id or auth.uid() = partner_b_id);

-- responses : chaque utilisateur·ice ne voit que les siennes
-- (les réponses de l'autre deviennent visibles uniquement via les reveals)
create policy "responses: own" on public.responses for all using (auth.uid() = user_id);

-- module_completions
create policy "completions: own" on public.module_completions for all using (auth.uid() = user_id);

-- reveals : les deux partenaires du couple y ont accès
create policy "reveals: couple" on public.reveals for all
  using (
    couple_id in (
      select id from public.couples
      where partner_a_id = auth.uid() or partner_b_id = auth.uid()
    )
  );

-- journal
create policy "journal: couple" on public.journal for all
  using (
    couple_id in (
      select id from public.couples
      where partner_a_id = auth.uid() or partner_b_id = auth.uid()
    )
  );

-- engagements
create policy "engagements: couple" on public.engagements for all
  using (
    couple_id in (
      select id from public.couples
      where partner_a_id = auth.uid() or partner_b_id = auth.uid()
    )
  );

-- modules : lecture publique
alter table public.modules enable row level security;
create policy "modules: public read" on public.modules for select using (true);
