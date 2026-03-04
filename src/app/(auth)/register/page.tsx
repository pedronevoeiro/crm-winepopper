'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Kanban } from 'lucide-react'

type TokenStatus = 'loading' | 'valid' | 'invalid'

interface InviteData {
  email: string
  target_app: string
  crm_role: string | null
  erp_role: string | null
}

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [inviteData, setInviteData] = useState<InviteData | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid')
      setErrorMessage('Link de convite invalido. Nenhum token encontrado.')
      return
    }

    async function validateToken() {
      try {
        const res = await fetch(`/api/admin/invite/validate?token=${token}`)
        const data = await res.json()

        if (data.valid) {
          setTokenStatus('valid')
          setInviteData({
            email: data.email,
            target_app: data.target_app,
            crm_role: data.crm_role,
            erp_role: data.erp_role,
          })
        } else {
          setTokenStatus('invalid')
          setErrorMessage(data.error ?? 'Convite invalido ou expirado.')
        }
      } catch {
        setTokenStatus('invalid')
        setErrorMessage('Erro ao validar convite. Tente novamente.')
      }
    }

    validateToken()
  }, [token])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitError('')

    if (password !== confirmPassword) {
      setSubmitError('As senhas nao coincidem.')
      return
    }

    if (password.length < 6) {
      setSubmitError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/admin/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          display_name: displayName,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setSubmitError(data.error ?? 'Erro ao criar conta.')
        setSubmitting(false)
        return
      }

      router.push('/login?registered=true')
    } catch {
      setSubmitError('Erro de conexao. Tente novamente.')
      setSubmitting(false)
    }
  }

  if (tokenStatus === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Kanban className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle>Winepopper CRM</CardTitle>
            <CardDescription>Validando convite...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (tokenStatus === 'invalid') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive">
              <Kanban className="h-6 w-6 text-destructive-foreground" />
            </div>
            <CardTitle>Convite Invalido</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button variant="outline" onClick={() => router.push('/login')}>
              Voltar para o login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Kanban className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle>Criar sua conta</CardTitle>
          <CardDescription>
            Convite para <strong>{inviteData?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Nome</Label>
              <Input
                id="display_name"
                type="text"
                placeholder="Seu nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar senha</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Repita a senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
