'use client'


import DashboardLayout from "@/components/DashboardLayout.tsx";
import ProductForm from "@/components/productlist/ProductForm";

import { useAuth } from "@/hooks/useAuth";

export default function SettingPage() {

  const { loading } = useAuth()

  if (loading) return <p>Loading...</p>
  
  return (
    <DashboardLayout>
        <ProductForm/>
    </DashboardLayout>
  )
}