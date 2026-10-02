"use client"

import DashboardLayout from "@/components/DashboardLayout.tsx"
import KanbanBoard from "@/components/kanban/KanbanBoard"
import { useAuth } from "@/hooks/useAuth"

export default function KanbanAdminRoute() {
  const { loading } = useAuth()
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading board...</p>
  return (
    <DashboardLayout>
      <KanbanBoard />
    </DashboardLayout>
  )
}
