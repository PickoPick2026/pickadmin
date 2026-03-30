"use client"

type Props = {
  title: string
  children: React.ReactNode
}

export default function ChartCard({ title, children }: Props) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="h-64 flex items-center justify-center text-gray-400">
        {children}
      </div>
    </div>
  )
}