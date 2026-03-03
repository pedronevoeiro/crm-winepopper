// Tipos do banco de dados CRM — gerados manualmente a partir do schema

export type CrmUserRole = 'admin' | 'manager' | 'vendedor' | 'viewer'
export type CrmDealPriority = 'low' | 'medium' | 'high' | 'urgent'
export type CrmTaskStatus = 'pending' | 'completed' | 'cancelled'
export type CrmTaskType = 'call' | 'email' | 'meeting' | 'follow_up' | 'other'
export type CrmActivityType = 'note' | 'email' | 'call' | 'meeting' | 'stage_change' | 'deal_created' | 'deal_won' | 'deal_lost'
export type CrmCompanySize = 'micro' | 'small' | 'medium' | 'large'
export type CrmLeadSource = 'site' | 'indicacao' | 'linkedin' | 'telefone' | 'evento' | 'meta_ads' | 'landing_page' | 'outro'
export type CrmProductInterest = 'classico' | 'lite_plus' | 'lite'

export interface CrmUserProfile {
  id: string
  email: string
  display_name: string
  role: CrmUserRole
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface CrmCompany {
  id: string
  name: string
  trade_name: string | null
  cnpj: string | null
  industry: string | null
  size: CrmCompanySize | null
  website: string | null
  email: string | null
  phone: string | null
  cep: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  notes: string | null
  tags: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CrmContact {
  id: string
  company_id: string | null
  name: string
  email: string | null
  phone: string | null
  mobile: string | null
  position: string | null
  is_decision_maker: boolean
  notes: string | null
  tags: string[]
  source: CrmLeadSource | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CrmPipelineStage {
  id: string
  name: string
  position: number
  color: string | null
  is_won: boolean
  is_lost: boolean
  created_at: string
}

export interface CrmDeal {
  id: string
  title: string
  stage_id: string
  company_id: string | null
  contact_id: string
  owner_id: string | null
  value: number | null
  product_interest: CrmProductInterest | null
  expected_quantity: number | null
  expected_close_date: string | null
  lost_reason: string | null
  source: CrmLeadSource | null
  priority: CrmDealPriority
  position: number
  budget_range: string | null
  urgency: string | null
  stage_entered_at: string
  won_at: string | null
  lost_at: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CrmActivity {
  id: string
  deal_id: string | null
  contact_id: string | null
  company_id: string | null
  user_id: string | null
  type: CrmActivityType
  content: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface CrmTask {
  id: string
  title: string
  description: string | null
  type: CrmTaskType
  priority: CrmDealPriority
  status: CrmTaskStatus
  due_date: string | null
  completed_at: string | null
  deal_id: string | null
  contact_id: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

// Tipos com relações (para queries com joins)
export interface CrmDealWithRelations extends CrmDeal {
  stage?: CrmPipelineStage
  company?: CrmCompany | null
  contact?: CrmContact
  owner?: CrmUserProfile | null
  next_task?: CrmTask | null
}

export interface CrmContactWithCompany extends CrmContact {
  company?: CrmCompany | null
}

export interface CrmTaskWithRelations extends CrmTask {
  deal?: CrmDeal | null
  contact?: CrmContact | null
  assigned_user?: CrmUserProfile | null
}

export interface CrmActivityWithUser extends CrmActivity {
  user?: CrmUserProfile | null
}

// Tipo genérico do banco — usado pelos Supabase clients
export interface Database {
  public: {
    Tables: {
      crm_user_profiles: { Row: CrmUserProfile; Insert: Partial<CrmUserProfile> & Pick<CrmUserProfile, 'id' | 'email' | 'display_name'>; Update: Partial<CrmUserProfile> }
      crm_companies: { Row: CrmCompany; Insert: Partial<CrmCompany> & Pick<CrmCompany, 'name'>; Update: Partial<CrmCompany> }
      crm_contacts: { Row: CrmContact; Insert: Partial<CrmContact> & Pick<CrmContact, 'name'>; Update: Partial<CrmContact> }
      crm_pipeline_stages: { Row: CrmPipelineStage; Insert: Partial<CrmPipelineStage> & Pick<CrmPipelineStage, 'name' | 'position'>; Update: Partial<CrmPipelineStage> }
      crm_deals: { Row: CrmDeal; Insert: Partial<CrmDeal> & Pick<CrmDeal, 'title' | 'stage_id' | 'contact_id'>; Update: Partial<CrmDeal> }
      crm_activities: { Row: CrmActivity; Insert: Partial<CrmActivity> & Pick<CrmActivity, 'type'>; Update: Partial<CrmActivity> }
      crm_tasks: { Row: CrmTask; Insert: Partial<CrmTask> & Pick<CrmTask, 'title' | 'type'>; Update: Partial<CrmTask> }
    }
  }
}
