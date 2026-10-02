"use client";

import { useEffect, useMemo, useState } from "react";
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
  UserPlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getSession } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { canDeleteLeads } from "@/config/rolePermissions";
import LeadActionsDrawer, { Remark } from "@/components/crm/LeadActionsDrawer";
import DeleteLeadButton from "@/components/crm/DeleteLeadButton";
import {
  useAssignableUsers,
  userOptions,
} from "@/components/crm/useAssignableUsers";
import Dropdown from "@/components/ui/dropdown";
import {
  assignLeadOwner,
  buildGmailLink,
  buildWhatsAppLink,
  resolveAssignedTo,
} from "@/components/crm/crmHelpers";
import Drawer from "@/components/ui/drawer";
import WhatsAppIcon from "@/components/common/WhatsAppIcon";

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  created_at?: string;
};

export type QuoteOrder = {
  id: string;
  order_code: string;
  customer_id: string | null;
  status:
    | "QUOTE_REQUESTED"
    | "CONTACTED"
    | "QUOTED"
    | "COMPLETED"
    | "CANCELLED"
    | string;
  payment_status: "PENDING" | "PAID" | "FAILED" | string;
  payment_method: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  shipping_address: string | null;
  created_at: string;
  assigned_to?: string | null;
  remarks?: Remark[] | null;
  order_items?: OrderItem[];
};

const STATUSES = [
  "QUOTE_REQUESTED",
  "CONTACTED",
  "FOLLOW_UP",
  "QUOTED",
  "COMPLETED",
  "CANCELLED",
] as const;

const statusTone: Record<string, string> = {
  QUOTE_REQUESTED: "bg-amber-50 text-amber-800 ring-amber-200 border-amber-300",
  CONTACTED: "bg-blue-50 text-blue-800 ring-blue-200 border-blue-300",
  FOLLOW_UP: "bg-blue-50 text-blue-800 ring-blue-200 border-blue-300",
  QUOTED: "bg-blue-50 text-blue-800 ring-blue-200 border-blue-300",
  COMPLETED:
    "bg-emerald-50 text-emerald-800 ring-emerald-200 border-emerald-300",
  CANCELLED: "bg-slate-100 text-slate-700 ring-slate-200 border-slate-300",
};

