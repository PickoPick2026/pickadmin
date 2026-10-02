"use client"

import { useEffect, useState } from "react"
import { Pencil, Power } from "lucide-react"
import { User } from "./UsersPage"
import TablePagination from "@/components/common/TablePagination"
import { ITEMS_PER_PAGE } from "@/lib/tableperpage"
import { EmptyRow, IconButton, StatusPill, TableCard, Thead, Tr } from "@/components/common/table"
import { assignableFeatures, menuItems } from "@/config/menuItems"

const roleTone: Record<string, "blue" | "amber" | "slate"> = {
  ADMIN: "blue",
  SUPER_ADMIN: "blue",
  STAFF: "amber",
}

// Keys that no longer appear in the sidebar but may exist in stored permissions.
const legacyFeatureLabels: Record<string, string> = {
  category: "Category",
  users: "Admin Users",
}

const featureLabel = (key: string) =>
  assignableFeatures.find((f) => f.key === key)?.label ??
  menuItems.find((m) => m.key === key)?.label ??
  legacyFeatureLabels[key] ??
  key

export default function UsersList({
  users,
  onEdit,
  onToggleStatus,
}: {
  users: User[]
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
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
      <TableCard minWidth={760}>
        <Thead>
          <tr>
            <th className="p-3">Username</th>
            <th className="p-3">Role</th>
            <th className="p-3">Feature access</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </Thead>
        <tbody>
          {paginatedUsers.length === 0 ? (
            <EmptyRow colSpan={5}>No users found</EmptyRow>
          ) : (
            paginatedUsers.map((user) => {
              const isSuperAdmin = user.role === "SUPER_ADMIN"
              const features = isSuperAdmin ? [] : user.permissions ?? []

              return (
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
                    <StatusPill tone={roleTone[user.role] ?? "slate"}>
                      {user.role === "SUPER_ADMIN" ? "SUPER ADMIN" : user.role}
                    </StatusPill>
                  </td>
                  <td className="p-3">
                    {isSuperAdmin ? (
                      <span className="text-xs font-medium text-slate-500">All features</span>
                    ) : features.length === 0 ? (
                      <span className="text-xs text-slate-400">None assigned</span>
                    ) : (
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        {features.slice(0, 3).map((key) => (
                          <span
                            key={key}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                          >
                            {featureLabel(key)}
                          </span>
                        ))}
                        {features.length > 3 && (
                          <span
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                            title={features.map(featureLabel).join(", ")}
                          >
                            +{features.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    <StatusPill active={user.adminLoginStatus}>
                      {user.adminLoginStatus ? "Active" : "Inactive"}
                    </StatusPill>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <IconButton onClick={() => onEdit(user)} title="Edit user" tone="blue">
                        <Pencil size={15} />
                      </IconButton>
                      <IconButton
                        onClick={() => onToggleStatus(user)}
                        title={user.adminLoginStatus ? "Deactivate user" : "Activate user"}
                        tone={user.adminLoginStatus ? "red" : "slate"}
                      >
                        <Power size={15} />
                      </IconButton>
                    </div>
                  </td>
                </Tr>
              )
            })
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
