import { z } from 'zod'

export const leadWebhookSchema = z.object({
  primeiro_nome: z.string().min(1, 'primeiro_nome is required'),
  ultimo_nome: z.string().default(''),
  fullName: z.string().min(1, 'fullName is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  numero_formatado: z.string().optional().default(''),
  empresa: z.string().optional().default(''),
  tamanho_pedido: z.string().optional().default(''),
  faixa_valor: z.string().optional().default(''),
  urgencia: z.string().optional().default(''),
  source: z.enum(['meta_ads', 'landing_page']).default('meta_ads'),
})

export type LeadWebhookPayload = z.infer<typeof leadWebhookSchema>

export const stageUpdateSchema = z.object({
  stage_id: z.string().min(1, 'stage_id is required'),
})

export type StageUpdatePayload = z.infer<typeof stageUpdateSchema>
