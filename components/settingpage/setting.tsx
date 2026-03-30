import Link from "next/link"
import {
  Phone,
  MessageSquare,
  PhoneCall,
  Clock,
  Ban,
  Settings,
  ShieldCheck,
  Users,
  UserCog,
  Music,
  ClipboardList,
  Tags,
  Package,
  Workflow,
  FileText,
  Webhook,
  Database,
  ToolCase,
  Coffee,
  UsersRound,
} from "lucide-react"

type Item = {
  label: string
  href: string
  icon: any
}

type Section = {
  title: string
  description?: string
  items: Item[]
}

export default function AdminSettingsPage() {
  const sections: Section[] = [
    {
      title: "Communication Channels",
      description:
        "All settings related to your email, phone, chat, and other communication channels",
      items: [
        { label: "DID Number", href: "#", icon: Phone },
        {
          label: "Greetings and Messages",
          href: "/admin/settings/greetings",
          icon: MessageSquare,
        },
        { label: "IVR Builder", href: "#", icon: PhoneCall },
      ],
    },
    {
      title: "General Settings",
      items: [
        {
          label: "Break Timings",
          href: "/breaksetting",
          icon: Coffee,
        },
        {
          label: "Business Hour for Calls",
          href: "#",
          icon: Clock,
        },
        {
          label: "Block Number List",
          href: "#",
          icon: Ban,
        },
      ],
    },
    {
      title: "Account Settings",
      description: "Contains your signup details and pricing plans in the CRM",
      items: [
        {
          label: "CRM Settings",
          href: "#",
          icon: Settings,
        },
        {
          label: "KYC Application",
          href: "#",
          icon: ShieldCheck,
        },
      ],
    },
    {
      title: "Users and Groups",
      description: "Manage all your users in the CRM",
      items: [
        { label: "User", href: "/users", icon: Users },
        {
          label: "Users Group",
          href: "/usergroup",
          icon: UserCog,
        },
        {
          label: "Team Name",
          href: "/team",
          icon: UsersRound,
        },
      ],
    },
    {
      title: "Lead Settings",
      items: [
        {
          label: "Lead Segment",
          href: "/segment",
          icon: Database,
        },
        {
          label: "Lead Source",
          href: "/leadsource",
          icon: Tags,
        },
        {
          label: "Lead Stage",
          href: "/leadstatus",
          icon: ClipboardList,
        },  
        {
          label: "Lead Disposition",
          href: "/disposition",
          icon: ToolCase,
        },       
        {
          label: "Products",
          href: "#",
          icon: Package,
        },
      ],
    },
    {
      title: "Automation",
      items: [
        {
          label: "Workflow",
          href: "#",
          icon: Workflow,
        },
      ],
    },
    {
      title: "Forms and Webhook",
      description:
        "Integrate your website and all your most-used tools with the CRM",
      items: [
        {
          label: "Web Forms",
          href: "#",
          icon: FileText,
        },
        {
          label: "Webhook",
          href: "#",
          icon: Webhook,
        },
      ],
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {sections.map((section) => (
        <div
          key={section.title}
          className="rounded-lg border bg-white p-6 shadow-sm"
        >
          <h2 className="text-base font-semibold text-gray-800">
            {section.title}
          </h2>

          {section.description && (
            <p className="mt-1 text-sm text-gray-500">
              {section.description}
            </p>
          )}

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {section.items.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 rounded-md p-3 hover:bg-gray-50 transition"
                >
                  <Icon className="h-5 w-5 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
