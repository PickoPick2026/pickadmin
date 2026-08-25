"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarClock, ClipboardList, Eye, Headphones, MapPin, RefreshCw, Truck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

type NriRequest = {
  id: string; request_code: string; request_type: "consultation" | "slot_reservation" | "pickup_request"; status: string
  customer_name: string; whatsapp_number: string; email: string | null; country: string; preferred_date: string | null
  preferred_time: string | null; payload: Record<string, unknown>; created_at: string
}

const typeLabels: Record<NriRequest["request_type"], string> = {
  consultation: "Free consultation", slot_reservation: "Slot reservation", pickup_request: "Pickup request",
}
const statuses = ["PENDING", "CONTACTED", "CONFIRMED", "COMPLETED", "CANCELLED"]

const text = (value: unknown, fallback = "—") => value === null || value === undefined || value === "" ? fallback : String(value)
const list = (value: unknown) => Array.isArray(value) ? value.map((item) => String(item).replace(/_/g, " ")).join(", ") : "—"
const serviceName = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</h3><div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">{children}</div></section>
}

function Field({ label, value }: { label: string; value: unknown }) {
  return <div><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-0.5 break-words font-medium text-slate-800">{text(value)}</p></div>
}

function RequestDetails({ request }: { request: NriRequest }) {
  const data = request.payload || {}
  if (request.request_type === "consultation") return <div className="mt-5 space-y-3">
    <DetailSection title="Consultation request"><Field label="Customer" value={data.fullName || request.customer_name} /><Field label="WhatsApp" value={data.whatsappNumber || request.whatsapp_number} /><Field label="Current country" value={data.currentCountry || request.country} /><Field label="Email" value={data.email || request.email} /><Field label="Preferred date" value={data.preferredDate || request.preferred_date || "Flexible"} /><Field label="Preferred time" value={data.preferredTime || request.preferred_time || "Flexible"} /></DetailSection>
    <DetailSection title="What the customer needs"><Field label="Requirement" value={data.requirementHelp || "General consultation"} /></DetailSection>
  </div>

  if (request.request_type === "slot_reservation") return <div className="mt-5 space-y-3">
    <DetailSection title="Slot reservation"><Field label="Customer / sender" value={data.customerName || request.customer_name} /><Field label="WhatsApp" value={data.whatsappNumber || request.whatsapp_number} /><Field label="Destination country" value={data.destinationCountry || request.country} /><Field label="Pickup date" value={data.preferredDate || request.preferred_date} /><Field label="Requested time slot" value={data.preferredTimeSlot || request.preferred_time} /><Field label="Notes" value={data.notes} /></DetailSection>
  </div>

  return <div className="mt-5 space-y-3">
    <DetailSection title="Services & requirements"><Field label="Services selected" value={Array.isArray(data.selectedServices) ? list(data.selectedServices) : serviceName(text(data.serviceType, ""))} /><Field label="Primary service" value={data.serviceType ? serviceName(String(data.serviceType)) : "—"} /><Field label="Requirement details" value={data.requirementDescription} /><Field label="Items ready / purchasing" value={data.alreadyPurchasing === "yes" ? "Yes — items are ready or in cart" : data.alreadyPurchasing === "no" ? "No — customer needs sourcing" : "—"} /></DetailSection>
    <DetailSection title="Package & item details"><Field label="Package type" value={data.packageType ? serviceName(String(data.packageType)) : "—"} /><Field label="Package count" value={data.packageCount} /><Field label="Approximate weight" value={data.approxWeightKg ? `${data.approxWeightKg} kg` : "—"} /><Field label="Dimensions" value={data.dimensions && typeof data.dimensions === "object" ? `${text((data.dimensions as Record<string, unknown>).lengthCm)} × ${text((data.dimensions as Record<string, unknown>).widthCm)} × ${text((data.dimensions as Record<string, unknown>).heightCm)} cm` : "—"} /><Field label="Item description" value={data.itemDescription} /><Field label="Special handling" value={list(data.specialHandling)} /><Field label="Uploaded photos" value={Array.isArray(data.uploadedPhotos) ? `${data.uploadedPhotos.length} file(s)` : "0 files"} /></DetailSection>
    <DetailSection title="Destination / recipient"><Field label="Destination country" value={data.destinationCountry} /><Field label="Destination city" value={data.destinationCity} /><Field label="Postal code" value={data.postalCode} /><Field label="Recipient name" value={data.recipientName} /><Field label="Recipient phone" value={data.recipientPhone} /><Field label="Permanent address" value={data.isPermanentAddress === "yes" ? "Yes" : "No"} /></DetailSection>
    <DetailSection title="Pickup schedule"><Field label="Preferred pickup date" value={data.preferredPickupDate} /><Field label="Preferred time slot" value={data.preferredPickupSlotLabel} /><Field label="Custom time requested" value={data.customTimeRequested ? "Yes" : "No"} /><Field label="Custom time note" value={data.customTimeNote} /></DetailSection>
    <DetailSection title="Pickup contact & address"><Field label="Customer name" value={data.customerName} /><Field label="Customer WhatsApp" value={data.customerWhatsapp} /><Field label="Customer email" value={data.customerEmail} /><Field label="Current country" value={data.currentCountry} /><Field label="Pickup contact" value={data.pickupName} /><Field label="Pickup phone" value={data.pickupPhone} /><Field label="Address line" value={data.pickupAddressLine1} /><Field label="Street / area" value={data.pickupStreetArea} /><Field label="Pickup city" value={data.pickupCity} /><Field label="Pickup state" value={data.pickupState} /><Field label="Pickup PIN" value={data.pickupPin} /><Field label="Landmark" value={data.pickupLandmark} /><Field label="Pickup instructions" value={data.pickupInstructions} /><Field label="Someone else handing over" value={data.someoneElseHandingOver === "yes" ? "Yes" : "No"} /><Field label="Authorised person" value={data.authorizedPersonName} /><Field label="Authorised person phone" value={data.authorizedPersonPhone} /></DetailSection>
  </div>
}

