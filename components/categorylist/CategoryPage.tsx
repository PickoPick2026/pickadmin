"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import CategoryList from "./CategoryList"
import CategoryForm from "./CategoryForm"


export type Category = {
  categoryID: number
  categoryName: string
  categorySequence: number
  categoryStatus: boolean
}

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("category")
      .select("*")
      .order("categorySequence", { ascending: true })

    if (error) return console.error(error)
    setCategories(data)
  }

  // 🔍 search
  const filtered = categories.filter((c) =>
    c.categoryName.toLowerCase().includes(search.toLowerCase())
  )

  const handleSave = async (category: Category) => {
    const toastId = toast.loading("Saving...")

    try {
      if (editing) {
        await supabase
          .from("category")
          .update({
            categoryName: category.categoryName,
            categorySequence: category.categorySequence,
          })
          .eq("categoryID", category.categoryID)

        toast.success("Updated", { id: toastId })
      } else {
        await supabase.from("category").insert({
          categoryName: category.categoryName,
          categorySequence: category.categorySequence,
          categoryStatus: true,
        })

        toast.success("Created", { id: toastId })
      }

      setOpen(false)
      setEditing(null)
      fetchCategories()
    } catch (err: any) {
      toast.error(err.message, { id: toastId })
    }
  }

  const handleDelete = async (id: number) => {
    await supabase
      .from("category")
      .update({ categoryStatus: false })
      .eq("categoryID", id)

    fetchCategories()
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Category List</h1>
        <input
          placeholder="Search category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />

        <Button onClick={() => setOpen(true)}>
          Add Category
        </Button>
      </div>

      <CategoryList
        categories={filtered}
        onEdit={(c) => {
          setEditing(c)
          setOpen(true)
        }}
        onDelete={handleDelete}
      />

      {open && (
        <CategoryForm
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