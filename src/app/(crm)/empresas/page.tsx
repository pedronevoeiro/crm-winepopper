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
import { Plus, Search, Building2 } from 'lucide-react'
import { formatCNPJ, COMPANY_SIZE_LABELS } from '@/lib/constants'
import type { CrmCompany } from '@/types/database'

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<CrmCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    fetch(`/api/companies${params}`)
      .then((res) => res.json())
      .then(setCompanies)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Gerencie suas empresas e contas"
        actions={
          <Link href="/empresas/nova">
            <Button><Plus className="mr-2 h-4 w-4" />Nova Empresa</Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CNPJ, cidade..."
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
          ) : companies.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Building2 className="h-8 w-8" />
              <p>Nenhuma empresa encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead>Porte</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell>
                      <Link href={`/empresas/${company.id}`} className="font-medium hover:underline">
                        {company.trade_name ?? company.name}
                      </Link>
                      {company.trade_name && (
                        <p className="text-xs text-muted-foreground">{company.name}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {company.cnpj ? formatCNPJ(company.cnpj) : '-'}
                    </TableCell>
                    <TableCell>{company.industry ?? '-'}</TableCell>
                    <TableCell>
                      {company.size ? COMPANY_SIZE_LABELS[company.size] : '-'}
                    </TableCell>
                    <TableCell>
                      {company.city && company.state
                        ? `${company.city}/${company.state}`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {company.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
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
