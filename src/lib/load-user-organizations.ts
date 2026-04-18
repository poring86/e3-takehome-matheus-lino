import { supabase } from "./supabase-client";

async function loadOrganizationsFallback(userId: string) {
  const { data: memberships, error } = await supabase
    .from("org_members")
    .select("id, org_id, user_id, role, joined_at, organizations(id, name, created_at)")
    .eq("user_id", userId);

  if (error || !memberships || memberships.length === 0) {
    return { orgs: [], currentOrg: null };
  }

  type Membership = {
    id: string;
    org_id: string;
    user_id: string;
    role: string;
    joined_at: string;
    organizations?: { id: string; name: string; created_at: string };
  };

  // Mapear os campos para garantir tipagem correta
  const orgs: Membership[] = (memberships as unknown[]).map((member) => ({
    id: String((member as any).id),
    org_id: String((member as any).org_id),
    user_id: String((member as any).user_id),
    role: String((member as any).role),
    joined_at: String((member as any).joined_at),
    organizations: (member as any).organizations
      ? {
          id: String((member as any).organizations.id),
          name: String((member as any).organizations.name),
          created_at: String((member as any).organizations.created_at),
        }
      : undefined,
  })).filter((member) => member.organizations);

  if (orgs.length === 0) {
    return { orgs: [], currentOrg: null };
  }

  const lastOrgId = localStorage.getItem("currentOrgId");
  const current = orgs.find((m) => m.org_id === lastOrgId) || orgs[0];
  localStorage.setItem("currentOrgId", current.org_id);

  return {
    orgs,
    currentOrg: current.organizations,
  };
}

export async function loadUserOrganizations(userId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  const response = await fetch("/api/organizations", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers,
  });

  if (response.status === 401 || response.status === 403) {
    return { orgs: [], currentOrg: null };
  }

  if (!response.ok) {
    return loadOrganizationsFallback(userId);
  }

  const data = await response.json().catch(() => null);
  if (!data) {
    return loadOrganizationsFallback(userId);
  }

  const memberships = (data.memberships || []).filter(
    (member: Membership) => member.user_id === userId,
  );

  if (!memberships || memberships.length === 0) {
    return { orgs: [], currentOrg: null };
  }

  const orgs = memberships;

  // Seleciona a org atual
  const lastOrgId = localStorage.getItem("currentOrgId");
  const current = orgs.find((m) => m.org_id === lastOrgId) || orgs[0];
  localStorage.setItem("currentOrgId", current.org_id);

  return {
    orgs,
    currentOrg: current.organizations,
  };
}
