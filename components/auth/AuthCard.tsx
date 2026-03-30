import Image from "next/image"
import { Card } from "@/components/ui/card"

export default function AuthCard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
    <Card className="w-full max-w-md overflow-hidden p-6">
      <div className="grid grid-cols-1">
        {children}
      </div>
    </Card>
  </div>
  )
}
