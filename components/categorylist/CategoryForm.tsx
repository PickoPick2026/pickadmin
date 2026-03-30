"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Category } from "./CategoryPage"

export default function CategoryForm({
  initialData,
  onSave,
  onClose,
}: {
  initialData: Category | null
  onSave: (c: Category) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Category>({
    categoryID: initialData?.categoryID ?? 0,
    categoryName: initialData?.categoryName ?? "",
    categorySequence: initialData?.categorySequence ?? 1,
    categoryStatus: true,
  })

  const [errors, setErrors] = useState<any>({})

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const validate = () => {
    const newErrors: any = {}

    if (!form.categoryName) {
      newErrors.categoryName = true
    }

    if (!form.categorySequence) {
      newErrors.categorySequence = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-md space-y-4">

        <h2 className="text-lg font-semibold">
          {initialData ? "Edit Category" : "Add Category"}
        </h2>

        <Input
          name="categoryName"
          placeholder="Category Name"
          value={form.categoryName}
          onChange={handleChange}
          className={errors.categoryName ? "border-red-500" : ""}
        />

        <Input
          name="categorySequence"
          type="number"
          placeholder="Sequence"
          value={form.categorySequence}
          onChange={handleChange}
          className={errors.categorySequence ? "border-red-500" : ""}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={() => {
              if (!validate()) return
              onSave(form)
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}