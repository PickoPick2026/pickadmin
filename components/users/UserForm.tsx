"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Drawer from "@/components/ui/drawer"
import { assignableFeatures } from "@/config/menuItems"
import { roles } from "@/config/rolePermissions"
import { User } from "./UsersPage"

export default function UserForm({
  initialData,
  onSave,
  onClose,
  saving,
}: {
  initialData: User | null
  onSave: (user: User) => void
  onClose: () => void
  saving?: boolean
}) {
  const [form, setForm] = useState<User>({
    adminLoginID: initialData?.adminLoginID ?? 0,
    username: initialData?.username ?? "",
    password: "",
    role: initialData?.role ?? "STAFF",
    adminLoginStatus: initialData ? initialData.adminLoginStatus : true,
    permissions: initialData?.permissions ?? [],
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const togglePermission = (key: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((k) => k !== key)
        : [...prev.permissions, key],
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialData && !form.password) return
    onSave(form)
  }

  const featureChecked = (key: string) => form.permissions.includes(key)

  return (
    <Drawer
      open
      onClose={onClose}
      title={initialData ? "Edit user" : "Add user"}
      subtitle={
        initialData
          ? "Update details, feature access and account status."
          : "Create the account, then tick the sidebar features this user can access."
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" disabled={saving}>
            {saving ? "Saving…" : initialData ? "Update user" : "Create user"}
          </Button>
        </div>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Username</Label>
            <Input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. kathir"
              required
            />
          </div>

          <div>
            <Label>Role</Label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm outline-none focus-visible:border-blue-500"
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role === "SUPER_ADMIN"
                    ? "Super Admin"
                    : role === "ADMIN"
                      ? "Admin"
                      : "Staff"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>
              Password
              {initialData && (
                <span className="ml-1 font-normal text-slate-400">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              type="password"
              name="password"
              onChange={handleChange}
              required={!initialData}
              placeholder={initialData ? "••••••••" : "Set a password"}
            />
          </div>

          <div>
            <Label>Account status</Label>
            <label className="flex h-9 items-center gap-2 text-sm text-slate-700">
              <Checkbox
                checked={form.adminLoginStatus}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, adminLoginStatus: checked === true }))
                }
              />
              {form.adminLoginStatus ? "Active — can sign in" : "Inactive — sign-in blocked"}
            </label>
          </div>
        </div>

        {/* Feature access — controls which sidebar items the user sees */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">Feature access</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Tick the sidebar sections this user can open after signing in.
          </p>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {assignableFeatures.map((feature) => (
              <label
                key={feature.key}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-200 hover:bg-slate-50"
              >
                <Checkbox
                  checked={featureChecked(feature.key)}
                  onCheckedChange={() => togglePermission(feature.key)}
                />
                <feature.icon size={15} className="shrink-0 text-slate-400" />
                {feature.label}
              </label>
            ))}
          </div>

          {featureChecked("delete_leads") && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              Delete Leads lets this user permanently delete quote, NRI, estimate
              and service requests (including bulk delete on service requests).
            </p>
          )}

          {form.role === "SUPER_ADMIN" && (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Super admins always have access to everything, including Admin Users.
            </p>
          )}
        </div>
      </form>
    </Drawer>
  )
}
