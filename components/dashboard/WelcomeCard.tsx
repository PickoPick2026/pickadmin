"use client"

import { useEffect, useState } from "react"

export default function WelcomeCard() {
  const [now, setNow] = useState<Date | null>(null)
  useEffect(() => setNow(new Date()), [])

  const hour = now?.getHours() ?? 9
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  return (
    <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600 to-indigo-500 p-4 text-white shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-indigo-100">{greeting}</p>
      <h2 className="mt-1 text-xl font-bold">Pick O Pick</h2>
      <p className="mt-2 text-xs text-indigo-100">
        {now
          ? now.toLocaleDateString("en-US", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "—"}
      </p>
    </div>
  )
}
