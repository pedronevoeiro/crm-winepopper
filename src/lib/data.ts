// Mock data para desenvolvimento — mesmo padrão do winepopper-erp
import type {
  CrmUserProfile,
  CrmCompany,
  CrmContact,
  CrmPipelineStage,
  CrmDeal,
  CrmActivity,
  CrmTask,
} from '@/types/database'

function daysAgo(days: number): string {
  const d = new Date(2026, 2, 2) // 2026-03-02
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

function daysFromNow(days: number): string {
  const d = new Date(2026, 2, 2)
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

// === USERS ===
export const users: CrmUserProfile[] = [
  {
    id: 'u1',
    email: 'joao@winepopper.com.br',
    display_name: 'João',
    role: 'admin',
    avatar_url: null,
    active: true,
    created_at: daysAgo(90),
    updated_at: daysAgo(0),
  },
  {
    id: 'u2',
    email: 'pedro@winepopper.com.br',
    display_name: 'Pedro',
    role: 'vendedor',
    avatar_url: null,
    active: true,
    created_at: daysAgo(60),
    updated_at: daysAgo(0),
  },
]

// === PIPELINE STAGES (SDR Flow) ===
export const pipelineStages: CrmPipelineStage[] = [
  { id: 'ps-sem-contato', name: 'Sem Contato', position: 0, color: 'bg-slate-100 text-slate-800', is_won: false, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-aguardando-resposta', name: 'Aguardando Resposta', position: 1, color: 'bg-sky-100 text-sky-800', is_won: false, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-em-conversa', name: 'Em Conversa', position: 2, color: 'bg-cyan-100 text-cyan-800', is_won: false, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-qualificacao', name: 'Qualificação', position: 3, color: 'bg-blue-100 text-blue-800', is_won: false, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-proposta-enviada', name: 'Proposta Enviada', position: 4, color: 'bg-purple-100 text-purple-800', is_won: false, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-negociacao', name: 'Negociação', position: 5, color: 'bg-amber-100 text-amber-800', is_won: false, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-fechado-ganho', name: 'Fechado Ganho', position: 6, color: 'bg-green-100 text-green-800', is_won: true, is_lost: false, created_at: daysAgo(90) },
  { id: 'ps-fechado-perdido', name: 'Fechado Perdido', position: 7, color: 'bg-red-100 text-red-800', is_won: false, is_lost: true, created_at: daysAgo(90) },
]

// === COMPANIES ===
export const companies: CrmCompany[] = [
  {
    id: 'co1', name: 'TechCorp Soluções Ltda', trade_name: 'TechCorp', cnpj: '12345678000190',
    industry: 'Tecnologia', size: 'medium', website: 'https://techcorp.com.br',
    email: 'compras@techcorp.com.br', phone: '1133334444',
    cep: '01310100', street: 'Av. Paulista', number: '1000', complement: 'Sala 1501',
    neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP',
    notes: 'Empresa de TI, já comprou brindes antes', tags: ['tecnologia', 'recorrente'],
    created_by: 'u1', created_at: daysAgo(60), updated_at: daysAgo(5),
  },
  {
    id: 'co2', name: 'Vinícola Serra Gaúcha S.A.', trade_name: 'Serra Gaúcha', cnpj: '98765432000110',
    industry: 'Vinícola', size: 'large', website: 'https://serragaucha.com.br',
    email: 'marketing@serragaucha.com.br', phone: '5432101234',
    cep: '95700000', street: 'RS-444', number: 'Km 12', complement: null,
    neighborhood: 'Vale dos Vinhedos', city: 'Bento Gonçalves', state: 'RS',
    notes: 'Interesse em grande volume para eventos', tags: ['vinho', 'eventos', 'grande volume'],
    created_by: 'u1', created_at: daysAgo(45), updated_at: daysAgo(3),
  },
  {
    id: 'co3', name: 'Banco Investir S.A.', trade_name: 'Investir', cnpj: '11223344000155',
    industry: 'Financeiro', size: 'large', website: 'https://bancoinvestir.com.br',
    email: 'eventos@bancoinvestir.com.br', phone: '1140001234',
    cep: '04543011', street: 'Av. Faria Lima', number: '3477', complement: '15o andar',
    neighborhood: 'Itaim Bibi', city: 'São Paulo', state: 'SP',
    notes: null, tags: ['financeiro', 'premium'],
    created_by: 'u2', created_at: daysAgo(30), updated_at: daysAgo(10),
  },
  {
    id: 'co4', name: 'Agência Criativa Design Ltda', trade_name: 'Criativa', cnpj: '55667788000199',
    industry: 'Marketing', size: 'small', website: null,
    email: 'contato@criativa.com.br', phone: '1198765432',
    cep: '30130000', street: 'Rua da Bahia', number: '1500', complement: null,
    neighborhood: 'Centro', city: 'Belo Horizonte', state: 'MG',
    notes: 'Querem saca-rolhas para presentear clientes no Natal', tags: ['marketing', 'natal'],
    created_by: 'u2', created_at: daysAgo(15), updated_at: daysAgo(2),
  },
  {
    id: 'co5', name: 'Hotel Fazenda Bella Vista', trade_name: 'Bella Vista', cnpj: '99887766000133',
    industry: 'Hotelaria', size: 'medium', website: 'https://bellavista.com.br',
    email: 'reservas@bellavista.com.br', phone: '1935551234',
    cep: '13085850', street: 'Rod. Campinas-Mogi', number: 'Km 85', complement: null,
    neighborhood: 'Zona Rural', city: 'Campinas', state: 'SP',
    notes: 'Interesse em saca-rolhas para amenities do hotel', tags: ['hotelaria', 'amenities'],
    created_by: 'u1', created_at: daysAgo(10), updated_at: daysAgo(1),
  },
]

// === CONTACTS ===
export const contacts: CrmContact[] = [
  {
    id: 'ct1', company_id: 'co1', name: 'Ana Silva', email: 'ana.silva@techcorp.com.br',
    phone: '1133334444', mobile: '11987654321', position: 'Gerente de Compras',
    is_decision_maker: true, notes: 'Muito exigente com qualidade', tags: ['decisor'],
    source: 'linkedin', created_by: 'u1', created_at: daysAgo(60), updated_at: daysAgo(5),
  },
  {
    id: 'ct2', company_id: 'co1', name: 'Carlos Mendes', email: 'carlos@techcorp.com.br',
    phone: null, mobile: '11912345678', position: 'Assistente de Compras',
    is_decision_maker: false, notes: null, tags: [],
    source: 'linkedin', created_by: 'u1', created_at: daysAgo(55), updated_at: daysAgo(55),
  },
  {
    id: 'ct3', company_id: 'co2', name: 'Roberto Bianchi', email: 'roberto@serragaucha.com.br',
    phone: '5432101234', mobile: '54991234567', position: 'Diretor de Marketing',
    is_decision_maker: true, notes: 'Conhece muito de vinhos, excelente contato', tags: ['decisor', 'vip'],
    source: 'evento', created_by: 'u1', created_at: daysAgo(45), updated_at: daysAgo(3),
  },
  {
    id: 'ct4', company_id: 'co3', name: 'Mariana Costa', email: 'mariana.costa@bancoinvestir.com.br',
    phone: '1140001234', mobile: '11998887777', position: 'Coord. de Eventos',
    is_decision_maker: true, notes: 'Prefere contato por e-mail', tags: ['decisor'],
    source: 'indicacao', created_by: 'u2', created_at: daysAgo(30), updated_at: daysAgo(10),
  },
  {
    id: 'ct5', company_id: 'co4', name: 'Felipe Rocha', email: 'felipe@criativa.com.br',
    phone: null, mobile: '31987654321', position: 'Diretor Criativo',
    is_decision_maker: true, notes: null, tags: ['decisor'],
    source: 'site', created_by: 'u2', created_at: daysAgo(15), updated_at: daysAgo(2),
  },
  {
    id: 'ct6', company_id: 'co5', name: 'Lucia Ferreira', email: 'lucia@bellavista.com.br',
    phone: '1935551234', mobile: '19987651234', position: 'Gerente Geral',
    is_decision_maker: true, notes: 'Busca parceria de longo prazo', tags: ['decisor', 'parceria'],
    source: 'telefone', created_by: 'u1', created_at: daysAgo(10), updated_at: daysAgo(1),
  },
  {
    id: 'ct7', company_id: null, name: 'Daniel Almeida', email: 'daniel.almeida@gmail.com',
    phone: null, mobile: '21976543210', position: null,
    is_decision_maker: false, notes: 'Procurando brindes para casamento', tags: ['pf'],
    source: 'site', created_by: 'u2', created_at: daysAgo(5), updated_at: daysAgo(5),
  },
]

// === DEALS ===
export const deals: CrmDeal[] = [
  {
    id: 'd1', title: '200 Clássicos - TechCorp', stage_id: 'ps-negociacao', company_id: 'co1', contact_id: 'ct1',
    owner_id: 'u1', value: 38000, product_interest: 'classico', expected_quantity: 200,
    expected_close_date: daysFromNow(7).split('T')[0], lost_reason: null, source: 'linkedin',
    priority: 'high', position: 0, budget_range: null, urgency: null, stage_entered_at: daysAgo(3),
    won_at: null, lost_at: null, created_by: 'u1', created_at: daysAgo(30), updated_at: daysAgo(3),
  },
  {
    id: 'd2', title: '500 Lite Plus - Serra Gaúcha', stage_id: 'ps-proposta-enviada', company_id: 'co2', contact_id: 'ct3',
    owner_id: 'u1', value: 67500, product_interest: 'lite_plus', expected_quantity: 500,
    expected_close_date: daysFromNow(14).split('T')[0], lost_reason: null, source: 'evento',
    priority: 'urgent', position: 0, budget_range: null, urgency: null, stage_entered_at: daysAgo(5),
    won_at: null, lost_at: null, created_by: 'u1', created_at: daysAgo(20), updated_at: daysAgo(5),
  },
  {
    id: 'd3', title: '100 Lite - Banco Investir', stage_id: 'ps-qualificacao', company_id: 'co3', contact_id: 'ct4',
    owner_id: 'u2', value: 9000, product_interest: 'lite', expected_quantity: 100,
    expected_close_date: daysFromNow(21).split('T')[0], lost_reason: null, source: 'indicacao',
    priority: 'medium', position: 0, budget_range: null, urgency: null, stage_entered_at: daysAgo(7),
    won_at: null, lost_at: null, created_by: 'u2', created_at: daysAgo(15), updated_at: daysAgo(7),
  },
  {
    id: 'd4', title: '50 Clássicos - Criativa', stage_id: 'ps-sem-contato', company_id: 'co4', contact_id: 'ct5',
    owner_id: 'u2', value: 9500, product_interest: 'classico', expected_quantity: 50,
    expected_close_date: null, lost_reason: null, source: 'site',
    priority: 'low', position: 0, budget_range: 'R$150-200', urgency: null, stage_entered_at: daysAgo(2),
    won_at: null, lost_at: null, created_by: 'u2', created_at: daysAgo(2), updated_at: daysAgo(2),
  },
  {
    id: 'd5', title: '300 Lite - Bella Vista', stage_id: 'ps-sem-contato', company_id: 'co5', contact_id: 'ct6',
    owner_id: 'u1', value: 27000, product_interest: 'lite', expected_quantity: 300,
    expected_close_date: null, lost_reason: null, source: 'telefone',
    priority: 'medium', position: 1, budget_range: 'R$80-100', urgency: 'Abril 2026', stage_entered_at: daysAgo(1),
    won_at: null, lost_at: null, created_by: 'u1', created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    id: 'd6', title: '150 Clássicos - TechCorp (2a compra)', stage_id: 'ps-fechado-ganho', company_id: 'co1', contact_id: 'ct1',
    owner_id: 'u1', value: 28500, product_interest: 'classico', expected_quantity: 150,
    expected_close_date: daysAgo(40).split('T')[0], lost_reason: null, source: 'indicacao',
    priority: 'high', position: 0, budget_range: null, urgency: null, stage_entered_at: daysAgo(40),
    won_at: daysAgo(40), lost_at: null, created_by: 'u1', created_at: daysAgo(75), updated_at: daysAgo(40),
  },
  {
    id: 'd7', title: '80 Lite Plus - Empresa XYZ', stage_id: 'ps-fechado-perdido', company_id: null, contact_id: 'ct7',
    owner_id: 'u2', value: 10800, product_interest: 'lite_plus', expected_quantity: 80,
    expected_close_date: daysAgo(10).split('T')[0], lost_reason: 'Preço acima do orçamento', source: 'site',
    priority: 'low', position: 0, budget_range: null, urgency: null, stage_entered_at: daysAgo(10),
    won_at: null, lost_at: daysAgo(10), created_by: 'u2', created_at: daysAgo(50), updated_at: daysAgo(10),
  },
]

// === ACTIVITIES ===
export const activities: CrmActivity[] = [
  { id: 'a1', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'deal_created', content: 'Negócio criado', metadata: null, created_at: daysAgo(30) },
  { id: 'a2', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'note', content: 'Ana solicitou orçamento para 200 unidades do modelo Clássico com logo gravada.', metadata: null, created_at: daysAgo(28) },
  { id: 'a3', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'stage_change', content: 'Movido para Qualificação', metadata: { from: 'Sem Contato', to: 'Qualificação' }, created_at: daysAgo(25) },
  { id: 'a4', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'call', content: 'Ligação de 15 min. Ana confirmou interesse e pediu proposta formal.', metadata: null, created_at: daysAgo(20) },
  { id: 'a5', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'stage_change', content: 'Movido para Proposta Enviada', metadata: { from: 'Qualificação', to: 'Proposta Enviada' }, created_at: daysAgo(15) },
  { id: 'a6', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'email', content: 'Proposta enviada por e-mail com mockup do saca-rolhas personalizado.', metadata: null, created_at: daysAgo(15) },
  { id: 'a7', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'stage_change', content: 'Movido para Negociação', metadata: { from: 'Proposta Enviada', to: 'Negociação' }, created_at: daysAgo(3) },
  { id: 'a8', deal_id: 'd1', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'note', content: 'Ana pediu desconto de 5% para fechar. Aguardando resposta.', metadata: null, created_at: daysAgo(2) },
  { id: 'a9', deal_id: 'd2', contact_id: 'ct3', company_id: 'co2', user_id: 'u1', type: 'deal_created', content: 'Negócio criado', metadata: null, created_at: daysAgo(20) },
  { id: 'a10', deal_id: 'd2', contact_id: 'ct3', company_id: 'co2', user_id: 'u1', type: 'meeting', content: 'Reunião presencial em Bento Gonçalves. Roberto quer 500 unidades para evento da vinícola.', metadata: null, created_at: daysAgo(18) },
  { id: 'a11', deal_id: 'd2', contact_id: 'ct3', company_id: 'co2', user_id: 'u1', type: 'stage_change', content: 'Movido para Proposta Enviada', metadata: { from: 'Qualificação', to: 'Proposta Enviada' }, created_at: daysAgo(5) },
  { id: 'a12', deal_id: 'd3', contact_id: 'ct4', company_id: 'co3', user_id: 'u2', type: 'deal_created', content: 'Negócio criado via indicação', metadata: null, created_at: daysAgo(15) },
  { id: 'a13', deal_id: 'd4', contact_id: 'ct5', company_id: 'co4', user_id: 'u2', type: 'deal_created', content: 'Lead entrou pelo site', metadata: null, created_at: daysAgo(2) },
  { id: 'a14', deal_id: 'd5', contact_id: 'ct6', company_id: 'co5', user_id: 'u1', type: 'deal_created', content: 'Contato telefônico, interessados em volume', metadata: null, created_at: daysAgo(1) },
  { id: 'a15', deal_id: 'd6', contact_id: 'ct1', company_id: 'co1', user_id: 'u1', type: 'deal_won', content: 'Negócio fechado! Pedido de 150 Clássicos.', metadata: null, created_at: daysAgo(40) },
  { id: 'a16', deal_id: 'd7', contact_id: 'ct7', company_id: null, user_id: 'u2', type: 'deal_lost', content: 'Cliente achou o preço alto. Preferiu outro fornecedor.', metadata: null, created_at: daysAgo(10) },
]

// === TASKS ===
export const tasks: CrmTask[] = [
  {
    id: 't1', title: 'Ligar para Ana - resposta sobre desconto', description: 'Ana pediu 5% de desconto. Verificar com gerência e retornar.',
    type: 'call', priority: 'high', status: 'pending', due_date: daysFromNow(1),
    completed_at: null, deal_id: 'd1', contact_id: 'ct1', assigned_to: 'u1', created_by: 'u1',
    created_at: daysAgo(2), updated_at: daysAgo(2),
  },
  {
    id: 't2', title: 'Enviar mockup atualizado - Serra Gaúcha', description: 'Roberto pediu ajuste no posicionamento do logo no saca-rolhas.',
    type: 'email', priority: 'urgent', status: 'pending', due_date: daysFromNow(0),
    completed_at: null, deal_id: 'd2', contact_id: 'ct3', assigned_to: 'u1', created_by: 'u1',
    created_at: daysAgo(3), updated_at: daysAgo(3),
  },
  {
    id: 't3', title: 'Reunião com Mariana - Banco Investir', description: 'Agendar call para apresentar catálogo.',
    type: 'meeting', priority: 'medium', status: 'pending', due_date: daysFromNow(3),
    completed_at: null, deal_id: 'd3', contact_id: 'ct4', assigned_to: 'u2', created_by: 'u2',
    created_at: daysAgo(5), updated_at: daysAgo(5),
  },
  {
    id: 't4', title: 'Follow-up Felipe - Criativa', description: 'Verificar se Felipe já definiu quantidade e modelo.',
    type: 'follow_up', priority: 'low', status: 'pending', due_date: daysFromNow(5),
    completed_at: null, deal_id: 'd4', contact_id: 'ct5', assigned_to: 'u2', created_by: 'u2',
    created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    id: 't5', title: 'Enviar proposta inicial - Bella Vista', description: 'Preparar proposta para 300 Lite com gravação.',
    type: 'email', priority: 'medium', status: 'pending', due_date: daysFromNow(2),
    completed_at: null, deal_id: 'd5', contact_id: 'ct6', assigned_to: 'u1', created_by: 'u1',
    created_at: daysAgo(1), updated_at: daysAgo(1),
  },
  {
    id: 't6', title: 'Confirmar pagamento TechCorp (compra anterior)', description: 'Verificar se o boleto da 2a compra foi pago.',
    type: 'other', priority: 'low', status: 'completed', due_date: daysAgo(35),
    completed_at: daysAgo(35), deal_id: 'd6', contact_id: 'ct1', assigned_to: 'u1', created_by: 'u1',
    created_at: daysAgo(40), updated_at: daysAgo(35),
  },
]

// === HELPERS ===

export function getDealsWithRelations() {
  return deals.map((deal) => ({
    ...deal,
    stage: pipelineStages.find((s) => s.id === deal.stage_id),
    company: companies.find((c) => c.id === deal.company_id) ?? null,
    contact: contacts.find((c) => c.id === deal.contact_id)!,
    owner: users.find((u) => u.id === deal.owner_id) ?? null,
    next_task: tasks.find((t) => t.deal_id === deal.id && t.status === 'pending') ?? null,
  }))
}

export function getContactsWithCompany() {
  return contacts.map((contact) => ({
    ...contact,
    company: companies.find((c) => c.id === contact.company_id) ?? null,
  }))
}

export function getTasksWithRelations() {
  return tasks.map((task) => ({
    ...task,
    deal: deals.find((d) => d.id === task.deal_id) ?? null,
    contact: contacts.find((c) => c.id === task.contact_id) ?? null,
    assigned_user: users.find((u) => u.id === task.assigned_to) ?? null,
  }))
}

export function getActivitiesWithUser() {
  return activities.map((activity) => ({
    ...activity,
    user: users.find((u) => u.id === activity.user_id) ?? null,
  }))
}
