"use client"

import { useEffect, useState } from "react"
import { Category } from "./CategoryPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"

export default function CategoryList({
  categories,
  onOpen,
}: {
  categories: Category[]
  onOpen: (c: Category) => void
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(categories.length / ITEMS_PER_PAGE)
  const data = categories.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => setPage(1), [categories])

  return (
    <>
      <TableCard minWidth={520}>
        <Thead>
          <tr>
            <th className="w-16 p-3 text-center">Seq</th>
            <th className="p-3">Category</th>
            <th className="p-3">Status</th>
          </tr>
        </Thead>
        <tbody>
          {data.length === 0 ? (
            <EmptyRow colSpan={3}>No categories found</EmptyRow>
          ) : (
            data.map((c) => (
              <Tr key={c.categoryID}>
                <td onClick={() => onOpen(c)} className="cursor-pointer p-3">
                  <span className="mx-auto flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-xs font-semibold text-blue-600">
                    {c.categorySequence}
                  </span>
                </td>
                <td onClick={() => onOpen(c)} className="cursor-pointer p-3">
                  <span className="font-medium text-slate-800">{c.categoryName}</span>
                </td>
                <td onClick={() => onOpen(c)} className="cursor-pointer p-3">
                  <StatusPill active={c.categoryStatus}>
                    {c.categoryStatus ? "Active" : "Inactive"}
                  </StatusPill>
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
