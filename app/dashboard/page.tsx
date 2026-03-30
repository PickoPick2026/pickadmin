'use client'


import Dashboard from "@/components/dashboard/Dashboard"
import DashboardLayout from "@/components/DashboardLayout.tsx"
import { Button } from "@/components/ui/button"
import { useAuth } from '@/hooks/useAuth'


function RoleDashboard({ role }: { role: string }) {
  switch (role) {
    case "SUPER_ADMIN":
      return <Dashboard/>
    case "ADMIN":
  //     return (
  //   <div className="space-y-6 p-6">
  //     <DashboardTabs />      
  //   </div>
  // )
    case "INSIDESALE":
      // return <TeleCallerDashboard />
    case "SUPERVISOR":
      // return <TeleCallerDashboard />
    default:
      return <p>Unauthorized</p>
  }
}


export default function DashboardPage() {
   const { role,loading } = useAuth()   

  if (loading) return <p>Loading...</p>

   // ✅ HANDLE null role here
  if (!role) {
    return <p>Unauthorized</p>
  }

  return (
    <DashboardLayout>      
      <RoleDashboard role={role} />
    </DashboardLayout>
  )
}
