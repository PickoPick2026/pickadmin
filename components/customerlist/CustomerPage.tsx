"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

import { toast } from "sonner"
import CustomerList from "./CustomerList"
import CustomerForm from "./CustomerForm"
import bcrypt from "bcryptjs"

export type Address = {
  addressID?: number
  addressType: string
  addressDetails: string
  addressStatus: boolean
  isDefault?: boolean
}

export type Customer = {
  customerID: number
  pickID: string
  firstName: string
  lastName: string
  phoneNumber: string
  emailID: string
  gender: string
  dob: string
  customerStatus: boolean
  password: string
  addresses?: Address[]
}

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const filteredCustomers = customers.filter((c) => {
    const text = search.toLowerCase()

    return (
        c.firstName.toLowerCase().includes(text) ||
        c.lastName.toLowerCase().includes(text) ||
        c.phoneNumber.includes(text) ||
        c.emailID?.toLowerCase().includes(text)
    )
    })

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customerList")
      .select(`
        *,
        addressTable (
          addressID,
          addressType,
          addressDetails,
          addressStatus,
          isDefault
        )
      `)
      .eq("customerStatus", true)

    if (error) return console.error(error)

    setCustomers(
      data.map((c: any) => ({
        ...c,
        addresses: c.addressTable || [],
      }))
    )
  }

  const checkDuplicate = async (
    field: "phoneNumber" | "emailID",
    value: string,
    excludeId?: number
    ) => {
    let query = supabase
        .from("customerList")
        .select("customerID")
        .eq(field, value)
        .eq("customerStatus", true)

    if (excludeId) {
        query = query.neq("customerID", excludeId)
    }

    const { data } = await query.limit(1)

    return data && data.length > 0
    }

    const generatePickID = async () => {
  const now = new Date()
  const yearMonth =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0")

  // get last record
  const { data } = await supabase
    .from("customerList")
    .select("pickID")
    .ilike("pickID", `PICK${yearMonth}%`)
    .order("pickID", { ascending: false })
    .limit(1)

  let nextNumber = 1

  if (data && data.length > 0) {
    const lastPick = data[0].pickID
    const lastNumber = parseInt(lastPick.slice(-4))
    nextNumber = lastNumber + 1
  }

  const padded = String(nextNumber).padStart(4, "0")

  return `PICK${yearMonth}${padded}`
}

  const handleSave = async (customer: Customer) => {
  const toastId = toast.loading("Saving customer...")

  try {

    // 🔍 phone check
    const phoneExists = await checkDuplicate(
      "phoneNumber",
      customer.phoneNumber,
      editing?.customerID
    )

    if (phoneExists) {
      toast.error("Phone number already exists", { id: toastId })
      return
    }

    // 🔍 email check
    if (customer.emailID) {
      const emailExists = await checkDuplicate(
        "emailID",
        customer.emailID,
        editing?.customerID
      )

      if (emailExists) {
        toast.error("Email already exists" , { id: toastId })
        return
      }
    }

    // 🔥 REMOVE addresses from payload
    const { customerID, addresses, password, ...customerData } = customer
    // hash password
    let hashedPassword = undefined

    if (password) {
    hashedPassword = await bcrypt.hash(password, 10)
    }

    if (editing) {
      // UPDATE customer
      await supabase
        .from("customerList")
        .update({
                ...customerData,
                ...(hashedPassword && { password: hashedPassword }),
            })
        .eq("customerID", customer.customerID)

      // DELETE old addresses
      await supabase
        .from("addressTable")
        .delete()
        .eq("customerID", customer.customerID)

      // INSERT new addresses
      if (addresses?.length) {
        await supabase.from("addressTable").insert(
          addresses.map((a) => ({
            ...a,
            customerID: customer.customerID,
          }))
        )
      }

      toast.success("Customer updated", { id: toastId })

    } else {
        const pickID = await generatePickID()
      // INSERT customer
      const { data } = await supabase
        .from("customerList")
        .insert({
          ...customerData,
          pickID: pickID, //
          password: hashedPassword,
          customerStatus: true,
        })
        .select()
        .single()

      // INSERT addresses
      if (addresses?.length) {
        await supabase.from("addressTable").insert(
          addresses.map((a) => ({
            ...a,
            customerID: data.customerID,
          }))
        )
      }
      console.log("INSERT RESULT:", data)
      toast.success("Customer created", { id: toastId })
    }

    setOpen(false)
    setEditing(null)
    fetchCustomers()

  } catch (err: any) {
    toast.error(err.message, { id: toastId })
  }
}

  const handleDelete = async (id: number) => {
    await supabase
      .from("customerList")
      .update({ customerStatus: false })
      .eq("customerID", id)

    fetchCustomers()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Customer List</h1>
        <input
            placeholder="Search customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-64"
        />
        <Button onClick={() => setOpen(true)}>Add Customer</Button>
      </div>

      <CustomerList
        customers={filteredCustomers}
        onEdit={(c) => {
            setEditing(c)
            setOpen(true)
        }}
        onDelete={handleDelete}
        />

      {open && (
        <CustomerForm
          initialData={editing}
          onClose={() => {
            setOpen(false)
            setEditing(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}