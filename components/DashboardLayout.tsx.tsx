"use client"

import { useState } from "react"
import Topbar from "./Topbar"
import Sidenav from "./Sidenav"
import Footer from "./Footer"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  //console.log("DashboardLayout render, collapsed =", collapsed)

  return (
    <div className="min-h-screen flex bg-muted/40">
      {/* Sidebar */}
      <Sidenav collapsed={collapsed} />

      {/* Main */}
      <div className="flex-1 flex flex-col">
         <Topbar
          onToggle={() => {
            setCollapsed((prev) => !prev)
          }}
        />

        <main className="flex-1 p-6">
          {children}
        </main>

        <Footer />
      </div>
    </div>
  )
}
