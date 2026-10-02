"use client"

import { useEffect, useState } from "react"
import { Mail, Pencil, Trash2 } from "lucide-react"
import Drawer from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import WhatsAppIcon from "@/components/common/WhatsAppIcon"
import { buildGmailLink, buildWhatsAppLink } from "@/components/crm/crmHelpers"
import type { Customer } from "./CustomerPage"

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—"

export default function CustomerDrawer({
  customer,
  onClose,
  onEdit,
  onDeactivate,
}: {
  customer: Customer | null
  onClose: () => void
  onEdit: (c: Customer) => void
  onDeactivate: (id: number) => void
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => setConfirmingDelete(false), [customer])

  if (!customer) return null

  const fullName = `${customer.firstName} ${customer.lastName}`.trim()
  const waLink = buildWhatsAppLink(
    customer.phoneNumber,
    `Hello ${customer.firstName}, this is Pick O Pick support.`,
  )
  const gmailLink = customer.emailID
    ? buildGmailLink(
        customer.emailID,
        `Regarding your Pick O Pick account (${customer.pickID})`,
        `Hello ${customer.firstName},\n\nRegarding your Pick O Pick account (${customer.pickID}).\n\nBest regards,\nPick O Pick Team`,
      )
    : null

  const details: [string, string][] = [
    ["Phone / WhatsApp", customer.phoneNumber || "—"],
    ["Email", customer.emailID || "—"],
    ["Gender", customer.gender || "—"],
    ["Date of birth", customer.dob || "—"],
    ["Country", customer.country || "—"],
    ["Joined on", formatDate(customer.created_at)],
  ]

  return (
    <Drawer
      open
      onClose={onClose}
      title={fullName || "Customer"}
      actions={
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
            {customer.pickID}
          </span>
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Chat on WhatsApp"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
            >
              <WhatsAppIcon size={15} />
            </a>
          )}
          {gmailLink && (
            <a
              href={gmailLink}
              target="_blank"
              rel="noopener noreferrer"
              title="Send email in one click (Gmail, pre-filled)"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 transition hover:bg-blue-100"
            >
              <Mail size={15} />
            </a>
          )}
        </div>
      }
      footer={
        <div className="flex justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (!confirmingDelete) return setConfirmingDelete(true)
              setConfirmingDelete(false)
              onDeactivate(customer.customerID)
            }}
            className="text-red-600 hover:!bg-red-50 hover:!text-red-700"
          >
            <Trash2 size={15} />
            {confirmingDelete ? "Click again to confirm" : "Deactivate"}
          </Button>
          <Button onClick={() => onEdit(customer)}>
            <Pencil size={15} /> Edit
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {`${customer.firstName?.[0] ?? ""}${customer.lastName?.[0] ?? ""}`.toUpperCase() || "?"}
          </span>
          <div>
            <p className="font-semibold text-slate-900">{fullName}</p>
            <p className="text-xs capitalize text-slate-400">{customer.gender || "Customer"}</p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200">
          <dl className="divide-y divide-slate-100 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                <dt className="text-slate-500">{label}</dt>
                <dd className="break-all text-right font-medium text-slate-900">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-medium text-slate-500">
            Addresses {(customer.addresses ?? []).length > 0 && `(${customer.addresses!.length})`}
          </h3>
          {(customer.addresses ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-400">
              No addresses on file.
            </p>
          ) : (
            <div className="space-y-2">
              {customer.addresses!.map((a, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-3 text-sm ${
                    a.isDefault
                      ? "border-blue-200 bg-blue-50 text-blue-900"
                      : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{a.addressType}</span>
                    {a.isDefault && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words">{a.addressDetails}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  )
}
