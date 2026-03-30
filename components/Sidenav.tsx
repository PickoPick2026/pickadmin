"use client"

import { useState } from "react"

import Link from "next/link"
import { Building2, LayoutDashboard, Menu, Users } from "lucide-react"
import Image from "next/image"
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { rolePermissions } from "@/config/rolePermissions"
import { menuItems } from "@/config/menuItems"
import { usePathname } from "next/navigation"


export default function Sidenav({
  collapsed,
}: {
  collapsed: boolean
}) {
  const router = useRouter()
  const { role, loading, logout } = useAuth()
  const [open, setOpen] = useState(true)
  const pathname = usePathname()

  const allowedKeys =
    rolePermissions[role as keyof typeof rolePermissions] ?? []

  if (loading) return null
  return (
  <aside
    className={`h-screen transition-all duration-300
    ${collapsed ? "w-20" : "w-64"}
    bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-gray-300`}
  >
    {/* Logo */}
    <div className="h-16 flex items-center px-4 border-b border-gray-700">
      {collapsed ? (
        <Image src="/images/favicon.png" alt="Logo" width={32} height={32} />
      ) : (
        <Image
          src="/images/logo.png"
          alt="Logo"
          width={120}
          height={32}
        />
      )}
    </div>

    {/* Menu */}
    <nav className="flex-1 px-3 py-4 space-y-1">
      {menuItems
        .filter((item) => allowedKeys.includes(item.key))
        .map((item) => {
          const Icon = item.icon

          const isActive =
            item.href !== "#" &&
            (pathname === item.href ||
              pathname.startsWith(item.href + "/"))

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {/* Icon */}
              <Icon size={18} />

              {/* Label */}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
    </nav>
  </aside>
)
}
