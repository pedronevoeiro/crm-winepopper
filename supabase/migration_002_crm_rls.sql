-- Row-Level Security para tabelas CRM

ALTER TABLE crm_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_tasks ENABLE ROW LEVEL SECURITY;

-- Política: usuários autenticados com perfil ativo podem ver tudo
CREATE POLICY crm_user_profiles_select ON crm_user_profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_companies_select ON crm_companies FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_companies_insert ON crm_companies FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_companies_update ON crm_companies FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_contacts_select ON crm_contacts FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_contacts_insert ON crm_contacts FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_contacts_update ON crm_contacts FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_pipeline_stages_select ON crm_pipeline_stages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_deals_select ON crm_deals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_deals_insert ON crm_deals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_deals_update ON crm_deals FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_activities_select ON crm_activities FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_activities_insert ON crm_activities FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_tasks_select ON crm_tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_tasks_insert ON crm_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));

CREATE POLICY crm_tasks_update ON crm_tasks FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM crm_user_profiles WHERE id = auth.uid() AND active = true));
