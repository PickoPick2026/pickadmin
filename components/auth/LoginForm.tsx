"use client"

import Image from "next/image"
import { Mail, Lock, User, EyeOff, Eye } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { toast } from 'sonner';
import bcrypt from 'bcryptjs';

export default function LoginForm() {
    const router = useRouter()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)


  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault()

      try {
        // 1️⃣ Check Login Table
        const { data: adminLoginTable, error: loginError } = await supabase
          .from("adminLoginTable")
          .select("*")
          .eq("username", email)
          .single()

        if (loginError || !adminLoginTable) {
          toast.error("Username or Password Invalid")
          return
        }

        // 2️⃣ Compare Password
        const isValid = await bcrypt.compare(password, adminLoginTable.password)

        if (!isValid) {
          toast.error("Incorrect password")
          return
        }

        // 3️⃣ Get User Info
        // const { data: user, error: userError } = await supabase
        //   .from("adminLoginTable")
        //   .select("userID, name, companyID")
        //   .eq("userStatus", true)
        //   .eq("userID", adminLoginTable.userID)
        //   .single()

        // if (userError || !user) {
        //   toast.error("User record not found")
        //   return
        // }

        

        // 5️⃣ Create App Session Object
        const session = {
          id: adminLoginTable.adminLoginID,          
          username: adminLoginTable.username,
          role: adminLoginTable.role,
          loggedIn: true,
        }

        // 6️⃣ Check If Already Online Session Exists
        // const { data: existingSession } = await supabase
        //   .from("userSessionTable")
        //   .select("userSessionID")
        //   .eq("userID", session.userID)
        //   .eq("sessionStatus", "ONLINE")
        //   .limit(1)

        // let activeSessionID = null

        // if (existingSession && existingSession.length > 0) {
        //   // Update existing session
        //   const { data: updatedSession } = await supabase
        //     .from("userSessionTable")
        //     .update({
        //       login_time: new Date().toISOString(),
        //     })
        //     .eq("userSessionID", existingSession[0].userSessionID)
        //     .select()
        //     .single()

        //   activeSessionID = updatedSession.userSessionID
        // } else {
        //   // Insert new session
        //   const { data: newSession, error: sessionError } = await supabase
        //     .from("userSessionTable")
        //     .insert([
        //       {
        //         companyID: company.companyID,
        //         userID: loginTable.userID,
        //         login_time: new Date().toISOString(),
        //         sessionStatus: "ONLINE",
        //       },
        //     ])
        //     .select()
        //     .single()

        //   if (sessionError) {
        //     toast.error("Failed to create user session")
        //     return
        //   }

        //   activeSessionID = newSession.userSessionID
        // }

        // 7️⃣ Store Local Storage
        localStorage.setItem("session", JSON.stringify(session))
        //localStorage.setItem("activeSessionID", activeSessionID)

        toast.success("Login successful")

        // 8️⃣ Redirect
        router.push("/dashboard")

      } catch (err) {
        console.error(err)
        toast.error("Something went wrong")
      }
    }
  return (
    <CardContent className="p-8">
      {/* Logo + Heading */}
      <div className="text-center mb-6">
        <Image
          src="/images/logo1.png"
          alt="Logo"
          width={300}
          height={100}
          className="mx-auto"
        />
        <h4 className="text-2xl font-bold mt-4">
          Welcome to CRM 👋
        </h4>
        <p className="text-muted-foreground mt-2">
          Access your account or create a new one
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <div />
          <TabsTrigger value="login" className="px-10 mx-auto">
            Login
          </TabsTrigger>
          <div />
        </TabsList>
        {/* <TabsList className="flex justify-center mb-6">
          {/* <TabsTrigger value="login" >Login</TabsTrigger> */}
          {/* <TabsTrigger value="register" >Register</TabsTrigger>
          <TabsTrigger value="forgot" >Forgot</TabsTrigger> */}
        {/* </TabsList>  */}

        {/* ================= LOGIN ================= */}
        <TabsContent value="login">
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-2">
              <Label>UserName</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  name="email"
                  placeholder="username"
                  className="pl-10"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  onChange={(e) => setPassword(e.target.value)}
                />

                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-muted-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember">Keep me signed in</Label>
              </div>

              {/* <button
                type="button"
                className="text-sm font-medium text-primary hover:underline"
                onClick={() => {
                  // switch to forgot tab
                  document
                    .querySelector('[data-value="forgot"]')
                    ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
                }}
              >
                Forgot password?
              </button> */}
            </div>

            <Button className="w-full" type="submit">Sign In</Button>
          </form>
        </TabsContent>

        {/* ================= REGISTER ================= */}
        <TabsContent value="register">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Name"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@gmail.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  className="pl-10"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Use 8+ characters with letters, numbers & symbols.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Agree the Terms & Policy</Label>
            </div>

            <Button className="w-full" type="button">Create Account</Button>
          </form>
        </TabsContent>

        {/* ================= FORGOT PASSWORD ================= */}
        <TabsContent value="forgot">
          <form className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="policy" />
              <Label htmlFor="policy">Agree the Terms & Policy</Label>
            </div>

            <Button className="w-full" type="button">Send Reset Link</Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-8">
        © {new Date().getFullYear()} CRM — {" "}
        <a
            href="https://altixbusinesssolutions.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
          >
            Altix Business Solutions
          </a>
      </p>
    </CardContent>
  )
}
