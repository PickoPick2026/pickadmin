"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import ProductList from "./ProductList"

export type Product = {
  productID: number
  productName: string
  sku: string
  price: number
  stock: number
  status: string
  imageURL: string
  category?: {
    categoryName: string
  }
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const router = useRouter()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
  const { data, error } = await supabase
    .from("productTable")
    .select(`
      *,
      category (
        categoryName
      )
    `)

  if (error) {
    console.error(error)
    return
  }

  setProducts(data || [])
}

  const filtered = products.filter((p) =>
    p.productName.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
  await supabase
    .from("productTable")
    .update({ status: "Closed" }) // ✅ soft delete
    .eq("productID", id)

  fetchProducts()
}

const handleEdit = (product: Product) => {
  // navigate to edit page OR open modal
  console.log("Edit:", product)
}

  return (
    <div className="space-y-6">

      {/* Top */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Product List</h1>
        <input
          placeholder="Search product..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

        <Button onClick={() => router.push("/product/add")}>
          + Add Product
        </Button>
      </div>

      <ProductList
  products={filtered}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
    </div>
  )
}