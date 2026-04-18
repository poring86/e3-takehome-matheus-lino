import { useOrganizations } from "../../../lib/use-organizations";
import { useEffect } from "react";
import { useUserSession } from "../../auth/hooks/use-user-session";

type UseCurrentOrgOptions = {
  onError?: (message: string) => void;
};

export function useCurrentOrg(options?: UseCurrentOrgOptions) {
  const { user } = useUserSession();
  const { data, isLoading, refetch, error } = useOrganizations(user?.id);

  useEffect(() => {
    if (!error) {
      return;
    }
    options?.onError?.(
      error instanceof Error ? error.message : "Failed to load organizations",
    );
  }, [error, options]);

  return {
    currentOrg: data?.currentOrg || null,
    userOrgs: data?.orgs || [],
    loading: isLoading,
    refreshOrganizations: refetch,
    error,
  };
}
