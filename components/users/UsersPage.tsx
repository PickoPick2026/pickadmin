"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import UserForm from "./UserForm"
import UsersList from "./UsersList"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { Input } from "../ui/input"

export type User = {
  adminLoginID: number
  username: string
  password: string
  role: "ADMIN" | "STAFF"
  adminLoginStatus: boolean
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [search, setSearch] = useState("")

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
    setUsers(data)
  }

  const handleSave = async (user: User) => {
    const toastId = toast.loading("Saving user...")

    try {
      const hashedPassword = await bcrypt.hash(user.password, 10)

      if (editing) {
        const { error } = await supabase
          .from("adminLoginTable")
          .update({
            username: user.username,
            password: hashedPassword,
            role: user.role,
          })
          .eq("adminLoginID", user.adminLoginID)

        if (error) throw error

        toast.success("User updated", { id: toastId })
      } else {
        const { data, error } = await supabase
          .from("adminLoginTable")
          .insert({
            username: user.username,
            password: hashedPassword,
            role: user.role,
            adminLoginStatus: true,
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
    }
  }

  const handleEdit = (user: User) => {
    setEditing(user)
    setOpen(true)
  }

  const handleDelete = async (id: number) => {
    await supabase
      .from("adminLoginTable")
      .update({ adminLoginStatus: false })
      .eq("adminLoginID", id)

    fetchUsers()
    toast.success("User deactivated")
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Users</h1>
        <Input
          placeholder="Search username or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Button onClick={() => setOpen(true)}>Add User</Button>
      </div>

      

      {open && (
        <UserForm
          initialData={editing}
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
        onDelete={handleDelete}
      />
    </div>
  )
}