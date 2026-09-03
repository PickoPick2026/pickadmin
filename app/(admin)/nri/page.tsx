"use client"

import DashboardLayout from "@/components/DashboardLayout.tsx"
import NriRequestsPage from "@/components/NRI/NriRequestsPage"
import { useAuth } from "@/hooks/useAuth"

export default function NriPage() {
  const { loading } = useAuth()
  if (loading) return <p className="p-6">Loading...</p>
  return <DashboardLayout><NriRequestsPage /></DashboardLayout>
}
