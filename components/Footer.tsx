import Image from "next/image"

export default function Footer() {
  return (
    <footer className="py-5 bg-white text-center text-sm border-t flex items-center justify-center gap-2">
      <span className="text-gray-500">
         © {new Date().getFullYear()} CRM — Developed by
      </span>

      <a
        href="https://altixbusinesssolutions.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        Altix Business Solutions
        {/* <Image
          src="/images/logo1.png"
          alt="Simple Hunt Logo"
          width={120}
          height={60}
          priority
        /> */}
      </a>
    </footer>
  )
}