export default function NriRequestsPage() {
  const [requests, setRequests] = useState<NriRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [selected, setSelected] = useState<NriRequest | null>(null)

  const loadRequests = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("nri_requests").select("*").order("created_at", { ascending: false })
    if (error) toast.error(`Unable to load NRI requests: ${error.message}`)
    else setRequests((data || []) as NriRequest[])
    setLoading(false)
  }
  useEffect(() => { loadRequests() }, [])

  const filtered = useMemo(() => filter === "all" ? requests : requests.filter((item) => item.request_type === filter), [filter, requests])
  const stats = useMemo(() => [
    { label: "All requests", value: requests.length, icon: ClipboardList, tone: "bg-slate-900 text-white" },
    { label: "Free consultations", value: requests.filter((item) => item.request_type === "consultation").length, icon: Headphones, tone: "bg-indigo-50 text-indigo-700" },
    { label: "Slot reservations", value: requests.filter((item) => item.request_type === "slot_reservation").length, icon: CalendarClock, tone: "bg-amber-50 text-amber-700" },
    { label: "Pickup requests", value: requests.filter((item) => item.request_type === "pickup_request").length, icon: Truck, tone: "bg-emerald-50 text-emerald-700" },
    { label: "Pending action", value: requests.filter((item) => item.status === "PENDING").length, icon: MapPin, tone: "bg-rose-50 text-rose-700" },
  ], [requests])

  const changeStatus = async (request: NriRequest, status: string) => {
    const { error } = await supabase.from("nri_requests").update({ status }).eq("id", request.id)
    if (error) return toast.error(`Could not update status: ${error.message}`)
    setRequests((items) => items.map((item) => item.id === request.id ? { ...item, status } : item))
    setSelected((item) => item?.id === request.id ? { ...item, status } : item)
    toast.success("Request status updated")
  }

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-2xl font-bold text-slate-900">NRI requests</h1><p className="mt-1 text-sm text-slate-500">Consultations, slot reservations and pickup requests in one queue.</p></div>
      <button onClick={loadRequests} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</button>
    </div>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {stats.map((stat) => { const Icon = stat.icon; return <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm"><div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}><Icon size={18} /></div><p className="mt-3 text-2xl font-bold text-slate-900">{stat.value}</p><p className="mt-1 text-xs font-medium text-slate-500">{stat.label}</p></div> })}
    </div>

    <div className="flex gap-2 overflow-x-auto pb-1">
      {[{ value: "all", label: `All (${requests.length})` }, ...Object.entries(typeLabels).map(([value, label]) => ({ value, label }))].map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${filter === item.value ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{item.label}</button>)}
    </div>

    <div className="overflow-x-auto rounded-xl border bg-white"><table className="min-w-[820px] w-full text-sm"><thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="p-3">Reference</th><th className="p-3">Customer</th><th className="p-3">Contact</th><th className="p-3">Schedule</th><th className="p-3">Status</th><th className="p-3">Received</th><th className="p-3 text-right">Details</th></tr></thead>
      <tbody>{loading ? <tr><td className="p-6 text-center text-slate-500" colSpan={7}>Loading requests…</td></tr> : filtered.length === 0 ? <tr><td className="p-6 text-center text-slate-500" colSpan={7}>No NRI requests found.</td></tr> : filtered.map((request) => <tr key={request.id} className="border-t align-top"><td className="p-3"><p className="font-mono text-xs font-semibold text-orange-600">{request.request_code}</p><p className="mt-1 text-xs font-medium text-slate-500">{typeLabels[request.request_type]}</p></td><td className="p-3"><p className="font-medium">{request.customer_name}</p><p className="text-xs text-slate-500">{request.country || "—"}</p></td><td className="p-3"><p>{request.whatsapp_number}</p><p className="text-xs text-slate-500">{request.email || "—"}</p></td><td className="p-3 text-xs"><p>{request.preferred_date || "Flexible"}</p><p className="mt-1 text-slate-500">{request.preferred_time || "Flexible"}</p></td><td className="p-3"><select value={request.status} onChange={(e) => changeStatus(request, e.target.value)} className="rounded-md border bg-white px-2 py-1 text-xs font-semibold"><option value={request.status}>{request.status}</option>{statuses.filter((s) => s !== request.status).map((s) => <option key={s} value={s}>{s}</option>)}</select></td><td className="p-3 text-xs text-slate-500">{new Date(request.created_at).toLocaleString()}</td><td className="p-3 text-right"><button onClick={() => setSelected(request)} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"><Eye size={15} /> View</button></td></tr>)}</tbody>
    </table></div>

    {selected && <div className="fixed inset-0 z-50 flex items-end bg-slate-900/40 p-0 sm:items-center sm:justify-center sm:p-4" onClick={() => setSelected(null)}><div className="max-h-[88vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-2xl sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><div><p className="font-mono text-xs font-bold text-orange-600">{selected.request_code}</p><h2 className="mt-1 text-xl font-bold">{typeLabels[selected.request_type]}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Close</button></div>
      <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><span className="font-bold text-slate-800">Status:</span> {selected.status} <span className="mx-2 text-slate-300">•</span> Received {new Date(selected.created_at).toLocaleString()}</div>
      <RequestDetails request={selected} />
      <details className="mt-5 rounded-xl border border-slate-200 bg-white"><summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800">View raw submitted JSON</summary><pre className="max-h-80 overflow-auto border-t bg-slate-950 p-4 text-xs leading-5 text-slate-100">{JSON.stringify(selected.payload, null, 2)}</pre></details>
    </div></div>}
  </div>
}
