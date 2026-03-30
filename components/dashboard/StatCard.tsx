"use client"

type Props = {
  title: string
  value: string
  change?: string
  positive?: boolean
}

export default function StatCard({ title, value, change, positive }: Props) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-2xl font-bold mt-1">{value}</h2>

      {change && (
        <p className={`text-sm mt-2 ${positive ? "text-green-500" : "text-red-500"}`}>
          {change}
        </p>
      )}
    </div>
  )
}