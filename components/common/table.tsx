"use client"

import { ReactNode } from "react"

/** Card wrapper + horizontal scroll for any admin table. */
export function TableCard({ children, minWidth = 720 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="w-full text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  )
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </thead>
  )
}

export function Tr({ children }: { children: ReactNode }) {
  return <tr className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">{children}</tr>
}

export function EmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-10 text-center text-sm text-slate-400">
        {children}
      </td>
    </tr>
  )
}

const toneMap: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-rose-50 text-rose-700 ring-rose-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  blue: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
}

export function StatusPill({
  active,
  tone,
  children,
}: {
  active?: boolean
  tone?: keyof typeof toneMap
  children: ReactNode
}) {
  const key = tone ?? (active ? "green" : "slate")
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${toneMap[key]}`}
    >
      {children}
    </span>
  )
}

export function IconButton({
  onClick,
  title,
  tone = "slate",
  children,
}: {
  onClick: () => void
  title: string
  tone?: "slate" | "blue" | "red"
  children: ReactNode
}) {
  const tones = {
    slate: "text-slate-500 hover:bg-slate-100 hover:text-slate-700",
    blue: "text-slate-500 hover:bg-indigo-50 hover:text-indigo-600",
    red: "text-slate-500 hover:bg-rose-50 hover:text-rose-600",
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors ${tones[tone]}`}
    >
      {children}
    </button>
  )
}
