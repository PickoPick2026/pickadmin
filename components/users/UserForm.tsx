"use client"

import { useEffect, useState } from "react"
import { Camera, Trash2, UserRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import Drawer from "@/components/ui/drawer"
import Dropdown from "@/components/ui/dropdown"
import { assignableFeatures } from "@/config/menuItems"
import { roles } from "@/config/rolePermissions"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
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
    avatar_url: initialData?.avatar_url ?? null,
  })

  // New avatar picked in this session (not yet uploaded).
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(
    () => () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    },
    [avatarPreview],
  )

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file")
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const removeAvatar = () => {
    setAvatarFile(null)
    setAvatarPreview(null)
    setForm((prev) => ({ ...prev, avatar_url: null }))
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile) return form.avatar_url ?? null

    setUploadingAvatar(true)
    try {
      const ext = avatarFile.name.split(".").pop() || "jpg"
      const path = `users/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error } = await supabase.storage.from("avatars").upload(path, avatarFile, {
        cacheControl: "3600",
        upsert: false,
      })
      if (error) throw error

      const { data } = supabase.storage.from("avatars").getPublicUrl(path)
      return data.publicUrl
    } catch (err: any) {
      toast.error(`Avatar upload failed: ${err?.message || err}`)
      return form.avatar_url ?? null
    } finally {
      setUploadingAvatar(false)
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialData && !form.password) return
    const avatar_url = await uploadAvatar()
    onSave({ ...form, avatar_url })
  }

  const featureChecked = (key: string) => form.permissions.includes(key)

  // Sidebar pages only — "Delete Leads" is a special permission, not a page.
  const sidebarFeatures = assignableFeatures.filter((f) => f.key !== "delete_leads")

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
        {/* Avatar */}
        <div className="flex items-center gap-4">
          {avatarPreview || form.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview || form.avatar_url!}
              alt=""
              className="h-16 w-16 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <UserRound size={26} />
            </span>
          )}

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-800">Profile photo</p>
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:bg-blue-50">
                <Camera size={14} />
                {uploadingAvatar ? "Uploading…" : "Upload photo"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={pickAvatar}
                  disabled={uploadingAvatar}
                />
              </label>
              {(avatarFile || form.avatar_url) && (
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="text-xs font-medium text-slate-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Shown next to the user's name everywhere leads are assigned.
            </p>
          </div>
        </div>

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
            <Dropdown
              value={form.role}
              onChange={(v) => setForm({ ...form, role: v as User["role"] })}
              options={roles.map((role) => ({
                value: role,
                label:
                  role === "SUPER_ADMIN"
                    ? "Super Admin"
                    : role === "ADMIN"
                      ? "Admin"
                      : "Staff",
              }))}
            />
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
            {sidebarFeatures.map((feature) => (
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

          {form.role === "SUPER_ADMIN" && (
            <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
              Super admins always have access to everything, including Admin Users.
            </p>
          )}
        </div>

        {/* Special permissions — destructive abilities, not sidebar pages */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-800">Special permissions</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Not a page — these grant extra abilities on top of the features above.
          </p>

          <label className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-lg border border-rose-100 bg-rose-50/50 px-3 py-2 text-sm text-slate-700 transition hover:border-rose-200">
            <Checkbox
              checked={featureChecked("delete_leads")}
              onCheckedChange={() => togglePermission("delete_leads")}
            />
            <Trash2 size={15} className="shrink-0 text-rose-400" />
            Delete Leads
          </label>

          {featureChecked("delete_leads") && (
            <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              Delete Leads lets this user permanently delete quote, NRI, estimate
              and service requests (including bulk delete on service requests).
            </p>
          )}
        </div>
      </form>
    </Drawer>
  )
}
