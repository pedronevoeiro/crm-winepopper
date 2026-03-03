'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ActivityTimeline } from '@/components/shared/ActivityTimeline'
import { formatBRL, LEAD_SOURCE_LABELS } from '@/lib/constants'
import { Briefcase, Building2, Plus } from 'lucide-react'
import type { CrmContact, CrmCompany, CrmDeal, CrmActivity } from '@/types/database'
import { users } from '@/lib/data'

interface ContactDetail extends CrmContact {
  company: CrmCompany | null
  deals: CrmDeal[]
  activities: CrmActivity[]
}

export default function ContatoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/contacts/${id}`)
      .then((res) => res.json())
      .then(setContact)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (!contact) {
    return <div className="text-muted-foreground">Contato não encontrado</div>
  }

  const activitiesWithUser = contact.activities.map((a) => ({
    ...a,
    user: users.find((u) => u.id === a.user_id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={contact.name}
        description={contact.position ?? undefined}
        actions={
          <Link href={`/negocios/novo?contact_id=${contact.id}${contact.company_id ? `&company_id=${contact.company_id}` : ''}`}>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Negócio</Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Dados do Contato</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {contact.email && <div><span className="font-medium">E-mail:</span> {contact.email}</div>}
            {contact.phone && <div><span className="font-medium">Telefone:</span> {contact.phone}</div>}
            {contact.mobile && <div><span className="font-medium">Celular:</span> {contact.mobile}</div>}
            {contact.position && <div><span className="font-medium">Cargo:</span> {contact.position}</div>}
            {contact.source && <div><span className="font-medium">Fonte:</span> {LEAD_SOURCE_LABELS[contact.source]}</div>}
            {contact.is_decision_maker && <Badge variant="secondary">Tomador de Decisão</Badge>}
            {contact.notes && <div><span className="font-medium">Obs:</span> {contact.notes}</div>}
            {contact.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {contact.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contact.company ? (
              <Link href={`/empresas/${contact.company.id}`} className="block rounded-md border p-3 hover:bg-accent/50 transition-colors">
                <div className="font-medium">{contact.company.trade_name ?? contact.company.name}</div>
                {contact.company.industry && <div className="text-sm text-muted-foreground">{contact.company.industry}</div>}
                {contact.company.city && <div className="text-sm text-muted-foreground">{contact.company.city}/{contact.company.state}</div>}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma empresa vinculada</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Negócios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />Negócios ({contact.deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contact.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum negócio vinculado</p>
          ) : (
            <div className="space-y-2">
              {contact.deals.map((deal) => (
                <Link key={deal.id} href={`/negocios/${deal.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <div className="font-medium">{deal.title}</div>
                  </div>
                  {deal.value && <div className="font-medium">{formatBRL(deal.value)}</div>}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle>Histórico de Atividades</CardTitle></CardHeader>
        <CardContent>
          <ActivityTimeline activities={activitiesWithUser} />
        </CardContent>
      </Card>
    </div>
  )
}
