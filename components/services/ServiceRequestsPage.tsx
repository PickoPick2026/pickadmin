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
  Truck,
  User,
  X,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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
    badge: "bg-purple-50 text-purple-700 border-purple-200 ring-purple-100",
    icon: Sparkles,
  },
  contact: {
    label: "Contact Desk",
    badge: "bg-amber-50 text-amber-800 border-amber-200 ring-amber-100",
    icon: MessageSquare,
  },
  assisted_buy: {
    label: "Assisted Buy",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-100",
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
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
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
  const [selectedReq, setSelectedReq] = useState<ServiceRequest | null>(null)
  const [notes, setNotes] = useState("")
  const [isSavingNotes, setIsSavingNotes] = useState(false)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        toast.error(`Failed to fetch service requests: ${error.message}`)
      } else {
        setRequests((data || []) as ServiceRequest[])
      }
    } catch (err) {
      toast.error("An error occurred while loading requests")
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
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: newStatus })
        .eq("id", id)

      if (error) {
        toast.error(`Failed to update status: ${error.message}`)
        return
      }

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      )
      if (selectedReq?.id === id) {
        setSelectedReq((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
      toast.success(`Status changed to ${newStatus}`)
    } catch {
      toast.error("Unable to update status")
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
      ].some((val) => val?.toLowerCase().includes(q))

      if (matchMain) return true

      if (r.payload && typeof r.payload === "object") {
        const payloadStr = JSON.stringify(r.payload).toLowerCase()
        return payloadStr.includes(q)
      }

      return false
    })
  }, [requests, typeFilter, statusFilter, searchQuery])

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

  const formatPhoneForWa = (phone: string) => {
    return phone.replace(/\D/g, "")
  }

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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Leads</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Package size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.total}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">All service submissions</span>
        </div>

        <div className="rounded-2xl border border-rose-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">New / Action Required</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-rose-600">{stats.newCount}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Uncontacted leads</span>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">Order & Send</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Truck size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.orderSend}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">India pickup & delivery</span>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Buy & Ship</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ShoppingBag size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.buyShip}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Assisted shopping</span>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Exclusive Sourcing</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <Sparkles size={16} />
            </div>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{stats.exclusive}</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Laddu, Halwa, Regional</span>
        </div>
      </div>
      {/* Filter Bar: Tabs & Controls */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
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
                  ? "bg-slate-900 text-white shadow-xs"
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
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-slate-400 shrink-0 hidden sm:block" />
            <select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s]?.label || s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-[950px] w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="p-3.5">Reference Code</th>
                <th className="p-3.5">Service Type</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Contact</th>
                <th className="p-3.5">Requirements / Location</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    <RefreshCw className="inline-block animate-spin mr-2" size={16} />
                    Loading service requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold">No service requests found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try clearing search filters or check back later.
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
                  const statusInfo = STATUS_META[req.status] || {
                    label: req.status,
                    badge: "bg-slate-100 text-slate-700",
                  }

                  const previewText =
                    req.payload?.itemsToShip ||
                    req.payload?.whatToBuy ||
                    req.payload?.requestedItems ||
                    req.payload?.message ||
                    req.payload?.productLinks ||
                    req.location

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-slate-50/70 transition-colors align-top group"
                    >
                      {/* Code */}
                      <td className="p-3.5 font-mono text-xs font-bold text-indigo-700">
                        {req.request_code}
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

                      {/* Requirements Preview */}
                      <td className="p-3.5 max-w-[220px]">
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                          {previewText || "No extra details"}
                        </p>
                      </td>

                      {/* Status Selector */}
                      <td className="p-3.5">
                        <select
                          aria-label="Change status"
                          value={req.status}
                          onChange={(e) => handleUpdateStatus(req.id, e.target.value)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-bold cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusInfo.badge}`}
                        >
                          {STATUS_LIST.map((s) => (
                            <option key={s} value={s}>
                              {STATUS_META[s]?.label || s}
                            </option>
                          ))}
                        </select>
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
                        <button
                          onClick={() => handleOpenDetails(req)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Detail Slide-over / Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 sm:p-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
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
                <h3 className="mt-2 text-xl font-extrabold text-slate-900">
                  {selectedReq.customer_name}
                </h3>
              </div>

              <button
                onClick={() => setSelectedReq(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Quick Actions Bar */}
            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={`https://wa.me/${formatPhoneForWa(selectedReq.phone)}?text=${encodeURIComponent(
                  `Hello ${selectedReq.customer_name}, regarding your Pick O Pick ${
                    SERVICE_TYPE_META[selectedReq.service_type]?.label || "service"
                  } request (${selectedReq.request_code}):`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white px-3.5 py-2 text-xs font-bold transition shadow-xs"
              >
                <MessageSquare size={14} />
                Open WhatsApp
              </a>

              <a
                href={`mailto:${selectedReq.email}?subject=${encodeURIComponent(
                  `Pick O Pick Request Update - ${selectedReq.request_code}`,
                )}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 text-xs font-bold transition shadow-xs"
              >
                <Mail size={14} />
                Email Customer
              </a>

              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <select
                  aria-label="Update modal status"
                  value={selectedReq.status}
                  onChange={(e) => handleUpdateStatus(selectedReq.id, e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  {STATUS_LIST.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_META[s]?.label || s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Modal Content Sections */}
            <div className="mt-6 space-y-4">
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
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Internal Team Notes
                </h4>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal staff notes about customer communication, quotes shared, or courier tracking..."
                  rows={3}
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 p-3 text-xs font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
                  >
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedReq(null)}
                className="rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
