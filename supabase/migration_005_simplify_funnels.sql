-- Migration 005: Simplificar funis (3 funis: Vendas | Nurturing | Finalizados)
-- Remove funil-inicial e funil-sdr-ai, consolida tudo no funil-vendedor (renomeado Vendas)
--
-- Estrutura final do funil Vendas:
--   Entrada (0) | Em Conversa (1) | Proposta Enviada (2) | Negociação (3)

BEGIN;

-- ── 1. Renomear funil-vendedor → "Vendas" ────────────────────────────────────
UPDATE crm_funnels SET name = 'Vendas' WHERE slug = 'funil-vendedor';

-- ── 2. Mover deals de "Ag. 1º Contato" → "Em Conversa" (ambos em funil-vendedor)
UPDATE crm_deals
SET stage_id = (
  SELECT s.id FROM crm_pipeline_stages s
  JOIN crm_funnels f ON f.id = s.funnel_id
  WHERE f.slug = 'funil-vendedor' AND s.name = 'Em Conversa'
  LIMIT 1
)
WHERE stage_id = (
  SELECT s.id FROM crm_pipeline_stages s
  JOIN crm_funnels f ON f.id = s.funnel_id
  WHERE f.slug = 'funil-vendedor' AND s.name ILIKE 'Ag. 1%'
  LIMIT 1
);

-- ── 3. Deletar estágio "Ag. 1º Contato" ─────────────────────────────────────
DELETE FROM crm_pipeline_stages
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor')
  AND name ILIKE 'Ag. 1%';

-- ── 4. Reposicionar estágios restantes do funil-vendedor ─────────────────────
UPDATE crm_pipeline_stages
SET position = 1
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor')
  AND name = 'Em Conversa';

UPDATE crm_pipeline_stages
SET position = 2
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor')
  AND name = 'Proposta Enviada';

UPDATE crm_pipeline_stages
SET position = 3
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor')
  AND name = 'Negociação';

-- ── 5. Inserir estágio "Entrada" em position 0 no funil-vendedor ─────────────
INSERT INTO crm_pipeline_stages (name, position, funnel_id, is_won, is_lost)
SELECT 'Entrada', 0, id, false, false
FROM crm_funnels WHERE slug = 'funil-vendedor';

-- ── 6. Mover deals funil-inicial/Entrada → funil-vendedor/Entrada ────────────
UPDATE crm_deals
SET
  funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor'),
  stage_id  = (
    SELECT s.id FROM crm_pipeline_stages s
    JOIN crm_funnels f ON f.id = s.funnel_id
    WHERE f.slug = 'funil-vendedor' AND s.name = 'Entrada'
    LIMIT 1
  )
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-inicial')
  AND stage_id = (
    SELECT s.id FROM crm_pipeline_stages s
    JOIN crm_funnels f ON f.id = s.funnel_id
    WHERE f.slug = 'funil-inicial' AND s.name = 'Entrada'
    LIMIT 1
  );

-- ── 7. Mover restantes do funil-inicial → funil-vendedor/Em Conversa ─────────
UPDATE crm_deals
SET
  funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor'),
  stage_id  = (
    SELECT s.id FROM crm_pipeline_stages s
    JOIN crm_funnels f ON f.id = s.funnel_id
    WHERE f.slug = 'funil-vendedor' AND s.name = 'Em Conversa'
    LIMIT 1
  )
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-inicial');

-- ── 8. Mover todos os deals do funil-sdr-ai → funil-vendedor/Em Conversa ─────
UPDATE crm_deals
SET
  funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-vendedor'),
  stage_id  = (
    SELECT s.id FROM crm_pipeline_stages s
    JOIN crm_funnels f ON f.id = s.funnel_id
    WHERE f.slug = 'funil-vendedor' AND s.name = 'Em Conversa'
    LIMIT 1
  )
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-sdr-ai');

-- ── 9. Remover funil-inicial ──────────────────────────────────────────────────
DELETE FROM crm_pipeline_stages
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-inicial');

DELETE FROM crm_funnels WHERE slug = 'funil-inicial';

-- ── 10. Remover funil-sdr-ai ─────────────────────────────────────────────────
DELETE FROM crm_pipeline_stages
WHERE funnel_id = (SELECT id FROM crm_funnels WHERE slug = 'funil-sdr-ai');

DELETE FROM crm_funnels WHERE slug = 'funil-sdr-ai';

COMMIT;
