-- ================================================================
-- Research Wall — Esquema de Base de Datos para Supabase
-- Copia y pega este SQL en: Supabase Dashboard > SQL Editor > Run
-- ================================================================

-- 1. Proyectos
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  story text,                   -- Historia / contexto libre del proyecto
  created_at timestamptz default now()
);

-- 2. Personajes
create table if not exists characters (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,

  -- Información básica
  name text not null,
  alias text,
  age integer,
  birthplace text,
  nationality text,
  status text default 'alive',  -- alive | dead | missing | unknown

  -- Psicología
  personality text,
  fears text,
  motivations text,
  objectives text,
  secrets text,

  -- Contexto
  residence text,
  social_class text,
  family text,

  -- Profesional
  profession text,
  studies text,
  current_job text,
  relevant_experience text,

  -- Físico
  height text,
  build_type text,
  distinctive_features text,

  -- Visual / Canvas
  avatar text,
  color text default '#1f2937',
  role text default 'Desconocido',
  position_x float default 0,
  position_y float default 0,

  -- Extra
  notes text,
  created_at timestamptz default now()
);

-- 3. Relaciones entre personajes
create table if not exists relationships (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  source_id uuid references characters(id) on delete cascade not null,
  target_id uuid references characters(id) on delete cascade not null,

  type text default 'unknown',      -- family | professional | enemy | love | secret | unknown
  label text,                       -- Nota flotante en el hilo
  intensity integer default 2,      -- 1-5
  bidirectional boolean default true,
  status text default 'active',     -- active | broken | hidden

  created_at timestamptz default now()
);

-- ================================================================
-- OPCIONAL: Row Level Security (cuando añadas autenticación)
-- ================================================================
-- alter table projects enable row level security;
-- alter table characters enable row level security;
-- alter table relationships enable row level security;
