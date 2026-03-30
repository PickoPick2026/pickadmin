import Image from "next/image"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-muted/40">
      <Image
            src="/images/auth-card-bg.svg"
            alt="bg"
            width={700}
            height={700}
            className="absolute top-0 right-0 pointer-events-none z-0"
        />
        <Image
            src="/images/auth-card-bg.svg"
            alt="bg"
            width={700}
            height={700}
            className="absolute bottom-0 left-0 rotate-180 pointer-events-none z-0"
        />

      {children}
    </div>
  )
}
