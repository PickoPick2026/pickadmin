'use client'

import UserPage from "@/components/users/UsersPage"
import DashboardLayout from "@/components/DashboardLayout.tsx";
import { useAuth } from "@/hooks/useAuth";
import { ShieldAlert } from "lucide-react";

export default function UsersPage() {

  const { loading, role } = useAuth()

  if (loading) return <p>Loading...</p>

  // Only super admins may manage users — even admins cannot open this page.
  if (role !== "SUPER_ADMIN") {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert size={28} />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Access restricted</h1>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Only super admins can view and manage admin users.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <UserPage/>
    </DashboardLayout>
  )
}