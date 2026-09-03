"use client"

import { Search } from "lucide-react"
import { ReactNode } from "react"

type PageHeaderProps = {
  title: string
  subtitle?: string
  search?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  actions?: ReactNode
}

export default function PageHeader({ title, subtitle, search, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {search && (
          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? "Search…"}
              className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
            />
          </div>
        )}
        {actions}
      </div>
    </div>
  )
}
