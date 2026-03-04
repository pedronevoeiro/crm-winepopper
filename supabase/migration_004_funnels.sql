-- Migration 004: Multi-funnel support, lead scoring, email sequences
-- Run this in Supabase SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Tabela de funis
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_funnels (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  slug       text UNIQUE NOT NULL,
  position   integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Seed: 5 funis
INSERT INTO crm_funnels (name, slug, position) VALUES
  ('Funil Inicial',   'funil-inicial',   0),
  ('SDR AI',          'funil-sdr-ai',    1),
  ('Vendedor',        'funil-vendedor',  2),
  ('Nurturing',       'funil-nurturing', 3),
  ('Finalizados',     'funil-b2b-site',  4)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Ligar stages aos funis
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE crm_pipeline_stages
  ADD COLUMN IF NOT EXISTS funnel_id uuid REFERENCES crm_funnels(id);

-- Recriar estágios para cada funil (preservando estágios antigos com funnel_id NULL)
-- Funil Inicial
INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Entrada', 0, 'bg-slate-100 text-slate-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-inicial'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Ocorreu Interação', 1, 'bg-blue-100 text-blue-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-inicial'
ON CONFLICT DO NOTHING;

-- Funil SDR AI
INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Contato Enviado', 0, 'bg-sky-100 text-sky-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-sdr-ai'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Aguardando Resposta', 1, 'bg-amber-100 text-amber-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-sdr-ai'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Necessária Ação Humana', 2, 'bg-red-100 text-red-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-sdr-ai'
ON CONFLICT DO NOTHING;

-- Funil Vendedor
INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Ag. 1º Contato', 0, 'bg-cyan-100 text-cyan-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-vendedor'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Em Conversa', 1, 'bg-blue-100 text-blue-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-vendedor'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Proposta Enviada', 2, 'bg-purple-100 text-purple-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-vendedor'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Negociação', 3, 'bg-amber-100 text-amber-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-vendedor'
ON CONFLICT DO NOTHING;

-- Funil Nurturing
INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Fluxo de E-mails', 0, 'bg-teal-100 text-teal-800', false, false, id
FROM crm_funnels WHERE slug = 'funil-nurturing'
ON CONFLICT DO NOTHING;

-- Funil Finalizados (apenas Ganhos e Perdidos)
INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Ganhos', 0, 'bg-green-200 text-green-900', true, false, id
FROM crm_funnels WHERE slug = 'funil-b2b-site'
ON CONFLICT DO NOTHING;

INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost, funnel_id)
SELECT 'Perdidos', 1, 'bg-red-100 text-red-800', false, true, id
FROM crm_funnels WHERE slug = 'funil-b2b-site'
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Novos campos em crm_deals
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE crm_deals
  ADD COLUMN IF NOT EXISTS funnel_id          uuid REFERENCES crm_funnels(id),
  ADD COLUMN IF NOT EXISTS tags               text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS estimated_value    integer,          -- em centavos
  ADD COLUMN IF NOT EXISTS first_interaction_at timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_outreach_at timestamptz,
  ADD COLUMN IF NOT EXISTS ai_disabled_at     timestamptz;

-- Índices
CREATE INDEX IF NOT EXISTS idx_crm_deals_funnel  ON crm_deals(funnel_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_tags    ON crm_deals USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_crm_deals_est_val ON crm_deals(estimated_value);

-- Deals existentes → Funil Inicial, estágio Entrada
UPDATE crm_deals d
SET funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-inicial'),
    stage_id  = (
      SELECT ps.id FROM crm_pipeline_stages ps
      JOIN crm_funnels f ON f.id = ps.funnel_id
      WHERE f.slug = 'funil-inicial' AND ps.name = 'Entrada'
      LIMIT 1
    )
WHERE d.funnel_id IS NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Tabela de sequências de e-mail (nurturing)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_email_sequences (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id      uuid REFERENCES crm_deals(id) ON DELETE CASCADE,
  email_index  integer NOT NULL DEFAULT 0,   -- índice do próximo e-mail a enviar
  next_send_at timestamptz,
  last_sent_at timestamptz,
  active       boolean NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_email_seq_deal   ON crm_email_sequences(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_email_seq_next   ON crm_email_sequences(next_send_at) WHERE active = true;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. RLS para novas tabelas
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE crm_funnels         ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_funnels_select" ON crm_funnels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM crm_user_profiles
      WHERE id = auth.uid() AND active = true
    )
  );

CREATE POLICY "crm_email_sequences_all" ON crm_email_sequences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM crm_user_profiles
      WHERE id = auth.uid() AND active = true
    )
  );
