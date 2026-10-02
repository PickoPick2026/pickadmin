"use client";

import { useState } from "react";
import Topbar from "./Topbar";
import Sidenav from "./Sidenav";
import Footer from "./Footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <Sidenav
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onToggle={() => {
            setCollapsed((prev) => !prev);
          }}
        />

        <main className="flex-1 p-6">{children}</main>

        <Footer />
      </div>
    </div>
  );
}
