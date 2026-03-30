"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { User } from "./UsersPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"

export default function UsersList({
  users,
  onEdit,
  onDelete,
}: {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (id: number) => void
}) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE)

  const paginatedUsers = users.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [users])

  if (users.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No users found
      </p>
    )
  }

  return (
    <>
      <div className="rounded-xl border bg-background overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="p-3 text-left">Username</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.adminLoginID} className="border-t">
                
                {/* Username */}
                <td className="p-3 font-medium">
                  {user.username}
                </td>

                {/* Role */}
                <td className="p-3">{user.role}</td>

                {/* Status */}
                <td className="p-3">
                  {user.adminLoginStatus ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-red-600">Inactive</span>
                  )}
                </td>

                {/* Actions */}
                <td className="p-3 text-right">
                  {user.adminLoginStatus && (
                    <>
                      <button
                        onClick={() => onEdit(user)}
                        className="p-1 hover:text-blue-600"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        onClick={() => onDelete(user.adminLoginID)}
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

      {/* ✅ SAME AS OLD UI */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  )
}