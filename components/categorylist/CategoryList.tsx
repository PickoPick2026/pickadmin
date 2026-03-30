"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Category } from "./CategoryPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"

export default function CategoryList({
  categories,
  onEdit,
  onDelete,
}: {
  categories: Category[]
  onEdit: (c: Category) => void
  onDelete: (id: number) => void
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE)

  const data = categories.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  useEffect(() => setPage(1), [categories])

  if (categories.length === 0) {
    return <p className="text-sm text-gray-500">No categories found</p>
  }

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3">Sequence</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((c) => (
              <tr key={c.categoryID} className="border-t">
                <td className="p-3 font-medium">
                  {c.categoryName}
                </td>

                <td className="p-3 text-center">
                  {c.categorySequence}
                </td>

                <td className="p-3 text-center">
                  {c.categoryStatus ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </td>

                <td className="p-3 text-right">
                  {c.categoryStatus && (
                    <>
                      <button
                        onClick={() => onEdit(c)}
                        className="p-1 hover:text-blue-600"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => onDelete(c.categoryID)}
                        className="p-1 ml-2 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
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