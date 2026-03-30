"use client"

import WelcomeCard from "./WelcomeCard"
import StatCard from "./StatCard"
import ChartCard from "./ChartCard"
import SalesReport from "./SalesReport"
import TopProducts from "./TopProducts"
import { useEffect, useState } from "react"
import { getDashboardStats } from "./getDashboardStats"
import { supabase } from "@/lib/supabase"
import ProductChart from "./ProductChart"




export default function Dashboard() {

  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      const data = await getDashboardStats()
      setStats(data)
    }

    fetchData()
  }, [])

  const [categories, setCategories] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: catData } = await supabase.from("category").select("*")
    const { data: prodData } = await supabase.from("productTable").select("*")

    setCategories(catData || [])
    setProducts(prodData || [])
  }
  if (!stats) return <p>Loading...</p>
  return (
    <div className="space-y-6">

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <WelcomeCard />
        <StatCard
        title="Customers"
        value={stats.totalCustomers}
        change={`+${stats.todayCustomers} today`}
        positive={true}
      />
         <StatCard
        title="Categories"
        value={stats.totalCategories}
      />
        <StatCard
        title="Products"
        value={stats.totalProducts}
      />
      {/* <StatCard
        title="Orders"
        value={stats.totalOrders}
      /> */}
      </div>

      {/* Charts */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChartCard title="Store Performance">
          Donut Chart Here
        </ChartCard>

        <ChartCard title="Weekly Insights">
          Chart Here
        </ChartCard>
      </div> */}
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        <ProductChart categories={categories} products={products} />
      </div>

      {/* Bottom Section */}
      {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SalesReport />
        <TopProducts />
      </div> */}

    </div>
  )
}