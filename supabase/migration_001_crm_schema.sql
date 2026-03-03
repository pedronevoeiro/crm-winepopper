-- CRM Schema — Winepopper CRM
-- Prefixo crm_ para separar das tabelas erp_

-- === ENUMS ===

DO $$ BEGIN
  CREATE TYPE crm_user_role AS ENUM ('admin', 'manager', 'vendedor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_deal_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_task_status AS ENUM ('pending', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_task_type AS ENUM ('call', 'email', 'meeting', 'follow_up', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_activity_type AS ENUM ('note', 'email', 'call', 'meeting', 'stage_change', 'deal_created', 'deal_won', 'deal_lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_company_size AS ENUM ('micro', 'small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_lead_source AS ENUM ('site', 'indicacao', 'linkedin', 'telefone', 'evento', 'outro');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE crm_product_interest AS ENUM ('classico', 'lite_plus', 'lite');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === TABLES ===

-- User profiles
CREATE TABLE IF NOT EXISTS crm_user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text NOT NULL,
  role crm_user_role NOT NULL DEFAULT 'viewer',
  avatar_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Companies
CREATE TABLE IF NOT EXISTS crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  trade_name text,
  cnpj text UNIQUE,
  industry text,
  size crm_company_size,
  website text,
  email text,
  phone text,
  cep text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  notes text,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_companies_cnpj ON crm_companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_crm_companies_name ON crm_companies USING gin(to_tsvector('portuguese', name));

-- Contacts
CREATE TABLE IF NOT EXISTS crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text,
  phone text,
  mobile text,
  position text,
  is_decision_maker boolean NOT NULL DEFAULT false,
  notes text,
  tags text[] DEFAULT '{}',
  source crm_lead_source,
  created_by uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_company ON crm_contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_name ON crm_contacts USING gin(to_tsvector('portuguese', name));

-- Pipeline stages
CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position integer NOT NULL,
  color text,
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Deals
CREATE TABLE IF NOT EXISTS crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  stage_id uuid NOT NULL REFERENCES crm_pipeline_stages(id) ON DELETE RESTRICT,
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES crm_contacts(id) ON DELETE RESTRICT,
  owner_id uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  value numeric,
  product_interest crm_product_interest,
  expected_quantity integer,
  expected_close_date date,
  lost_reason text,
  source crm_lead_source,
  priority crm_deal_priority NOT NULL DEFAULT 'medium',
  position integer NOT NULL DEFAULT 0,
  stage_entered_at timestamptz NOT NULL DEFAULT now(),
  won_at timestamptz,
  lost_at timestamptz,
  created_by uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_company ON crm_deals(company_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_owner ON crm_deals(owner_id);

-- Activities
CREATE TABLE IF NOT EXISTS crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES crm_deals(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES crm_companies(id) ON DELETE SET NULL,
  user_id uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  type crm_activity_type NOT NULL,
  content text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_created ON crm_activities(created_at DESC);

-- Tasks
CREATE TABLE IF NOT EXISTS crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type crm_task_type NOT NULL,
  priority crm_deal_priority NOT NULL DEFAULT 'medium',
  status crm_task_status NOT NULL DEFAULT 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  deal_id uuid REFERENCES crm_deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES crm_contacts(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES crm_user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal ON crm_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned ON crm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_status ON crm_tasks(status);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_due ON crm_tasks(due_date);

-- === TRIGGERS ===

CREATE OR REPLACE FUNCTION crm_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_crm_companies_updated BEFORE UPDATE ON crm_companies FOR EACH ROW EXECUTE FUNCTION crm_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION crm_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_crm_deals_updated BEFORE UPDATE ON crm_deals FOR EACH ROW EXECUTE FUNCTION crm_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_crm_tasks_updated BEFORE UPDATE ON crm_tasks FOR EACH ROW EXECUTE FUNCTION crm_update_timestamp();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- === SEED: Default pipeline stages ===

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost) VALUES
  ('Novo Lead', 0, 'bg-slate-100 text-slate-800', false, false),
  ('Qualificação', 1, 'bg-blue-100 text-blue-800', false, false),
  ('Proposta Enviada', 2, 'bg-purple-100 text-purple-800', false, false),
  ('Negociação', 3, 'bg-amber-100 text-amber-800', false, false),
  ('Fechado Ganho', 4, 'bg-green-100 text-green-800', true, false),
  ('Fechado Perdido', 5, 'bg-red-100 text-red-800', false, true)
ON CONFLICT DO NOTHING;
