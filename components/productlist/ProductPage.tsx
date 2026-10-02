"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LayoutGrid, Plus } from "lucide-react"
import ProductList from "./ProductList"
import ProductDrawer, { ProductDrawerMode } from "./ProductDrawer"
import PageHeader from "@/components/common/PageHeader"

export type Product = {
  productID: number
  productName: string
  sku: string
  price: number
  stock: number
  status: string
  imageURL: string
  description?: string
  categoryID?: number
  category?: {
    categoryName: string
  }
}

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<ProductDrawerMode>("view")
  const [selected, setSelected] = useState<Product | null>(null)
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

  const openProduct = (p: Product) => {
    setSelected(p)
    setDrawerMode("view")
    setDrawerOpen(true)
  }

  const openAdd = () => {
    setSelected(null)
    setDrawerMode("add")
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelected(null)
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
            <Button onClick={openAdd}>
              <Plus size={16} /> Add Product
            </Button>
          </div>
        }
      />

      <ProductList products={filtered} onOpen={openProduct} />

      <ProductDrawer
        open={drawerOpen}
        mode={drawerMode}
        product={selected}
        onClose={closeDrawer}
        onModeChange={setDrawerMode}
        onSaved={fetchProducts}
        onDeleted={fetchProducts}
      />
    </div>
  )
}
