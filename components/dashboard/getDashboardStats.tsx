import { supabase } from "@/lib/supabase"

export type LeadStatusCounts = Record<string, number>

export type DashboardData = {
  totalCustomers: number
  weekCustomers: number
  outOfStock: number
  lowStock: number
  /** status -> row count, per CRM lead source */
  leadStatuses: {
    estimates: LeadStatusCounts
    quotes: LeadStatusCounts
    nri: LeadStatusCounts
    services: LeadStatusCounts
  }
  signupTrend: { label: string; date: string; customers: number }[]
  recentCustomers: {
    customerID: number
    name: string
    pickID: string
    phoneNumber: string
    created_at: string
  }[]
  lowStockProducts: { productID: number; productName: string; stock: number }[]
}

const dayKey = (d: Date) => d.toISOString().split("T")[0]

const countByStatus = (rows: { status: string }[] | null): LeadStatusCounts => {
  const map: LeadStatusCounts = {}
  ;(rows ?? []).forEach((row) => {
    map[row.status] = (map[row.status] ?? 0) + 1
  })
  return map
}

export const getDashboardStats = async (): Promise<DashboardData> => {
  const now = new Date()
  const today = dayKey(now)
  const weekAgo = new Date(now.getTime() - 6 * 864e5)
  const trendStart = new Date(now.getTime() - 13 * 864e5)

  const [
    totalCustomersRes,
    weekCustomersRes,
    customerDatesRes,
    productsRes,
    estimatesRes,
    quotesRes,
    nriRes,
    servicesRes,
    recentCustomersRes,
  ] = await Promise.all([
    supabase.from("customerList").select("*", { count: "exact", head: true }).eq("customerStatus", true),
    supabase.from("customerList").select("*", { count: "exact", head: true }).eq("customerStatus", true).gte("created_at", dayKey(weekAgo)),
    supabase.from("customerList").select("created_at").eq("customerStatus", true).gte("created_at", dayKey(trendStart)),
    supabase.from("productTable").select("productID, productName, stock"),
    supabase.from("estimate_leads").select("status"),
    supabase.from("orders").select("status"),
    supabase.from("nri_requests").select("status"),
    supabase.from("service_requests").select("status"),
    supabase
      .from("customerList")
      .select("customerID, firstName, lastName, pickID, phoneNumber, created_at")
      .eq("customerStatus", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const products = productsRes.data ?? []

  // 14-day signup trend
  const buckets = new Map<string, number>()
  for (let i = 0; i < 14; i++) {
    buckets.set(dayKey(new Date(trendStart.getTime() + i * 864e5)), 0)
  }
  ;(customerDatesRes.data ?? []).forEach((row: any) => {
    const key = String(row.created_at).split("T")[0]
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1)
  })
  const signupTrend = [...buckets.entries()].map(([date, customers]) => ({
    date,
    customers,
    label: new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
  }))

  const lowStockProducts = products
    .filter((p: any) => Number(p.stock) <= 5)
    .sort((a: any, b: any) => Number(a.stock) - Number(b.stock))
    .slice(0, 6)
    .map((p: any) => ({
      productID: p.productID,
      productName: p.productName,
      stock: Number(p.stock),
    }))

  return {
    totalCustomers: totalCustomersRes.count ?? 0,
    weekCustomers: weekCustomersRes.count ?? 0,
    outOfStock: products.filter((p: any) => Number(p.stock) <= 0).length,
    lowStock: products.filter((p: any) => Number(p.stock) > 0 && Number(p.stock) <= 5).length,
    leadStatuses: {
      estimates: countByStatus(estimatesRes.data as { status: string }[] | null),
      quotes: countByStatus(quotesRes.data as { status: string }[] | null),
      nri: countByStatus(nriRes.data as { status: string }[] | null),
      services: countByStatus(servicesRes.data as { status: string }[] | null),
    },
    signupTrend,
    recentCustomers: (recentCustomersRes.data ?? []).map((c: any) => ({
      customerID: c.customerID,
      name: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim() || "—",
      pickID: c.pickID,
      phoneNumber: c.phoneNumber,
      created_at: c.created_at,
    })),
    lowStockProducts,
  }
}
