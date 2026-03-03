-- Migration 003: Webhook integration updates
-- Adds new lead sources, deal fields, and updates pipeline stages for SDR flow

-- 1. Add new lead sources
ALTER TYPE crm_lead_source ADD VALUE IF NOT EXISTS 'meta_ads';
ALTER TYPE crm_lead_source ADD VALUE IF NOT EXISTS 'landing_page';

-- 2. Add new fields to crm_deals
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS budget_range text;
ALTER TABLE crm_deals ADD COLUMN IF NOT EXISTS urgency text;

-- 3. Update pipeline stages to SDR flow (8 stages)
DELETE FROM crm_pipeline_stages;
INSERT INTO crm_pipeline_stages (name, position, color, is_won, is_lost) VALUES
  ('Sem Contato',          0, 'bg-slate-100 text-slate-800',  false, false),
  ('Aguardando Resposta',  1, 'bg-sky-100 text-sky-800',      false, false),
  ('Em Conversa',          2, 'bg-cyan-100 text-cyan-800',     false, false),
  ('Qualificação',         3, 'bg-blue-100 text-blue-800',     false, false),
  ('Proposta Enviada',     4, 'bg-purple-100 text-purple-800', false, false),
  ('Negociação',           5, 'bg-amber-100 text-amber-800',   false, false),
  ('Fechado Ganho',        6, 'bg-green-100 text-green-800',   true,  false),
  ('Fechado Perdido',      7, 'bg-red-100 text-red-800',       false, true);
