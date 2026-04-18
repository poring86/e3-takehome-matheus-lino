import { supabase } from "./supabase-client";

export type Membership = {
  id: string;
  org_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  organizations?: { id: string; name: string; created_at: string };
};

async function loadOrganizationsFallback(userId: string) {
  const { data: memberships, error } = await supabase
    .from("org_members")
    .select(
      "id, org_id, user_id, role, joined_at, organizations(id, name, created_at)",
    )
    .eq("user_id", userId);

  if (error || !memberships || memberships.length === 0) {
    return { orgs: [], currentOrg: null };
  }

  // ...tipo Membership agora está no topo do arquivo...

  // Type guard para validar o shape do objeto
  function isMembership(obj: unknown): obj is Membership {
    if (!obj || typeof obj !== "object") return false;
    const m = obj as {
      id?: unknown;
      org_id?: unknown;
      user_id?: unknown;
      role?: unknown;
      joined_at?: unknown;
      organizations?: unknown;
    };
    const org = m.organizations as
      | { id?: unknown; name?: unknown; created_at?: unknown }
      | undefined;
    return (
      (typeof m.id === "string" || typeof m.id === "number") &&
      (typeof m.org_id === "string" || typeof m.org_id === "number") &&
      (typeof m.user_id === "string" || typeof m.user_id === "number") &&
      typeof m.role === "string" &&
      typeof m.joined_at === "string" &&
      (!org ||
        ((typeof org.id === "string" || typeof org.id === "number") &&
          typeof org.name === "string" &&
          typeof org.created_at === "string"))
    );
  }

  const orgs: Membership[] = (memberships as unknown[]).flatMap((member) => {
    if (!isMembership(member)) return [];
    type OrgRaw = { id: string | number; name: string; created_at: string };
    type MemberRaw = {
      id: string | number;
      org_id: string | number;
      user_id: string | number;
      role: string;
      joined_at: string;
      organizations?: OrgRaw;
    };
    const m = member as MemberRaw;
    if (!m.organizations) return [];
    return [
      {
        id: String(m.id),
        org_id: String(m.org_id),
        user_id: String(m.user_id),
        role: m.role,
        joined_at: m.joined_at,
        organizations: {
          id: String(m.organizations.id),
          name: m.organizations.name,
          created_at: m.organizations.created_at,
        },
      },
    ];
  });

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

  const memberships: Membership[] = (
    (data.memberships || []) as Membership[]
  ).filter((member) => member.user_id === userId);

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
