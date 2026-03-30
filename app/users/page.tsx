'use client'

import UserPage from "@/components/users/UsersPage"
import DashboardLayout from "@/components/DashboardLayout.tsx";
import { useAuth } from "@/hooks/useAuth";

export default function UsersPage() {

  const { loading } = useAuth()

  if (loading) return <p>Loading...</p>
  
  return (
    <DashboardLayout>
      <UserPage/>
    </DashboardLayout>
  )
}