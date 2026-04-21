import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase-client";

export function useOrganizations(userId?: string) {
  return useQuery({
    queryKey: ["organizations", userId],
    queryFn: async () => {
      // Só busca se userId existir
      if (!userId) return { orgs: [], currentOrg: null };
      const { data } = await supabase.auth.getSession();
      const access_token = data?.session?.access_token;
      const res = await fetch("/api/organizations", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
        headers: {
          ...(access_token ? { Authorization: `Bearer ${access_token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to load organizations");
      const dataJson = await res.json();
      type Membership = {
        id: string;
        org_id: string;
        user_id: string;
        role: string;
        joined_at: string;
        organizations?: { id: string; name: string; created_at: string };
      };
      const memberships: Membership[] = (
        (dataJson.memberships || []) as Membership[]
      ).filter((m) => m.user_id === userId);
      if (!memberships.length) return { orgs: [], currentOrg: null };
      const lastOrgId = localStorage.getItem("currentOrgId");
      const current =
        memberships.find((m) => m.org_id === lastOrgId) || memberships[0];
      localStorage.setItem("currentOrgId", current.org_id);
      return { orgs: memberships, currentOrg: current.organizations };
    },
    enabled: !!userId, // só busca quando userId existe
    staleTime: 30_000,
    select: (data) => data,
  });
}
