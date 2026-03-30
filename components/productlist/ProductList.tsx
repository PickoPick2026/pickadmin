"use client"

import { Pencil, Trash2 } from "lucide-react"
import { Product } from "./ProductPage"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"

export default function ProductList({
  products,
  onEdit,
  onDelete,
}: {
  products: Product[]
  onEdit: (p: Product) => void
  onDelete: (id: number) => void
}) {

  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)

  const data = products.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )
  
const [editId, setEditId] = useState<number | null>(null)
const [editData, setEditData] = useState({
  stock: "",
  price: "",
})

const startEdit = (p: Product) => {
  setEditId(p.productID)
  setEditData({
    stock: String(p.stock),
    price: String(p.price),
  })
}

const saveEdit = async (id: number) => {
  await supabase
    .from("productTable")
    .update({
      stock: Number(editData.stock),
      price: Number(editData.price),
    })
    .eq("productID", id)

  setEditId(null)
 // fetchProducts() // refresh
}


const router = useRouter()
  return (
    <>
    <div className="border rounded-xl overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Product</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-left">SKU</th>
            <th className="p-3 text-left">Stock</th>
            <th className="p-3 text-left">Price</th>
            <th className="p-3 text-left">Images</th>
            <th className="p-3 ">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {data.map((p) => {
            const images =
              typeof p.imageURL === "string"
                ? JSON.parse(p.imageURL)
                : p.imageURL ?? []

            return (
              <tr key={p.productID} className="border-t">
                <td className="p-3 font-medium">
                  {p.productName}
                </td>

                <td className="p-3">
                  {p.category?.categoryName || "—"}
                </td>

                <td className="p-3">{p.sku}</td>
                <td className="p-3 text-center">
                  {editId === p.productID ? (
                    <input
                      value={editData.stock}
                      onChange={(e) =>
                        setEditData({ ...editData, stock: e.target.value })
                      }
                      className="border px-2 py-1 w-16 text-center rounded"
                    />
                  ) : (
                    p.stock
                  )}
                </td>
                <td className="p-3 text-center">
                  {editId === p.productID ? (
                    <input
                      value={editData.price}
                      onChange={(e) =>
                        setEditData({ ...editData, price: e.target.value })
                      }
                      className="border px-2 py-1 w-20 text-center rounded"
                    />
                  ) : (
                    `$${p.price}`
                  )}
                </td>

                {/* Images */}
                <td className="p-3">
                  <div className="flex">
                    {images.slice(0, 3).map((img: string, i: number) => (
                      <img
                        key={i}
                        src={img}
                        className="w-10 h-10 rounded-full -ml-2 first:ml-0 border"
                      />
                    ))}
                  </div>
                </td>

                <td className="p-3 text-center">
                  <span
                    className={
                      p.status === "Closed"
                        ? "text-red-500"
                        : "text-green-600"
                    }
                  >
                    {p.status}
                  </span>
                </td>

                {/* ACTIONS */}
                
                <td className="p-3 text-right">
                  {editId === p.productID ? (
                    <>
                      <button
                        onClick={() => saveEdit(p.productID)}
                        className="text-green-600 text-sm"
                      >
                        Save
                      </button>

                      <button
                        onClick={() => setEditId(null)}
                        className="ml-2 text-gray-500 text-sm"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(p)}
                        className="p-1 hover:text-blue-600"
                      >
                        ✏️
                      </button>

                      
                    </>
                  )}
                  <button
                      onClick={() => router.push(`/product/add?id=${p.productID}`)}
                      className="p-1 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => onDelete(p.productID)}
                    className="p-1 ml-2 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
    
    <TablePagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />

    </>
  )
}