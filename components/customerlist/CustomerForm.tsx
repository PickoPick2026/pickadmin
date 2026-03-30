"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Customer } from "./CustomerPage"
import { Eye, EyeOff, Trash2 } from "lucide-react"

export default function CustomerForm({
  initialData,
  onSave,
  onClose,
}: {
  initialData: Customer | null
  onSave: (c: Customer) => void
  onClose: () => void
}) {
    const [errors, setErrors] = useState<any>({})
    const [showPassword, setShowPassword] = useState(false)
    
  const [form, setForm] = useState<Customer>({
    customerID: initialData?.customerID ?? 0,
    pickID: initialData?.pickID ?? "",
    firstName: initialData?.firstName ?? "",
    lastName: initialData?.lastName ?? "",
    phoneNumber: initialData?.phoneNumber ?? "",
    emailID: initialData?.emailID ?? "",
    gender: initialData?.gender ?? "",
    dob: initialData?.dob ?? "",
    customerStatus: true,
    password: initialData?.password ?? "",
    addresses:
      initialData?.addresses ?? [
        {
          addressType: "Home",
          addressDetails: "",
          addressStatus: true,
          isDefault: true,
        },
      ],
  })

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleAddressChange = (i: number, field: string, value: any) => {
    const updated = [...(form.addresses || [])]
    updated[i] = { ...updated[i], [field]: value }
    setForm({ ...form, addresses: updated })
  }

  // ⭐ only one default
  const setDefault = (index: number) => {
    const updated = form.addresses?.map((a, i) => ({
      ...a,
      isDefault: i === index,
    }))
    setForm({ ...form, addresses: updated })
  }

  const addAddress = () => {
    setForm({
      ...form,
      addresses: [
        ...(form.addresses || []),
        {
          addressType: "",
          addressDetails: "",
          addressStatus: true,
          isDefault: false,
        },
      ],
    })
  }

  const removeAddress = (index: number) => {
    const updated = form.addresses?.filter((_, i) => i !== index)

    // ensure at least one default
    if (updated && !updated.some((a) => a.isDefault)) {
      updated[0].isDefault = true
    }

    setForm({ ...form, addresses: updated })
  }

  const validate = () => {
    const newErrors: any = {}

    if (!form.firstName) newErrors.firstName = "First name required"
    if (!form.phoneNumber) newErrors.phoneNumber = "Phone required"

    if (!form.emailID) {
        newErrors.emailID = "Email required"
        } else if (!/^\S+@\S+\.\S+$/.test(form.emailID)) {
        newErrors.emailID = "Invalid email"
        }

    form.addresses?.forEach((a, i) => {
        if (!a.addressDetails) {
        newErrors[`address_${i}`] = "Address required"
        }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
    }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-3xl p-6 space-y-6">

        {/* Title */}
        <h2 className="text-xl font-semibold">
          {initialData ? "Edit Customer" : "Add Customer"}
        </h2>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-4">
          <Input name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} className={errors.firstName ? "border-red-500 focus:ring-red-500" : ""} />
          
          <Input name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
          
          <Input name="phoneNumber" placeholder="Phone" value={form.phoneNumber} onChange={handleChange} className={errors.phoneNumber ? "border-red-500 focus:ring-red-500" : ""} />
          
          <Input name="emailID" placeholder="Email" value={form.emailID} onChange={handleChange} className={errors.emailID ? "border-red-500 focus:ring-red-500" : ""} />
          
          <Input type="date" name="dob" value={form.dob || ""} onChange={handleChange} />
          <div className="relative">
            <Input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                className="pr-10"
            />

            <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            </div>
        </div>

        {/* Address Section */}
        <div>
          <h3 className="font-semibold mb-3">Addresses</h3>

          <div className="space-y-4">
            {form.addresses?.map((addr, i) => (
              <div
                key={i}
                className={`border rounded-xl p-4 space-y-3 ${
                  addr.isDefault ? "border-blue-500 bg-blue-50" : ""
                }`}
              >
                {/* Top row */}
                <div className="flex justify-between items-center">
                  <select
                    value={addr.addressType}
                    onChange={(e) =>
                      handleAddressChange(i, "addressType", e.target.value)
                    }
                    className="border rounded px-3 py-1 text-sm"
                  >
                    <option value="">Select Type</option>
                    <option value="Home">Home</option>
                    <option value="Office">Office</option>
                    <option value="Other">Other</option>
                  </select>

                  <div className="flex items-center gap-3">
                    {/* Default */}
                    <label className="flex items-center gap-1 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={addr.isDefault}
                        onChange={() => setDefault(i)}
                      />
                      Default
                    </label>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => removeAddress(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Address */}
                <Input
                  placeholder="Address details"
                  value={addr.addressDetails}
                  onChange={(e) =>
                    handleAddressChange(i, "addressDetails", e.target.value)
                  }
                  className={errors[`address_${i}`] ? "border-red-500" : ""}
                />
                
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-3"
            onClick={addAddress}
          >
            + Add Address
          </Button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {
                if (!validate()) return
                onSave(form)
            }}>
            Save Customer
          </Button>
        </div>
      </div>
    </div>
  )
}