import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export const handleLogout = async (router: any) => {
  try {
    const session = localStorage.getItem("session")
    const activeSessionID = localStorage.getItem("activeSessionID")
    console.log(activeSessionID)

    if (activeSessionID) {
      await supabase
        .from("userSessionTable")
        .update({
          logout_time: new Date().toISOString(),
          sessionStatus: "OFFLINE",
        })
        .eq("userSessionID", activeSessionID)
    }

    // Clear storage
    localStorage.removeItem("session")
    localStorage.removeItem("activeSessionID")

    toast.success("Logged out successfully")

    router.push("/")
  } catch (error) {
    console.error(error)
    toast.error("Logout failed")
  }
}