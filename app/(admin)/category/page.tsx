'use client'


import CategoryPage from "@/components/categorylist/CategoryPage";
import DashboardLayout from "@/components/DashboardLayout.tsx";

import { useAuth } from "@/hooks/useAuth";

export default function SettingPage() {

  const { loading } = useAuth()

  if (loading) return <p>Loading...</p>
  
  return (
    <DashboardLayout>
        <CategoryPage/>
    </DashboardLayout>
  )
}