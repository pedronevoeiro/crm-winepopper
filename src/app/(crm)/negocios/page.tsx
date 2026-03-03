import { redirect } from 'next/navigation'

// Negócios são gerenciados via Pipeline (Kanban)
export default function NegociosPage() {
  redirect('/pipeline')
}
