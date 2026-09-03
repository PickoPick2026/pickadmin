"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Calculator,
  CheckCircle2,
  Eye,
  IndianRupee,
  MapPin,
  Package,
  RefreshCw,
  Search,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type EstimateLead = {
  id: string
  request_code: string
  status: "NEW" | "CONTACTED" | "QUOTED" | "CONVERTED" | "CLOSED"
  customer_name: string
  whatsapp_number: string
  email: string | null
  destination_country: string
  package_type: string | null
  approx_weight_kg: number | null
  dimensions: string | null
  requirement_description: string | null
  payload: Record<string, unknown>
  quoted_amount: number | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

const STATUSES: EstimateLead["status"][] = ["NEW", "CONTACTED", "QUOTED", "CONVERTED", "CLOSED"]

const statusTone: Record<EstimateLead["status"], string> = {
  NEW: "bg-rose-50 text-rose-700 ring-rose-200",
  CONTACTED: "bg-amber-50 text-amber-700 ring-amber-200",
  QUOTED: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
}

const text = (value: unknown, fallback = "—") =>
  value === null || value === undefined || value === "" ? fallback : String(value)

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words font-medium text-slate-800">{text(value)}</p>
    </div>
  )
}

export default function EstimateLeadsPage() {
  const [leads, setLeads] = useState<EstimateLead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<"all" | EstimateLead["status"]>("all")
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<EstimateLead | null>(null)
  const [draftNotes, setDraftNotes] = useState("")
  const [draftQuote, setDraftQuote] = useState("")
  const [savingDetails, setSavingDetails] = useState(false)

  const loadLeads = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("estimate_leads")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) toast.error(`Unable to load estimate leads: ${error.message}`)
    else setLeads((data || []) as EstimateLead[])
    setLoading(false)
  }
  useEffect(() => {
    loadLeads()
  }, [])

  const openLead = (lead: EstimateLead) => {
    setSelected(lead)
    setDraftNotes(lead.admin_notes || "")
    setDraftQuote(lead.quoted_amount != null ? String(lead.quoted_amount) : "")
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false
      if (!q) return true
      return [
        lead.request_code,
        lead.customer_name,
        lead.whatsapp_number,
        lead.email,
        lead.destination_country,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    })
  }, [leads, statusFilter, query])

  const stats = useMemo(
    () => [
      { label: "All leads", value: leads.length, icon: Calculator, tone: "bg-slate-900 text-white" },
      { label: "New / unactioned", value: leads.filter((l) => l.status === "NEW").length, icon: MapPin, tone: "bg-rose-50 text-rose-700" },
      { label: "Quoted", value: leads.filter((l) => l.status === "QUOTED").length, icon: IndianRupee, tone: "bg-indigo-50 text-indigo-700" },
      { label: "Converted", value: leads.filter((l) => l.status === "CONVERTED").length, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700" },
    ],
    [leads],
  )

  const patchLead = (id: string, patch: Partial<EstimateLead>) => {
    setLeads((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
    setSelected((item) => (item && item.id === id ? { ...item, ...patch } : item))
  }

  const changeStatus = async (lead: EstimateLead, status: EstimateLead["status"]) => {
    const { error } = await supabase.from("estimate_leads").update({ status }).eq("id", lead.id)
    if (error) return toast.error(`Could not update status: ${error.message}`)
    patchLead(lead.id, { status })
    toast.success("Status updated")
  }

  const saveDetails = async () => {
    if (!selected) return
    setSavingDetails(true)
    const quoted = draftQuote.trim() === "" ? null : Number(draftQuote)
    if (quoted != null && Number.isNaN(quoted)) {
      setSavingDetails(false)
      return toast.error("Quoted amount must be a number")
    }
    const patch = { admin_notes: draftNotes.trim() || null, quoted_amount: quoted }
    const { error } = await supabase.from("estimate_leads").update(patch).eq("id", selected.id)
    setSavingDetails(false)
    if (error) return toast.error(`Could not save: ${error.message}`)
    patchLead(selected.id, patch)
    toast.success("Lead updated")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estimate Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Shipping estimate requests from the website. Verify the customer&apos;s code before sending a quotation.
          </p>
        </div>
        <button
          onClick={loadLeads}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(["all", ...STATUSES] as const).map((value) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                statusFilter === value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"
              }`}
            >
              {value === "all" ? `All (${leads.length})` : value}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, name, phone, email…"
            className="w-full rounded-lg border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Shipment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Received</th>
              <th className="p-3 text-right">Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={7}>
                  Loading estimate leads…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={7}>
                  No estimate leads found.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => (
                <tr key={lead.id} className="border-t align-top">
                  <td className="p-3">
                    <p className="font-mono text-xs font-semibold text-orange-600">{lead.request_code}</p>
                  </td>
                  <td className="p-3">
                    <p className="font-medium">{lead.customer_name}</p>
                    <p className="text-xs text-slate-500">{lead.destination_country}</p>
                  </td>
                  <td className="p-3">
                    <p>{lead.whatsapp_number}</p>
                    <p className="text-xs text-slate-500">{lead.email || "—"}</p>
                  </td>
                  <td className="p-3 text-xs">
                    <p>{lead.package_type || "—"}</p>
                    <p className="mt-1 text-slate-500">
                      {lead.approx_weight_kg != null ? `${lead.approx_weight_kg} kg` : "—"}
                      {lead.dimensions ? ` · ${lead.dimensions}` : ""}
                    </p>
                  </td>
                  <td className="p-3">
                    <select
                      value={lead.status}
                      onChange={(e) => changeStatus(lead, e.target.value as EstimateLead["status"])}
                      className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 ${statusTone[lead.status]}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3 text-xs text-slate-500">{new Date(lead.created_at).toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => openLead(lead)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      <Eye size={15} /> View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-900/40 p-0 sm:items-center sm:justify-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs font-bold text-orange-600">{selected.request_code}</p>
                <h2 className="mt-1 text-xl font-bold">{selected.customer_name}</h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100"
              >
                Close
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
              <span className="font-bold text-slate-800">Verification code:</span>{" "}
              <span className="font-mono font-bold text-orange-600">{selected.request_code}</span>
              <span className="mx-2 text-slate-300">•</span>
              <span className="font-bold text-slate-800">Status:</span> {selected.status}
              <span className="mx-2 text-slate-300">•</span>
              Received {new Date(selected.created_at).toLocaleString()}
            </div>

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Package size={14} /> Request details
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                <Field label="Customer name" value={selected.customer_name} />
                <Field label="WhatsApp number" value={selected.whatsapp_number} />
                <Field label="Email ID" value={selected.email} />
                <Field label="Destination country" value={selected.destination_country} />
                <Field label="Package type" value={selected.package_type} />
                <Field
                  label="Approx. weight"
                  value={selected.approx_weight_kg != null ? `${selected.approx_weight_kg} kg` : null}
                />
                <Field label="Dimensions" value={selected.dimensions} />
                <Field label="What they are shipping" value={selected.requirement_description} />
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Team working notes</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
                <label className="text-xs font-semibold text-slate-600">
                  Admin notes
                  <textarea
                    rows={3}
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    className="mt-1 w-full resize-none rounded-lg border p-2 text-sm text-slate-800 outline-none focus:border-slate-400"
                    placeholder="Call outcome, quote shared, follow-up date…"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Quoted amount (₹)
                  <input
                    type="number"
                    value={draftQuote}
                    onChange={(e) => setDraftQuote(e.target.value)}
                    className="mt-1 w-full rounded-lg border p-2 text-sm text-slate-800 outline-none focus:border-slate-400"
                    placeholder="0"
                  />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <select
                  value={selected.status}
                  onChange={(e) => changeStatus(selected, e.target.value as EstimateLead["status"])}
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold ring-1 ${statusTone[selected.status]}`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveDetails}
                  disabled={savingDetails}
                  className="rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                >
                  {savingDetails ? "Saving…" : "Save notes & quote"}
                </button>
              </div>
            </section>

            <details className="mt-5 rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800">
                View raw submitted JSON
              </summary>
              <pre className="max-h-80 overflow-auto border-t bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  )
}
