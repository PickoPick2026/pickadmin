"use client"

import { useEffect, useState } from "react"
import { Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Drawer from "@/components/ui/drawer"
import { Category } from "./CategoryPage"

export default function CategoryForm({
  initialData,
  onSave,
  onDelete,
  onClose,
}: {
  initialData: Category | null
  onSave: (c: Category) => void
  onDelete: (id: number) => void
  onClose: () => void
}) {
  const [form, setForm] = useState<Category>({
    categoryID: initialData?.categoryID ?? 0,
    categoryName: initialData?.categoryName ?? "",
    categorySequence: initialData?.categorySequence ?? 1,
    categoryStatus: true,
  })

  const [errors, setErrors] = useState<any>({})
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => setConfirmingDelete(false), [initialData])

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

  const handleDelete = () => {
    if (!initialData) return
    if (!confirmingDelete) return setConfirmingDelete(true)
    setConfirmingDelete(false)
    onDelete(initialData.categoryID)
  }

  const field = (node: React.ReactNode, label: string) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {node}
    </div>
  )

  return (
    <Drawer
      open
      onClose={onClose}
      title={initialData ? "Edit category" : "Add category"}
      subtitle={initialData ? `Sequence ${initialData.categorySequence}` : undefined}
      footer={
        <div className="flex justify-between gap-2">
          {initialData ? (
            <Button
              variant="outline"
              onClick={handleDelete}
              className="text-red-600 hover:!bg-red-50 hover:!text-red-700"
            >
              <Trash2 size={15} />
              {confirmingDelete ? "Click again to confirm" : "Delete"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
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
      }
    >
      <div className="space-y-5">
        {field(
          <Input
            name="categoryName"
            placeholder="Category name"
            value={form.categoryName}
            onChange={handleChange}
            className={errors.categoryName ? "border-red-500" : ""}
          />,
          "Category name"
        )}

        {field(
          <Input
            name="categorySequence"
            type="number"
            placeholder="Sequence"
            value={form.categorySequence}
            onChange={handleChange}
            className={errors.categorySequence ? "border-red-500" : ""}
          />,
          "Sequence"
        )}
      </div>
    </Drawer>
  )
}
