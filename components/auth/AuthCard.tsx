import Image from "next/image"
import { Card } from "@/components/ui/card"

export default function AuthCard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
    <Card className="w-full max-w-md overflow-hidden border-0 bg-white shadow-none">
      <div className="grid grid-cols-1">
        {children}
      </div>
    </Card>
  </div>
  )
}
