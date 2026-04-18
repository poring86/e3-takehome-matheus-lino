import { useCallback } from "react";
import { useUserSession } from "../../auth/hooks/use-user-session";
import { switchOrganization } from "../../../services/organization-service";

type UseSwitchOrgOptions = {
  userId?: string;
  onSwitched?: () => void;
  onError?: (message: string) => void;
};

export function useSwitchOrg(options?: UseSwitchOrgOptions) {
  const { user } = useUserSession();
  const resolvedUserId = options?.userId ?? user?.id;

  return useCallback(
    async (orgId: string) => {
      if (!resolvedUserId) {
        const message = "User is not authenticated";
        options?.onError?.(message);
        return { success: false, error: message };
      }

      const result = await switchOrganization(resolvedUserId, orgId);
      if (result.success) {
        localStorage.setItem("currentOrgId", orgId);
        options?.onSwitched?.();
        return { success: true };
      }

      const message =
        typeof result.error === "string"
          ? result.error
          : result.error?.message || "Failed to switch organization";
      options?.onError?.(message);
      return { success: false, error: message };
    },
    [options, resolvedUserId],
  );
}
