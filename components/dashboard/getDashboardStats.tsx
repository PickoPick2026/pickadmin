import { supabase } from "@/lib/supabase"

export const getDashboardStats = async () => {
  const today = new Date().toISOString().split("T")[0]

  // Customers
  const { count: totalCustomers } = await supabase
    .from("customerList")
    .select("*", { count: "exact", head: true })

  const { count: todayCustomers } = await supabase
    .from("customerList")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today)

  // Categories
  const { count: totalCategories } = await supabase
    .from("category")
    .select("*", { count: "exact", head: true })

  // Products
  const { count: totalProducts } = await supabase
    .from("productTable")
    .select("*", { count: "exact", head: true })

  // Orders
  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })

  return {
    totalCustomers,
    todayCustomers,
    totalCategories,
    totalProducts,
    totalOrders,
  }
}