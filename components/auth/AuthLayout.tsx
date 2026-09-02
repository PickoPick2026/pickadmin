import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B56D9] px-4 py-8 sm:px-6">
      <Image src="/images/bg.png" alt="" fill priority sizes="100vw" className="object-cover" />
      <div className="relative z-10 w-full">{children}</div>
    </main>
  )
}
