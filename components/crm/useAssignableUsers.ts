"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export type AdminUser = {
  adminLoginID: string
  username: string
  role: string
}

/** Active admin users, for the "assign to" dropdowns. */
export function useAssignableUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from("adminLoginTable")
        .select("adminLoginID, username, role")
        .eq("adminLoginStatus", true)
        .order("username", { ascending: true })

      if (!error && data) {
        setUsers(
          data.map((u: any) => ({
            adminLoginID: String(u.adminLoginID),
            username: u.username,
            role: u.role,
          })),
        )
      }
      setLoading(false)
    })()
  }, [])

  return { users, loading }
}

export const userNameById = (users: AdminUser[], id?: string | number | null) => {
  if (id === undefined || id === null || id === "") return null
  const target = String(id)
  return users.find((u) => String(u.adminLoginID) === target?.username ?? null
}
