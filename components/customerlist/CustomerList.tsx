"use client"

import { useState, useEffect } from "react"
import { MapPin } from "lucide-react"
import { Customer } from "./CustomerPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, TableCard, Thead, Tr } from "@/components/common/table"

const initials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—"

export default function CustomerList({
  customers,
  onView,
}: {
  customers: Customer[]
  onView: (c: Customer) => void
}) {
  const [page, setPage] = useState(1)

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE)
  const data = customers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => setPage(1), [customers])

  return (
    <>
      <TableCard minWidth={860}>
        <Thead>
          <tr>
            <th className="p-3">Customer</th>
            <th className="p-3">Pick ID</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Country</th>
            <th className="p-3">Joined</th>
            <th className="p-3">Addresses</th>
          </tr>
        </Thead>
        <tbody>
          {data.length === 0 ? (
            <EmptyRow colSpan={6}>No customers found</EmptyRow>
          ) : (
            data.map((c) => {
              const addresses = c.addresses ?? []

              return (
                <Tr key={c.customerID}>
                  <td onClick={() => onView(c)} className="cursor-pointer p-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                        {initials(c.firstName, c.lastName)}
                      </span>
                      <div>
                        <p className="font-medium text-slate-800">
                          {c.firstName} {c.lastName}
                        </p>
                        {c.gender && (
                          <p className="text-xs capitalize text-slate-400">{c.gender}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td onClick={() => onView(c)} className="cursor-pointer p-3">
                    <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                      {c.pickID}
                    </span>
                  </td>

                  <td onClick={() => onView(c)} className="cursor-pointer p-3">
                    <p className="text-slate-700">{c.phoneNumber}</p>
                    <p className="text-xs text-slate-400">{c.emailID || "—"}</p>
                  </td>

                  <td onClick={() => onView(c)} className="cursor-pointer p-3 text-slate-700">{c.country || "—"}</td>

                  <td onClick={() => onView(c)} className="cursor-pointer p-3 text-xs text-slate-500">{formatDate(c.created_at)}</td>

                  <td onClick={() => onView(c)} className="cursor-pointer p-3">
                    {addresses.length === 0 ? (
                      <span className="text-xs text-slate-400">No address</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-200">
                        <MapPin size={12} />
                        {addresses.length} address{addresses.length > 1 ? "es" : ""}
                      </span>
                    )}
                  </td>
                </Tr>
              )
            })
          )}
        </tbody>
      </TableCard>

      <TablePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
    </>
  )
}
