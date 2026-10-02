"use client"

import { useState, useEffect } from "react"
import { Download, MapPin, Pencil, Sheet, Trash2 } from "lucide-react"
import { Customer } from "./CustomerPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, IconButton, TableCard, Thead, Tr } from "@/components/common/table"
import { buildWhatsAppLink } from "@/components/crm/LeadActionsDrawer"
import { MessageCircle } from "lucide-react"

const initials = (first: string, last: string) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "?"

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—"

export default function CustomerList({
  customers,
  onEdit,
  onDelete,
}: {
  customers: Customer[]
  onEdit: (c: Customer) => void
  onDelete: (id: number) => void
}) {
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<number | null>(null)

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE)
  const data = customers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  useEffect(() => setPage(1), [customers])

  return (
    <>
      <TableCard minWidth={960}>
        <Thead>
          <tr>
            <th className="p-3">Customer</th>
            <th className="p-3">Pick ID</th>
            <th className="p-3">Contact</th>
            <th className="p-3">Country</th>
            <th className="p-3">Joined</th>
            <th className="p-3">Addresses</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </Thead>
        <tbody>
          {data.length === 0 ? (
            <EmptyRow colSpan={7}>No customers found</EmptyRow>
          ) : (
            data.map((c) => {
              const addresses = c.addresses ?? []
              const isOpen = expanded === c.customerID
              const wa = buildWhatsAppLink(c.phoneNumber, `Hello ${c.firstName}, this is Pick O Pick support.`)
              return (
                <Tr key={c.customerID}>
                  <td className="p-3">
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

                  <td className="p-3">
                    <span className="font-mono text-xs font-semibold text-[#0B56D9]">{c.pickID}</span>
                  </td>

                  <td className="p-3">
                    <p className="text-slate-700">{c.phoneNumber}</p>
                    <p className="text-xs text-slate-400">{c.emailID || "—"}</p>
                  </td>

                  <td className="p-3 text-slate-700">{c.country || "—"}</td>

                  <td className="p-3 text-xs text-slate-500">{formatDate(c.created_at)}</td>

                  <td className="p-3">
                    {addresses.length === 0 ? (
                      <span className="text-xs text-slate-400">No address</span>
                    ) : (
                      <div className="space-y-1">
                        <button
                          onClick={() => setExpanded(isOpen ? null : c.customerID)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                        >
                          <MapPin size={12} />
                          {addresses.length} address{addresses.length > 1 ? "es" : ""}
                        </button>
                        {isOpen && (
                          <div className="mt-1 space-y-1">
                            {addresses.map((a, i) => (
                              <div
                                key={i}
                                className={`flex items-start justify-between gap-2 rounded-md border p-2 text-xs ${
                                  a.isDefault
                                    ? "border-blue-300 bg-blue-50 text-blue-700"
                                    : "border-slate-200 bg-slate-50 text-slate-600"
                                }`}
                              >
                                <span>
                                  <span className="font-semibold">{a.addressType}</span>: {a.addressDetails}
                                </span>
                                {a.isDefault && (
                                  <span className="rounded bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                                    Default
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      {wa && (
                        <a
                          href={wa}
                          target="_blank"
                          rel="noreferrer"
                          title="Chat on WhatsApp"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <MessageCircle size={15} />
                        </a>
                      )}
                      <IconButton onClick={() => onEdit(c)} title="Edit customer" tone="blue">
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton onClick={() => onDelete(c.customerID)} title="Deactivate customer" tone="red">
                        <Trash2 size={15} />
                      </IconButton>
                    </div>
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