const statusLabels: Record<string, string> = {
  QUOTE_REQUESTED: "Quote Requested",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  QUOTED: "Quoted",
  COMPLETED: "Completed / Order Placed",
  CANCELLED: "Cancelled",
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<QuoteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuote, setSelectedQuote] = useState<QuoteOrder | null>(null);
  const [actionQuote, setActionQuote] = useState<QuoteOrder | null>(null);
  const [assigning, setAssigning] = useState(false);
  const { users } = useAssignableUsers();
  const { role, session } = useAuth();
  const canDelete = canDeleteLeads(role, session?.permissions);

  // Edit states inside modal
  const [editStatus, setEditStatus] = useState<string>("QUOTE_REQUESTED");
  const [editSubtotal, setEditSubtotal] = useState<string>("0");
  const [editShipping, setEditShipping] = useState<string>("0");
  const [editTax, setEditTax] = useState<string>("0");
  const [editTotal, setEditTotal] = useState<string>("0");
  const [itemPrices, setItemPrices] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  const loadQuotes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(`Unable to load quote requests: ${error.message}`);
      } else {
        setQuotes(
          (data || []).map((row: any) => ({
            ...row,
            assigned_to: resolveAssignedTo(row),
          })),
        );
      }
    } catch (err: any) {
      toast.error(`Failed loading quotes: ${err?.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuotes();
  }, []);

  const openModal = (quote: QuoteOrder) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status || "QUOTE_REQUESTED");
    setEditSubtotal(String(quote.subtotal || 0));
    setEditShipping(String(quote.shipping || 0));
    setEditTax(String(quote.tax || 0));
    setEditTotal(String(quote.total || 0));

    const prices: Record<string, string> = {};
    quote.order_items?.forEach((item) => {
      prices[item.id] = String(item.price || 0);
    });
    setItemPrices(prices);
  };

  const patchLocalQuote = (id: string, patch: Partial<QuoteOrder>) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...patch } : q)),
    );
    setSelectedQuote((curr) =>
      curr && curr.id === id ? { ...curr, ...patch } : curr,
    );
    setActionQuote((curr) =>
      curr && curr.id === id ? { ...curr, ...patch } : curr,
    );
  };

  const changeStatusQuick = async (quote: QuoteOrder, newStatus: string) => {
    if (quote.status === newStatus) return;
    const prevStatus = quote.status;

    // 1. INSTANT optimistic update
    patchLocalQuote(quote.id, { status: newStatus });

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", quote.id);

      if (error) throw error;
      toast.success(
        `Status updated to ${statusLabels[newStatus] || newStatus}`,
      );
    } catch (err: any) {
      patchLocalQuote(quote.id, { status: prevStatus });
      toast.error(`Could not update status: ${err?.message || err}`);
    }
  };

  // --- CRM: ownership + remarks ---

  const assignQuote = async (quote: QuoteOrder, userId: string | null) => {
    const prevOwner = quote.assigned_to;

    // 1. INSTANT optimistic update
    patchLocalQuote(quote.id, { assigned_to: userId });

    setAssigning(true);
    const targetUser = users.find(
      (uq) => String(uq.adminLoginID) === String(userId),
    );
    const res = await assignLeadOwner({
      table: "orders",
      id: quote.id,
      userId,
      userName: targetUser?.username,
      currentRemarks: quote.remarks ?? [],
    });
    setAssigning(false);

    if (!res.success) {
      patchLocalQuote(quote.id, { assigned_to: prevOwner });
      return toast.error(
        `Could not assign owner: ${res.error?.message || "Database error"}`,
      );
    }

    if (res.remarks) {
      patchLocalQuote(quote.id, { remarks: res.remarks });
    }
    toast.success(
      userId
        ? `Assigned to ${targetUser?.username || "user"}`
        : "Owner cleared",
    );
  };

  const addQuoteRemark = async (quote: QuoteOrder, text: string) => {
    const session = getSession();
    const remark: Remark = {
      id: crypto.randomUUID(),
      text,
      author: session?.username ?? "admin",
      createdAt: new Date().toISOString(),
    };
    const next = [...(quote.remarks ?? []), remark];
    const { error } = await supabase
      .from("orders")
      .update({ remarks: next })
      .eq("id", quote.id);

    if (error) return toast.error(`Could not add remark: ${error.message}`);
    patchLocalQuote(quote.id, { remarks: next });
    toast.success("Remark added");
  };

  const deleteQuoteRemark = async (quote: QuoteOrder, remarkId: string) => {
    const next = (quote.remarks ?? []).filter((r) => r.id !== remarkId);
    const { error } = await supabase
      .from("orders")
      .update({ remarks: next })
      .eq("id", quote.id);

    if (error) return toast.error(`Could not delete remark: ${error.message}`);
    patchLocalQuote(quote.id, { remarks: next });
    toast.success("Remark deleted");
  };

  // Permanently remove a quote request and its items (permission-gated).
  const deleteQuote = async (quote: QuoteOrder) => {
    try {
      await supabase.from("order_items").delete().eq("order_id", quote.id);
      const { data, error } = await supabase
        .from("orders")
        .delete()
        .eq("id", quote.id)
        .select("id");

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error(
          "The database blocked the delete (row-level security has no delete policy for quote requests). Nothing was deleted.",
        );
        return;
      }

      setQuotes((prev) => prev.filter((q) => q.id !== quote.id));
      setSelectedQuote(null);
      setActionQuote((curr) => (curr?.id === quote.id ? null : curr));
      toast.success(`Deleted ${quote.order_code}`);
    } catch (err: any) {
      toast.error(`Could not delete: ${err?.message || err}`);
    }
  };

  const saveQuoteChanges = async () => {
    if (!selectedQuote) return;
    setIsSaving(true);
    try {
      const subtotalNum = parseFloat(editSubtotal) || 0;
      const shippingNum = parseFloat(editShipping) || 0;
      const taxNum = parseFloat(editTax) || 0;
      const totalNum =
        parseFloat(editTotal) || subtotalNum + shippingNum + taxNum;

      const { error: orderError } = await supabase
        .from("orders")
        .update({
          status: editStatus,
          subtotal: subtotalNum,
          shipping: shippingNum,
          tax: taxNum,
          total: totalNum,
        })
        .eq("id", selectedQuote.id);

      if (orderError) throw orderError;

      if (selectedQuote.order_items && selectedQuote.order_items.length > 0) {
        for (const item of selectedQuote.order_items) {
          const newPrice = parseFloat(itemPrices[item.id]) || 0;
          if (newPrice !== item.price) {
            await supabase
              .from("order_items")
              .update({ price: newPrice })
              .eq("id", item.id);
          }
        }
      }

      patchLocalQuote(selectedQuote.id, {
        status: editStatus,
        subtotal: subtotalNum,
        shipping: shippingNum,
        tax: taxNum,
        total: totalNum,
      });

      toast.success("Quote details updated successfully!");
      loadQuotes();
    } catch (err: any) {
      toast.error(`Failed to save: ${err?.message || err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      const matchesStatus =
        statusFilter === "all" ? true : q.status === statusFilter;

      if (!matchesStatus) return false;

      if (!searchQuery.trim()) return true;
      const qLower = searchQuery.toLowerCase();

      const matchCode = q.order_code?.toLowerCase().includes(qLower);
      const matchName = q.customer_name?.toLowerCase().includes(qLower);
      const matchPhone = q.customer_phone?.toLowerCase().includes(qLower);
      const matchEmail = q.customer_email?.toLowerCase().includes(qLower);
      const matchProduct = q.order_items?.some((item) =>
        item.name.toLowerCase().includes(qLower),
      );

      return matchCode || matchName || matchPhone || matchEmail || matchProduct;
    });
  }, [quotes, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return [
      {
        label: "Total Requests",
        value: quotes.length,
        icon: ShoppingBag,
        color: "bg-blue-600 text-white",
      },
      {
        label: "Quote Requested",
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
        color: "bg-blue-50 text-blue-700",
      },
      {
        label: "Completed",
        value: quotes.filter((q) => q.status === "COMPLETED").length,
        icon: CheckCircle2,
        color: "bg-emerald-50 text-emerald-700",
      },
    ];
  }, [quotes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Product Quote Requests
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time table of customer cart quote requests, product lists,
            quantities, and contact details.
          </p>
        </div>
        <button
          onClick={loadQuotes}
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}
              >
                <Icon size={18} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatusFilter("all")}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              statusFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({quotes.length})
          </button>
          {STATUSES.map((st) => {
            const count = quotes.filter((q) => q.status === st).length;
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {statusLabels[st] || st} ({count})
              </button>
            );
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
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      {/* Main Quote Requests Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="p-3.5">Quote Ref Code</th>
              <th className="p-3.5">Customer Details</th>
              <th className="p-3.5">Products</th>
              <th className="p-3.5">Total Units</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Owner</th>
              <th className="p-3.5">Quoted Total</th>
              <th className="p-3.5">Date Requested</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw
                      size={18}
                      className="animate-spin text-blue-600"
                    />
                    <span>Loading quote requests...</span>
                  </div>
                </td>
              </tr>
            ) : filteredQuotes.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-10 text-center text-slate-500">
                  <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                  <p className="font-semibold text-slate-700">
                    No quote requests found
                  </p>
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
                  quote.order_items?.reduce(
                    (sum, item) => sum + (item.quantity || 1),
                    0,
                  ) || 0;

                const waLink = buildWhatsAppLink(
                  quote.customer_phone,
                  `Hello ${quote.customer_name || "Customer"}, regarding your Pick O Pick product quote request (${quote.order_code}). We have reviewed your items and have an update for you.`,
                );
                const gmailLink = buildGmailLink(
                  quote.customer_email,
                  `Regarding Pick O Pick Quote Request ${quote.order_code}`,
                  `Hello ${quote.customer_name || "Customer"},\n\nRegarding your cart quote request (${quote.order_code}).\n\nItems in your request:\n${(quote.order_items || []).map((i) => `- ${i.name} (Qty: ${i.quantity})`).join("\n")}\n\nPlease let us know if you need any assistance.\n\nBest regards,\nPick O Pick Team`,
                );

                return (
                  <tr
                    key={quote.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    {/* Code */}
                    <td className="p-3.5 align-middle">
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#0B56D9]">
                        {quote.order_code}
                      </span>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Method: {quote.payment_method || "QUOTE"}
                      </p>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5 align-middle">
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

                    {/* Products Count */}
                    <td className="p-3.5 align-middle">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                        <Package size={12} />
                        {(quote.order_items || []).length}{" "}
                        {(quote.order_items || []).length === 1 ? "product" : "products"}
                      </span>
                    </td>

                    {/* Total Units */}
                    <td className="p-3.5 align-middle">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {totalUnits} {totalUnits === 1 ? "unit" : "units"}
                      </span>
                    </td>

                    {/* Status with inline selector */}
                    <td className="p-3.5 align-middle min-w-[170px]">
                      <Dropdown
                        size="sm"
                        value={quote.status}
                        onChange={(v) => changeStatusQuick(quote, v)}
                        options={STATUSES.map((st) => ({
                          value: st,
                          label: statusLabels[st] || st,
                        }))}
                      />
                    </td>

                    {/* Owner */}
                    <td className="p-3.5 align-middle min-w-[150px]">
                      <div className="flex items-center gap-1.5">
                        <Dropdown
                          size="sm"
                          value={quote.assigned_to ?? ""}
                          onChange={(v) => assignQuote(quote, v || null)}
                          options={userOptions(users)}
                          placeholder="Unassigned"
                          disabled={assigning}
                        />
                      </div>
                      {(quote.remarks?.length ?? 0) > 0 && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {quote.remarks?.length} remark
                          {(quote.remarks?.length ?? 0) === 1 ? "" : "s"}
                        </p>
                      )}
                    </td>

                    {/* Quoted Total */}
                    <td className="p-3.5 align-middle">
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
                    <td className="p-3.5 align-middle text-xs text-slate-500">
                      {new Date(quote.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {new Date(quote.created_at).toLocaleTimeString(
                          "en-IN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat with customer on WhatsApp"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-emerald-200 bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100"
                          >
                            <WhatsAppIcon size={14} />
                          </a>
                        )}
                        {gmailLink && (
                          <a
                            href={gmailLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Compose in Gmail (pre-filled)"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                          >
                            <Mail size={14} />
                          </a>
                        )}
                        <button
                          onClick={() => openModal(quote)}
                          className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Eye size={13} />
                          View
                        </button>
                        <button
                          onClick={() => setActionQuote(quote)}
                          title="Assign owner & manage remarks"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
                        >
                          <UserPlus size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quote Details & Edit Drawer */}
      {selectedQuote && (
        <Drawer
          open
          onClose={() => setSelectedQuote(null)}
          title={selectedQuote.customer_name || "Guest Customer"}
          subtitle={`Requested on ${new Date(selectedQuote.created_at).toLocaleString("en-IN")}`}
          wide
          actions={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#0B56D9]">
                {selectedQuote.order_code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
                  statusTone[selectedQuote.status] ||
                  "bg-slate-100 text-slate-800"
                }`}
              >
                {statusLabels[selectedQuote.status] || selectedQuote.status}
              </span>
              {canDelete && (
                <DeleteLeadButton
                  onDelete={() => deleteQuote(selectedQuote)}
                />
              )}
            </div>
          }
        >
          <div className="space-y-5">
            {/* Customer & Shipping Info */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Customer Information
                </h3>
                <div className="mt-2 space-y-1.5 text-sm">
                  <p>
                    <span className="font-medium text-slate-500">Name:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedQuote.customer_name || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Phone:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedQuote.customer_phone || "—"}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium text-slate-500">Email:</span>{" "}
                    <span className="font-semibold text-slate-800">
                      {selectedQuote.customer_email || "—"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Shipping Destination
                </h3>
                <p className="mt-2 text-sm text-slate-800 whitespace-pre-wrap">
                  {selectedQuote.shipping_address ||
                    "No shipping address provided."}
                </p>
              </div>
            </div>

            {/* Requested Products List */}
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Products In This Quote Request
              </h3>
              <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Quoted Unit Price (₹)</th>
                      <th className="p-3 text-right">Line Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(selectedQuote.order_items || []).map((item) => {
                      const currentPrice =
                        parseFloat(itemPrices[item.id] || "0") || 0;
                      const lineTotal = currentPrice * (item.quantity || 1);

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-md object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                                  <Package size={16} />
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {item.name}
                                </p>
                                <p className="text-xs text-slate-400">
                                  ID: {item.product_id || "N/A"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-center font-semibold text-slate-800">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={itemPrices[item.id] ?? ""}
                              onChange={(e) => {
                                const newPrice = e.target.value;
                                setItemPrices((prev) => ({
                                  ...prev,
                                  [item.id]: newPrice,
                                }));
                                const newSubtotal = (
                                  selectedQuote.order_items || []
                                ).reduce((sum, it) => {
                                  const p =
                                    it.id === item.id
                                      ? parseFloat(newPrice) || 0
                                      : parseFloat(itemPrices[it.id] || "0") ||
                                        0;
                                  return sum + p * (it.quantity || 1);
                                }, 0);
                                setEditSubtotal(String(newSubtotal));
                                const s = parseFloat(editShipping) || 0;
                                const t = parseFloat(editTax) || 0;
                                setEditTotal(String(newSubtotal + s + t));
                              }}
                              className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-right text-sm font-semibold outline-none focus:border-blue-600"
                              placeholder="0"
                            />
                          </td>
                          <td className="p-3 text-right font-mono font-semibold text-slate-900">
                            ₹{lineTotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Price Breakdown & Status Updating Section */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Update Pricing & Quote Status
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Subtotal (₹)
                  </label>
                  <input
                    type="number"
                    value={editSubtotal}
                    onChange={(e) => {
                      setEditSubtotal(e.target.value);
                      const sub = parseFloat(e.target.value) || 0;
                      const s = parseFloat(editShipping) || 0;
                      const t = parseFloat(editTax) || 0;
                      setEditTotal(String(sub + s + t));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Shipping (₹)
                  </label>
                  <input
                    type="number"
                    value={editShipping}
                    onChange={(e) => {
                      setEditShipping(e.target.value);
                      const sub = parseFloat(editSubtotal) || 0;
                      const s = parseFloat(e.target.value) || 0;
                      const t = parseFloat(editTax) || 0;
                      setEditTotal(String(sub + s + t));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Tax / GST (₹)
                  </label>
                  <input
                    type="number"
                    value={editTax}
                    onChange={(e) => {
                      setEditTax(e.target.value);
                      const sub = parseFloat(editSubtotal) || 0;
                      const s = parseFloat(editShipping) || 0;
                      const t = parseFloat(e.target.value) || 0;
                      setEditTotal(String(sub + s + t));
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    Total Quoted (₹)
                  </label>
                  <input
                    type="number"
                    value={editTotal}
                    onChange={(e) => setEditTotal(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-blue-300 bg-blue-50/40 p-2 text-sm font-bold text-blue-900 outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-slate-600">
                    Quote Status:
                  </label>
                  <div className="min-w-[160px]">
                    <Dropdown
                      size="sm"
                      value={editStatus}
                      onChange={(v) => setEditStatus(v)}
                      options={STATUSES.map((st) => ({
                        value: st,
                        label: statusLabels[st] || st,
                      }))}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveQuoteChanges}
                  disabled={isSaving}
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-blue-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSaving ? "Saving..." : "Save Quote & Prices"}
                </button>
              </div>
            </div>
          </div>
        </Drawer>
      )}

      {/* CRM Actions Drawer (Owner & Remarks) */}
      <LeadActionsDrawer
        open={!!actionQuote}
        onClose={() => setActionQuote(null)}
        code={actionQuote?.order_code}
        title={actionQuote?.customer_name ?? "Cart Quote Request"}
        subtitle={
          actionQuote
            ? `Requested ${new Date(actionQuote.created_at).toLocaleString("en-IN")}`
            : undefined
        }
        customerName={actionQuote?.customer_name}
        phone={actionQuote?.customer_phone}
        email={actionQuote?.customer_email}
        statuses={STATUSES.map((s) => ({
          value: s,
          label: statusLabels[s] || s,
        }))}
        status={actionQuote?.status ?? "QUOTE_REQUESTED"}
        onStatusChange={(status) =>
          actionQuote && changeStatusQuick(actionQuote, status)
        }
        users={users}
        assignedTo={actionQuote?.assigned_to ?? null}
        onAssign={(userId) => actionQuote && assignQuote(actionQuote, userId)}
        assigning={assigning}
        remarks={actionQuote?.remarks ?? []}
        onAddRemark={(text) => actionQuote && addQuoteRemark(actionQuote, text)}
        onDeleteRemark={(remarkId) =>
          actionQuote && deleteQuoteRemark(actionQuote, remarkId)
        }
      >
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Package size={14} /> Cart items overview
          </h3>
          <div className="mt-3 space-y-2">
            {(actionQuote?.order_items || []).map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="font-medium text-slate-800">{it.name}</span>
                <span className="text-slate-500">
                  Qty: {it.quantity} · ₹
                  {(it.price * (it.quantity || 1)).toLocaleString("en-IN")}
                </span>
              </div>
            ))}
          </div>
        </section>
      </LeadActionsDrawer>
    </div>
  );
}
