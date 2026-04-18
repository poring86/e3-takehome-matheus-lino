import { useQuery } from "@tanstack/react-query";

export function useOrganizations(userId?: string) {
  return useQuery({
    queryKey: ["organizations", userId],
    queryFn: async () => {
      if (!userId) return { orgs: [], currentOrg: null };
      const res = await fetch("/api/organizations", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load organizations");
      const data = await res.json();
      type Membership = {
        id: string;
        org_id: string;
        user_id: string;
        role: string;
        joined_at: string;
        organizations?: { id: string; name: string; created_at: string };
      };
      const memberships: Membership[] = (
        (data.memberships || []) as Membership[]
      ).filter((m) => m.user_id === userId);
      if (!memberships.length) return { orgs: [], currentOrg: null };
      const lastOrgId = localStorage.getItem("currentOrgId");
      const current =
        memberships.find((m) => m.org_id === lastOrgId) || memberships[0];
      localStorage.setItem("currentOrgId", current.org_id);
      return { orgs: memberships, currentOrg: current.organizations };
    },
    enabled: !!userId,
    staleTime: 30_000,
  });
}
