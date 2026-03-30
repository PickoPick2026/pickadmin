"use client"

export default function TopProducts() {
  const products = [
    { name: "Modern Sofa", price: "$499" },
    { name: "L-Shaped Sofa", price: "$899" },
    { name: "Recliner Chair", price: "$379" },
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="font-semibold mb-4">Top Products</h3>

      <div className="space-y-4">
        {products.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span>{item.name}</span>
            <span className="font-medium">{item.price}</span>
          </div>
        ))}
      </div>
    </div>
  )
}