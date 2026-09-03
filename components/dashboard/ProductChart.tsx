"use client"

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

type Props = {
  signupTrend: { label: string; customers: number }[]
  categoryBreakdown: { name: string; products: number }[]
}

const BAR_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6", "#ec4899"]

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 12,
  boxShadow: "0 4px 16px rgb(15 23 42 / 0.08)",
}

export default function ProductChart({ signupTrend, categoryBreakdown }: Props) {
  const topCategories = categoryBreakdown.slice(0, 7)

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="New customers" subtitle="Sign-ups over the last 14 days">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={signupTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="customers"
              stroke="#6366f1"
              strokeWidth={2}
              fill="url(#signupFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Panel>

      <Panel title="Products per category" subtitle="Top categories by catalogue size">
        {topCategories.length === 0 ? (
          <p className="py-16 text-center text-sm text-slate-400">No categories yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={topCategories}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 11, fill: "#475569" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="products" radius={[0, 6, 6, 0]} barSize={18}>
                {topCategories.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Panel>
    </div>
  )
}
