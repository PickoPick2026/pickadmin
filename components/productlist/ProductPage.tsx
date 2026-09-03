"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import ProductList from "./ProductList"
import PageHeader from "@/components/common/PageHeader"

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

      <PageHeader
        title="Product List"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: "Search product…",
        }}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/category">
                <LayoutGrid size={16} /> Manage Categories
              </Link>
            </Button>
            <Button onClick={() => router.push("/product/add")}>+ Add Product</Button>
          </div>
        }
      />

      <ProductList
  products={filtered}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
    </div>
  )
}