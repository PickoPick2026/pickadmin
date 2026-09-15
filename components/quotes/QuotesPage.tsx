"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  Eye,
  IndianRupee,
  Mail,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  Search,
  ShoppingBag,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  name: string
  price: number
  quantity: number
  image: string | null
  created_at?: string
}

export type QuoteOrder = {
  id: string
  order_code: string
  customer_id: string | null
  status: "QUOTE_REQUESTED" | "CONTACTED" | "QUOTED" | "COMPLETED" | "CANCELLED" | string
  payment_status: "PENDING" | "PAID" | "FAILED" | string
  payment_method: string | null
  subtotal: number
  shipping: number
  tax: number
  total: number
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  shipping_address: string | null
  created_at: string
  order_items?: OrderItem[]
}

const STATUSES = [
  "QUOTE_REQUESTED",
  "CONTACTED",
  "QUOTED",
  "COMPLETED",
  "CANCELLED",
] as const

const statusTone: Record<string, string> = {
  QUOTE_REQUESTED: "bg-amber-50 text-amber-800 ring-amber-200 border-amber-300",
  CONTACTED: "bg-blue-50 text-blue-800 ring-blue-200 border-blue-300",
  QUOTED: "bg-indigo-50 text-indigo-800 ring-indigo-200 border-indigo-300",
  COMPLETED: "bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-300",
  CANCELLED: "bg-slate-100 text-slate-700 ring-slate-200 border-slate-300",
}

