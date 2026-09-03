"use client"

import DashboardLayout from "@/components/DashboardLayout.tsx"
import EstimateLeadsPage from "@/components/estimates/EstimateLeadsPage"
import { useAuth } from "@/hooks/useAuth"

export default function EstimatesPage() {
  const { loading } = useAuth()
  if (loading) return <p className="p-6">Loading...</p>
  return <DashboardLayout><EstimateLeadsPage /></DashboardLayout>
}
