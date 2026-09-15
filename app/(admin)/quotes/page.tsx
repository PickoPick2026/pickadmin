"use client"

import DashboardLayout from "@/components/DashboardLayout.tsx"
import QuotesPage from "@/components/quotes/QuotesPage"
import { useAuth } from "@/hooks/useAuth"

export default function QuotesAdminRoute() {
  const { loading } = useAuth()
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading quote requests...</p>
  return (
    <DashboardLayout>
      <QuotesPage />
    </DashboardLayout>
  )
}
