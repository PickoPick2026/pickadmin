"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Check, ChevronDown } from "lucide-react"

export type DropdownOption = {
  value: string
  label: string
  /** Optional image (e.g. user avatar) shown as a small circle. */
  image?: string | null
  hint?: string
}

/**
 * Avatar circle: shows the image when there is one, otherwise the initial.
 * Used on owner chips and in the dropdown options.
 */
export function UserAvatar({
  name,
  image,
  size = 20,
  className = "",
}: {
  name: string | null | undefined
  image?: string | null
  size?: number
  className?: string
}) {
  const initial = (name ?? "?").trim()[0]?.toUpperCase() ?? "?"
  const style = { width: size, height: size }

  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name ?? ""}
        style={style}
        className={`shrink-0 rounded-full border border-slate-200 object-cover ${className}`}
      />
    )
  }

  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white ${className}`}
    >
      <span style={{ fontSize: Math.max(8, size * 0.42) }}>{initial}</span>
    </span>
  )
}

type DropdownProps = {
  value: string | null | undefined
  onChange: (value: string) => void
  options: DropdownOption[]
  placeholder?: string
  disabled?: boolean
  /** Renders the trigger as a compact inline control (tables) or a full field (forms). */
  size?: "sm" | "md"
  className?: string
  emptyLabel?: string
}

/**
 * Reusable styled dropdown that replaces the native browser <select> across
 * the admin (status pickers, owner assignment, …). Options can carry an image
 * (user avatars). The options panel is rendered in a portal, so it works
 * inside tables with overflow and inside drawers.
 */
export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  size = "md",
  className = "",
  emptyLabel = "No options",
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [highlight, setHighlight] = useState(-1)

  const selected = options.find((o) => o.value === value) ?? null

  const place = () => {
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const estimatedHeight = Math.min(options.length * 40 + 8, 240)
    const below = window.innerHeight - rect.bottom
    const top =
      below < estimatedHeight + 8 && rect.top > estimatedHeight + 8
        ? rect.top - estimatedHeight - 6
        : rect.bottom + 4
    setCoords({
      top: Math.max(8, Math.min(top, window.innerHeight - estimatedHeight - 8)),
      left: Math.max(8, Math.min(rect.left, window.innerWidth - rect.width - 8)),
      width: rect.width,
    })
  }

  useLayoutEffect(() => {
    if (open) place()
  }, [open])

  useEffect(() => {
    if (!open) return

    const onDocClick = (e: MouseEvent) => {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        panelRef.current?.contains(e.target as Node)
      )
        return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault()
        setHighlight((h) => {
          const next = e.key === "ArrowDown" ? h + 1 : h - 1
          if (next < 0) return options.length - 1
          if (next >= options.length) return 0
          return next
        })
      }
      if (e.key === "Enter" && highlight >= 0 && options[highlight]) {
        e.preventDefault()
        onChange(options[highlight].value)
        setOpen(false)
      }
    }
    const close = () => setOpen(false)

    document.addEventListener("mousedown", onDocClick)
    document.addEventListener("keydown", onKey)
    // Any scroll (page, table container, drawer body) closes the floating panel.
    document.addEventListener("scroll", close, true)
    window.addEventListener("resize", close)
    return () => {
      document.removeEventListener("mousedown", onDocClick)
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("scroll", close, true)
      window.removeEventListener("resize", close)
    }
  }, [open, highlight, options, onChange])

  const pad = size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"
  const optionPad = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm"

  const trigger = (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      onClick={() => setOpen((o) => !o)}
      className={`inline-flex w-full items-center justify-between gap-2 rounded-lg border bg-white font-medium transition outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
        open ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"
      } ${pad} ${className}`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {selected?.image ? (
          <UserAvatar name={selected.label} image={selected.image} size={size === "sm" ? 16 : 20} />
        ) : null}
        <span className={`truncate ${selected ? "text-slate-800" : "text-slate-400"}`}>
          {selected ? selected.label : placeholder}
        </span>
      </span>
      <ChevronDown size={size === "sm" ? 13 : 15} className="shrink-0 text-slate-400" />
    </button>
  )

  return (
    <div className="relative w-full">
      {trigger}

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={{
              position: "fixed",
              top: coords?.top ?? -9999,
              left: coords?.left ?? -9999,
              width: coords?.width,
              zIndex: 60,
            }}
            className="max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1"
            role="listbox"
          >
            {options.length === 0 && (
              <p className={`px-3 py-2 text-slate-400 ${optionPad}`}>{emptyLabel}</p>
            )}
            {options.map((option, i) => {
              const isSelected = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 rounded-md text-left transition ${
                    isSelected
                      ? "bg-blue-50 text-blue-700"
                      : highlight === i
                        ? "bg-slate-50 text-slate-800"
                        : "text-slate-700"
                  } ${optionPad}`}
                >
                  {option.image ? (
                    <UserAvatar name={option.label} image={option.image} size={size === "sm" ? 16 : 20} />
                  ) : null}
                  <span className="min-w-0 flex-1 truncate font-medium">{option.label}</span>
                  {option.hint && (
                    <span className="shrink-0 text-[10px] uppercase tracking-wide text-slate-400">
                      {option.hint}
                    </span>
                  )}
                  {isSelected && <Check size={13} className="shrink-0 text-blue-600" />}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
