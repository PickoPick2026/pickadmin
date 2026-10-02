"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Calculator,
  ClipboardList,
  PackageCheck,
  ShoppingBag,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { getDashboardStats, DashboardData, LeadStatusCounts } from "./getDashboardStats"
import { EmptyRow, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"

/**
 * Unified pipeline stages across all four lead sources. Each stage maps the
 * per-table status values that mean the same thing operationally.
 */
const PIPELINE_STAGES: { key: string; label: string; statuses: string[] }[] = [
  { key: "new", label: "New requests", statuses: ["NEW", "PENDING", "QUOTE_REQUESTED"] },
  { key: "contacted", label: "Contacted", statuses: ["CONTACTED"] },
  { key: "followup", label: "Follow-up", statuses: ["FOLLOW_UP"] },
  { key: "working", label: "Quoted / In progress", statuses: ["QUOTED", "IN_PROGRESS", "CONFIRMED"] },
  { key: "converted", label: "Converted / Completed", statuses: ["CONVERTED", "COMPLETED"] },
  { key: "closed", label: "Closed / Cancelled", statuses: ["CLOSED", "CANCELLED"] },
]

const SOURCE_CARDS = [
  { key: "estimates", label: "Estimate Leads", href: "/estimates", icon: Calculator, newStatuses: ["NEW"] },
  { key: "quotes", label: "Quote Requests", href: "/quotes", icon: ShoppingBag, newStatuses: ["QUOTE_REQUESTED"] },
  { key: "nri", label: "NRI Requests", href: "/nri", icon: ClipboardList, newStatuses: ["PENDING"] },
  { key: "services", label: "Service Requests", href: "/services", icon: PackageCheck, newStatuses: ["NEW"] },
] as const

const SOURCE_COLORS = ["#0B56D9", "#2F6FEA", "#5F97F6", "#96BAFA"]

const sumStatuses = (counts: Record<string, LeadStatusCounts>, statuses: string[]) =>
  Object.values(counts).reduce(
    (total, byStatus) =>
      total + statuses.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0),
    0,
  )

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200 bg-white p-5 ${className}`}>{children}</div>
}

function CardTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  )
}

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  fontSize: 12,
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    getDashboardStats().then(setData).catch(console.error)
  }, [])

  const pipeline = useMemo(() => {
    if (!data) return { stages: [] as { key: string; label: string; count: number }[], total: 0, converted: 0, closed: 0, rate: 0 }
    const counts = data.leadStatuses
    const total = Object.values(counts).reduce(
      (sum, byStatus) => sum + Object.values(byStatus).reduce((a, b) => a + b, 0),
      0,
    )
    const stages = PIPELINE_STAGES.map((stage) => ({
      key: stage.key,
      label: stage.label,
      count: sumStatuses(counts, stage.statuses),
    }))
    const converted = stages.find((s) => s.key === "converted")?.count ?? 0
    const closed = stages.find((s) => s.key === "closed")?.count ?? 0
    return { stages, total, converted, closed, rate: total > 0 ? Math.round((converted / total) * 100) : 0 }
  }, [data])

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading dashboard…
      </div>
    )
  }

  const maxStage = Math.max(1, ...pipeline.stages.map((s) => s.count))

  const sourceData = SOURCE_CARDS.map((s, i) => ({
    name: s.label,
    total: Object.values(data.leadStatuses[s.key] ?? {}).reduce((a, b) => a + b, 0),
    color: SOURCE_COLORS[i],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Lead pipeline, conversion and customer activity across the business.
        </p>
      </div>

      {/* Lead sources */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SOURCE_CARDS.map((source) => {
          const Icon = source.icon
          const byStatus = data.leadStatuses[source.key] ?? {}
          const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
          const newCount = source.newStatuses.reduce((sum, s) => sum + (byStatus[s] ?? 0), 0)

          return (
            <Link
              key={source.key}
              href={source.href}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {source.label}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{total}</h2>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                {newCount > 0 ? (
                  <>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700 ring-1 ring-blue-200">
                      {newCount} new
                    </span>
                    waiting for first contact
                  </>
                ) : (
                  "All caught up"
                )}
                <ArrowRight
                  size={13}
                  className="ml-auto text-slate-300 transition-colors group-hover:text-blue-500"
                />
              </p>
            </Link>
          )
        })}
      </div>

      {/* Pipeline: stage breakdown + conversion summary */}
      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle
            title="Lead pipeline"
            subtitle="Every lead from all four sources, grouped by stage"
          />
          <div className="space-y-4">
            {pipeline.stages.map((stage) => (
              <div key={stage.key}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">{stage.label}</span>
                  <span className="font-bold text-slate-900">{stage.count}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-50">
                  <div
                    className={`h-full rounded-full ${
                      stage.key === "converted" ? "bg-blue-600" : "bg-blue-500/80"
                    }`}
                    style={{ width: `${Math.round((stage.count / maxStage) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardTitle title="Conversion" subtitle="How leads are converting overall" />
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold text-blue-700">Conversion rate</p>
              <p className="mt-1 text-3xl font-black text-blue-800">{pipeline.rate}%</p>
              <p className="mt-1 text-[11px] text-blue-600">
                {pipeline.converted} converted of {pipeline.total} total leads
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold text-slate-500">Total leads</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{pipeline.total}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold text-slate-500">Converted</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{pipeline.converted}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold text-slate-500">Open leads</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {pipeline.total - pipeline.converted - pipeline.closed}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-[11px] font-semibold text-slate-500">Closed / Cancelled</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{pipeline.closed}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-5 xl:grid-cols-2">
        <Card>
          <CardTitle title="New customers" subtitle="Sign-ups over the last 14 days" />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={data.signupTrend} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="signupFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0B56D9" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0B56D9" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="customers"
                stroke="#0B56D9"
                strokeWidth={2}
                fill="url(#signupFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardTitle title="Leads by source" subtitle="Where your leads come from" />
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={sourceData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="none"
                >
                  {sourceData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-2.5 sm:w-auto sm:min-w-[190px]">
              {sourceData.map((entry) => (
                <div key={entry.name} className="flex items-center justify-between gap-3 text-xs">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    {entry.name}
                  </span>
                  <span className="font-bold text-slate-900">{entry.total}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent customers</h2>
            <Link href="/customer" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <TableCard minWidth={480}>
            <Thead>
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Pick ID</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Joined</th>
              </tr>
            </Thead>
            <tbody>
              {data.recentCustomers.length === 0 ? (
                <EmptyRow colSpan={4}>No customers yet</EmptyRow>
              ) : (
                data.recentCustomers.map((c) => (
                  <Tr key={c.customerID}>
                    <td className="p-3 font-medium text-slate-800">{c.name}</td>
                    <td className="p-3">
                      <span className="font-mono text-xs text-slate-500">{c.pickID}</span>
                    </td>
                    <td className="p-3 text-slate-600">{c.phoneNumber}</td>
                    <td className="p-3 text-xs text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                    </td>
                  </Tr>
                ))
              )}
            </tbody>
          </TableCard>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Low / out of stock</h2>
            <Link href="/product" className="text-xs font-medium text-blue-600 hover:underline">
              Manage products
            </Link>
          </div>
          <TableCard minWidth={480}>
            <Thead>
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3 text-right">Stock</th>
              </tr>
            </Thead>
            <tbody>
              {data.lowStockProducts.length === 0 ? (
                <EmptyRow colSpan={2}>Everything is well stocked 🎉</EmptyRow>
              ) : (
                data.lowStockProducts.map((p) => (
                  <Tr key={p.productID}>
                    <td className="p-3 font-medium text-slate-800">{p.productName}</td>
                    <td className="p-3 text-right">
                      <StatusPill tone={p.stock <= 0 ? "red" : "amber"}>{p.stock} left</StatusPill>
                    </td>
                  </Tr>
                ))
              )}
            </tbody>
          </TableCard>
        </div>
      </div>
    </div>
  )
}
