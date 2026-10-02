"use client"

import { supabase } from "@/lib/supabase"
import { getSession } from "@/lib/auth"

export type Remark = {
  id: string
  text: string
  author: string
  createdAt: string
  type?: string
  assigned_to?: string | null
}

/**
 * Extracts the assigned owner ID (adminLoginID as string) from either
 * the dedicated column assigned_to or from the fallback meta-record in remarks.
 */
export function resolveAssignedTo(row: any): string | null {
  if (row?.assigned_to !== undefined && row?.assigned_to !== null && row?.assigned_to !== "") {
    return String(row.assigned_to)
  }
  if (Array.isArray(row/.remarks)) {
    const meta = row.remarks.find((r: any) => r?.type === "assignment" && r?.assigned_to)
    if (meta?.assigned_to) return String(meta.assigned_to)
  }
  return null
}

/**
 * Safely assigns an owner to any lead/request row.
 * Handles both Postgres text/uuid columns AND gracefully falls back to
 * remarks jsonb if the column type in Postgres hasn't been migrated yet.
 */
export async function assignLeadOwner({
  table,
  id,
  userId,
  userName,
  currentRemarks = [],
}: {
  table: string
  id: string
  userId: string | null
  userName?: string | null
  currentRemarks?: Remark[]
}): Promise<{ success: boolean; remarks: Remark[]; error?: any }> {
  const session = getSession()
  const authorName = session?.username ?? "admin"
  let nextRemarks = Array.isArray(currentRemarks) ? [...currentRemarks] : []

  // 1. Attempt updating the assigned_to column directly
  let columnUpdateOk = false
  try {
    const { error } = await supabase
      .from(table)
      .update({ assigned_to: userId })
      .eq("id", id)

    if (!error) {
      columnUpdateOk = true
    }
  } catch (err) {
    columnUpdateOk = false
  }

  // 2. If column update failed (e.g. bigint type mismatch), or as a resilient fallback,
  // store assignment record into remarks JSONB
  if (!columnUpdateOk) {
    nextRemarks = nextRemarks.filter((r) => r?.type !== "assignment")
    if (userId) {
      nextRemarks.push({
        id: "assign-" + Date.now(),
        type: "assignment",
        assigned_to: userId,
        text: "Assigned owner: " + (userName || userId),
        author: authorName,
        createdAt: new Date().toISOString(),
      })
    }
    const { error: remarkErr } = await supabase
      .from(table)
      .update({ remarks: nextRemarks })
      .eq("id", id)

    if (remarkErr) {
      return { success: false, remarks: currentRemarks, error: remarkErr }
    }
    return { success: true, remarks: nextRemarks }
  }


  return { success: true, remarks: nextRemarks }
}

/**
 * Builds a direct WhatsApp web/app link.
 * Handles country codes (+91 default for 10-digit Indian numbers).
 */
export function buildWhatsAppLink(phone?: string | null, message = "Hello"): string | null {
  const clean = (phone || "").replace(/\D/g, "")
  if (!clean) return null
  const full = clean.startsWith("91")
    ? clean
    : clean.length === 10
      ? "91" + clean
      : clean
  return "https://api.whatsapp.com/send?phone=" + full + "&text=" + encodeURIComponent(message)
}

/**
 * Builds a direct Gmail compose URL so clicking opens Gmail directly in the browser
 * with pre-filled To, Subject, and Body, avoiding OS mailto popups.
 */
export function buildGmailLink(
  to?: string | null,
  subject = "",
  body = "",): string | null {
  if (!to) return null
  const params = new URLSearchParams()
  params.set("view", "cm")
  params.set("fs", "1")
  params.set("to", to.trim())
  if (subject) params.set("su", subject.trim())
  if (body) params.set("body", body.trim())
  return "https://mail.google.com/mail/?" + params.toString()
}
