"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  ResponsiveContainer,
} from "recharts"

type Props = {
  categories: any[]
  products: any[]
}

export default function ProductChart({ categories, products }: Props) {
  
  // 📊 Products per category (with colors)
  const categoryData = categories.map((cat, index) => {
    const count = products.filter(
      (p) => p.categoryID === cat.categoryID
    ).length

    const colors = [
      "#3b82f6",
      "#22c55e",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#14b8a6",
    ]

    return {
      name: cat.categoryName,
      products: count,
      fill: colors[index % colors.length], // 👈 dynamic color
    }
  })

  // 🥧 Status data (with colors)
  const activeCount = products.filter(p => p.status === "active").length
  const inactiveCount = products.length - activeCount

  const statusData = [
    { name: "Active", value: activeCount, fill: "#22c55e" },
    { name: "Inactive", value: inactiveCount, fill: "#ef4444" },
  ]

  return (
    <div className="grid md:grid-cols-2 gap-6">

      {/* 📊 Bar Chart */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="mb-4 font-medium">Products per Category</h2>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={categoryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="products" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🥧 Pie Chart */}
      <div className="bg-white p-4 rounded-xl shadow border">
        <h2 className="mb-4 font-medium">Product Status</h2>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              dataKey="value"
              label
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}