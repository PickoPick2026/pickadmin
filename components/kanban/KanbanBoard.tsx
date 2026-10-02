"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { ClipboardList, GripVertical, MessageSquare, RefreshCw, ShoppingBag, Truck } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { getSession } from "@/lib/auth"
import LeadActionsDrawer from "@/components/crm/LeadActionsDrawer"
import { useAssignableUsers } from "@/components/crm/useAssignableUsers"
import { UserAvatar } from "@/components/ui/dropdown"
import {
  Remark,
  assignLeadOwner,
  resolveAssignedTo,
} from "@/components/crm/crmHelpers"

type Card = {
  id: string
  code: string
  name: string
  info: string
  phone: string
  email: string | null
  status: string
  assigned_to: string | null
  remarks: Remark[]
  remarkCount: number
  created_at: string
}

type ModuleConfig = {
  key: string
  label: string
  table: string
  icon: any
  statuses: { value: string; label: string; dot: string }[]
  load: () => Promise<Card[]>
}

const dotClasses: Record<string, string> = {
  rose: "bg-rose-500",
  amber: "bg-blue-400",
  blue: "bg-blue-500",
  indigo: "bg-blue-500",
  emerald: "bg-emerald-500",
  slate: "bg-slate-400",
}

const fmtDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short" })

const countRemarks = (value: unknown) =>
  Array.isArray(value) ? value.filter((r: any) => r?.type !== "assignment").length : 0

const MODULES: ModuleConfig[] = [
  {
    key: "estimates",
    label: "Estimate Leads",
    table: "estimate_leads",
    icon: ClipboardList,
    statuses: [
      { value: "NEW", label: "New", dot: "rose" },
      { value: "CONTACTED", label: "Contacted", dot: "amber" },
      { value: "QUOTED", label: "Quoted", dot: "indigo" },
      { value: "CONVERTED", label: "Converted", dot: "emerald" },
      { value: "CLOSED", label: "Closed", dot: "slate" },
    ],
    load: async () => {
      const { data, error } = await supabase.from("estimate_leads").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row: any) => ({
        id: row.id,
        code: row.request_code,
        name: row.customer_name,
        info: `${row.destination_country || "—"}${row.approx_weight_kg != null ? ` · ${row.approx_weight_kg} kg` : ""}`,
        phone: row.whatsapp_number,
        email: row.email,
        status: row.status,
        assigned_to: resolveAssignedTo(row),
        remarks: Array.isArray(row.remarks) ? row.remarks : [],
        remarkCount: countRemarks(row.remarks),
        created_at: row.created_at,
      }))
    },
  },
  {
    key: "nri",
    label: "NRI Requests",
    table: "nri_requests",
    icon: Truck,
    statuses: [
      { value: "PENDING", label: "Pending", dot: "rose" },
      { value: "CONTACTED", label: "Contacted", dot: "amber" },
      { value: "CONFIRMED", label: "Confirmed", dot: "blue" },
      { value: "COMPLETED", label: "Completed", dot: "emerald" },
      { value: "CANCELLED", label: "Cancelled", dot: "slate" },
    ],
    load: async () => {
      const { data, error } = await supabase.from("nri_requests").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row: any) => ({
        id: row.id,
        code: row.request_code,
        name: row.customer_name,
        info: `${(row.request_type || "").replace(/_/g, " ")} · ${row.country || "—"}`,
        phone: row.whatsapp_number,
        email: row.email,
        status: row.status,
        assigned_to: resolveAssignedTo(row),
        remarks: Array.isArray(row.remarks) ? row.remarks : [],
        remarkCount: countRemarks(row.remarks),
        created_at: row.created_at,
      }))
    },
  },
  {
    key: "quotes",
    label: "Quote Requests",
    table: "orders",
    icon: ShoppingBag,
    statuses: [
      { value: "QUOTE_REQUESTED", label: "Quote Requested", dot: "amber" },
      { value: "CONTACTED", label: "Contacted", dot: "blue" },
      { value: "QUOTED", label: "Quoted", dot: "indigo" },
      { value: "COMPLETED", label: "Completed", dot: "emerald" },
      { value: "CANCELLED", label: "Cancelled", dot: "slate" },
    ],
    load: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row: any) => ({
        id: row.id,
        code: row.order_code,
        name: row.customer_name || "Guest Customer",
        info: row.total > 0 ? `₹${Number(row.total).toLocaleString("en-IN")}` : "Quote pending",
        phone: row.customer_phone,
        email: row.customer_email,
        status: row.status,
        assigned_to: resolveAssignedTo(row),
        remarks: Array.isArray(row.remarks) ? row.remarks : [],
        remarkCount: countRemarks(row.remarks),
        created_at: row.created_at,
      }))
    },
  },
  {
    key: "services",
    label: "Service Requests",
    table: "service_requests",
    icon: RefreshCw,
    statuses: [
      { value: "NEW", label: "New", dot: "rose" },
      { value: "CONTACTED", label: "Contacted", dot: "amber" },
      { value: "IN_PROGRESS", label: "In Progress", dot: "blue" },
      { value: "COMPLETED", label: "Completed", dot: "emerald" },
      { value: "CLOSED", label: "Closed", dot: "slate" },
    ],
    load: async () => {
      const { data, error } = await supabase.from("service_requests").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return (data || []).map((row: any) => ({
        id: row.id,
        code: row.request_code,
        name: row.customer_name,
        info: `${(row.service_type || "").replace(/_/g, " ")}${row.location ? ` · ${row.location}` : ""}`,
        phone: row.phone,
        email: row.email,
        status: row.status,
        assigned_to: resolveAssignedTo(row),
        remarks: Array.isArray(row.remarks) ? row.remarks : [],
        remarkCount: countRemarks(row.remarks),
        created_at: row.created_at,
      }))
    },
  },
]

