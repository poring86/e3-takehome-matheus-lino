import { useOrganizations } from "../../../lib/use-organizations";
import { useEffect, useState } from "react";
import { useUserSession } from "../../auth/hooks/use-user-session";

type UseCurrentOrgOptions = {
  onError?: (message: string) => void;
};

export function useCurrentOrg(options?: UseCurrentOrgOptions) {
  const { user } = useUserSession();
  const { data, isLoading, refetch, error } = useOrganizations(user?.id);
  const [optimisticOrgId, setOptimisticOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (!error) return;
    options?.onError?.(
      error instanceof Error ? error.message : "Failed to load organizations"
    );
  }, [error, options]);

  // Atualiza o estado otimista ao trocar de organização
  const setCurrentOrgId = (orgId: string) => {
    setOptimisticOrgId(orgId);
    localStorage.setItem("currentOrgId", orgId);
    refetch();
  };

  // Decide qual organização mostrar: otimista ou do backend
  let currentOrg = data?.currentOrg || null;
  let userOrgs = data?.orgs || [];
  if (optimisticOrgId && userOrgs.length > 0) {
    const optimistic = userOrgs.find((m) => m.org_id === optimisticOrgId);
    if (optimistic?.organizations) {
      currentOrg = optimistic.organizations;
    }
  }

  return {
    currentOrg,
    userOrgs,
    loading: isLoading,
    refreshOrganizations: refetch,
    setCurrentOrgId, // expõe setter otimista
    error,
  };
}
