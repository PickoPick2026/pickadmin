"use client"

import { Menu } from "lucide-react"
import { useEffect, useState } from "react"
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
  const { session, loading } = useAuth()

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  // Live avatar: stored in the session at login, refreshed from the DB so an
  // updated photo shows up without signing in again.
  useEffect(() => {
    if (!session?.id) return
    setAvatarUrl(session.avatar_url ?? null)
    supabase
      .from("adminLoginTable")
      .select("avatar_url")
      .eq("adminLoginID", session.id)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setAvatarUrl(data[0].avatar_url ?? null)
      })
  }, [session?.id, session?.avatar_url])

  // Mounted
  useEffect(() => {
    setMounted(true)
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
    {/* User dropdown */}
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-muted"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="User"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold uppercase text-white">
              {(loading ? "" : session?.username ?? "?")[0] ?? "?"}
            </span>
          )}

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