function KanbanCard({
  card,
  ownerName,
  ownerAvatar,
  dragging,
}: {
  card: Card
  ownerName: string | null
  ownerAvatar?: string | null
  dragging?: boolean
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-3 transition ${
        dragging ? "rotate-2 ring-2 ring-blue-300" : "hover:border-blue-200"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-bold text-blue-700">{card.code}</span>
        <GripVertical size={14} className="shrink-0 text-slate-300" />
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-slate-800" title={card.name}>
        {card.name}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-500">{card.info}</p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{fmtDate(card.created_at)}</span>
        <div className="flex items-center gap-1.5">
          {card.remarkCount > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-500">
              <MessageSquare size={10} /> {card.remarkCount}
            </span>
          )}
          {ownerName ? (
            <span
              title={`Owner: ${ownerName}`}
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 ring-1 ring-blue-200"
            >
              <UserAvatar name={ownerName} image={ownerAvatar} size={16} />
              <span className="max-w-[70px] truncate text-[10px] font-semibold text-blue-700">{ownerName}</span>
            </span>
          ) : (
            <span className="rounded-full border border-dashed border-slate-300 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400">
              Unassigned
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function DraggableCard({
  card,
  ownerName,
  ownerAvatar,
  onOpen,
}: {
  card: Card
  ownerName: string | null
  ownerAvatar?: string | null
  onOpen: (card: Card) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      className={`touch-none cursor-pointer ${isDragging ? "opacity-40" : ""}`}
    >
      <KanbanCard card={card} ownerName={ownerName} ownerAvatar={ownerAvatar} />
    </div>
  )
}

function Column({
  status,
  cards,
  owners,
  ownerAvatars,
  onOpen,
}: {
  status: { value: string; label: string; dot: string }
  cards: Card[]
  owners: Record<string, string | null>
  ownerAvatars: Record<string, string | null>
  onOpen: (card: Card) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: status.value })

  return (
    <div className="flex min-w-[250px] flex-1 flex-col max-h-full">
      <div
        className={`mb-2 flex shrink-0 items-center justify-between gap-2 rounded-xl border bg-white px-3 py-2 transition-colors ${
          isOver ? "border-blue-400" : "border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dotClasses[status.dot]}`} />
          <span className="truncate text-xs font-bold uppercase tracking-wide text-slate-700">
            {status.label}
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-blue-200">
          {cards.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-dashed bg-slate-50/60 p-2 transition-colors min-h-[120px]"
        style={isOver ? { borderColor: "#0B56D9", backgroundColor: "rgb(238 244 254 / 0.7)" } : undefined}
      >
        {cards.map((card) => (
          <DraggableCard
            key={card.id}
            card={card}
            ownerName={card.assigned_to ? owners[card.assigned_to] ?? null : null}
            ownerAvatar={card.assigned_to ? ownerAvatars[card.assigned_to] ?? null : null}
            onOpen={onOpen}
          />
        ))}
        {cards.length === 0 && (
          <p className="flex h-full min-h-[120px] items-center justify-center text-center text-[11px] text-slate-400">
            Drop cards here
          </p>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const [moduleKey, setModuleKey] = useState(MODULES[0].key)
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const { users } = useAssignableUsers()

  // Detail popup (opened by clicking a card)
  const [detailCard, setDetailCard] = useState<Card | null>(null)
  const [detail, setDetail] = useState<{
    assigned_to: string | null
    status: string
    remarks: Remark[]
  } | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const lastDragEndRef = useRef(0)

  const module = useMemo(() => MODULES.find((m) => m.key === moduleKey)!, [moduleKey])

  // adminLoginID (string) -> username / avatar, for the owner chips on cards
  const owners = useMemo(() => {
    const map: Record<string, string | null> = {}
    users.forEach((u) => (map[u.adminLoginID] = u.username))
    return map
  }, [users])

  const ownerAvatars = useMemo(() => {
    const map: Record<string, string | null> = {}
    users.forEach((u) => (map[u.adminLoginID] = u.avatar_url))
    return map
  }, [users])

  const loadCards = async () => {
    setLoading(true)
    try {
      setCards(await module.load())
    } catch (err: any) {
      toast.error(`Could not load ${module.label}: ${err?.message || err}`)
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCards()
  }, [moduleKey])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const onDragStart = (event: DragStartEvent) => {
    setActiveCard(cards.find((c) => c.id === event.active.id) ?? null)
  }

  const onDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null)
    lastDragEndRef.current = Date.now()
    const { active, over } = event
    if (!over) return

    const card = cards.find((c) => c.id === active.id)
    const nextStatus = String(over.id)
    if (!card || card.status === nextStatus) return
    if (!module.statuses.some((s) => s.value === nextStatus)) return

    const prev = cards
    setCards((items) => items.map((c) => (c.id === card.id ? { ...c, status: nextStatus } : c)))

    const { error } = await supabase.from(module.table).update({ status: nextStatus }).eq("id", card.id)
    if (error) {
      setCards(prev)
      toast.error(`Could not move card: ${error.message}`)
    } else {
      const label = module.statuses.find((s) => s.value === nextStatus)?.label ?? nextStatus
      toast.success(`${card.code} moved to ${label}`)
    }
  }

  // Patch one card everywhere (board + open popup)
  const patchCard = (id: string, patch: Partial<Card>) => {
    setCards((items) => items.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    setDetailCard((curr) => (curr && curr.id === id ? { ...curr, ...patch } : curr))
  }

  // --- Card click -> detail popup ---

  const openDetail = async (card: Card) => {
    // Ignore the click that fires right after a real drag
    if (Date.now() - lastDragEndRef.current < 250) return

    setDetailCard(card)
    setDetail({
      assigned_to: card.assigned_to,
      status: card.status,
      remarks: card.remarks,
    })
    setDetailLoading(true)
    const { data, error } = await supabase
      .from(module.table)
      .select("assigned_to, status, remarks")
      .eq("id", card.id)
      .single()
    setDetailLoading(false)
    if (error) return // keep showing card data — the select may lack new columns until SQL runs
    setDetail({
      assigned_to: resolveAssignedTo(data),
      status: (data as any)?.status ?? card.status,
      remarks: Array.isArray((data as any)?.remarks) ? (data as any).remarks : [],
    })
  }

  // --- Assignment (optimistic: the board chip updates instantly) ---

  const assignDetail = async (userId: string | null) => {
    if (!detailCard || !detail) return
    const prevOwner = detail.assigned_to
    const prevCardOwner = detailCard.assigned_to

    // 1. Instant local update — chip changes on the card immediately
    setDetail({ ...detail, assigned_to: userId })
    patchCard(detailCard.id, { assigned_to: userId })

    setAssigning(true)
    const targetUser = users.find((u) => String(u.adminLoginID) === String(userId))
    const res = await assignLeadOwner({
      table: module.table,
      id: detailCard.id,
      userId,
      userName: targetUser?.username,
      currentRemarks: detail.remarks,
    })
    setAssigning(false)

    if (!res.success) {
      // Roll back
      setDetail((curr) => (curr ? { ...curr, assigned_to: prevOwner } : curr))
      patchCard(detailCard.id, { assigned_to: prevCardOwner })
      return toast.error(`Could not assign owner: ${res.error?.message || "Database error"}`)
    }

    if (res.remarks) {
      setDetail((curr) => (curr ? { ...curr, remarks: res.remarks } : curr))
      patchCard(detailCard.id, { remarks: res.remarks, remarkCount: countRemarks(res.remarks) })
    }
    toast.success(userId ? `Assigned to ${targetUser?.username ?? userId}` : "Owner cleared")
  }

  const changeDetailStatus = async (status: string) => {
    if (!detailCard) return
    const prevStatus = detailCard.status
    setDetail((curr) => (curr ? { ...curr, status } : curr))
    patchCard(detailCard.id, { status })

    const { error } = await supabase.from(module.table).update({ status }).eq("id", detailCard.id)
    if (error) {
      setDetail((curr) => (curr ? { ...curr, status: prevStatus } : curr))
      patchCard(detailCard.id, { status: prevStatus })
      return toast.error(`Could not update status: ${error.message}`)
    }
    const label = module.statuses.find((s) => s.value === status)?.label ?? status
    toast.success(`${detailCard.code} moved to ${label}`)
  }

  const addDetailRemark = async (text: string) => {
    if (!detailCard || !detail) return
    const session = getSession()
    const remark: Remark = {
      id: crypto.randomUUID(),
      text,
      author: session?.username ?? "admin",
      createdAt: new Date().toISOString(),
    }
    const next = [...detail.remarks, remark]
    setDetail({ ...detail, remarks: next })
    patchCard(detailCard.id, { remarks: next, remarkCount: countRemarks(next) })

    const { error } = await supabase.from(module.table).update({ remarks: next }).eq("id", detailCard.id)
    if (error) {
      setDetail({ ...detail, remarks: detail.remarks })
      patchCard(detailCard.id, { remarks: detailCard.remarks, remarkCount: detailCard.remarkCount })
      return toast.error(`Could not add remark: ${error.message}`)
    }
    toast.success("Remark added")
  }

  const deleteDetailRemark = async (remarkId: string) => {
    if (!detailCard || !detail) return
    const next = detail.remarks.filter((r) => r.id !== remarkId)
    setDetail({ ...detail, remarks: next })
    patchCard(detailCard.id, { remarks: next, remarkCount: countRemarks(next) })

    const { error } = await supabase.from(module.table).update({ remarks: next }).eq("id", detailCard.id)
    if (error) {
      setDetail({ ...detail, remarks: detail.remarks })
      patchCard(detailCard.id, { remarks: detailCard.remarks, remarkCount: detailCard.remarkCount })
      return toast.error(`Could not delete remark: ${error.message}`)
    }
    toast.success("Remark deleted")
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="mt-1 text-sm text-slate-500">
            Drag cards between columns to update the status — or click a card to open its details, owner and remarks.
          </p>
        </div>
        <button
          onClick={loadCards}
          disabled={loading}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Module tabs — white bar, blue active pill */}
      <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5">
        {MODULES.map((m) => {
          const Icon = m.icon
          const active = moduleKey === m.key
          return (
            <button
              key={m.key}
              onClick={() => setModuleKey(m.key)}
              className={`inline-flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <Icon size={14} />
              {m.label}
            </button>
          )
        })}
      </div>

      {/* Board */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-xl border bg-white text-sm text-slate-500">
          <RefreshCw size={18} className="mr-2 animate-spin text-blue-600" /> Loading board…
        </div>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex h-[calc(100vh-330px)] min-h-[440px] gap-3 overflow-x-auto pb-2">
            {module.statuses.map((status) => (
              <Column
                key={status.value}
                status={status}
                cards={cards.filter((c) => c.status === status.value)}
                owners={owners}
                ownerAvatars={ownerAvatars}
                onOpen={openDetail}
              />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-[250px]">
                <KanbanCard
                  card={activeCard}
                  ownerName={activeCard.assigned_to ? owners[activeCard.assigned_to] ?? null : null}
                  ownerAvatar={activeCard.assigned_to ? ownerAvatars[activeCard.assigned_to] ?? null : null}
                  dragging
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {/* Card detail popup */}
      <LeadActionsDrawer
        open={!!detailCard}
        onClose={() => setDetailCard(null)}
        code={detailCard?.code}
        title={detailCard?.name ?? "Lead"}
        subtitle={
          detailLoading
            ? "Refreshing lead details…"
            : detailCard
              ? `${module.label} · received ${new Date(detailCard.created_at).toLocaleString("en-IN")}`
              : undefined
        }
        customerName={detailCard?.name}
        phone={detailCard?.phone}
        email={detailCard?.email}
        statuses={module.statuses.map((s) => ({ value: s.value, label: s.label }))}
        status={detail?.status ?? detailCard?.status ?? ""}
        onStatusChange={changeDetailStatus}
        users={users}
        assignedTo={detail?.assigned_to ?? null}
        onAssign={assignDetail}
        assigning={assigning}
        remarks={detail?.remarks ?? []}
        onAddRemark={addDetailRemark}
        onDeleteRemark={deleteDetailRemark}
      >
        {detailCard && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Summary</p>
            <p className="mt-1 font-medium text-slate-800">{detailCard.info}</p>
            <p className="mt-1 text-xs text-slate-500">
              {detailCard.phone || "No phone"} · {detailCard.email || "no email"} · received{" "}
              {new Date(detailCard.created_at).toLocaleDateString("en-IN")}
            </p>
          </div>
        )}
      </LeadActionsDrawer>
    </div>
  )
}
