"use client"

import Link from "next/link"
import { Layers, ShieldCheck, Tags, UserCog } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"

type Item = {
  label: string
  description: string
  href: string
  icon: any
  superAdminOnly?: boolean
}

/** Only real, working areas of this admin — nothing else. */
const sections: { title: string; items: Item[] }[] = [
  {
    title: "User Management",
    items: [
      {
        label: "Admin Users",
        description: "Create users, set passwords, roles and the sidebar features each user can access. Super admins only.",
        href: "/users",
        icon: UserCog,
        superAdminOnly: true,
      },
    ],
  },
  {
    title: "Catalog",
    items: [
      {
        label: "Products",
        description: "Manage the product catalog shown on the website.",
        href: "/product",
        icon: Layers,
      },
      {
        label: "Categories",
        description: "Manage product categories. Also available from inside Products.",
        href: "/category",
        icon: Tags,
      },
    ],
  },
]

export default function AdminSettingsPage() {
  const { role, loading } = useAuth()

  if (loading) return null

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.superAdminOnly || role === "SUPER_ADMIN"
      ),
    }))
    .filter((section) => section.items.length > 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage accounts and catalog settings for the Pick O Pick CRM.
        </p>
      </div>

      {visibleSections.map((section) => (
        <div key={section.title} className="rounded-xl border bg-white p-6">
          <h2 className="text-base font-semibold text-slate-800">{section.title}</h2>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50/40"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition group-hover:bg-blue-600 group-hover:text-white">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-slate-400">
                      {item.description}
                    </span>
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}

      {role !== "SUPER_ADMIN" && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          <ShieldCheck size={18} className="shrink-0 text-slate-400" />
          User management is available to super admins only.
        </div>
      )}
    </div>
  )
}
