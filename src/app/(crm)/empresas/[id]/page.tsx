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
import { formatCNPJ, formatBRL, COMPANY_SIZE_LABELS } from '@/lib/constants'
import { Users, Briefcase, Plus } from 'lucide-react'
import type { CrmCompany, CrmContact, CrmDeal, CrmActivity } from '@/types/database'
import { users } from '@/lib/data'

interface CompanyDetail extends CrmCompany {
  contacts: CrmContact[]
  deals: CrmDeal[]
  activities: CrmActivity[]
}

export default function EmpresaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [company, setCompany] = useState<CompanyDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/companies/${id}`)
      .then((res) => res.json())
      .then(setCompany)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!company) {
    return <div className="text-muted-foreground">Empresa não encontrada</div>
  }

  const activitiesWithUser = company.activities.map((a) => ({
    ...a,
    user: users.find((u) => u.id === a.user_id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <PageHeader
        title={company.trade_name ?? company.name}
        description={company.trade_name ? company.name : undefined}
        actions={
          <Link href={`/negocios/novo?company_id=${company.id}`}>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Negócio</Button>
          </Link>
        }
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dados da empresa */}
        <Card>
          <CardHeader><CardTitle>Dados da Empresa</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company.cnpj && <div><span className="font-medium">CNPJ:</span> {formatCNPJ(company.cnpj)}</div>}
            {company.industry && <div><span className="font-medium">Segmento:</span> {company.industry}</div>}
            {company.size && <div><span className="font-medium">Porte:</span> {COMPANY_SIZE_LABELS[company.size]}</div>}
            {company.email && <div><span className="font-medium">E-mail:</span> {company.email}</div>}
            {company.phone && <div><span className="font-medium">Telefone:</span> {company.phone}</div>}
            {company.website && <div><span className="font-medium">Website:</span> <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{company.website}</a></div>}
            {company.city && <div><span className="font-medium">Cidade:</span> {company.city}/{company.state}</div>}
            {company.street && <div><span className="font-medium">Endereço:</span> {company.street}, {company.number}{company.complement ? ` - ${company.complement}` : ''}</div>}
            {company.notes && <div><span className="font-medium">Obs:</span> {company.notes}</div>}
            {company.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {company.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contatos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />Contatos ({company.contacts.length})
            </CardTitle>
            <Link href={`/contatos/novo?company_id=${company.id}`}>
              <Button variant="outline" size="sm"><Plus className="mr-1 h-3 w-3" />Adicionar</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {company.contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum contato vinculado</p>
            ) : (
              <div className="space-y-3">
                {company.contacts.map((contact) => (
                  <Link key={contact.id} href={`/contatos/${contact.id}`} className="block rounded-md border p-3 hover:bg-accent/50 transition-colors">
                    <div className="font-medium">{contact.name}</div>
                    {contact.position && <div className="text-sm text-muted-foreground">{contact.position}</div>}
                    {contact.email && <div className="text-sm text-muted-foreground">{contact.email}</div>}
                    {contact.is_decision_maker && <Badge variant="secondary" className="mt-1 text-xs">Decisor</Badge>}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Negócios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />Negócios ({company.deals.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {company.deals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum negócio vinculado</p>
          ) : (
            <div className="space-y-2">
              {company.deals.map((deal) => (
                <Link key={deal.id} href={`/negocios/${deal.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50 transition-colors">
                  <div>
                    <div className="font-medium">{deal.title}</div>
                    <div className="text-sm text-muted-foreground">{deal.product_interest}</div>
                  </div>
                  <div className="text-right">
                    {deal.value && <div className="font-medium">{formatBRL(deal.value)}</div>}
                  </div>
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
