'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Kanban,
  Briefcase,
  Users,
  Building2,
  CheckSquare,
  Settings,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useSidebar } from '@/components/layout/SidebarContext'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', href: '/pipeline', icon: Kanban },
  { name: 'Negócios', href: '/negocios', icon: Briefcase },
  { name: 'Contatos', href: '/contatos', icon: Users },
  { name: 'Empresas', href: '/empresas', icon: Building2 },
  { name: 'Tarefas', href: '/tarefas', icon: CheckSquare },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
        <Image
          src="/logo/simbolo-preto.png"
          alt="Winepopper"
          width={24}
          height={24}
          className="h-6 w-6"
        />
        <span className="text-lg font-semibold">Winepopper CRM</span>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t px-6 py-3">
        <p className="text-xs text-muted-foreground">Winepopper CRM v1.0</p>
      </div>
    </>
  )
}

export function Sidebar() {
  const { open, setOpen } = useSidebar()

  return (
    <>
      <aside className="hidden md:flex h-screen w-64 flex-col border-r bg-card">
        <SidebarNav />
      </aside>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <SidebarNav onNavigate={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
