"use client"

import { useState, useRef, useEffect } from "react"

type Option = {
  label: string
  value: string
}

type Props = {
  label?: string
  options: Option[]
  selected: string[]
  onChange: (values: string[]) => void
}

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () =>
      document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleValue = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="text-sm">{label}</label>}

      {/* Button */}
      <div
        onClick={() => setOpen(!open)}
        className="w-full border rounded-md p-2 cursor-pointer bg-white"
      >
        {selected.length === 0
          ? "All"
          : `${selected.length} selected`}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-md max-h-60 overflow-y-auto">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => toggleValue(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}