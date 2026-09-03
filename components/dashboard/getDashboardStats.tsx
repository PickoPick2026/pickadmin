import { supabase } from "@/lib/supabase"

export type DashboardData = {
  totalCustomers: number
  todayCustomers: number
  weekCustomers: number
  totalCategories: number
  totalProducts: number
  outOfStock: number
  lowStock: number
  pendingNri: number
  newEstimates: number
  signupTrend: { label: string; date: string; customers: number }[]
  categoryBreakdown: { name: string; products: number }[]
  recentCustomers: {
    customerID: number
    name: string
    pickID: string
    phoneNumber: string
    created_at: string
  }[]
  lowStockProducts: { productID: number; productName: string; stock: number; category: string }[]
}

const dayKey = (d: Date) => d.toISOString().split("T")[0]

export const getDashboardStats = async (): Promise<DashboardData> => {
  const now = new Date()
  const today = dayKey(now)
  const weekAgo = new Date(now.getTime() - 6 * 864e5)
  const trendStart = new Date(now.getTime() - 13 * 864e5)

  const [
    totalCustomersRes,
    todayCustomersRes,
    weekCustomersRes,
    totalCategoriesRes,
    totalProductsRes,
    pendingNriRes,
    newEstimatesRes,
    customerDatesRes,
    categoriesRes,
    productsRes,
    recentCustomersRes,
  ] = await Promise.all([
    supabase.from("customerList").select("*", { count: "exact", head: true }).eq("customerStatus", true),
    supabase.from("customerList").select("*", { count: "exact", head: true }).eq("customerStatus", true).gte("created_at", today),
    supabase.from("customerList").select("*", { count: "exact", head: true }).eq("customerStatus", true).gte("created_at", dayKey(weekAgo)),
    supabase.from("category").select("*", { count: "exact", head: true }),
    supabase.from("productTable").select("*", { count: "exact", head: true }),
    supabase.from("nri_requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("estimate_leads").select("*", { count: "exact", head: true }).eq("status", "NEW"),
    supabase.from("customerList").select("created_at").eq("customerStatus", true).gte("created_at", dayKey(trendStart)),
    supabase.from("category").select("categoryID, categoryName"),
    supabase.from("productTable").select("productID, productName, stock, categoryID"),
    supabase
      .from("customerList")
      .select("customerID, firstName, lastName, pickID, phoneNumber, created_at")
      .eq("customerStatus", true)
      .order("created_at", { ascending: false })
      .limit(6),
  ])

  const products = productsRes.data ?? []
  const categories = categoriesRes.data ?? []

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

  // products per category
  const categoryBreakdown = categories
    .map((cat: any) => ({
      name: cat.categoryName,
      products: products.filter((p: any) => p.categoryID === cat.categoryID).length,
    }))
    .sort((a, b) => b.products - a.products)

  const lowStockProducts = products
    .filter((p: any) => Number(p.stock) <= 5)
    .sort((a: any, b: any) => Number(a.stock) - Number(b.stock))
    .slice(0, 6)
    .map((p: any) => ({
      productID: p.productID,
      productName: p.productName,
      stock: Number(p.stock),
      category: categories.find((c: any) => c.categoryID === p.categoryID)?.categoryName ?? "—",
    }))

  return {
    totalCustomers: totalCustomersRes.count ?? 0,
    todayCustomers: todayCustomersRes.count ?? 0,
    weekCustomers: weekCustomersRes.count ?? 0,
    totalCategories: totalCategoriesRes.count ?? 0,
    totalProducts: totalProductsRes.count ?? 0,
    outOfStock: products.filter((p: any) => Number(p.stock) <= 0).length,
    lowStock: products.filter((p: any) => Number(p.stock) > 0 && Number(p.stock) <= 5).length,
    pendingNri: pendingNriRes.count ?? 0,
    newEstimates: newEstimatesRes.count ?? 0,
    signupTrend,
    categoryBreakdown,
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
