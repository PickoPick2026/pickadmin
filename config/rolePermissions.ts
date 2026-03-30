export type Role = "SUPER_ADMIN" | "ADMIN" | "INSIDESALE" | "SUPERVISOR"

export const rolePermissions: Record<Role, string[]> = {
  SUPER_ADMIN: [
    "dashboard",
    "product",
    "company_restriction",
    "users",
    "customer",
    "category",
    "logout",
  ],

  ADMIN: [
    "dashboard",
    "users",
    //"segment",
    //"break_setting",    
    //"lead_source",
   // "lead_status",
    //"lead_dispositor",
    "upload_leads",
    "leads",
    "call_setting",
    "campaigns",
    "chat",
    "apps",
    "digital_assets_library",
    "sms",
    "email",
    "breakreport",
    "workflow",
    "outcomes",
    "admin_settings",
    "logout",
  ],

  INSIDESALE: [
    "dashboard",
    "leads",
    "logout",
  ],

  SUPERVISOR: [
    "dashboard",
    "upload_leads",
    "leads",
    "breakreport",
    "logout",
  ],
}




