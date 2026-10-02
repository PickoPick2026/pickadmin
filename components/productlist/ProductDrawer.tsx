"use client"

import { useEffect, useMemo, useState } from "react"
import { ImagePlus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Drawer from "@/components/ui/drawer"
import Dropdown from "@/components/ui/dropdown"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusPill } from "@/components/common/table"
import { supabase } from "@/lib/supabase"
import type { Product } from "./ProductPage"

export type ProductDrawerMode = "view" | "edit" | "add"

export function parseImages(imageURL: unknown): string[] {
  if (typeof imageURL === "string") {
    try {
      const parsed = JSON.parse(imageURL)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return Array.isArray(imageURL) ? imageURL : []
}

type Props = {
  open: boolean
  mode: ProductDrawerMode
  product: Product | null
  onClose: () => void
  onModeChange: (mode: ProductDrawerMode) => void
  onSaved: () => void
  onDeleted: () => void
}

export default function ProductDrawer({
  open,
  mode,
  product,
  onClose,
  onModeChange,
  onSaved,
  onDeleted,
}: Props) {
  const isEditing = mode === "edit" || mode === "add"

  const [form, setForm] = useState({
    productName: "",
    sku: "",
    stock: "",
    price: "",
    description: "",
    categoryID: "",
    status: "Published",
  })
  const [categories, setCategories] = useState<{ categoryID: number; categoryName: string }[]>([])
  const [existing, setExisting] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  useEffect(() => {
    if (!open) return
    setConfirmingDelete(false)
    if (mode === "add") {
      setForm({
        productName: "",
        sku: "",
        stock: "",
        price: "",
        description: "",
        categoryID: "",
        status: "Published",
      })
      setExisting([])
    } else if (product) {
      setForm({
        productName: product.productName ?? "",
        sku: product.sku ?? "",
        stock: String(product.stock ?? ""),
        price: String(product.price ?? ""),
        description: (product as any).description ?? "",
        categoryID: String((product as any).categoryID ?? ""),
        status: product.status || "Published",
      })
      setExisting(parseImages(product.imageURL))
    }
    setFiles([])
    setFilePreviews([])
  }, [open, mode, product])

  useEffect(() => {
    if (!open || !isEditing) return
    supabase
      .from("category")
      .select("categoryID, categoryName")
      .eq("categoryStatus", true)
      .then(({ data }) => setCategories(data || []))
  }, [open, isEditing])

  const previews = useMemo(() => [...existing, ...filePreviews], [existing, filePreviews])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []) as File[]
    if (!selected.length) return
    setFiles((prev) => [...prev, ...selected])
    setFilePreviews((prev) => [...prev, ...selected.map((f) => URL.createObjectURL(f))])
    e.target.value = ""
  }

  const removeImage = (index: number) => {
    if (index < existing.length) {
      setExisting((prev) => prev.filter((_, i) => i !== index))
    } else {
      const i = index - existing.length
      setFiles((prev) => prev.filter((_, j) => j !== i))
      setFilePreviews((prev) => prev.filter((_, j) => j !== i))
    }
  }

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = []
    for (const file of files) {
      const fileName = `product/${Date.now()}-${file.name}`
      const { error } = await supabase.storage.from("product").upload(fileName, file)
      if (error) {
        console.error(error)
        continue
      }
      const { data } = supabase.storage.from("product").getPublicUrl(fileName)
      urls.push(data.publicUrl)
    }
    return urls
  }

  const handleSave = async () => {
    if (!form.productName.trim()) return toast.error("Product name is required")
    if (!form.categoryID) return toast.error("Category is required")

    setSaving(true)
    const toastId = toast.loading("Saving product…")
    try {
      const uploaded = await uploadImages()
      const payload = {
        productName: form.productName,
        sku: form.sku,
        stock: Number(form.stock || 0),
        price: Number(form.price || 0),
        description: form.description,
        categoryID: Number(form.categoryID),
        status: form.status,
        imageURL: [...existing, ...uploaded],
      }

      const { error } =
        mode === "add"
          ? await supabase.from("productTable").insert(payload)
          : await supabase.from("productTable").update(payload).eq("productID", product!.productID)

      if (error) throw error
      toast.success(mode === "add" ? "Product created" : "Product updated", { id: toastId })
      onSaved()
      onClose()
    } catch (err: any) {
      toast.error(err?.message || "Could not save product", { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!product) return
    if (!confirmingDelete) return setConfirmingDelete(true)

    const toastId = toast.loading("Deleting product…")
    const { error } = await supabase
      .from("productTable")
      .update({ status: "Closed" })
      .eq("productID", product.productID)

    if (error) {
      toast.error(error.message, { id: toastId })
      return
    }
    toast.success("Product deleted", { id: toastId })
    setConfirmingDelete(false)
    onDeleted()
    onClose()
  }

  const images = product ? parseImages(product.imageURL) : []
  const fields = (node: React.ReactNode, label: string) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-500">{label}</label>
      {node}
    </div>
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        mode === "add"
          ? "Add product"
          : isEditing
            ? "Edit product"
            : product?.productName || "Product"
      }
      subtitle={mode === "view" ? product?.sku : undefined}
      actions={
        mode === "view" && product ? (
          <StatusPill active={product.status !== "Closed"}>{product.status}</StatusPill>
        ) : undefined
      }
      footer={
        isEditing ? (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => (mode === "add" ? onClose() : onModeChange("view"))}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {mode === "add" ? "Create product" : "Save changes"}
            </Button>
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={confirmingDelete}
              className="text-red-600 hover:!bg-red-50 hover:!text-red-700"
            >
              <Trash2 size={15} />
              {confirmingDelete ? "Click again to confirm" : "Delete"}
            </Button>
            <Button onClick={() => onModeChange("edit")}>
              <Pencil size={15} /> Edit
            </Button>
          </div>
        )
      }
      wide
    >
      {isEditing ? (
        <div className="space-y-5">
          {fields(
            <Input
              name="productName"
              placeholder="Product name"
              value={form.productName}
              onChange={(e) => setForm({ ...form, productName: e.target.value })}
            />,
            "Product name"
          )}

          <div className="grid grid-cols-2 gap-4">
            {fields(
              <Input
                name="sku"
                placeholder="SKU"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />,
              "SKU"
            )}
            {fields(
              <Input
                name="stock"
                type="number"
                placeholder="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
              />,
              "Stock"
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {fields(
              <Dropdown
                value={form.categoryID}
                onChange={(v) => setForm({ ...form, categoryID: v })}
                options={categories.map((c) => ({
                  value: String(c.categoryID),
                  label: c.categoryName,
                }))}
                placeholder="Choose category"
              />,
              "Category"
            )}
            {fields(
              <Dropdown
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v })}
                options={[
                  { value: "Published", label: "Published" },
                  { value: "Pending", label: "Pending" },
                  { value: "Draft", label: "Draft" },
                  { value: "Closed", label: "Closed" },
                ]}
                placeholder="Status"
              />,
              "Status"
            )}
          </div>

          {fields(
            <Input
              name="price"
              type="number"
              placeholder="0.00"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />,
            "Price"
          )}

          {fields(
            <textarea
              name="description"
              placeholder="Product description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-input bg-transparent p-3 text-sm outline-none focus-visible:border-ring min-h-28"
            />,
            "Description"
          )}

          {fields(
            <div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-blue-300 px-3 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50">
                <ImagePlus size={15} /> Add images
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-3">
                  {previews.map((src, i) => (
                    <div key={`${src}-${i}`} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-24 w-full rounded-lg border border-slate-200 bg-white object-contain" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 rounded bg-white/90 px-1.5 py-0.5 text-xs font-semibold text-red-600 border border-slate-200"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>,
            "Images"
          )}
        </div>
      ) : (
        product && (
          <div className="space-y-6">
            {images.length > 0 && (
              <div className="space-y-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[0]}
                  alt={product.productName}
                  className="max-h-72 w-full rounded-xl border border-slate-200 bg-white object-contain"
                />
                {images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {images.slice(1, 6).map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="h-20 w-full rounded-lg border border-slate-200 bg-white object-contain"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-slate-200">
              <dl className="divide-y divide-slate-100 text-sm">
                {[
                  ["Category", product.category?.categoryName || "—"],
                  ["SKU", product.sku || "—"],
                  ["Stock", String(product.stock ?? "—")],
                  ["Status", product.status || "—"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {(product as any).description ? (
              <div className="space-y-1.5">
                <h3 className="text-xs font-medium text-slate-500">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {(product as any).description}
                </p>
              </div>
            ) : null}
          </div>
        )
      )}
    </Drawer>
  )
}
