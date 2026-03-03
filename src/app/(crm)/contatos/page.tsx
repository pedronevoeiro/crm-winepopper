'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Users } from 'lucide-react'
import { LEAD_SOURCE_LABELS } from '@/lib/constants'
import type { CrmContactWithCompany } from '@/types/database'

export default function ContatosPage() {
  const [contacts, setContacts] = useState<CrmContactWithCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    fetch(`/api/contacts${params}`)
      .then((res) => res.json())
      .then(setContacts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        description="Gerencie seus contatos e leads"
        actions={
          <Link href="/contatos/novo">
            <Button><Plus className="mr-2 h-4 w-4" />Novo Contato</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, empresa, cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Users className="h-8 w-8" />
              <p>Nenhum contato encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Fonte</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Link href={`/contatos/${contact.id}`} className="font-medium hover:underline">
                        {contact.name}
                      </Link>
                      {contact.is_decision_maker && (
                        <Badge variant="secondary" className="ml-2 text-xs">Decisor</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.company ? (
                        <Link href={`/empresas/${contact.company.id}`} className="hover:underline">
                          {contact.company.trade_name ?? contact.company.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{contact.position ?? '-'}</TableCell>
                    <TableCell>{contact.email ?? '-'}</TableCell>
                    <TableCell>{contact.mobile ?? contact.phone ?? '-'}</TableCell>
                    <TableCell>
                      {contact.source ? LEAD_SOURCE_LABELS[contact.source] : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
