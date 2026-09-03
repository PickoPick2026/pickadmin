"use client"

import { useEffect, useState } from "react"
import { GripVertical, Pencil, Trash2 } from "lucide-react"
import { Category } from "./CategoryPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, IconButton, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"

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
  const data = categories.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => setPage(1), [categories])

  return (
    <>
      <TableCard minWidth={560}>
        <Thead>
          <tr>
            <th className="w-16 p-3 text-center">Seq</th>
            <th className="p-3">Category</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </Thead>
        <tbody>
          {data.length === 0 ? (
            <EmptyRow colSpan={4}>No categories found</EmptyRow>
          ) : (
            data.map((c) => (
              <Tr key={c.categoryID}>
                <td className="p-3">
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-500">
                    {c.categorySequence}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} className="text-slate-300" />
                    <span className="font-medium text-slate-800">{c.categoryName}</span>
                  </div>
                </td>
                <td className="p-3">
                  <StatusPill active={c.categoryStatus}>
                    {c.categoryStatus ? "Active" : "Inactive"}
                  </StatusPill>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {c.categoryStatus && (
                      <>
                        <IconButton onClick={() => onEdit(c)} title="Edit category" tone="blue">
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton
                          onClick={() => onDelete(c.categoryID)}
                          title="Deactivate category"
                          tone="red"
                        >
                          <Trash2 size={15} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </td>
              </Tr>
            ))
          )}
        </tbody>
      </TableCard>

      <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  )
}
