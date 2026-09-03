"use client"

import Link from "next/link"
import Image from "next/image"
import { LogOut } from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { rolePermissions } from "@/config/rolePermissions"
import { menuItems } from "@/config/menuItems"
import { handleLogout } from "@/lib/logout"

export default function Sidenav({ collapsed }: { collapsed: boolean }) {
  const router = useRouter()
  const { role, loading } = useAuth()
  const pathname = usePathname()

  const allowedKeys = rolePermissions[role as keyof typeof rolePermissions] ?? []

  if (loading) return null

  const navItems = menuItems.filter(
    (item) => item.key !== "logout" && allowedKeys.includes(item.key),
  )

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-gray-300 transition-all duration-300
      ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-white/10 px-4">
        {collapsed ? (
          <Image src="/images/favicon.png" alt="Logo" width={32} height={32} />
        ) : (
          <Image src="/images/logo.png" alt="Logo" width={120} height={32} />
        )}
      </div>

      {/* Menu (scrollable) */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href !== "#" &&
            (pathname === item.href || pathname.startsWith(item.href + "/"))

          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200
              ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Logout (pinned to bottom, visually separated) */}
      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => handleLogout(router)}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-rose-300 transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-200
          ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  )
}
