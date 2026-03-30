"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/useAuth"
import { User, Mail, Phone, Building2, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"

export default function ProfilePage() {
  const { session } = useAuth()

  const [isEditing, setIsEditing] = useState(false)
  const today = new Date().toISOString().split("T")[0]

  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [sessions, setSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  const [breaks, setBreaks] = useState<any[]>([])
  const [loadingBreaks, setLoadingBreaks] = useState(false)

  const [breakStartDate, setBreakStartDate] = useState(today)
  const [breakEndDate, setBreakEndDate] = useState(today)

  const [form, setForm] = useState({
    name: session?.name || "",
    email: session?.username || "",
    phone: "",
    password: "",
  })

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  useEffect(() => {
  if (!session?.userID) return

  const fetchSessions = async () => {
    setLoadingSessions(true)

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const { data, error } = await supabase
      .from("userSessionTable")
      .select("*")
      .eq("userID", session.userID)
      .gte("login_time", start.toISOString())
      .lte("login_time", end.toISOString())
      .order("login_time", { ascending: false })

    if (!error && data) {
      setSessions(data)
    }

    setLoadingSessions(false)
  }

  fetchSessions()
}, [session, startDate, endDate])


  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return "-"

    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()

    const diff = endTime - startTime

    if (diff <= 0) return "-"

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    const pad = (num: number) => String(num).padStart(2, "0")

    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
  }

  useEffect(() => {
    if (!session?.userID) return

    const fetchBreaks = async () => {
      setLoadingBreaks(true)

      const start = new Date(breakStartDate)
      start.setHours(0, 0, 0, 0)

      const end = new Date(breakEndDate)
      end.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from("userBreakLogTable")
        .select(`
          *,
          breakTable (
            breakName,
            breakDuration
          )
        `)
        .eq("userID", session.userID)
        .gte("break_start", start.toISOString())
        .lte("break_start", end.toISOString())
        .order("break_start", { ascending: false })

      if (!error && data) {
        setBreaks(data)
      }

      setLoadingBreaks(false)
    }

    fetchBreaks()
  }, [session, breakStartDate, breakEndDate])

  const breakLimitToSeconds = (value: string) => {
    if (!value) return 0

    const match = value.match(/\d+/) // extract numbers safely

    if (!match) return 0

    const minutes = parseInt(match[0], 10)

    return minutes * 60
  }

  const timeToSeconds = (time: string) => {
  if (!time) return 0

  const parts = time.split(":").map(Number)

  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  const seconds = parts[2] || 0

  return hours * 3600 + minutes * 60 + seconds
}

 const getBreakStatus = (
  actualDuration: string,
  breakLimit: string
) => {
  if (!actualDuration || !breakLimit) return null

  const actualSeconds = timeToSeconds(actualDuration)
  const allowedSeconds = breakLimitToSeconds(breakLimit)

  console.log("Actual Sec:", actualSeconds)
  console.log("Allowed Sec:", allowedSeconds)
  console.log(actualDuration)
  console.log(breakLimit)

  return actualSeconds <= allowedSeconds ? "ontime" : "late"
}
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile</h1>

        {/* <Button
          variant="outline"
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Cancel" : "Edit Profile"}
        </Button> */}
      </div>


      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="session">Login Details</TabsTrigger>
          <TabsTrigger value="break">Break Details</TabsTrigger>
        </TabsList>

        {/* PROFILE TAB */}
        <TabsContent value="profile">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Profile Card */}
                

                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold">
                        {session?.name?.charAt(0).toUpperCase()}
                      </div>

                      <div>
                        <h2 className="text-xl font-semibold">
                          {session?.name}
                        </h2>
                        <p className="text-muted-foreground">
                          {session?.username}
                        </p>
                        <Badge className="mt-2">
                          {session?.role}
                        </Badge>
                      </div>
                    </div>

                    {/* Info Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      <div>
                        <Label>Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="name"
                            value={session?.name ?? ""}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Username</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            name="email"
                            value={session?.username ?? ""}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Company</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={session?.companyName ?? ""}
                            disabled
                            className="pl-10 bg-muted"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Role</Label>
                        <div className="relative">
                          <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            value={session?.role ?? ""}
                            disabled
                            className="pl-10 bg-muted"
                          />
                        </div>
                      </div>

                    </div>

                    {/* Change Password Section */}
                    {/* {isEditing && (
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-semibold">
                          Change Password
                        </h3>

                        <Input
                          type="password"
                          name="password"
                          placeholder="Enter new password"
                          value={form.password}
                          onChange={handleChange}
                        />

                        <Button className="w-full">
                          Save Changes
                        </Button>
                      </div>
                    )} */}
                  
            </CardContent>
          </Card>
        </TabsContent>

        {/* SESSION DETAILS TAB */}
        <TabsContent value="session">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Session History
                  </h3>

                  <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
              </div>

              {loadingSessions ? (
                <p>Loading sessions...</p>
              ) : sessions.length === 0 ? (
                <p>No session records found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Login Time</th>
                        <th className="p-3 text-left">Logout Time</th>
                        <th className="p-3 text-left">Duration</th>
                      </tr>
                    </thead>

                    <tbody>
                      {sessions.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-3">
                            {item.login_time
                                ? new Date(item.login_time).toLocaleString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                          </td>

                          <td className="p-3">                            
                              {item.logout_time
                                ? new Date(item.logout_time).toLocaleString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                          </td>

                          <td className="p-3">
                            {calculateDuration(item.login_time, item.logout_time)}
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BREAK DETAILS TAB */}
        <TabsContent value="break">
          <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Break History
                  </h3>

                  <div className="flex flex-wrap items-end gap-4 mb-4">
                    <div>
                      <Label>Start Date</Label>
                      <Input
                        type="date"
                        value={breakStartDate}
                        onChange={(e) => setBreakStartDate(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>End Date</Label>
                      <Input
                        type="date"
                        value={breakEndDate}
                        onChange={(e) => setBreakEndDate(e.target.value)}
                      />
                    </div>
                  </div>
              </div>
                

                {loadingBreaks ? (
                  <p>Loading break logs...</p>
                ) : breaks.length === 0 ? (
                  <p>No break records found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-muted">
                        <tr>
                          <th className="p-3 text-left">Break Name</th>
                          <th className="p-3 text-left">Start Time</th>
                          <th className="p-3 text-left">End Time</th>
                          <th className="p-3 text-left">Duration</th>
                          <th className="p-3 text-left">Status</th>
                        </tr>
                      </thead>

                      <tbody>
                        {breaks.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">
                              {item.breakTable?.breakName || "-"}
                            </td>

                            <td className="p-3">
                              {item.break_start
                                ? new Date(item.break_start).toLocaleString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </td>

                            <td className="p-3">
                              {item.break_end
                                ? new Date(item.break_end).toLocaleString("en-IN", {
                                    year: "numeric",
                                    month: "short",
                                    day: "2-digit",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "-"}
                            </td>

                            <td className="p-3">
                              {calculateDuration(item.break_start, item.break_end)}
                            </td>
                            <td className="p-3">
                                {(() => {
                                  const duration = calculateDuration(
                                    item.break_start,
                                    item.break_end
                                  )

                                  const status = getBreakStatus(
                                    duration, // ✅ use calculated duration
                                    item.breakTable?.breakDuration
                                  )

                                  if (!status) return "-"

                                  return status === "ontime" ? (
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                      On Time
                                    </Button>
                                  ) : (
                                    <Button size="sm" variant="destructive">
                                      Late
                                    </Button>
                                  )
                                })()}
                              </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      
    </div>
  )
}
