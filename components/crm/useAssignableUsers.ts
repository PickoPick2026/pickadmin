"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AdminUser = {
  adminLoginID: string;
  username: string;
  role: string;
  avatar_url: string | null;
};

/** Active admin users, for the "assign to" dropdowns. */
export function useAssignableUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("adminLoginTable")
        .select("adminLoginID, username, role, avatar_url")
        .eq("adminLoginStatus", true)
        .order("username", { ascending: true });

      if (!error && data) {
        setUsers(
          data.map((u: any) => ({
            adminLoginID: String(u.adminLoginID),
            username: u.username,
            role: u.role,
            avatar_url: u.avatar_url ?? null,
          })),
        );
      }
      setLoading(false);
    })();
  }, []);

  return { users, loading };
}

export const userNameById = (
  users: AdminUser[],
  id?: string | number | null,
) => {
  if (id === undefined || id === null || id === "") return null;
  const target = String(id);
  return users.find((u) => String(u.adminLoginID) === target)?.username ?? null;
};

export const userAvatarById = (
  users: AdminUser[],
  id?: string | number | null,
) => {
  if (id === undefined || id === null || id === "") return null;
  const target = String(id);
  return users.find((u) => String(u.adminLoginID) === target)?.avatar_url ?? null;
};

/** Dropdown options for a user-assignment select (includes avatars). */
export const userOptions = (users: AdminUser[]) => [
  { value: "", label: "Unassigned", image: "" as string | null },
  ...users.map((u) => ({
    value: u.adminLoginID,
    label: u.username,
    image: u.avatar_url,
    hint: u.role === "SUPER_ADMIN" ? "super admin" : u.role.toLowerCase(),
  })),
];
