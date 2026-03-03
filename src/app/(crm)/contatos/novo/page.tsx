'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LEAD_SOURCE_LABELS } from '@/lib/constants'
import type { CrmCompany } from '@/types/database'

export default function NovoContatoPage() {
  return (
    <Suspense>
      <NovoContatoForm />
    </Suspense>
  )
}

function NovoContatoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedCompanyId = searchParams.get('company_id')
  const [saving, setSaving] = useState(false)
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [companyId, setCompanyId] = useState(preselectedCompanyId ?? '')
  const [isDecisionMaker, setIsDecisionMaker] = useState(false)

  useEffect(() => {
    fetch('/api/companies').then((r) => r.json()).then(setCompanies)
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())
    const body = {
      ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '')),
      company_id: companyId || null,
      is_decision_maker: isDecisionMaker,
      tags: typeof data.tags === 'string' && data.tags
        ? (data.tags as string).split(',').map((t) => t.trim()).filter(Boolean)
        : [],
    }

    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      const contact = await res.json()
      router.push(`/contatos/${contact.id}`)
    } else {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Novo Contato" description="Cadastre um novo contato" />

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Dados do Contato</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input id="name" name="name" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" name="phone" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Celular</Label>
                  <Input id="mobile" name="mobile" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input id="position" name="position" />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_decision_maker"
                  checked={isDecisionMaker}
                  onCheckedChange={(v) => setIsDecisionMaker(v === true)}
                />
                <Label htmlFor="is_decision_maker">Tomador de decisão</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Empresa e Origem</CardTitle></CardHeader>
            <CardContent className="space-y-4">
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
                    {Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input id="tags" name="tags" placeholder="ex: decisor, vip" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" rows={4} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Contato'}
          </Button>
        </div>
      </form>
    </div>
  )
}
