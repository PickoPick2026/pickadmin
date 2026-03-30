"use client"

import Image from "next/image"
import { Menu } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import Clock from '@/components/Clock';
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { handleLogout } from "@/lib/logout"
import { supabase } from "@/lib/supabase"

type TopbarProps = {
  onToggle: () => void
}

export default function Topbar({ onToggle }: TopbarProps) {
  const router = useRouter()
  const { session, role, loading } = useAuth()

  const [now, setNow] = useState(new Date())
  const [isOnline, setIsOnline] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  // Mounted
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Online status effect (MOVED ABOVE RETURN)
  useEffect(() => {
    const checkOnlineStatus = async () => {
      const session = localStorage.getItem("session")
      if (!session) return

      const parsed = JSON.parse(session)

      const { data } = await supabase
        .from("userSessionTable")
        .select("sessionStatus")
        .eq("userID", parsed.userID)
        .order("login_time", { ascending: false })
        .limit(1)

      if (data && data.length > 0) {
        setIsOnline(data[0].sessionStatus === "ONLINE")
      }
    }

    checkOnlineStatus()
  }, [])

  // ✅ Now safe
  if (!mounted) return null

  

  return (
   <header className="h-16 border-b bg-background px-4 flex items-center justify-between">
  {/* Left */}
  <div className="flex items-center gap-3">
    <button
      className="p-2 rounded-md hover:bg-muted"
      type="button"
      onClick={onToggle}
    >
      <Menu size={20} />
    </button>

    <span className="text-sm font-medium text-muted-foreground">
      Welcome to{" "}
      <span className="text-foreground font-semibold">
        PickOPick
      </span>
    </span>
  </div>

  {/* Right */}
  <div className="flex items-center gap-6">
    {/* Clock */}
    <div className="hidden md:flex text-sm text-muted-foreground">
      <Clock />
    </div>

    {/* User dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted"
        >
          <Image
            src="/images/user.png"
            alt="User"
            width={32}
            height={32}
            className="rounded-full"
          />

          <div className="hidden md:block text-left">
            <p className="text-sm font-semibold leading-none">
              {loading ? "Loading..." : session?.username ?? "—"}
            </p>
            <span className="text-xs text-muted-foreground">
              {loading ? "Loading..." : session?.role ?? "—"}
            </span>
          </div>
          
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-red-600">
            <button
              onClick={() => handleLogout(router)}
            >
              Logout
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</header>

  )
}
