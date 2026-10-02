"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { canManageUsers, resolvePermissions } from "@/config/rolePermissions";
import { menuItems } from "@/config/menuItems";
import { handleLogout } from "@/lib/logout";

export default function Sidenav({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle?: () => void;
}) {
  const router = useRouter();
  const { role, session, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return null;

  // Admin Users is a super-admin-only area; everything else follows the
  // user's stored permission checkboxes.
  const allowedKeys = resolvePermissions(role, session?.permissions).filter(
    (key) => key !== "users" || canManageUsers(role),
  );

  const navItems = menuItems.filter((item) => allowedKeys.includes(item.key));

  return (
    <aside
      className={`sticky top-0 flex h-screen flex-col bg-white border-r border-slate-200 text-slate-700 transition-all duration-300 z-30 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header & Logo */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 overflow-hidden"
        >
          {collapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-slate-100">
              <Image
                src="/images/PICKLogoMark.png"
                alt="Pick O Pick"
                width={28}
                height={18}
                priority
                className="h-auto w-7 object-contain"
              />
            </div>
          ) : (
            <div className="flex h-9 items-center rounded-lg bg-white px-2">
              <Image
                src="/images/PICKLogoMark.png"
                alt="Pick O Pick"
                width={72}
                height={44}
                priority
                className="h-auto w-[72px] object-contain"
              />
            </div>
          )}
        </Link>

        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      {/* Menu (scrollable) */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href !== "#" &&
            (pathname === item.href || pathname.startsWith(item.href + "/"));

          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer controls: Collapse & Logout */}
      <div className="shrink-0 space-y-1 border-t border-slate-100 p-3">
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} className="shrink-0" />
            ) : (
              <>
                <PanelLeftClose size={17} className="shrink-0" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => handleLogout(router)}
          title={collapsed ? "Logout" : undefined}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
