"use client"

import { useEffect } from "react"
import { X } from "lucide-react"

type DrawerProps = {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Right-aligned node rendered next to the title (badges, contact buttons…). */
  actions?: React.ReactNode
  children: React.ReactNode
  /** Sticky node rendered at the bottom of the drawer (save buttons…). */
  footer?: React.ReactNode
  wide?: boolean
}

/**
 * Reusable right-side sliding drawer used across the CRM
 * (lead actions, user form, …). Mount it once and toggle `open`.
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  actions,
  children,
  footer,
  wide = false,
}: DrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`absolute right-0 top-0 flex h-full w-full flex-col bg-white transition-transform duration-300 ease-out ${
          wide ? "sm:max-w-2xl" : "sm:max-w-xl"
        } ${open ? "translate-x-0" : "translate-x-full"}`}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <div className="text-lg font-bold text-slate-900">{title}</div>
            {subtitle && (
              <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <div className="border-t border-slate-100 bg-white px-5 py-4">{footer}</div>
        )}
      </aside>
    </div>
  )
}
