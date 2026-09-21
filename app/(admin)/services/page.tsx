"use client"

import DashboardLayout from "@/components/DashboardLayout.tsx"
import ServiceRequestsPage from "@/components/services/ServiceRequestsPage"
import { useAuth } from "@/hooks/useAuth"

export default function ServicesAdminRoute() {
  const { loading } = useAuth()
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading service requests...</p>
  return (
    <DashboardLayout>
      <ServiceRequestsPage />
    </DashboardLayout>
  )
}
