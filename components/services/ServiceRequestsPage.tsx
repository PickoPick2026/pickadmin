"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  PackageCheck,
  Phone,
  RefreshCw,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  Trash2,
  Truck,
  User,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { useAuth } from "@/hooks/useAuth"
import { canDeleteLeads } from "@/config/rolePermissions"
import { buildGmailLink, buildWhatsAppLink } from "@/components/crm/crmHelpers"
import Drawer from "@/components/ui/drawer"
import Dropdown from "@/components/ui/dropdown"
import WhatsAppIcon from "@/components/common/WhatsAppIcon"
import {
  useAssignableUsers,
  userOptions,
} from "@/components/crm/useAssignableUsers"

export type ServiceRequest = {
  id: string
  request_code: string
  service_type:
    | "buy_and_ship"
    | "order_and_send"
    | "exclusive_sourcing"
    | "contact"
    | "assisted_buy"
    | string
  status: "NEW" | "CONTACTED" | "IN_PROGRESS" | "COMPLETED" | "CLOSED" | string
  customer_name: string
  phone: string
  email: string
  location: string
  payload: Record<string, any>
  admin_notes: string | null
  assigned_to?: string | null
  created_at: string
  updated_at: string
}

const SERVICE_TYPE_META: Record<
  string,
  { label: string; badge: string; icon: any }
> = {
  order_and_send: {
    label: "Order & Send",
    badge: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
    icon: Truck,
  },
  buy_and_ship: {
    label: "Buy & Ship",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
    icon: ShoppingBag,
  },
  exclusive_sourcing: {
    label: "Exclusive Sourcing",
    badge: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
    icon: Sparkles,
  },
  contact: {
    label: "Contact Desk",
    badge: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-100",
    icon: MessageSquare,
  },
  assisted_buy: {
    label: "Assisted Buy",
    badge: "bg-blue-50 text-blue-700 border-blue-200 ring-blue-100",
    icon: PackageCheck,
  },
}

const STATUS_META: Record<string, { label: string; badge: string }> = {
  NEW: { label: "New / Unactioned", badge: "bg-rose-50 text-rose-700 ring-rose-200 border-rose-200" },
  CONTACTED: { label: "Contacted", badge: "bg-amber-50 text-amber-700 ring-amber-200 border-amber-200" },
  IN_PROGRESS: { label: "In Progress", badge: "bg-blue-50 text-blue-700 ring-blue-200 border-blue-200" },
  COMPLETED: { label: "Completed", badge: "bg-emerald-50 text-emerald-700 ring-emerald-200 border-emerald-200" },
  CLOSED: { label: "Closed", badge: "bg-slate-100 text-slate-600 ring-slate-200 border-slate-200" },
}

