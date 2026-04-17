import { supabase } from "./supabase-client";

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

  const orgs = memberships.filter((member: any) => member.organizations);
  if (orgs.length === 0) {
    return { orgs: [], currentOrg: null };
  }

  const lastOrgId = localStorage.getItem("currentOrgId");
  const current = orgs.find((m: any) => m.org_id === lastOrgId) || orgs[0];
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
    (member: any) => member.user_id === userId,
  );

  if (!memberships || memberships.length === 0) {
    return { orgs: [], currentOrg: null };
  }

  const orgs = memberships;

  // Seleciona a org atual
  const lastOrgId = localStorage.getItem("currentOrgId");
  const current = orgs.find((m: any) => m.org_id === lastOrgId) || orgs[0];
  localStorage.setItem("currentOrgId", current.org_id);

  return {
    orgs,
    currentOrg: current.organizations,
  };
}
