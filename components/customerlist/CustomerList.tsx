"use client"

import { useState, useEffect } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Customer } from "./CustomerPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"

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

  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE)

  const data = customers.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  )

  useEffect(() => setPage(1), [customers])

  return (
    <>
      <div className="border rounded-xl overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">PickID</th>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Addresses</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {data.map((c) => (
              <tr key={c.customerID} className="border-t">
                <td className="p-3">{c.pickID}</td>
                <td className="p-3 font-medium">
                  {c.firstName} 
                  <p>LastName: {c.lastName}</p>
                </td>
                <td className="p-3">{c.phoneNumber}</td>
                <td className="p-3">{c.emailID}</td>

                <td className="p-3 space-y-1">
                    {c.addresses?.map((a, i) => (
                        <div
                        key={i}
                        className={`text-xs p-2 rounded-md border flex justify-between items-center
                            ${
                            a.isDefault
                                ? "bg-blue-50 border-blue-400 text-blue-700"
                                : "bg-gray-50"
                            }`}
                        >
                        <div>
                            <span className="font-medium">
                            {a.addressType}
                            </span>
                            : {a.addressDetails}
                        </div>

                        {a.isDefault && (
                            <span className="text-[10px] px-2 py-0.5 bg-blue-600 text-white rounded">
                            Default
                            </span>
                        )}
                        </div>
                    ))}
                    </td>

                <td className="p-3 text-right">
                  <button onClick={() => onEdit(c)}>
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(c.customerID)}
                    className="ml-2 text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
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