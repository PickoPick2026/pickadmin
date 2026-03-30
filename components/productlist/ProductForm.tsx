"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

export default function ProductForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")

  const [form, setForm] = useState({
    productName: "",
    sku: "",
    stock: "",
    price: "",
    description: "",
    categoryID: "",
    status: "Published",
  })

  const [categories, setCategories] = useState<any[]>([])

  // ✅ MULTI IMAGE
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])

  // 🔥 Fetch categories
  useEffect(() => {
    fetchCategories()
    if (id) fetchProduct()
  }, [id])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("category")
      .select("categoryID, categoryName")
      .eq("categoryStatus", true)

    setCategories(data || [])
  }

  // 🔥 FETCH PRODUCT FOR EDIT
  const fetchProduct = async () => {
    const { data } = await supabase
      .from("productTable")
      .select("*")
      .eq("productID", id)
      .single()

    if (data) {
      setForm({
        productName: data.productName || "",
        sku: data.sku || "",
        stock: String(data.stock || ""),
        price: String(data.price || ""),
        description: data.description || "",
        categoryID: String(data.categoryID || ""),
        status: data.status || "Published",
      })

      // 🔥 handle images
      const imgs =
        typeof data.imageURL === "string"
          ? JSON.parse(data.imageURL)
          : data.imageURL ?? []

      setPreviews(imgs)
    }
  }

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // ✅ MULTI IMAGE SELECT
  const handleImageChange = (e: any) => {
    const files = Array.from(e.target.files) as File[]

    setImages((prev) => [...prev, ...files])

    const newPreviews = files.map((file) =>
      URL.createObjectURL(file)
    )

    setPreviews((prev) => [...prev, ...newPreviews])
  }

  // ✅ REMOVE IMAGE
  const removeImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index))
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  // ✅ UPLOAD IMAGES
  const uploadImages = async () => {
    if (!images.length) return []

    const urls: string[] = []

    for (const file of images) {
      const fileName = `product/${Date.now()}-${file.name}`

      const { error } = await supabase.storage
        .from("product")
        .upload(fileName, file)

      if (error) {
        console.error(error)
        continue
      }

      const { data } = supabase.storage
        .from("product")
        .getPublicUrl(fileName)

      urls.push(data.publicUrl)
    }

    return urls
  }

  // 🔥 SAVE (ADD + EDIT)
  const handleSave = async () => {
    const toastId = toast.loading("Saving product...")

    try {
      if (!form.productName) {
        toast.error("Product name required", { id: toastId })
        return
      }

      if (!form.categoryID) {
        toast.error("Category required", { id: toastId })
        return
      }

      // 🔥 upload new images
      const newImageURLs = await uploadImages()

      // combine old + new
      const finalImages = [...previews, ...newImageURLs]

      if (id) {
        // UPDATE
        const { error } = await supabase
          .from("productTable")
          .update({
              ...form,
              price: Number(form.price),
              stock: Number(form.stock),
              categoryID: form.categoryID, // ✅ FIX
              status: form.status, // ✅ FORCE
              imageURL: finalImages,
          })
          .eq("productID", id)

        if (error) throw error

        toast.success("Product updated", { id: toastId })
      } else {
        // INSERT
        const { error } = await supabase.from("productTable").insert({
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
          categoryID: form.categoryID,
          imageURL: finalImages,
        })

        if (error) throw error

        toast.success("Product created", { id: toastId })
      }

      // 🔥 redirect
      router.replace("/product")

    } catch (err: any) {
      console.error(err)
      toast.error(err.message, { id: toastId })
    }
  }

  return (
    <div className="grid grid-cols-3 gap-6">

      {/* LEFT */}
      <div className="col-span-2 space-y-6">

        {/* Product Info */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h2 className="font-semibold text-lg">
            {id ? "Edit Product" : "Add Product"}
          </h2>

          <Input
            name="productName"
            placeholder="Product Name"
            value={form.productName}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input name="sku" placeholder="SKU" value={form.sku} onChange={handleChange} />
            <Input name="stock" placeholder="Stock" value={form.stock} onChange={handleChange} />
          </div>

          <textarea
            name="description"
            placeholder="Product Description"
            value={form.description}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 min-h-30"
          />
        </div>

        {/* IMAGES */}
        <div className="bg-white p-6 rounded-xl shadow border border-dashed">

          <input type="file" multiple onChange={handleImageChange} />

          <div className="grid grid-cols-4 gap-3 mt-4">
            {previews.map((src, i) => (
              <div key={i} className="relative">
                <img
                  src={src}
                  className="w-full h-24 object-cover rounded"
                />

                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs px-1 rounded"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="space-y-6">

        {/* Pricing */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="font-semibold">Pricing</h3>

          <Input
            name="price"
            placeholder="Base Price"
            value={form.price}
            onChange={handleChange}
          />
        </div>

        {/* Category */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="font-semibold">Organize</h3>

          <select
            name="categoryID"
            value={form.categoryID}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="">Choose Category</option>
            {categories.map((c) => (
              <option key={c.categoryID} value={c.categoryID}>
                {c.categoryName}
              </option>
            ))}
          </select>

          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded-lg p-2"
          >
            <option value="Published">Published</option>
            <option value="Pending">Pending</option>
            <option value="Draft">Draft</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        {/* ACTION */}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>

          <Button onClick={handleSave}>
            {id ? "Update Product" : "Publish"}
          </Button>
        </div>
      </div>
    </div>
  )
}