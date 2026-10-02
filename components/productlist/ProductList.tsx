"use client"

import { useEffect, useState } from "react"
import { Product } from "./ProductPage"
import { parseImages } from "./ProductDrawer"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"

export default function ProductList({
  products,
  onOpen,
}: {
  products: Product[]
  onOpen: (p: Product) => void
}) {
  const [page, setPage] = useState(1)

  useEffect(() => setPage(1), [products])

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE)
  const data = products.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <>
      <TableCard minWidth={820}>
        <Thead>
          <tr>
            <th className="p-3">Product</th>
            <th className="p-3">Category</th>
            <th className="p-3">SKU</th>
            <th className="p-3 text-center">Stock</th>
            <th className="p-3">Status</th>
          </tr>
        </Thead>

        <tbody>
          {data.length === 0 && <EmptyRow colSpan={5}>No products found</EmptyRow>}
          {data.map((p) => {
            const thumb = parseImages(p.imageURL)[0]

            return (
              <Tr key={p.productID}>
                <td
                  onClick={() => onOpen(p)}
                  className="cursor-pointer p-3"
                >
                  <div className="flex items-center gap-3">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={thumb}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] font-medium text-slate-300">
                        No img
                      </span>
                    )}
                    <span className="font-medium text-slate-800">{p.productName}</span>
                  </div>
                </td>

                <td onClick={() => onOpen(p)} className="cursor-pointer p-3 text-slate-600">
                  {p.category?.categoryName || "—"}
                </td>

                <td onClick={() => onOpen(p)} className="cursor-pointer p-3">
                  <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-600">
                    {p.sku || "—"}
                  </span>
                </td>

                <td onClick={() => onOpen(p)} className="cursor-pointer p-3 text-center text-slate-700">
                  {p.stock}
                </td>

                <td onClick={() => onOpen(p)} className="cursor-pointer p-3">
                  <StatusPill active={p.status !== "Closed"}>{p.status}</StatusPill>
                </td>
              </Tr>
            )
          })}
        </tbody>
      </TableCard>

      <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  )
}
