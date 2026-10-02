"use client"

import { useState } from "react"
import { Mail, MessageCircle, StickyNote, Trash2, UserPlus } from "lucide-react"
import Drawer from "@/components/ui/drawer"
import {
  AdminUser,
  userNameById,
} from "@/components/crm/useAssignableUsers"

export type Remark = {
  id: string
  text: string
  author: string
  createdAt: string
}

export const buildWhatsAppLink = (phone?: string | null, message = "Hello") => {
  const clean = (phone || "").replace(/\D/g, "")
  if (!clean) return null
  const full = clean.startsWith("91")
    ? clean
    : clean.length === 10
      ? `91${clean}`
      : clean
  return `https://wa.me/${full}?text=${encodeURIComponent(message)}`
}

type LeadActionsDrawerProps = {
  open: boolean
  onClose: () => void
  code?: string | null
  title: string
  subtitle?: React.ReactNode
  customerName?: string | null
  phone?: string | null
  email?: string | null
  whatsappMessage?: string

  statuses: { value: string; label: string }[]
  status: string
  onStatusChange: (status: string) => unknown

  users: AdminUser[]
  assignedTo?: number | null
  onAssign: (userId: number | null) => unknown
  assigning?: boolean

  remarks?: Remark[] | null
  onAddRemark?: (text: string) => unknown
  onDeleteRemark?: (remarkId: string) => unknown

  children?: React.ReactNode
}

/**
 * Generic CRM drawer: contact buttons, status, owner assignment and
 * JSON-backed remarks. The lead's own details can be passed as children.
 */
export default function LeadActionsDrawer({
  open,
  onClose,
  code,
  title,
  subtitle,
  customerName,
  phone,
  email,
  whatsappMessage,
  statuses,
  status,
  onStatusChange,
  users,
  assignedTo,
  onAssign,
  assigning,
  remarks,
  onAddRemark,
  onDeleteRemark,
  children,
}: LeadActionsDrawerProps) {
  const [remarkText, setRemarkText] = useState("")
  const [savingRemark, setSavingRemark] = useState(false)

  const waLink = buildWhatsAppLink(
    phone,
    whatsappMessage ||
      `Hello ${customerName || "Customer"}, regarding your request${code ? ` (${code})` : ""} with Pick O Pick.`,
  )

  const addRemark = async () => {
    const text = remarkText.trim()
    if (!text || !onAddRemark) return
    setSavingRemark(true)
    await onAddRemark(text)
    setSavingRemark(false)
    setRemarkText("")
  }
  return (
    <Drawer
      open={open}
      onClose={onClose}
      wide
      title={
        <div>
          {code && <span className="block font-mono text-xs font-bold text-orange-600">{code}</span>}
          <span className="mt-0.5 block truncate">{title}</span>
        </div>
      }
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-1.5">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              title="Chat with customer on WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle size={16} />
            </a>
          )}
          {email && (
            <a
              href={`mailto:${email}${code ? `?subject=Regarding Pick O Pick request ${code}` : ""}`}
              title="Email customer"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
            >
              <Mail size={16} />
            </a>
          )}
        </div>
      }
    >
      {/* Ownership + status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Assigned owner
          </span>
          <div className="mt-1 flex items-center gap-2">
            <select
              value={assignedTo ?? ""}
              onChange={(e) => onAssign(e.target.value ? Number(e.target.value) : null)}
              disabled={assigning}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:border-indigo-500 disabled:opacity-60"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.adminLoginID} value={u.adminLoginID}>
                  {u.username} {u.role === "SUPER_ADMIN" ? "(super admin)" : ""}
                </option>
              ))}
            </select>
            <UserPlus size={16} className="shrink-0 text-slate-400" />
          </div>
          {assignedTo != null && (
            <p className="mt-1 text-[11px] text-slate-400">
              Current owner: {userNameById(users, assignedTo) ?? `#${assignedTo}`}
            </p>
          )}
        </label>

        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Status</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500"
          >
            {statuses.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Contact summary */}
      {(customerName || phone || email) && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          {customerName && (
            <p className="font-semibold text-slate-800">{customerName}</p>
          )}
          <p className="mt-0.5 text-xs text-slate-500">
            {phone || "No phone"} · {email || "no email"}
          </p>
        </div>
      )}

      {/* Lead-specific details */}
      {children && <div className="mt-4">{children}</div>}

      {/* Remarks (stored as a JSON array on the record) */}
      {onAddRemark && (
        <section className="mt-5">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <StickyNote size={14} /> Remarks & follow-ups
          </h3>

          <div className="mt-2 flex gap-2">
            <textarea
              rows={2}
              value={remarkText}
              onChange={(e) => setRemarkText(e.target.value)}
              placeholder="Call outcome, next follow-up, note for the team…"
              className="w-full resize-none rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) addRemark()
              }}
            />
            <button
              type="button"
              onClick={addRemark}
              disabled={savingRemark || !remarkText.trim()}
              className="h-fit shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {savingRemark ? "Saving…" : "Add"}
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {(remarks ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                No remarks yet.
              </p>
            ) : (
              [...(remarks ?? [])]
                .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
                .map((remark) => (
                  <div
                    key={remark.id}
                    className="group flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3"
                  >
                    <div className="min-w-0">
                      <p className="whitespace-pre-wrap break-words text-sm text-slate-800">
                        {remark.text}
                      </p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        {remark.author} ·{" "}
                        {new Date(remark.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {onDeleteRemark && (
                      <button
                        type="button"
                        onClick={() => onDeleteRemark(remark.id)}
                        title="Delete remark"
                        className="shrink-0 rounded-md p-1.5 text-slate-300 transition hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))
            )}
          </div>
        </section>
      )}
    </Drawer>
  )
}
