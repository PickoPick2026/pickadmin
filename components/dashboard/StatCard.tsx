"use client"

import { LucideIcon } from "lucide-react"

type Props = {
  title: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  tone?: "indigo" | "emerald" | "amber" | "rose" | "slate"
}

const tones = {
  indigo: "bg-indigo-50 text-indigo-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-600",
}

export default function StatCard({ title, value, hint, icon: Icon, tone = "slate" }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">{value}</h2>
        </div>
        {Icon && (
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
      {hint && <p className="mt-2 text-xs font-medium text-slate-400">{hint}</p>}
    </div>
  )
}
