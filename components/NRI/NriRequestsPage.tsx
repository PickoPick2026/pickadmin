"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Eye,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  RefreshCw,
  Truck,
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

type NriRequest = {
  id: string;
  request_code: string;
  request_type: "consultation" | "slot_reservation" | "pickup_request";
  status: string;
  customer_name: string;
  whatsapp_number: string;
  email: string | null;
  country: string;
  preferred_date: string | null;
  preferred_time: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  assigned_to?: string | null;
  remarks?: Remark[] | null;
};

const typeLabels: Record<NriRequest["request_type"], string> = {
  consultation: "Free consultation",
  slot_reservation: "Slot reservation",
  pickup_request: "Pickup request",
};
const statuses = [
  "PENDING",
  "CONTACTED",
  "FOLLOW_UP",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
];

const text = (value: unknown, fallback = "—") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);
const list = (value: unknown) =>
  Array.isArray(value)
    ? value.map((item) => String(item).replace(/_/g, " ")).join(", ")
    : "—";
const serviceName = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
        {children}
      </div>
    </section>
  );
}

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

function RequestDetails({ request }: { request: NriRequest }) {
  const data = request.payload || {};
  if (request.request_type === "consultation")
    return (
      <div className="mt-5 space-y-3">
        <DetailSection title="Consultation request">
          <Field
            label="Customer"
            value={data.fullName || request.customer_name}
          />
          <Field label="Mobile number" value={data.mobileNumber} />
          <Field
            label="WhatsApp"
            value={data.whatsappNumber || request.whatsapp_number}
          />
          <Field
            label="Current country"
            value={data.currentCountry || request.country}
          />
          <Field label="Email" value={data.email || request.email} />
          <Field
            label="Preferred date"
            value={data.preferredDate || request.preferred_date || "Flexible"}
          />
          <Field
            label="Preferred time"
            value={data.preferredTime || request.preferred_time || "Flexible"}
          />
          <Field label="Customer timezone" value={data.timezone} />
        </DetailSection>
        <DetailSection title="What the customer needs">
          <Field
            label="Requirement"
            value={data.requirementHelp || "General consultation"}
          />
        </DetailSection>
      </div>
    );

  if (request.request_type === "slot_reservation")
    return (
      <div className="mt-5 space-y-3">
        <DetailSection title="Slot reservation">
          <Field
            label="Customer / sender"
            value={data.customerName || request.customer_name}
          />
          <Field
            label="WhatsApp"
            value={data.whatsappNumber || request.whatsapp_number}
          />
          <Field
            label="Destination country"
            value={data.destinationCountry || request.country}
          />
          <Field
            label="Pickup date"
            value={data.preferredDate || request.preferred_date}
          />
          <Field
            label="Requested time slot"
            value={data.preferredTimeSlot || request.preferred_time}
          />
          <Field label="Notes" value={data.notes} />
        </DetailSection>
      </div>
    );

  return (
    <div className="mt-5 space-y-3">
      <DetailSection title="Services & requirements">
        <Field
          label="Services selected"
          value={
            Array.isArray(data.selectedServices)
              ? list(data.selectedServices)
              : serviceName(text(data.serviceType, ""))
          }
        />
        <Field
          label="Primary service"
          value={data.serviceType ? serviceName(String(data.serviceType)) : "—"}
        />
        <Field
          label="Requirement details"
          value={data.requirementDescription}
        />
        <Field
          label="Items ready / purchasing"
          value={
            data.alreadyPurchasing === "yes"
              ? "Yes — items are ready or in cart"
              : data.alreadyPurchasing === "no"
                ? "No — customer needs sourcing"
                : "—"
          }
        />
      </DetailSection>
      <DetailSection title="Package & item details">
        <Field
          label="Package type"
          value={data.packageType ? serviceName(String(data.packageType)) : "—"}
        />
        <Field label="Package count" value={data.packageCount} />
        <Field
          label="Approximate weight"
          value={data.approxWeightKg ? `${data.approxWeightKg} kg` : "—"}
        />
        <Field
          label="Dimensions"
          value={
            data.dimensions && typeof data.dimensions === "object"
              ? `${text((data.dimensions as Record<string, unknown>).lengthCm)} × ${text((data.dimensions as Record<string, unknown>).widthCm)} × ${text((data.dimensions as Record<string, unknown>).heightCm)} cm`
              : "—"
          }
        />
        <Field label="Item description" value={data.itemDescription} />
        <Field label="Special handling" value={list(data.specialHandling)} />
        <Field
          label="Uploaded photos"
          value={
            Array.isArray(data.uploadedPhotos)
              ? `${data.uploadedPhotos.length} file(s)`
              : "0 files"
          }
        />
      </DetailSection>
      <DetailSection title="Destination / recipient">
        <Field label="Destination country" value={data.destinationCountry} />
        <Field label="Destination city" value={data.destinationCity} />
        <Field label="Postal code" value={data.postalCode} />
        <Field label="Recipient name" value={data.recipientName} />
        <Field label="Recipient phone" value={data.recipientPhone} />
        <Field
          label="Permanent address"
          value={data.isPermanentAddress === "yes" ? "Yes" : "No"}
        />
      </DetailSection>
      <DetailSection title="Pickup schedule">
        <Field label="Preferred pickup date" value={data.preferredPickupDate} />
        <Field
          label="Preferred time slot"
          value={data.preferredPickupSlotLabel}
        />
        <Field
          label="Custom time requested"
          value={data.customTimeRequested ? "Yes" : "No"}
        />
        <Field label="Custom time note" value={data.customTimeNote} />
      </DetailSection>
      <DetailSection title="Pickup contact & address">
        <Field label="Customer name" value={data.customerName} />
        <Field label="Customer WhatsApp" value={data.customerWhatsapp} />
        <Field label="Customer email" value={data.customerEmail} />
        <Field label="Current country" value={data.currentCountry} />
        <Field label="Pickup contact" value={data.pickupName} />
        <Field label="Pickup phone" value={data.pickupPhone} />
        <Field label="Address line" value={data.pickupAddressLine1} />
        <Field label="Street / area" value={data.pickupStreetArea} />
        <Field label="Pickup city" value={data.pickupCity} />
        <Field label="Pickup state" value={data.pickupState} />
        <Field label="Pickup PIN" value={data.pickupPin} />
        <Field label="Landmark" value={data.pickupLandmark} />
        <Field label="Pickup instructions" value={data.pickupInstructions} />
        <Field
          label="Someone else handing over"
          value={data.someoneElseHandingOver === "yes" ? "Yes" : "No"}
        />
        <Field label="Authorised person" value={data.authorizedPersonName} />
        <Field
          label="Authorised person phone"
          value={data.authorizedPersonPhone}
        />
      </DetailSection>
    </div>
  );
}