const statusLabels: Record<string, string> = {
  QUOTE_REQUESTED: "Quote Requested",
  CONTACTED: "Contacted",
  QUOTED: "Quoted",
  COMPLETED: "Completed / Order Placed",
  CANCELLED: "Cancelled",
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedQuote, setSelectedQuote] = useState<QuoteOrder | null>(null)

  // Edit states inside modal
  const [editStatus, setEditStatus] = useState<string>("QUOTE_REQUESTED")
  const [editSubtotal, setEditSubtotal] = useState<string>("0")
  const [editShipping, setEditShipping] = useState<string>("0")
  const [editTax, setEditTax] = useState<string>("0")
  const [editTotal, setEditTotal] = useState<string>("0")
  const [itemPrices, setItemPrices] = useState<Record<string, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const loadQuotes = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })

      if (error) {
        toast.error(`Unable to load quote requests: ${error.message}`)
      } else {
        setQuotes((data || []) as QuoteOrder[])
      }
    } catch (err: any) {
      toast.error(`Failed loading quotes: ${err?.message || err}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadQuotes()
  }, [])

  const openModal = (quote: QuoteOrder) => {
    setSelectedQuote(quote)
    setEditStatus(quote.status || "QUOTE_REQUESTED")
    setEditSubtotal(String(quote.subtotal || 0))
    setEditShipping(String(quote.shipping || 0))
    setEditTax(String(quote.tax || 0))
    setEditTotal(String(quote.total || 0))

    const prices: Record<string, string> = {}
    quote.order_items?.forEach((item) => {
      prices[item.id] = String(item.price || 0)
    })
    setItemPrices(prices)
  }

  const patchLocalQuote = (id: string, patch: Partial<QuoteOrder>) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q))
    )
    setSelectedQuote((curr) => (curr && curr.id === id ? { ...curr, ...patch } : curr))
  }

  const changeStatusQuick = async (quote: QuoteOrder, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", quote.id)

      if (error) throw error
      patchLocalQuote(quote.id, { status: newStatus })
      toast.success(`Status updated to ${statusLabels[newStatus] || newStatus}`)
    } catch (err: any) {
      toast.error(`Could not update status: ${err?.message || err}`)
    }
  }

  const saveQuoteChanges = async () => {
    if (!selectedQuote) return
    setIsSaving(true)
    try {
      const subtotalNum = parseFloat(editSubtotal) || 0
      const shippingNum = parseFloat(editShipping) || 0
      const taxNum = parseFloat(editTax) || 0
      const totalNum = parseFloat(editTotal) || (subtotalNum + shippingNum + taxNum)

      // 1. Update orders table
      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: editStatus,
          subtotal: subtotalNum,
          shipping: shippingNum,
          tax: taxNum,
          total: totalNum,
        })
        .eq("id", selectedQuote.id)

      if (orderError) throw orderError

      // 2. Update item prices if modified
      if (selectedQuote.order_items && selectedQuote.order_items.length > 0) {
        for (const item of selectedQuote.order_items) {
          const newPrice = parseFloat(itemPrices[item.id]) || 0
          if (newPrice !== item.price) {
            await supabase
              .from("order_items")
              .update({ price: newPrice })
              .eq("id", item.id)
          }
        }
      }

      patchLocalQuote(selectedQuote.id, {
        status: editStatus,
        subtotal: subtotalNum,
        shipping: shippingNum,
        tax: taxNum,
        total: totalNum,
      })

      toast.success("Quote details updated successfully!")
      loadQuotes()
    } catch (err: any) {
      toast.error(`Failed to save: ${err?.message || err}`)
    } finally {
      setIsSaving(false)
    }
  }

  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return quotes.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (!q) return true

      const matchCode = item.order_code?.toLowerCase().includes(q)
      const matchName = item.customer_name?.toLowerCase().includes(q)
      const matchEmail = item.customer_email?.toLowerCase().includes(q)
      const matchPhone = item.customer_phone?.includes(q)
      const matchItems = item.order_items?.some((i) =>
        i.name?.toLowerCase().includes(q)
      )

      return matchCode || matchName || matchEmail || matchPhone || matchItems
    })
  }, [quotes, statusFilter, searchQuery])

  // Summary KPI statistics
  const stats = useMemo(() => {
    return [
      {
        label: "Total Quote Requests",
        value: quotes.length,
        icon: ShoppingBag,
        color: "bg-slate-900 text-white",
      },
      {
        label: "Awaiting Quote",
        value: quotes.filter((q) => q.status === "QUOTE_REQUESTED").length,
        icon: Clock,
        color: "bg-amber-50 text-amber-700",
      },
      {
        label: "Contacted",
        value: quotes.filter((q) => q.status === "CONTACTED").length,
        icon: Phone,
        color: "bg-blue-50 text-blue-700",
      },
      {
        label: "Quoted",
        value: quotes.filter((q) => q.status === "QUOTED").length,
        icon: IndianRupee,
        color: "bg-indigo-50 text-indigo-700",
      },
      {
        label: "Completed",
        value: quotes.filter((q) => q.status === "COMPLETED").length,
        icon: CheckCircle2,
        color: "bg-emerald-50 text-emerald-700",
      },
    ]
  }, [quotes])

  const getWhatsAppLink = (quote: QuoteOrder) => {
    const cleanPhone = (quote.customer_phone || "").replace(/\D/g, "")
    const fullPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : cleanPhone.length === 10
      ? `91${cleanPhone}`
      : cleanPhone

    const message = `Hello ${quote.customer_name || "Customer"}, regarding your Pick O Pick product quote request (${quote.order_code}). We have reviewed your items and have an update for you.`
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Product Quote Requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time table of customer cart quote requests, product lists, quantities, and contact details.
          </p>
        </div>
        <button
          onClick={loadQuotes}
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <Icon size={18} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({quotes.length})
          </button>
          {STATUSES.map((st) => {
            const count = quotes.filter((q) => q.status === st).length
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {statusLabels[st] || st} ({count})
              </button>
            )
          })}
        </div>

        <div className="relative min-w-[280px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search code, customer, product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      {/* Main Quote Requests Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3.5">Quote Ref Code</th>
              <th className="p-3.5">Customer Details</th>
              <th className="p-3.5">Products Picked</th>
              <th className="p-3.5">Total Units</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Quoted Total</th>
              <th className="p-3.5">Date Requested</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw size={18} className="animate-spin text-indigo-600" />
                    <span>Loading quote requests...</span>
                  </div>
                </td>
              </tr>
            ) : filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-500">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-700">No quote requests found</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {searchQuery
                      ? "Try clearing your search query"
                      : "When users request quotes from the cart, they will appear here."}
                  </p>
                </td>
              </tr>
            ) : (
              filteredQuotes.map((quote) => {
                const totalUnits =
                  quote.order_items?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0

                return (
                  <tr key={quote.id} className="transition hover:bg-slate-50/70">
                    {/* Code */}
                    <td className="p-3.5 align-top">
                      <span className="font-mono text-xs font-bold text-[#0B56D9]">
                        {quote.order_code}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Method: {quote.payment_method || "QUOTE"}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5 align-top">
                      <p className="font-semibold text-slate-900">
                        {quote.customer_name || "Guest Customer"}
                      </p>
                      {quote.customer_phone && (
                        <p className="mt-0.5 text-xs text-slate-600">
                          {quote.customer_phone}
                        </p>
                      )}
                      {quote.customer_email && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {quote.customer_email}
                        </p>
                      )}
                    </td>

                    {/* Products Preview */}
                    <td className="p-3.5 align-top">
                      <div className="flex flex-col gap-1.5 max-w-[280px]">
                        {(quote.order_items || []).slice(0, 3).map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-8 w-8 rounded-md object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-400 shrink-0">
                                <Package size={14} />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-medium text-slate-800" title={item.name}>
                                {item.name}
                              </p>
                            </div>
                            <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                              ×{item.quantity}
                            </span>
                          </div>
                        ))}
                        {(quote.order_items || []).length > 3 && (
                          <p className="text-[11px] font-semibold text-indigo-600">
                            +{(quote.order_items || []).length - 3} more product(s)
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Total Units */}
                    <td className="p-3.5 align-top">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                      </span>
                    </td>

                    {/* Status with inline selector */}
                    <td className="p-3.5 align-top">
                      <select
                        value={quote.status}
                        onChange={(e) => changeStatusQuick(quote, e.target.value)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-bold outline-none ring-1 transition cursor-pointer ${
                          statusTone[quote.status] || "bg-slate-100 text-slate-800 ring-slate-200 border-slate-300"
                        }`}
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {statusLabels[st] || st}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Quoted Total */}
                    <td className="p-3.5 align-top">
                      {quote.total > 0 ? (
                        <p className="font-semibold text-slate-900">
                          ₹{quote.total.toLocaleString("en-IN")}
                        </p>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                          Pending quote
                        </span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="p-3.5 align-top text-xs text-slate-500">
                      {new Date(quote.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(quote.created_at).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {quote.customer_phone && (
                          <a
                            href={getWhatsAppLink(quote)}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat with customer on WhatsApp"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                          >
                            <MessageCircle size={15} />
                          </a>
                        )}
                        <button
                          onClick={() => openModal(quote)}
                          className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Eye size={14} />
                          View
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

      {/* Quote Details & Edit Drawer Modal */}
      {selectedQuote && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          onClick={() => setSelectedQuote(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs font-bold text-[#0B56D9]">
                  {selectedQuote.order_code}
                </span>
                <h2 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedQuote.customer_name || "Customer Quote Request"}
                </h2>
                <p className="text-xs text-slate-400">
                  Requested on {new Date(selectedQuote.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuote(null)}
                className="cursor-pointer rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="mt-5 space-y-6">
              {/* Customer Contact Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Customer Information
                  </h3>
                  <div className="flex gap-2">
                    {selectedQuote.customer_phone && (
                      <a
                        href={getWhatsAppLink(selectedQuote)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white transition hover:bg-emerald-700"
                      >
                        <MessageCircle size={14} />
                        WhatsApp Customer
                      </a>
                    )}
                    {selectedQuote.customer_email && (
                      <a
                        href={`mailto:${selectedQuote.customer_email}?subject=Regarding Pick O Pick Quote Request ${selectedQuote.order_code}`}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-300"
                      >
                        <Mail size={14} />
                        Email
                      </a>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400">Full Name</span>
                    <p className="font-semibold text-slate-800">{selectedQuote.customer_name || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400">Phone Number</span>
                    <p className="font-semibold text-slate-800">{selectedQuote.customer_phone || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400">Email Address</span>
                    <p className="font-semibold text-slate-800">{selectedQuote.customer_email || "—"}</p>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400">Customer ID</span>
                    <p className="font-mono text-xs font-medium text-slate-600">
                      {selectedQuote.customer_id || "—"}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[11px] font-medium text-slate-400">Shipping Address</span>
                    <p className="font-medium text-slate-800">{selectedQuote.shipping_address || "Not specified"}</p>
                  </div>
                </div>
              </div>

              {/* Products Table */}
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Products Selected by Customer ({(selectedQuote.order_items || []).length})
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="p-3">Product</th>
                        <th className="p-3 text-center">Quantity</th>
                        <th className="p-3 text-right">Item Price (₹)</th>
                        <th className="p-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(selectedQuote.order_items || []).map((item) => {
                        const unitPrice = parseFloat(itemPrices[item.id] || "0") || 0
                        const lineTotal = unitPrice * (item.quantity || 1)

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="h-12 w-12 rounded-lg object-cover border border-slate-200 shrink-0"
                                  />
                                ) : (
                                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400 shrink-0">
                                    <Package size={20} />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-slate-900">{item.name}</p>
                                  {item.product_id && (
                                    <p className="font-mono text-[10px] text-slate-400">
                                      ID: {item.product_id}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-center font-bold text-slate-800">
                              {item.quantity}
                            </td>
                            <td className="p-3 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={itemPrices[item.id] ?? "0"}
                                onChange={(e) => {
                                  const val = e.target.value
                                  setItemPrices((prev) => ({ ...prev, [item.id]: val }))
                                  // Auto-calculate subtotal
                                  const newPrices = { ...itemPrices, [item.id]: val }
                                  let newSub = 0
                                  selectedQuote.order_items?.forEach((it) => {
                                    const p = parseFloat(newPrices[it.id] || "0") || 0
                                    newSub += p * (it.quantity || 1)
                                  })
                                  setEditSubtotal(String(newSub))
                                  const ship = parseFloat(editShipping) || 0
                                  const tax = parseFloat(editTax) || 0
                                  setEditTotal(String(newSub + ship + tax))
                                }}
                                className="w-24 rounded-md border border-slate-300 px-2 py-1 text-right text-sm font-semibold outline-none focus:border-indigo-600"
                              />
                            </td>
                            <td className="p-3 text-right font-bold text-slate-900">
                              ₹{lineTotal.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown & Status Form */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-600">
                  Quote Pricing & Status Administration
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Lead / Quote Status
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
                    >
                      {STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {statusLabels[st] || st}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Products Subtotal (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editSubtotal}
                      onChange={(e) => {
                        setEditSubtotal(e.target.value)
                        const sub = parseFloat(e.target.value) || 0
                        const ship = parseFloat(editShipping) || 0
                        const tax = parseFloat(editTax) || 0
                        setEditTotal(String(sub + ship + tax))
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      International Shipping (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editShipping}
                      onChange={(e) => {
                        setEditShipping(e.target.value)
                        const sub = parseFloat(editSubtotal) || 0
                        const ship = parseFloat(e.target.value) || 0
                        const tax = parseFloat(editTax) || 0
                        setEditTotal(String(sub + ship + tax))
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Packaging / Tax (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editTax}
                      onChange={(e) => {
                        setEditTax(e.target.value)
                        const sub = parseFloat(editSubtotal) || 0
                        const ship = parseFloat(editShipping) || 0
                        const tax = parseFloat(e.target.value) || 0
                        setEditTotal(String(sub + ship + tax))
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Total Quoted Amount (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editTotal}
                      onChange={(e) => setEditTotal(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-base font-extrabold text-[#0B56D9] outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row border-t border-slate-100 pt-4">
              <button
                onClick={() => setSelectedQuote(null)}
                className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={saveQuoteChanges}
                disabled={isSaving}
                className="cursor-pointer rounded-lg bg-[#0B56D9] px-5 py-2.5 text-xs font-extrabold text-white transition hover:bg-[#0849B7] disabled:opacity-60"
              >
                {isSaving ? "Saving changes..." : "Save Quote & Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
