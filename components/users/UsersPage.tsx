"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import UserForm from "./UserForm"
import UsersList from "./UsersList"
import PageHeader from "@/components/common/PageHeader"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export type User = {
  adminLoginID: number
  username: string
  password: string
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF"
  adminLoginStatus: boolean
  permissions: string[]
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  )

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("adminLoginTable")
      .select("*")
      .order("adminLoginID", { ascending: false })

    if (error) return console.error(error)
    setUsers(
      ((data || []) as any[]).map((u) => ({
        ...u,
        permissions: Array.isArray(u.permissions) ? u.permissions : [],
      }))
    )
  }

  const handleSave = async (user: User) => {
    const toastId = toast.loading("Saving user...")
    setSaving(true)

    try {
      // Blank password on edit means "keep the existing one".
      const hashedPassword = user.password
        ? await bcrypt.hash(user.password, 10)
        : undefined

      const payload: Record<string, unknown> = {
        username: user.username,
        role: user.role,
        adminLoginStatus: user.adminLoginStatus,
        permissions: user.permissions,
      }
      if (hashedPassword) payload.password = hashedPassword

      if (editing) {
        const { error } = await supabase
          .from("adminLoginTable")
          .update(payload)
          .eq("adminLoginID", user.adminLoginID)

        if (error) throw error

        toast.success("User updated", { id: toastId })
      } else {
        const { data, error } = await supabase
          .from("adminLoginTable")
          .insert({
            ...payload,
            password: hashedPassword,
            adminLoginStatus: user.adminLoginStatus,
          })
          .select()
          .single()

        if (error) throw error

        setUsers((prev) => [data, ...prev])
        toast.success("User created", { id: toastId })
      }

      setOpen(false)
      setEditing(null)
      fetchUsers()
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditing(user)
    setOpen(true)
  }

  const handleToggleStatus = async (user: User) => {
    const next = !user.adminLoginStatus
    const { error } = await supabase
      .from("adminLoginTable")
      .update({ adminLoginStatus: next })
      .eq("adminLoginID", user.adminLoginID)

    if (error) return toast.error(`Could not update user: ${error.message}`)

    setUsers((prev) =>
      prev.map((u) => (u.adminLoginID === user.adminLoginID ? { ...u, adminLoginStatus: next } : u))
    )
    toast.success(next ? "User activated" : "User deactivated")
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Users"
        subtitle={`${users.length} account${users.length === 1 ? "" : "s"}`}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search username or role…",
        }}
        actions={<Button onClick={() => setOpen(true)}>Add User</Button>}
      />

      {open && (
        <UserForm
          initialData={editing}
          saving={saving}
          onClose={() => {
            setOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}

      <UsersList
        users={filteredUsers}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  )
}
