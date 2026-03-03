'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LEAD_SOURCE_LABELS, PRIORITY_LABELS, PRODUCT_INTEREST_LABELS } from '@/lib/constants'
import type { CrmCompany, CrmContact, CrmPipelineStage } from '@/types/database'

export default function NovoNegocioPage() {
  return (
    <Suspense>
      <NovoNegocioForm />
    </Suspense>
  )
}

function NovoNegocioForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [contacts, setContacts] = useState<CrmContact[]>([])
  const [stages, setStages] = useState<CrmPipelineStage[]>([])
  const [companyId, setCompanyId] = useState(searchParams.get('company_id') ?? '')
  const [contactId, setContactId] = useState(searchParams.get('contact_id') ?? '')
  const [stageId, setStageId] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/companies').then((r) => r.json()),
      fetch('/api/contacts').then((r) => r.json()),
      fetch('/api/pipeline-stages').then((r) => r.json()),
    ]).then(([c, ct, s]) => {
      setCompanies(c)
      setContacts(ct)
      setStages(s)
      // Set default stage to first non-won/lost
      const firstStage = s.find((st: CrmPipelineStage) => !st.is_won && !st.is_lost)
      if (firstStage) setStageId(firstStage.id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    const body = {
      title: data.title,
      stage_id: stageId,
      company_id: companyId || null,
      contact_id: contactId,
      value: data.value ? Number(data.value) : null,
      product_interest: data.product_interest || null,
      expected_quantity: data.expected_quantity ? Number(data.expected_quantity) : null,
      expected_close_date: data.expected_close_date || null,
      source: data.source || null,
      priority: data.priority || 'medium',
    }

    const res = await fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      router.push('/pipeline')
    } else {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Negócio" description="Crie um novo negócio no pipeline" />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Dados do Negócio</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input id="title" name="title" required placeholder='Ex: "200 Clássicos - TechCorp"' />
              </div>
              <div className="space-y-2">
                <Label>Estágio</Label>
                <Select value={stageId} onValueChange={setStageId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {stages.filter((s) => !s.is_won && !s.is_lost).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="value">Valor (R$)</Label>
                  <Input id="value" name="value" type="number" step="0.01" min="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select name="priority" defaultValue="medium">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product_interest">Produto</Label>
                  <Select name="product_interest">
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRODUCT_INTEREST_LABELS).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expected_quantity">Qtd. Estimada</Label>
                  <Input id="expected_quantity" name="expected_quantity" type="number" min="5" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_close_date">Previsão de Fechamento</Label>
                <Input id="expected_close_date" name="expected_close_date" type="date" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Contato e Empresa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Contato *</Label>
                <Select value={contactId} onValueChange={setContactId} required>
                  <SelectTrigger><SelectValue placeholder="Selecione um contato" /></SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger><SelectValue placeholder="Selecione uma empresa" /></SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.trade_name ?? c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Fonte do Lead</Label>
                <Select name="source">
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LEAD_SOURCE_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || !contactId}>
            {saving ? 'Salvando...' : 'Criar Negócio'}
          </Button>
        </div>
      </form>
    </div>
  )
}
