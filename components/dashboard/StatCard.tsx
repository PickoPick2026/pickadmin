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
  indigo: "bg-blue-50 text-blue-600",
  emerald: "bg-blue-50 text-blue-600",
  amber: "bg-blue-50 text-blue-600",
  rose: "bg-blue-50 text-blue-600",
  slate: "bg-blue-50 text-blue-600",
}

export default function StatCard({ title, value, hint, icon: Icon, tone = "slate" }: Props) {
  return (
    <div className="rounded-xl border bg-white p-4">
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
