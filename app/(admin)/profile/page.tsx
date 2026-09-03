'use client'


import DashboardLayout from "@/components/DashboardLayout.tsx";
import ProfilePage from "@/components/profile/ProfilePage";
import { useAuth } from "@/hooks/useAuth";

export default function SettingPage() {

  const { loading } = useAuth()

  if (loading) return <p>Loading...</p>
  
  return (
    <DashboardLayout>
      <ProfilePage />
    </DashboardLayout>
  )
}