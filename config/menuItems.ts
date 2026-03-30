import {
  LayoutDashboard,
  Users,
  Building2,
  Layers,
  Database,
  Tag,
  ToolCase,
  Upload,
  FileText,
  PhoneCall,
  Megaphone,
  Coffee,
  MessageCircle,
  Grid3X3,
  Library,
  MessageSquareText,
  Mail,
  BarChart3,
  GitBranch,
  Target,
  Settings,
  LogOut,
  LayoutGrid,
  UserCircle,
} from "lucide-react"



export const menuItems = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
      
  },
  
  
  
  {
    key: "users",
    label: "Admin Users",
    href: "/users",
    icon: UserCircle,
  },
  {
    key: "category",
    label: "Category",
    href: "/category",
    icon: LayoutGrid,
  },
  {
    key: "product",
    label: "Product",
    href: "/product",
    icon: Layers,
    // children: [
    //   { key: "dash1", label: "Category", href: "/category" },
    //    { key: "dash2", label: "Analytics", href: "/dashboard" },
    //   { key: "dash3", label: "CRM", href: "/dashboard/crm" },
    // ],
  },
  {
    key: "customer",
    label: "Customer List",
    href: "/customer",
    icon: Users,
  },
  
  
  // {
  //   key: "segment",
  //   label: "Segment",
  //   href: "/segment",
  //   icon: Layers,
  // },
  
  
  // {
  //   key: "lead_source",
  //   label: "Lead Source",
  //   href: "/leadsource",
  //   icon: Database,
  // },
  // {
  //   key: "lead_status",
  //   label: "Lead Stage",
  //   href: "/leadstatus",
  //   icon: Tag,
  // },
  // {
  //   key: "lead_dispositor",
  //   label: "Lead Disposition",
  //   href: "/disposition",
  //   icon: ToolCase,
  // },
  {
    key: "upload_leads",
    label: "Import Leads",
    href: "/uploadleads",
    icon: Upload,
  },
  {
    key: "leads",
    label: "Leads",
    href: "/leads",
    icon: FileText,
  },
  {
    key: "call_setting",
    label: "Call Setting",
    href: "#",
    icon: PhoneCall,
  },
  {
    key: "campaigns",
    label: "Campaigns",
    href: "#",
    icon: Megaphone,
  },
  // {
  //   key: "break_setting",
  //   label: "Break Setting",
  //   href: "/breaksetting",
  //   icon: Coffee,
  // },
  {
    key: "chat",
    label: "Chat",
    href: "#",
    icon: MessageCircle,
  },
  {
    key: "apps",
    label: "Apps",
    href: "#",
    icon: Grid3X3,
  },
  {
    key: "digital_assets_library",
    label: "Digital Assets Library",
    href: "#",
    icon: Library,
  },
  {
    key: "sms",
    label: "SMS",
    href: "#",
    icon: MessageSquareText,
  },
  {
    key: "email",
    label: "Email",
    href: "/email",
    icon: Mail,
  },
  {
    key: "breakreport",
    label: "Break Report",
    href: "/reports",
    icon: BarChart3,
  },
  {
    key: "workflow",
    label: "Wor Flow",
    href: "#",
    icon: GitBranch,
  },
  {
    key: "outcomes",
    label: "Outcomes",
    href: "#",
    icon: Target,
  },
  {
    key: "admin_settings",
    label: "Admin Settings",
    href: "/setting",
    icon: Settings,
  },
  
  {
    key: "logout",
    label: "Logout",
    href: "/",
    icon: LogOut,
  },
]