const STATUS_LIST = ["NEW", "CONTACTED", "IN_PROGRESS", "COMPLETED", "CLOSED"]

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h4>
      <div className="mt-3 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function FieldItem({ label, value }: { label: string; value: unknown }) {
  const display =
    value === null || value === undefined || value === "" ? "—" : String(value)
  return (
    <div>
      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <p className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{display}</p>
    </div>
  )
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Slide-over detail view
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null)
  const [notes, setNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  // Team assignment
  const { users: assignableUsers } = useAssignableUsers()

  // Bulk actions (Delete Leads permission only)
  const { role, session } = useAuth()
  const canDelete = canDeleteLeads(role, session?.permissions)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        toast.error(`Error loading service requests: ${error.message}`)
      } else {
        setRequests((data || []) as ServiceRequest[])
      }
    } catch {
      toast.error("Failed to fetch service requests")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [])

  const handleOpenDetails = (req: ServiceRequest) => {
    setSelectedReq(req)
    setNotes(req.admin_notes || "")
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const prev = requests.find((r) => r.id === id)?.status
    if (prev === newStatus) return

    // INSTANT optimistic update
    setRequests((list) =>
      list.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
    )
    if (selectedReq?.id === id) {
      setSelectedReq((curr) => (curr ? { ...curr, status: newStatus } : null))
    }

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) throw error
      toast.success(`Status changed to ${newStatus}`)
    } catch (err: any) {
      if (prev) {
        setRequests((list) =>
          list.map((r) => (r.id === id ? { ...r, status: prev } : r)),
        )
      }
      toast.error(`Unable to update status: ${err?.message || err}`)
    }
  }

  const handleAssign = async (id: string, userId: string) => {
    const prevOwner = requests.find((r) => r.id === id)?.assigned_to ?? null
    const nextOwner = userId || null

    setRequests((list) =>
      list.map((r) => (r.id === id ? { ...r, assigned_to: nextOwner } : r)),
    )
    if (selectedReq?.id === id) {
      setSelectedReq((curr) => (curr ? { ...curr, assigned_to: nextOwner } : null))
    }

    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ assigned_to: nextOwner })
        .eq("id", id)

      if (error) throw error
      toast.success(nextOwner ? "Ticket assigned" : "Assignment cleared")
    } catch (err: any) {
      setRequests((list) =>
        list.map((r) => (r.id === id ? { ...r, assigned_to: prevOwner } : r)),
      )
      if (selectedReq?.id === id) {
        setSelectedReq((curr) => (curr ? { ...curr, assigned_to: prevOwner } : null))
      }
      toast.error(`Unable to assign: ${err?.message || err}`)
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedReq) return
    setIsSavingNotes(true)
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ admin_notes: notes })
        .eq("id", selectedReq.id)

      if (error) {
        toast.error(`Failed to save notes: ${error.message}`)
      } else {
        setRequests((prev) =>
          prev.map((r) =>
            r.id === selectedReq.id ? { ...r, admin_notes: notes } : r,
          ),
        )
        setSelectedReq((prev) => (prev ? { ...prev, admin_notes: notes } : null))
        toast.success("Admin notes updated")
      }
    } catch {
      toast.error("Unable to save notes")
    } finally {
      setIsSavingNotes(false)
    }
  }

  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return requests.filter((r) => {
      if (typeFilter !== "all" && r.service_type !== typeFilter) return false
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (!q) return true

      const matchMain = [
        r.request_code,
        r.customer_name,
        r.phone,
        r.email,
        r.location,
        r.service_type,
      ].some((val) => String(val || "").toLowerCase().includes(q))

      if (matchMain) return true

      if (r.payload) {
        const payloadStr = JSON.stringify(r.payload).toLowerCase()
        if (payloadStr.includes(q)) return true
      }

      return false
    })
  }, [requests, typeFilter, statusFilter, searchQuery])

  // --- Bulk selection & delete ---

  const allFilteredSelected =
    filteredRequests.length > 0 &&
    filteredRequests.every((r) => selectedIds.includes(r.id))

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredRequests.map((r) => r.id))
    }
    setConfirmBulkDelete(false)
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    setConfirmBulkDelete(false)
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!confirmBulkDelete) {
      setConfirmBulkDelete(true)
      return
    }

    setIsBulkDeleting(true)
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .delete()
        .in("id", selectedIds)
        .select("id")

      if (error) {
        toast.error(`Bulk delete failed: ${error.message}`)
        return
      }

      const deletedIds = ((data || []) as { id: string }[]).map((r) => r.id)
      if (deletedIds.length === 0) {
        toast.error(
          "The database blocked the delete (row-level security has no delete policy for this table). Nothing was deleted.",
        )
        return
      }

      setRequests((prev) => prev.filter((r) => !deletedIds.includes(r.id)))
      setSelectedIds([])
      setConfirmBulkDelete(false)

      if (deletedIds.length < selectedIds.length) {
        toast.warning(
          `Deleted ${deletedIds.length} of ${selectedIds.length} — the database blocked the rest (row-level security).`,
        )
      } else {
        toast.success(`Deleted ${deletedIds.length} service request${deletedIds.length === 1 ? "" : "s"}`)
      }
    } catch {
      toast.error("Bulk delete failed")
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const stats = useMemo(() => {
    return {
      total: requests.length,
      newCount: requests.filter((r) => r.status === "NEW").length,
      orderSend: requests.filter((r) => r.service_type === "order_and_send").length,
      buyShip: requests.filter((r) => r.service_type === "buy_and_ship").length,
      exclusive: requests.filter((r) => r.service_type === "exclusive_sourcing").length,
      contact: requests.filter((r) => r.service_type === "contact").length,
    }
  }, [requests])

  const drawerWaLink = selectedReq
    ? buildWhatsAppLink(
        selectedReq.phone,
        `Hello ${selectedReq.customer_name}, regarding your Pick O Pick ${
          SERVICE_TYPE_META[selectedReq.service_type]?.label || "service"
        } request (${selectedReq.request_code}):`,
      )
    : null

  const drawerGmailLink = selectedReq
    ? buildGmailLink(
        selectedReq.email,
        `Pick O Pick Request Update - ${selectedReq.request_code}`,
        `Hello ${selectedReq.customer_name},\n\nRegarding your Pick O Pick request (${selectedReq.request_code}).\n\nBest regards,\nPick O Pick Team`,
      )
    : null

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Service Requests
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live dashboard for Order & Send, Buy & Ship, Exclusive Sourcing, and Contact requests.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadRequests}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <span className="text-xs font-semibold text-slate-500">Total Requests</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4">
          <span className="text-xs font-bold text-rose-700">New / Unactioned</span>
          <p className="text-2xl font-black text-rose-800 mt-1">{stats.newCount}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <span className="text-xs font-bold text-blue-700">Order & Send</span>
          <p className="text-2xl font-black text-blue-800 mt-1">{stats.orderSend}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <span className="text-xs font-bold text-blue-700">Buy & Ship</span>
          <p className="text-2xl font-black text-blue-800 mt-1">{stats.buyShip}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <span className="text-xs font-bold text-blue-700">Exclusive Sourcing</span>
          <p className="text-2xl font-black text-blue-800 mt-1">{stats.exclusive}</p>
        </div>
      </div>

      {/* Filter Bar: Tabs & Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all", label: `All (${requests.length})` },
            { id: "order_and_send", label: `Order & Send (${stats.orderSend})` },
            { id: "buy_and_ship", label: `Buy & Ship (${stats.buyShip})` },
            { id: "exclusive_sourcing", label: `Exclusive Sourcing (${stats.exclusive})` },
            { id: "contact", label: `Contact Desk (${stats.contact})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                typeFilter === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search and Status Dropdown */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by reference ID, customer name, phone, email, city, items..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto min-w-[170px]">
            <Filter size={15} className="text-slate-400 shrink-0 hidden sm:block" />
            <Dropdown
              size="sm"
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={[
                { value: "all", label: "All Statuses" },
                ...STATUS_LIST.map((s) => ({
                  value: s,
                  label: STATUS_META[s]?.label || s,
                })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Bulk action bar (Delete Leads permission only) */}
      {canDelete && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <span className="text-sm font-bold text-blue-900">
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => {
              setSelectedIds([])
              setConfirmBulkDelete(false)
            }}
            className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            Clear selection
          </button>
          <div className="ml-auto flex items-center gap-2">
            {confirmBulkDelete && (
              <span className="text-xs font-semibold text-rose-600">
                Permanently delete {selectedIds.length} request
                {selectedIds.length === 1 ? "" : "s"}?
              </span>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60 ${
                confirmBulkDelete
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <Trash2 size={14} />
              {isBulkDeleting
                ? "Deleting…"
                : confirmBulkDelete
                  ? "Confirm Delete"
                  : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      {/* Requests Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                {canDelete && (
                  <th className="p-3.5 w-10">
                    <Checkbox
                      aria-label="Select all"
                      checked={allFilteredSelected}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="p-3.5">Reference ID</th>
                <th className="p-3.5">Service Type</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Submitted On</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td
                    colSpan={canDelete ? 8 : 7}
                    className="p-12 text-center text-slate-400"
                  >
                    <RefreshCw className="mx-auto mb-2 animate-spin text-blue-600" size={24} />
                    <p className="text-xs font-semibold">Loading service requests…</p>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={canDelete ? 8 : 7}
                    className="p-12 text-center text-slate-400"
                  >
                    <AlertCircle className="mx-auto mb-2 text-slate-300" size={28} />
                    <p className="text-xs font-bold text-slate-600">No service requests found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust your filters or wait for new incoming requests.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const typeMeta =
                    SERVICE_TYPE_META[req.service_type] || {
                      label: req.service_type.replace(/_/g, " "),
                      badge: "bg-slate-100 text-slate-700",
                      icon: Package,
                    }
                  const TypeIcon = typeMeta.icon

                  const waLink = buildWhatsAppLink(
                    req.phone,
                    `Hello ${req.customer_name}, regarding your Pick O Pick ${typeMeta.label} request (${req.request_code}).`,
                  )

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition-colors align-middle group"
                    >
                      {/* Bulk select (Delete Leads permission only) */}
                      {canDelete && (
                        <td className="p-3.5">
                          <Checkbox
                            aria-label={`Select ${req.request_code}`}
                            checked={selectedIds.includes(req.id)}
                            onCheckedChange={() => toggleSelectRow(req.id)}
                          />
                        </td>
                      )}

                      {/* Code */}
                      <td className="p-3.5">
                        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                          {req.request_code}
                        </span>
                      </td>

                      {/* Service Type */}
                      <td className="p-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${typeMeta.badge}`}
                        >
                          <TypeIcon size={12} />
                          {typeMeta.label}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{req.customer_name}</p>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={11} /> {req.location || "—"}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="p-3.5 text-xs">
                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                          <Phone size={12} className="text-slate-400" />
                          <span>{req.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1 truncate max-w-[180px]">
                          <Mail size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">{req.email}</span>
                        </div>
                      </td>

                      {/* Status Selector */}
                      <td className="p-3.5 min-w-[160px]">
                        <Dropdown
                          size="sm"
                          value={req.status}
                          onChange={(v) => handleUpdateStatus(req.id, v)}
                          options={STATUS_LIST.map((s) => ({
                            value: s,
                            label: STATUS_META[s]?.label || s,
                          }))}
                        />
                      </td>

                      {/* Date */}
                      <td className="p-3.5 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(req.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                        <span className="block text-[10px] text-slate-400">
                          {new Date(req.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {waLink && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Chat on WhatsApp"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                            >
                              <WhatsAppIcon size={13} />
                            </a>
                          )}
                          <button
                            onClick={() => handleOpenDetails(req)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {selectedReq && (
        <Drawer
          open
          onClose={() => setSelectedReq(null)}
          title={selectedReq.customer_name}
          subtitle={`Submitted ${new Date(selectedReq.created_at).toLocaleString()}`}
          wide
          actions={
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                {selectedReq.request_code}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  SERVICE_TYPE_META[selectedReq.service_type]?.badge || "bg-slate-100 text-slate-700"
                }`}
              >
                {SERVICE_TYPE_META[selectedReq.service_type]?.label ||
                  selectedReq.service_type.replace(/_/g, " ")}
              </span>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Quick contact actions */}
            <div className="flex flex-wrap gap-2">
              {drawerWaLink && (
                <a
                  href={drawerWaLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 text-xs font-bold transition"
                >
                  <WhatsAppIcon size={14} />
                  WhatsApp
                </a>
              )}

              {drawerGmailLink && (
                <a
                  href={drawerGmailLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 text-xs font-bold transition"
                >
                  <Mail size={14} />
                  Compose in Gmail
                </a>
              )}
            </div>

            {/* Workflow: status + assignment */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Status
                </label>
                <Dropdown
                  value={selectedReq.status}
                  onChange={(v) => handleUpdateStatus(selectedReq.id, v)}
                  options={STATUS_LIST.map((s) => ({
                    value: s,
                    label: STATUS_META[s]?.label || s,
                  }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned To
                </label>
                <Dropdown
                  value={selectedReq.assigned_to ?? ""}
                  onChange={(v) => handleAssign(selectedReq.id, v)}
                  options={userOptions(assignableUsers)}
                  placeholder="Unassigned"
                />
              </div>
            </div>

            <div className="space-y-4">
              {/* Customer Info Card */}
              <DetailBlock title="Customer Details">
                <FieldItem label="Full Name" value={selectedReq.customer_name} />
                <FieldItem label="Phone / WhatsApp" value={selectedReq.phone} />
                <FieldItem label="Email Address" value={selectedReq.email} />
                <FieldItem label="Location / Destination" value={selectedReq.location} />
                <FieldItem
                  label="Created At"
                  value={new Date(selectedReq.created_at).toLocaleString()}
                />
                <FieldItem
                  label="Last Updated"
                  value={new Date(selectedReq.updated_at).toLocaleString()}
                />
              </DetailBlock>

              {/* Service Details Card based on type */}
              {selectedReq.service_type === "order_and_send" && (
                <DetailBlock title="Order & Send Logistics">
                  <FieldItem
                    label="Pickup City (India)"
                    value={selectedReq.payload?.pickupLocation || "India pickup"}
                  />
                  <FieldItem
                    label="Drop Destination"
                    value={selectedReq.payload?.dropLocation || selectedReq.location}
                  />
                  <div className="sm:col-span-2">
                    <FieldItem
                      label="Items / Products to Ship"
                      value={selectedReq.payload?.itemsToShip}
                    />
                  </div>
                  {selectedReq.payload?.productLinks && (
                    <div className="sm:col-span-2 mt-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Shared Product Links (Myntra, Meesho, Amazon, Flipkart, etc.)
                      </span>
                      <p className="mt-1 p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-800 break-all border border-slate-200">
                        {String(selectedReq.payload.productLinks)}
                      </p>
                    </div>
                  )}
                </DetailBlock>
              )}

              {selectedReq.service_type === "buy_and_ship" && (
                <DetailBlock title="Buy & Ship Requirements">
                  <div className="sm:col-span-2">
                    <FieldItem
                      label="What to Buy (Items & Specifications)"
                      value={selectedReq.payload?.whatToBuy}
                    />
                  </div>
                  <FieldItem
                    label="Where to Buy (Stores / Platforms)"
                    value={selectedReq.payload?.whereToBuy}
                  />
                  <FieldItem
                    label="Where to Send"
                    value={selectedReq.payload?.whereToSend || selectedReq.location}
                  />
                  {selectedReq.payload?.productLinks && (
                    <div className="sm:col-span-2 mt-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Product Links
                      </span>
                      <p className="mt-1 p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-800 break-all border border-slate-200">
                        {String(selectedReq.payload.productLinks)}
                      </p>
                    </div>
                  )}
                </DetailBlock>
              )}

              {selectedReq.service_type === "exclusive_sourcing" && (
                <DetailBlock title="Exclusive Sourcing Desk">
                  <div className="sm:col-span-2">
                    <FieldItem
                      label="Requested Regional Items"
                      value={selectedReq.payload?.requestedItems}
                    />
                  </div>
                  <FieldItem
                    label="Quantity / Estimate"
                    value={selectedReq.payload?.quantity || "1"}
                  />
                  <FieldItem
                    label="Destination Location"
                    value={selectedReq.location}
                  />
                </DetailBlock>
              )}

              {selectedReq.service_type === "contact" && (
                <DetailBlock title="Inquiry Message">
                  <FieldItem
                    label="Subject / Topic"
                    value={selectedReq.payload?.topic || "General Inquiry"}
                  />
                  <div className="sm:col-span-2">
                    <FieldItem
                      label="Customer Message"
                      value={selectedReq.payload?.message}
                    />
                  </div>
                </DetailBlock>
              )}

              {/* Extra Payload Explorer */}
              {selectedReq.payload &&
                Object.keys(selectedReq.payload).length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Full Form Payload
                    </p>
                    <pre className="max-h-40 overflow-y-auto rounded-xl bg-white p-3 text-[11px] font-mono text-slate-700 border border-slate-200">
                      {JSON.stringify(selectedReq.payload, null, 2)}
                    </pre>
                  </div>
                )}

              {/* Internal Admin Notes */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Internal Team Notes
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal staff notes about customer communication, quotes shared, or courier tracking..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  )
}
