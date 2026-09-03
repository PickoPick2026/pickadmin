"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ClipboardList,
  Calculator,
  Layers,
  LayoutGrid,
  PackageX,
  TrendingUp,
  Users,
} from "lucide-react"
import WelcomeCard from "./WelcomeCard"
import StatCard from "./StatCard"
import ProductChart from "./ProductChart"
import { getDashboardStats, DashboardData } from "./getDashboardStats"
import { EmptyRow, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"

function MiniStat({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: number
  icon: any
  href?: string
}) {
  const body = (
    <div className="flex items-center gap-3 rounded-xl border bg-white p-3 shadow-sm transition-colors hover:border-slate-300">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        <Icon size={17} />
      </span>
      <div>
        <p className="text-lg font-bold leading-none text-slate-900">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{label}</p>
      </div>
    </div>
  )
  return href ? <Link href={href}>{body}</Link> : body
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)

  useEffect(() => {
    getDashboardStats().then(setData).catch(console.error)
  }, [])

  if (!data) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        Loading dashboard…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Store activity at a glance.</p>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WelcomeCard />
        <StatCard
          title="Customers"
          value={data.totalCustomers}
          hint={`+${data.todayCustomers} today · +${data.weekCustomers} this week`}
          icon={Users}
          tone="indigo"
        />
        <StatCard title="Categories" value={data.totalCategories} icon={LayoutGrid} tone="emerald" />
        <StatCard title="Products" value={data.totalProducts} icon={Layers} tone="amber" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="Sign-ups this week" value={data.weekCustomers} icon={TrendingUp} />
        <MiniStat label="Pending NRI requests" value={data.pendingNri} icon={ClipboardList} href="/nri" />
        <MiniStat label="New estimate leads" value={data.newEstimates} icon={Calculator} href="/estimates" />
        <MiniStat label="Low stock" value={data.lowStock} icon={AlertTriangle} href="/product" />
        <MiniStat label="Out of stock" value={data.outOfStock} icon={PackageX} href="/product" />
      </div>

      {/* Charts */}
      <ProductChart signupTrend={data.signupTrend} categoryBreakdown={data.categoryBreakdown} />

      {/* Tables */}
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Recent customers</h2>
            <Link href="/customer" className="text-xs font-medium text-indigo-600 hover:underline">
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
                    <td className="p-3 font-mono text-xs text-slate-500">{c.pickID}</td>
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
            <Link href="/product" className="text-xs font-medium text-indigo-600 hover:underline">
              Manage products
            </Link>
          </div>
          <TableCard minWidth={480}>
            <Thead>
              <tr>
                <th className="p-3">Product</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Stock</th>
              </tr>
            </Thead>
            <tbody>
              {data.lowStockProducts.length === 0 ? (
                <EmptyRow colSpan={3}>Everything is well stocked 🎉</EmptyRow>
              ) : (
                data.lowStockProducts.map((p) => (
                  <Tr key={p.productID}>
                    <td className="p-3 font-medium text-slate-800">{p.productName}</td>
                    <td className="p-3 text-slate-600">{p.category}</td>
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
