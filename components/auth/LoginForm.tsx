"use client"

import Image from "next/image"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import bcrypt from "bcryptjs"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CardContent } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      const { data: adminLogin, error } = await supabase
        .from("adminLoginTable")
        .select("*")
        .eq("username", username.trim())
        .single()

      if (error || !adminLogin || !(await bcrypt.compare(password, adminLogin.password))) {
        toast.error("Username or password is invalid")
        return
      }

      localStorage.setItem("session", JSON.stringify({
        id: adminLogin.adminLoginID,
        username: adminLogin.username,
        role: adminLogin.role,
        loggedIn: true,
      }))
      toast.success("Login successful")
      router.push("/dashboard")
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CardContent className="p-6 sm:p-9">
      <div className="mb-8 text-center">
        <Image src="https://pickopick.com/PICKLogo.png" alt="Pick O Pick" width={150} height={58} className="mx-auto h-auto w-[130px] sm:w-[150px]" priority />
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage Pick O Pick operations.</p>
      </div>

      <form className="space-y-5" onSubmit={handleLogin}>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="username" required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter your username" className="h-11 border-slate-200 pl-10" /></div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input id="password" required autoComplete="current-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-11 border-slate-200 pl-10 pr-10" /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-600"><Checkbox id="remember" /><span>Keep me signed in</span></label>
        <Button className="h-11 w-full bg-[#0B56D9] font-bold text-white hover:bg-[#0849B7]" disabled={isSubmitting} type="submit">{isSubmitting ? "Signing in…" : "Sign in"}</Button>
      </form>
    </CardContent>
  )
}
