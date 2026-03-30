"use client"

export default function SalesReport() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border">
      <h3 className="font-semibold mb-4">Sales Report</h3>

      <div className="grid grid-cols-3 text-center mb-4">
        <div>
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="font-semibold">$78,224</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Orders</p>
          <p className="font-semibold">8,541</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Growth</p>
          <p className="font-semibold text-green-500">25.3%</p>
        </div>
      </div>

      <div className="h-56 flex items-center justify-center text-gray-400">
        Line Chart Here
      </div>
    </div>
  )
}