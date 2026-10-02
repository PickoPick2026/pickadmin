"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

/**
 * Two-step delete: first click arms it ("Confirm delete?"), second click
 * executes. Only render this for users with the delete-leads permission.
 */
export default function DeleteLeadButton({
  onDelete,
  className = "",
}: {
  onDelete: () => unknown
  className?: string
}) {
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!confirming) {
          setConfirming(true)
          return
        }
        setBusy(true)
        try {
          await onDelete()
        } finally {
          setBusy(false)
          setConfirming(false)
        }
      }}
      onBlur={() => setConfirming(false)}
      title={confirming ? "Click again to permanently delete" : "Delete this lead"}
      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-60 ${
        confirming
          ? "border-rose-300 bg-rose-600 text-white hover:bg-rose-700"
          : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
      } ${className}`}
    >
      <Trash2 size={14} />
      {busy ? "Deleting…" : confirming ? "Confirm delete?" : "Delete"}
    </button>
  )
}
