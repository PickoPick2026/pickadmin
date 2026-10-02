"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Calculator,
  CheckCircle2,
  Eye,
  IndianRupee,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  RefreshCw,
  Search,
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
  userNameById,
} from "@/components/crm/useAssignableUsers";
import {
  assignLeadOwner,
  buildGmailLink,
  buildWhatsAppLink,
  resolveAssignedTo,
} from "@/components/crm/crmHelpers";
import Drawer from "@/components/ui/drawer";
import WhatsAppIcon from "@/components/common/WhatsAppIcon";

type EstimateLead = {
  id: string;
  request_code: string;
  status: "NEW" | "CONTACTED" | "QUOTED" | "CONVERTED" | "CLOSED";
  customer_name: string;
  whatsapp_number: string;
  email: string | null;
  destination_country: string;
  package_type: string | null;
  approx_weight_kg: number | null;
  dimensions: string | null;
  requirement_description: string | null;
  payload: Record<string, unknown>;
  quoted_amount: number | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_to?: string | null;
  remarks?: Remark[] | null;
};

const STATUSES: EstimateLead["status"][] = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "CONVERTED",
  "CLOSED",
];

const statusTone: Record<EstimateLead["status"], string> = {
  NEW: "bg-rose-50 text-rose-700 ring-rose-200",
  CONTACTED: "bg-amber-50 text-amber-700 ring-amber-200",
  QUOTED: "bg-blue-50 text-blue-700 ring-blue-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-600 ring-slate-200",
};

const text = (value: unknown, fallback = "—") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);

function Field({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 break-words font-medium text-slate-800">
        {text(value)}
      </p>
    </div>
  );
}

