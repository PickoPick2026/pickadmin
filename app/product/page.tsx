'use client'


import DashboardLayout from "@/components/DashboardLayout.tsx";
import ProductPage from "@/components/productlist/ProductPage";

import { useAuth } from "@/hooks/useAuth";

export default function SettingPage() {

  const { loading } = useAuth()

  if (loading) return <p>Loading...</p>
  
  return (
    <DashboardLayout>
        <ProductPage/>
    </DashboardLayout>
  )
}