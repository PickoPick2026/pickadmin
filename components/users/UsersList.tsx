"use client"

import { useEffect, useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { User } from "./UsersPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, IconButton, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"

const roleTone: Record<string, "blue" | "amber" | "slate"> = {
  ADMIN: "blue",
  SUPER_ADMIN: "blue",
  STAFF: "amber",
}

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
    currentPage * ITEMS_PER_PAGE,
  )

  useEffect(() => setCurrentPage(1), [users])

  return (
    <>
      <TableCard minWidth={620}>
        <Thead>
          <tr>
            <th className="p-3">Username</th>
            <th className="p-3">Role</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </Thead>
        <tbody>
          {paginatedUsers.length === 0 ? (
            <EmptyRow colSpan={4}>No users found</EmptyRow>
          ) : (
            paginatedUsers.map((user) => (
              <Tr key={user.adminLoginID}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold uppercase text-white">
                      {user.username?.[0] ?? "?"}
                    </span>
                    <span className="font-medium text-slate-800">{user.username}</span>
                  </div>
                </td>
                <td className="p-3">
                  <StatusPill tone={roleTone[user.role] ?? "slate"}>{user.role}</StatusPill>
                </td>
                <td className="p-3">
                  <StatusPill active={user.adminLoginStatus}>
                    {user.adminLoginStatus ? "Active" : "Inactive"}
                  </StatusPill>
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    {user.adminLoginStatus && (
                      <>
                        <IconButton onClick={() => onEdit(user)} title="Edit user" tone="blue">
                          <Pencil size={15} />
                        </IconButton>
                        <IconButton
                          onClick={() => onDelete(user.adminLoginID)}
                          title="Deactivate user"
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

      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  )
}