export default function EstimateLeadsPage() {
  const [leads, setLeads] = useState<EstimateLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | EstimateLead["status"]
  >("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EstimateLead | null>(null);
  const [actionLead, setActionLead] = useState<EstimateLead | null>(null);
  const [assigning, setAssigning] = useState(false);
  const { users } = useAssignableUsers();
  const { role, session } = useAuth();
  const canDelete = canDeleteLeads(role, session?.permissions);
  const [draftNotes, setDraftNotes] = useState("");
  const [draftQuote, setDraftQuote] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);

  const loadLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("estimate_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(`Unable to load estimate leads: ${error.message}`);
    else {
      setLeads(
        (data || []).map((row: any) => ({
          ...row,
          assigned_to: resolveAssignedTo(row),
        })),
      );
    }
    setLoading(false);
  };
  useEffect(() => {
    loadLeads();
  }, []);

  const openLead = (lead: EstimateLead) => {
    setSelected(lead);
    setDraftNotes(lead.admin_notes || "");
    setDraftQuote(lead.quoted_amount != null ? String(lead.quoted_amount) : "");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      if (!q) return true;
      return [
        lead.request_code,
        lead.customer_name,
        lead.whatsapp_number,
        lead.email,
        lead.destination_country,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    });
  }, [leads, statusFilter, query]);

  const stats = useMemo(
    () => [
      {
        label: "All leads",
        value: leads.length,
        icon: Calculator,
        tone: "bg-blue-600 text-white",
      },
      {
        label: "New / unactioned",
        value: leads.filter((l) => l.status === "NEW").length,
        icon: MapPin,
        tone: "bg-rose-50 text-rose-700",
      },
      {
        label: "Quoted",
        value: leads.filter((l) => l.status === "QUOTED").length,
        icon: IndianRupee,
        tone: "bg-blue-50 text-blue-700",
      },
      {
        label: "Converted",
        value: leads.filter((l) => l.status === "CONVERTED").length,
        icon: CheckCircle2,
        tone: "bg-emerald-50 text-emerald-700",
      },
    ],
    [leads],
  );

  const patchLead = (id: string, patch: Partial<EstimateLead>) => {
    setLeads((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setSelected((item) =>
      item && item.id === id ? { ...item, ...patch } : item,
    );
    setActionLead((item) =>
      item && item.id === id ? { ...item, ...patch } : item,
    );
  };

  const changeStatus = async (
    lead: EstimateLead,
    status: EstimateLead["status"],
  ) => {
    if (lead.status === status) return;
    const prevStatus = lead.status;

    // 1. INSTANT optimistic update
    patchLead(lead.id, { status });

    const { error } = await supabase
      .from("estimate_leads")
      .update({ status })
      .eq("id", lead.id);
    if (error) {
      patchLead(lead.id, { status: prevStatus });
      return toast.error(`Could not update status: ${error.message}`);
    }
    toast.success(`${lead.request_code} status updated to ${status}`);
  };

  // --- CRM: ownership + remarks ---

  const assignLead = async (lead: EstimateLead, userId: string | null) => {
    const prevOwner = lead.assigned_to;

    // 1. INSTANT optimistic update
    patchLead(lead.id, { assigned_to: userId });

    setAssigning(true);
    const targetUser = users.find(
      (uq) => String(uq.adminLoginID) === String(userId),
    );
    const res = await assignLeadOwner({
      table: "estimate_leads",
      id: lead.id,
      userId,
      userName: targetUser?.username,
      currentRemarks: lead.remarks ?? [],
    });
    setAssigning(false);

    if (!res.success) {
      patchLead(lead.id, { assigned_to: prevOwner });
      return toast.error(
        `Could not assign owner: ${res.error?.message || "Database error"}`,
      );
    }

    if (res.remarks) {
      patchLead(lead.id, { remarks: res.remarks });
    }
    toast.success(
      userId
        ? `Assigned to ${targetUser?.username || "user"}`
        : "Owner cleared",
    );
  };

  const addLeadRemark = async (lead: EstimateLead, text: string) => {
    const session = getSession();
    const remark: Remark = {
      id: crypto.randomUUID(),
      text,
      author: session?.username ?? "admin",
      createdAt: new Date().toISOString(),
    };
    const next = [...(lead.remarks ?? []), remark];
    const { error } = await supabase
      .from("estimate_leads")
      .update({ remarks: next })
      .eq("id", lead.id);
    if (error) return toast.error(`Could not add remark: ${error.message}`);
    patchLead(lead.id, { remarks: next });
    toast.success("Remark added");
  };

  const deleteLeadRemark = async (lead: EstimateLead, remarkId: string) => {
    const next = (lead.remarks ?? []).filter((r) => r.id !== remarkId);
    const { error } = await supabase
      .from("estimate_leads")
      .update({ remarks: next })
      .eq("id", lead.id);
    if (error) return toast.error(`Could not delete remark: ${error.message}`);
    patchLead(lead.id, { remarks: next });
    toast.success("Remark deleted");
  };

  const deleteLead = async (lead: EstimateLead) => {
    const { data, error } = await supabase
      .from("estimate_leads")
      .delete()
      .eq("id", lead.id)
      .select("id");

    if (error) return toast.error(`Could not delete: ${error.message}`);
    if (!data || data.length === 0) {
      return toast.error(
        "The database blocked the delete (row-level security has no delete policy for estimate leads). Nothing was deleted.",
      );
    }
    setLeads((items) => items.filter((item) => item.id !== lead.id));
    setSelected(null);
    setActionLead((curr) => (curr?.id === lead.id ? null : curr));
    toast.success(`Deleted ${lead.request_code}`);
  };

  const saveDetails = async () => {
    if (!selected) return;
    setSavingDetails(true);
    const quoted = draftQuote.trim() === "" ? null : Number(draftQuote);
    const notes = draftNotes.trim() === "" ? null : draftNotes.trim();
    const { error } = await supabase
      .from("estimate_leads")
      .update({ quoted_amount: quoted, admin_notes: notes })
      .eq("id", selected.id);
    setSavingDetails(false);
    if (error) return toast.error(`Could not save details: ${error.message}`);
    patchLead(selected.id, { quoted_amount: quoted, admin_notes: notes });
    toast.success("Saved admin notes & quote");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Estimate Leads</h1>
          <p className="mt-1 text-sm text-slate-500">
            Instantly manage and modify customer shipment estimates, status, and
            assigned owners.
          </p>
        </div>
        <button
          onClick={loadLeads}
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  {card.label}
                </p>
                <span className={`rounded-lg ${card.tone} p-2`}>
                  <Icon size={18} />
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, name, phone, country…"
            className="w-full rounded-lg outline-none border bg-white py-2 pl-9 pr-3 text-sm focus:border-slate-400"
          />
        </div>

        <div className="flex wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === "all"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                statusFilter === s
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Shipment</th>
              <th className="p-3">Status</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Received</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={8}>
                  <RefreshCw
                    size={18}
                    className="mr-2 inline animate-spin text-blue-600"
                  />{" "}
                  Loading estimate leads…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={8}>
                  No estimate leads found.
                </td>
              </tr>
            ) : (
              filtered.map((lead) => {
                const waLink = buildWhatsAppLink(
                  lead.whatsapp_number,
                  `Hello ${lead.customer_name}, regarding your estimate request (${lead.request_code}) with Pick O Pick.`,
                );
                const gmailLink = buildGmailLink(
                  lead.email,
                  `Regarding Pick O Pick estimate request ${lead.request_code}`,
                  `Hello ${lead.customer_name},\n\nRegarding your estimate request (${lead.request_code}) for shipping to ${lead.destination_country || ""}.\n\nPackage details:\n- Package: ${lead.package_type || "Standard"}\n- Weight: ${lead.approx_weight_kg != null ? `${lead.approx_weight_kg} kg` : "N/A"}\n- Dimensions: ${lead.dimensions || "N/A"}\n\nPlease let us know if you have any further questions.\n\nBest regards,\nPick O Pick Team`,
                );

                return (
                  <tr
                    key={lead.id}
                    className="border-t align-middle hover:bg-slate-50/50"
                  >
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                        {lead.request_code}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">
                        {lead.customer_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {lead.destination_country}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-medium text-slate-800">
                        {lead.whatsapp_number}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {lead.email || "—"}
                      </p>
                    </td>
                    <td className="p-3 text-xs">
                      <p className="font-medium text-slate-800">
                        {lead.package_type || "—"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {lead.approx_weight_kg != null
                          ? `${lead.approx_weight_kg} kg`
                          : "—"}
                        {lead.dimensions ? ` · ${lead.dimensions}` : ""}
                      </p>
                    </td>
                    <td className="p-3">
                      <select
                        value={lead.status}
                        onChange={(e) =>
                          changeStatus(
                            lead,
                            e.target.value as EstimateLead["status"],
                          )
                        }
                        className={`rounded-md px-2 py-1 text-xs font-semibold ring-1 cursor-pointer ${statusTone[lead.status]}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={lead.assigned_to ?? ""}
                          onChange={(e) =>
                            assignLead(lead, e.target.value || null)
                          }
                          disabled={assigning}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-800 outline-none hover:border-slate-300 focus:border-blue-500"
                        >
                          <option value="">Unassigned</option>
                          {users.map((u) => (
                            <option key={u.adminLoginID} value={u.adminLoginID}>
                              {u.username}
                            </option>
                          ))}
                        </select>
                        {lead.assigned_to && (
                          <span
                            title={`Owner: ${userNameById(users, lead.assigned_to) || "user"}`}
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold uppercase text-white"
                          >
                            {(userNameById(users, lead.assigned_to) || "U")[0]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(lead.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {waLink && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Chat on WhatsApp"
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
                          onClick={() => openLead(lead)}
                          title="View full details"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setActionLead(lead)}
                          title="Manage remarks & follow-ups"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                        >
                          <UserPlus size={15} />
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

      {selected && (
        <Drawer
          open
          onClose={() => setSelected(null)}
          title={selected.customer_name}
          subtitle={`Received ${new Date(selected.created_at).toLocaleString()}`}
          wide
          actions={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                {selected.request_code}
              </span>
              {canDelete && (
                <DeleteLeadButton onDelete={() => deleteLead(selected)} />
              )}
            </div>
          }
        >
          <div className="rounded-xl bg-blue-50 p-3 text-xs text-slate-600 ring-1 ring-blue-100">
            <span className="font-bold text-slate-800">Status:</span>{" "}
            {selected.status}
          </div>

            <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                <Package size={14} /> Request details
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                <Field label="Customer name" value={selected.customer_name} />
                <Field
                  label="WhatsApp number"
                  value={selected.whatsapp_number}
                />
                <Field label="Email ID" value={selected.email} />
                <Field
                  label="Destination country"
                  value={selected.destination_country}
                />
                <Field label="Package type" value={selected.package_type} />
                <Field
                  label="Approx. weight"
                  value={
                    selected.approx_weight_kg != null
                      ? `${selected.approx_weight_kg} kg`
                      : null
                  }
                />
                <Field label="Dimensions" value={selected.dimensions} />
                <Field
                  label="What they are shipping"
                  value={selected.requirement_description}
                />
              </div>
            </section>

            <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Team working notes
              </h3>
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
                  onChange={(e) =>
                    changeStatus(
                      selected,
                      e.target.value as EstimateLead["status"],
                    )
                  }
                  className={`rounded-md px-2 py-1.5 text-xs font-semibold ring-1 cursor-pointer ${statusTone[selected.status]}`}
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
                  className="rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingDetails ? "Saving…" : "Save notes & quote"}
                </button>
              </div>
            </section>

            <details className="mt-5 rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800">
                View raw submitted JSON
              </summary>
              <pre className="max-h-80 overflow-auto border-t border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </details>
        </Drawer>
      )}

      <LeadActionsDrawer
        open={!!actionLead}
        onClose={() => setActionLead(null)}
        code={actionLead?.request_code}
        title={actionLead?.customer_name ?? "Estimate lead"}
        subtitle={
          actionLead
            ? `Received ${new Date(actionLead.created_at).toLocaleString("en-IN")} · destination ${actionLead.destination_country}`
            : undefined
        }
        customerName={actionLead?.customer_name}
        phone={actionLead?.whatsapp_number}
        email={actionLead?.email}
        statuses={STATUSES.map((s) => ({ value: s, label: s }))}
        status={actionLead?.status ?? "NEW"}
        onStatusChange={(status) =>
          actionLead &&
          changeStatus(actionLead, status as EstimateLead["status"])
        }
        users={users}
        assignedTo={actionLead?.assigned_to ?? null}
        onAssign={(userId) => actionLead && assignLead(actionLead, userId)}
        assigning={assigning}
        remarks={actionLead?.remarks ?? []}
        onAddRemark={(text) => actionLead && addLeadRemark(actionLead, text)}
        onDeleteRemark={(remarkId) =>
          actionLead && deleteLeadRemark(actionLead, remarkId)
        }
      >
        <section className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
            <Package size={14} /> Request details
          </h3>
          <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
            <Field
              label="Destination country"
              value={actionLead?.destination_country}
            />
            <Field label="Package type" value={actionLead?.package_type} />
            <Field
              label="Approx. weight"
              value={
                actionLead?.approx_weight_kg != null
                  ? `${actionLead.approx_weight_kg} kg`
                  : null
              }
            />
            <Field label="Dimensions" value={actionLead?.dimensions} />
            <Field
              label="What they are shipping"
              value={actionLead?.requirement_description}
            />
          </div>
        </section>
      </LeadActionsDrawer>
    </div>
  );
}