export default function NriRequestsPage() {
  const [requests, setRequests] = useState<NriRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<NriRequest | null>(null);
  const [actionItem, setActionItem] = useState<NriRequest | null>(null);
  const [assigning, setAssigning] = useState(false);
  const { users } = useAssignableUsers();
  const { role, session } = useAuth();
  const canDelete = canDeleteLeads(role, session?.permissions);

  const loadRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("nri_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(`Unable to load NRI requests: ${error.message}`);
    else {
      setRequests(
        (data || []).map((row: any) => ({
          ...row,
          assigned_to: resolveAssignedTo(row),
        })),
      );
    }
    setLoading(false);
  };
  useEffect(() => {
    loadRequests();
  }, []);

  const filtered = useMemo(
    () =>
      filter === "all"
        ? requests
        : requests.filter((item) => item.request_type === filter),
    [filter, requests],
  );
  const stats = useMemo(
    () => [
      {
        label: "All requests",
        value: requests.length,
        icon: ClipboardList,
        tone: "bg-blue-600 text-white",
      },
      {
        label: "Free consultations",
        value: requests.filter((item) => item.request_type === "consultation")
          .length,
        icon: Headphones,
        tone: "bg-blue-50 text-blue-700",
      },
      {
        label: "Slot reservations",
        value: requests.filter(
          (item) => item.request_type === "slot_reservation",
        ).length,
        icon: CalendarClock,
        tone: "bg-blue-50 text-blue-700",
      },
      {
        label: "Pickup requests",
        value: requests.filter((item) => item.request_type === "pickup_request")
          .length,
        icon: Truck,
        tone: "bg-blue-50 text-blue-700",
      },
      {
        label: "Pending action",
        value: requests.filter((item) => item.status === "PENDING").length,
        icon: MapPin,
        tone: "bg-rose-50 text-rose-700",
      },
    ],
    [requests],
  );

  const patchRequest = (id: string, patch: Partial<NriRequest>) => {
    setRequests((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
    setSelected((item) => (item?.id === id ? { ...item, ...patch } : item));
    setActionItem((item) => (item?.id === id ? { ...item, ...patch } : item));
  };

  const changeStatus = async (request: NriRequest, status: string) => {
    if (request.status === status) return;
    const prevStatus = request.status;

    // INSTANT optimistic update
    patchRequest(request.id, { status });

    const { error } = await supabase
      .from("nri_requests")
      .update({ status })
      .eq("id", request.id);
    if (error) {
      patchRequest(request.id, { status: prevStatus });
      return toast.error(`Could not update status: ${error.message}`);
    }
    toast.success(`${request.request_code} status updated to ${status}`);
  };

  // --- CRM: ownership + remarks ---

  const assignRequest = async (request: NriRequest, userId: string | null) => {
    const prevOwner = request.assigned_to;

    // INSTANT optimistic update
    patchRequest(request.id, { assigned_to: userId });

    setAssigning(true);
    const targetUser = users.find(
      (uq) => String(uq.adminLoginID) === String(userId),
    );
    const res = await assignLeadOwner({
      table: "nri_requests",
      id: request.id,
      userId,
      userName: targetUser?.username,
      currentRemarks: request.remarks ?? [],
    });
    setAssigning(false);

    if (!res.success) {
      patchRequest(request.id, { assigned_to: prevOwner });
      return toast.error(
        `Could not assign owner: ${res.error?.message || "Database error"}`,
      );
    }

    if (res.remarks) {
      patchRequest(request.id, { remarks: res.remarks });
    }
    toast.success(
      userId
        ? `Assigned to ${targetUser?.username || "user"}`
        : "Owner cleared",
    );
  };

  const addRequestRemark = async (request: NriRequest, text: string) => {
    const session = getSession();
    const remark: Remark = {
      id: crypto.randomUUID(),
      text,
      author: session?.username ?? "admin",
      createdAt: new Date().toISOString(),
    };
    const next = [...(request.remarks ?? []), remark];
    const { error } = await supabase
      .from("nri_requests")
      .update({ remarks: next })
      .eq("id", request.id);
    if (error) return toast.error(`Could not add remark: ${error.message}`);
    patchRequest(request.id, { remarks: next });
    toast.success("Remark added");
  };

  const deleteRequestRemark = async (request: NriRequest, remarkId: string) => {
    const next = (request.remarks ?? []).filter((r) => r.id !== remarkId);
    const { error } = await supabase
      .from("nri_requests")
      .update({ remarks: next })
      .eq("id", request.id);
    if (error) return toast.error(`Could not delete remark: ${error.message}`);
    patchRequest(request.id, { remarks: next });
    toast.success("Remark deleted");
  };

  const deleteRequest = async (request: NriRequest) => {
    const { data, error } = await supabase
      .from("nri_requests")
      .delete()
      .eq("id", request.id)
      .select("id");

    if (error) return toast.error(`Could not delete: ${error.message}`);
    if (!data || data.length === 0) {
      return toast.error(
        "The database blocked the delete (row-level security has no delete policy for NRI requests). Nothing was deleted.",
      );
    }
    setRequests((items) => items.filter((item) => item.id !== request.id));
    setSelected(null);
    setActionItem((curr) => (curr?.id === request.id ? null : curr));
    toast.success(`Deleted ${request.request_code}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">NRI requests</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consultations, slot reservations and pickup requests in one queue.
          </p>
        </div>
        <button
          onClick={loadRequests}
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="rounded-xl border bg-white p-4"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.tone}`}
              >
                <Icon size={18} />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {stat.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { value: "all", label: `All (${requests.length})` },
          ...Object.entries(typeLabels).map(([value, label]) => ({
            value,
            label,
          })),
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => setFilter(item.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              filter === item.value
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
        <table className="min-w-[960px] w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="p-3">Reference</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Schedule</th>
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
                  Loading requests…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-slate-500" colSpan={8}>
                  No NRI requests found.
                </td>
              </tr>
            ) : (
              filtered.map((request) => {
                const waLink = buildWhatsAppLink(
                  request.whatsapp_number,
                  `Hello ${request.customer_name}, regarding your ${typeLabels[request.request_type]} (${request.request_code}) with Pick O Pick.`,
                );
                const gmailLink = buildGmailLink(
                  request.email,
                  `Regarding Pick O Pick request ${request.request_code}`,
                  `Hello ${request.customer_name},\n\nRegarding your request (${request.request_code}) for ${typeLabels[request.request_type]}.\n\nPlease let us know if you need any assistance.\n\nBest regards,\nPick O Pick Team`,
                );

                return (
                  <tr
                    key={request.id}
                    className="border-t align-middle hover:bg-slate-50/50"
                  >
                    <td className="p-3">
                      <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                        {request.request_code}
                      </span>
                      <p className="mt-1 text-[11px] font-medium text-slate-500">
                        {typeLabels[request.request_type]}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="font-semibold text-slate-900">
                        {request.customer_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {request.country || "—"}
                      </p>
                    </td>
                    <td className="p-3">
                      <p className="text-xs font-medium text-slate-800">
                        {request.whatsapp_number}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {request.email || "—"}
                      </p>
                    </td>
                    <td className="p-3 text-xs">
                      <p className="font-medium text-slate-800">
                        {request.preferred_date || "Flexible"}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {request.preferred_time || "Flexible"}
                      </p>
                    </td>
                    <td className="p-3 min-w-[140px]">
                      <Dropdown
                        size="sm"
                        value={request.status}
                        onChange={(v) => changeStatus(request, v)}
                        options={statuses.map((s) => ({ value: s, label: s }))}
                      />
                    </td>
                    <td className="p-3 min-w-[140px]">
                      <Dropdown
                        size="sm"
                        value={request.assigned_to ?? ""}
                        onChange={(v) => assignRequest(request, v || null)}
                        options={userOptions(users)}
                        placeholder="Unassigned"
                        disabled={assigning}
                      />
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(request.created_at).toLocaleDateString(
                        "en-IN",
                        {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        },
                      )}
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
                          onClick={() => setSelected(request)}
                          title="View full details"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-700 hover:bg-blue-50"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => setActionItem(request)}
                          title="Assign owner & manage remarks"
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
          title={typeLabels[selected.request_type]}
          subtitle={`Received ${new Date(selected.created_at).toLocaleString()}`}
          wide
          actions={
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-blue-700">
                {selected.request_code}
              </span>
              {canDelete && (
                <DeleteLeadButton onDelete={() => deleteRequest(selected)} />
              )}
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 p-3 text-xs text-slate-600 ring-1 ring-blue-100">
              <span className="font-bold text-slate-800">Status:</span>{" "}
              {selected.status}
            </div>
            <RequestDetails request={selected} />
            <details className="rounded-xl border border-slate-200 bg-white">
              <summary className="cursor-pointer px-4 py-3 text-sm font-bold text-slate-800">
                View raw submitted JSON
              </summary>
              <pre className="max-h-80 overflow-auto border-t border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
            </details>
          </div>
        </Drawer>
      )}

      <LeadActionsDrawer
        open={!!actionItem}
        onClose={() => setActionItem(null)}
        code={actionItem?.request_code}
        title={typeLabels[actionItem?.request_type ?? "consultation"]}
        subtitle={
          actionItem
            ? `Received ${new Date(actionItem.created_at).toLocaleString("en-IN")}`
            : undefined
        }
        customerName={actionItem?.customer_name}
        phone={actionItem?.whatsapp_number}
        email={actionItem?.email}
        statuses={statuses.map((s) => ({ value: s, label: s }))}
        status={actionItem?.status ?? "PENDING"}
        onStatusChange={(status) =>
          actionItem && changeStatus(actionItem, status)
        }
        users={users}
        assignedTo={actionItem?.assigned_to ?? null}
        onAssign={(userId) => actionItem && assignRequest(actionItem, userId)}
        assigning={assigning}
        remarks={actionItem?.remarks ?? []}
        onAddRemark={(text) => actionItem && addRequestRemark(actionItem, text)}
        onDeleteRemark={(remarkId) =>
          actionItem && deleteRequestRemark(actionItem, remarkId)
        }
      />
    </div>
  );
}
